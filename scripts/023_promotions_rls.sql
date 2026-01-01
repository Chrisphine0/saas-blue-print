-- RLS for promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view their promotions"
  ON promotions FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can create promotions"
  ON promotions FOR INSERT
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Suppliers can update their promotions"
  ON promotions FOR UPDATE
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can delete their promotions"
  ON promotions FOR DELETE
  USING (supplier_id = auth.uid());

CREATE POLICY "Buyers can view active promotions"
  ON promotions FOR SELECT
  USING (
    is_active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  );

-- RLS for promotion_usage
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their promotion usage"
  ON promotion_usage FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "System can insert promotion usage"
  ON promotion_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Suppliers can view their promotion usage"
  ON promotion_usage FOR SELECT
  USING (
    promotion_id IN (
      SELECT id FROM promotions WHERE supplier_id = auth.uid()
    )
  );
