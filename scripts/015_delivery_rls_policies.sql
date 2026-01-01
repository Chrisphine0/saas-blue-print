-- RLS policies for deliveries

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_updates ENABLE ROW LEVEL SECURITY;

-- Buyers can view their deliveries
CREATE POLICY deliveries_buyer_select ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can view their deliveries
CREATE POLICY deliveries_supplier_select ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can update deliveries
CREATE POLICY deliveries_supplier_update ON deliveries
  FOR UPDATE
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Users can view delivery updates for their deliveries
CREATE POLICY delivery_updates_select ON delivery_updates
  FOR SELECT
  TO authenticated
  USING (
    delivery_id IN (
      SELECT id FROM deliveries
      WHERE buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
         OR supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
    )
  );

-- Suppliers can create delivery updates
CREATE POLICY delivery_updates_insert ON delivery_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    delivery_id IN (
      SELECT id FROM deliveries
      WHERE supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
    )
  );
