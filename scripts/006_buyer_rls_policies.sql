-- Enable RLS for buyer tables
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Buyers table policies
CREATE POLICY "Buyers can view their own profile"
  ON buyers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Buyers can update their own profile"
  ON buyers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create a buyer profile"
  ON buyers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cart items policies
CREATE POLICY "Buyers can view their own cart"
  ON cart_items FOR SELECT
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can add to their cart"
  ON cart_items FOR INSERT
  WITH CHECK (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can update their cart"
  ON cart_items FOR UPDATE
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can delete from their cart"
  ON cart_items FOR DELETE
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

-- Favorites policies
CREATE POLICY "Buyers can view their favorites"
  ON buyer_favorites FOR SELECT
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can add favorites"
  ON buyer_favorites FOR INSERT
  WITH CHECK (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can remove favorites"
  ON buyer_favorites FOR DELETE
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

-- Reorder alerts policies
CREATE POLICY "Buyers can view their reorder alerts"
  ON reorder_alerts FOR SELECT
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can create reorder alerts"
  ON reorder_alerts FOR INSERT
  WITH CHECK (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can update their reorder alerts"
  ON reorder_alerts FOR UPDATE
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can delete their reorder alerts"
  ON reorder_alerts FOR DELETE
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

-- Product reviews policies
CREATE POLICY "Anyone can view product reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Buyers can create reviews for products they purchased"
  ON product_reviews FOR INSERT
  WITH CHECK (
    buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()) AND
    order_id IN (SELECT id FROM orders WHERE buyer_id = product_reviews.buyer_id AND status = 'delivered')
  );

CREATE POLICY "Buyers can update their own reviews"
  ON product_reviews FOR UPDATE
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can delete their own reviews"
  ON product_reviews FOR DELETE
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

-- Orders policies for buyers (view only)
CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

-- Order items policies for buyers (view only)
CREATE POLICY "Buyers can view order items for their orders"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())));

-- Products policies (public read)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Inventory policies (public read for available quantity)
CREATE POLICY "Anyone can view inventory levels"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Suppliers policies (public read for verified suppliers)
CREATE POLICY "Anyone can view verified suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (verified = true AND status = 'active');
