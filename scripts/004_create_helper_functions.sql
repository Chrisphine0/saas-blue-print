-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get count of orders today
  SELECT COUNT(*) INTO counter 
  FROM orders 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: ORD-YYYYMMDD-0001
  new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory when order is placed
CREATE OR REPLACE FUNCTION reserve_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Reserve inventory when order item is created
  UPDATE inventory
  SET quantity_reserved = quantity_reserved + NEW.quantity
  WHERE product_id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reserve_inventory_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION reserve_inventory();

-- Function to release inventory when order is cancelled
CREATE OR REPLACE FUNCTION release_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE inventory
    SET quantity_reserved = quantity_reserved - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND inventory.product_id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER release_inventory_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION release_inventory();
