-- RLS for supplier_ratings
ALTER TABLE supplier_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supplier ratings"
  ON supplier_ratings FOR SELECT
  USING (true);

CREATE POLICY "System can manage supplier ratings"
  ON supplier_ratings FOR ALL
  USING (auth.uid() IN (SELECT id FROM admins));

-- RLS for supplier_follows
ALTER TABLE supplier_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their follows"
  ON supplier_follows FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can manage their follows"
  ON supplier_follows FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can delete their follows"
  ON supplier_follows FOR DELETE
  USING (buyer_id = auth.uid());

-- RLS for product_views
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own views"
  ON product_views FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Anyone can insert product views"
  ON product_views FOR INSERT
  WITH CHECK (true);
