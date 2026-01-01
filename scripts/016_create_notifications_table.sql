-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('buyer', 'supplier', 'admin')),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'delivery', 'message', 'system', 'review', 'inventory')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_type, user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_type, user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_type TEXT,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_type,
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  )
  VALUES (
    p_user_type,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Notify on new order
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify supplier
  PERFORM create_notification(
    'supplier',
    NEW.supplier_id,
    'order',
    'New Order Received',
    'You have received a new order #' || (SELECT order_number FROM orders WHERE id = NEW.id),
    '/dashboard/orders/' || NEW.id::TEXT,
    jsonb_build_object('order_id', NEW.id, 'order_number', (SELECT order_number FROM orders WHERE id = NEW.id))
  );
  
  -- Notify buyer
  PERFORM create_notification(
    'buyer',
    NEW.buyer_id,
    'order',
    'Order Placed Successfully',
    'Your order #' || (SELECT order_number FROM orders WHERE id = NEW.id) || ' has been placed',
    '/buyer/dashboard/orders/' || NEW.id::TEXT,
    jsonb_build_object('order_id', NEW.id, 'order_number', (SELECT order_number FROM orders WHERE id = NEW.id))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_new_order();

-- Notify on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    -- Notify buyer of status change
    PERFORM create_notification(
      'buyer',
      NEW.buyer_id,
      'order',
      'Order Status Updated',
      'Your order #' || (SELECT order_number FROM orders WHERE id = NEW.id) || ' is now ' || NEW.status,
      '/buyer/dashboard/orders/' || NEW.id::TEXT,
      jsonb_build_object('order_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_status_change();

-- Notify on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conversation RECORD;
  recipient_type TEXT;
  recipient_id UUID;
BEGIN
  SELECT * INTO conversation FROM conversations WHERE id = NEW.conversation_id;
  
  -- Determine recipient
  IF NEW.sender_type = 'buyer' THEN
    recipient_type := 'supplier';
    recipient_id := conversation.supplier_id;
  ELSE
    recipient_type := 'buyer';
    recipient_id := conversation.buyer_id;
  END IF;
  
  -- Create notification
  PERFORM create_notification(
    recipient_type,
    recipient_id,
    'message',
    'New Message',
    'You have a new message in conversation',
    (CASE WHEN recipient_type = 'buyer' THEN '/buyer/dashboard/messages/' ELSE '/dashboard/messages/' END) || NEW.conversation_id::TEXT,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- Notify on low inventory
CREATE OR REPLACE FUNCTION notify_low_inventory()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
BEGIN
  IF NEW.quantity_available <= NEW.reorder_level AND OLD.quantity_available > OLD.reorder_level THEN
    SELECT name INTO product_name FROM products WHERE id = NEW.product_id;
    
    PERFORM create_notification(
      'supplier',
      NEW.supplier_id,
      'inventory',
      'Low Inventory Alert',
      'Product "' || product_name || '" is running low on stock',
      '/dashboard/inventory/' || NEW.product_id::TEXT,
      jsonb_build_object('product_id', NEW.product_id, 'quantity', NEW.quantity_available, 'reorder_level', NEW.reorder_level)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_low_inventory
AFTER UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION notify_low_inventory();

-- Notify on payment received
CREATE OR REPLACE FUNCTION notify_payment()
RETURNS TRIGGER AS $$
DECLARE
  order_number TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT o.order_number INTO order_number 
    FROM orders o
    WHERE o.id = NEW.order_id;
    
    -- Notify supplier
    PERFORM create_notification(
      'supplier',
      NEW.supplier_id,
      'payment',
      'Payment Received',
      'Payment of KES ' || NEW.amount::TEXT || ' received for order #' || order_number,
      '/dashboard/invoices/' || NEW.invoice_id::TEXT,
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'order_number', order_number)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_payment
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment();
