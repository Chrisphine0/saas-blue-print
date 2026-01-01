-- Delivery tracking tables
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
  pickup_address TEXT,
  delivery_address TEXT NOT NULL,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_notes TEXT,
  signature_url TEXT,
  proof_of_delivery_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_buyer ON deliveries(buyer_id);
CREATE INDEX idx_deliveries_supplier ON deliveries(supplier_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_tracking ON deliveries(tracking_number);
CREATE INDEX idx_delivery_updates_delivery ON delivery_updates(delivery_id, created_at DESC);

-- Generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  tracking_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(tracking_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM deliveries
  WHERE tracking_number ~ '^TRK[0-9]+$';
  
  tracking_num := 'TRK' || LPAD(next_num::TEXT, 8, '0');
  RETURN tracking_num;
END;
$$ LANGUAGE plpgsql;

-- Auto-create delivery when order is confirmed
CREATE OR REPLACE FUNCTION create_delivery_for_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO deliveries (
      tracking_number,
      order_id,
      buyer_id,
      supplier_id,
      delivery_address,
      estimated_delivery_date,
      status
    )
    VALUES (
      generate_tracking_number(),
      NEW.id,
      NEW.buyer_id,
      NEW.supplier_id,
      NEW.delivery_address,
      COALESCE(NEW.expected_delivery_date::DATE, CURRENT_DATE + INTERVAL '7 days'),
      'pending'
    );
    
    -- Create initial delivery update
    INSERT INTO delivery_updates (
      delivery_id,
      status,
      notes,
      updated_by
    )
    SELECT 
      id,
      'pending',
      'Delivery created and awaiting pickup',
      'system'
    FROM deliveries
    WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_delivery
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_delivery_for_order();

-- Update order status based on delivery
CREATE OR REPLACE FUNCTION update_order_from_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'picked_up' THEN
    UPDATE orders SET status = 'processing' WHERE id = NEW.order_id;
  ELSIF NEW.status = 'in_transit' OR NEW.status = 'out_for_delivery' THEN
    UPDATE orders SET status = 'shipped' WHERE id = NEW.order_id;
  ELSIF NEW.status = 'delivered' THEN
    UPDATE orders 
    SET status = 'delivered', actual_delivery_date = NEW.actual_delivery_date::TEXT 
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_from_delivery
AFTER UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION update_order_from_delivery();
