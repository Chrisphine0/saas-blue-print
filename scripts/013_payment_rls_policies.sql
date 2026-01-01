-- RLS policies for invoices and payments

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Buyers can view their invoices
CREATE POLICY invoices_buyer_select ON invoices
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can view their invoices
CREATE POLICY invoices_supplier_select ON invoices
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can update invoice status
CREATE POLICY invoices_supplier_update ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Buyers can view their payments
CREATE POLICY payments_buyer_select ON payments
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can view their payments
CREATE POLICY payments_supplier_select ON payments
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Buyers can create payments
CREATE POLICY payments_buyer_insert ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can update payment status
CREATE POLICY payments_supplier_update ON payments
  FOR UPDATE
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );
