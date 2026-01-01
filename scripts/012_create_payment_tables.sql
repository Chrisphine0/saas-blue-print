-- Payment and invoicing tables
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'bank_transfer', 'cash', 'credit', 'check')),
  transaction_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_buyer ON invoices(buyer_id);
CREATE INDEX idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_buyer ON payments(buyer_id);
CREATE INDEX idx_payments_supplier ON payments(supplier_id);

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  invoice_num := 'INV-' || LPAD(next_num::TEXT, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Generate payment number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  payment_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM payments
  WHERE payment_number ~ '^PAY-[0-9]+$';
  
  payment_num := 'PAY-' || LPAD(next_num::TEXT, 6, '0');
  RETURN payment_num;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate invoice when order is confirmed
CREATE OR REPLACE FUNCTION create_invoice_for_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO invoices (
      invoice_number,
      order_id,
      buyer_id,
      supplier_id,
      subtotal,
      tax_amount,
      total_amount,
      due_date
    )
    VALUES (
      generate_invoice_number(),
      NEW.id,
      NEW.buyer_id,
      NEW.supplier_id,
      NEW.total_amount,
      0,
      NEW.total_amount,
      CURRENT_DATE + INTERVAL '30 days'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_invoice
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_invoice_for_order();

-- Update order payment status when payment is made
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  order_total DECIMAL(12, 2);
  total_paid DECIMAL(12, 2);
BEGIN
  IF NEW.status = 'completed' THEN
    -- Get order total
    SELECT total_amount INTO order_total
    FROM orders
    WHERE id = NEW.order_id;
    
    -- Get total paid for this order
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE order_id = NEW.order_id AND status = 'completed';
    
    -- Update order payment status
    IF total_paid >= order_total THEN
      UPDATE orders SET payment_status = 'paid' WHERE id = NEW.order_id;
      UPDATE invoices SET status = 'paid', paid_date = CURRENT_DATE WHERE order_id = NEW.order_id;
    ELSIF total_paid > 0 THEN
      UPDATE orders SET payment_status = 'partial' WHERE id = NEW.order_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_status
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();
