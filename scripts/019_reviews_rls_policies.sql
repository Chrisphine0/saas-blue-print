-- RLS policies for reviews

ALTER TABLE supplier_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published product reviews
CREATE POLICY product_reviews_select_published ON product_reviews
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Buyers can create product reviews for their orders
CREATE POLICY product_reviews_buyer_insert ON product_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
    AND order_id IN (
      SELECT id FROM orders WHERE buyer_id IN (
        SELECT id FROM buyers WHERE user_id = auth.uid()
      )
    )
  );

-- Buyers can view their own reviews
CREATE POLICY product_reviews_buyer_select_own ON product_reviews
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can view reviews on their products
CREATE POLICY product_reviews_supplier_select ON product_reviews
  FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE supplier_id IN (
        SELECT id FROM suppliers WHERE user_id = auth.uid()
      )
    )
  );

-- Supplier reviews policies
CREATE POLICY supplier_reviews_select_published ON supplier_reviews
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Buyers can create supplier reviews for their orders
CREATE POLICY supplier_reviews_buyer_insert ON supplier_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
    AND order_id IN (
      SELECT id FROM orders WHERE buyer_id IN (
        SELECT id FROM buyers WHERE user_id = auth.uid()
      ) AND status = 'delivered'
    )
  );

-- Buyers can view their own supplier reviews
CREATE POLICY supplier_reviews_buyer_select_own ON supplier_reviews
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can view their reviews
CREATE POLICY supplier_reviews_supplier_select ON supplier_reviews
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );
