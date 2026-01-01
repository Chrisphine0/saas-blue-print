-- Enable Row Level Security on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Suppliers Policies (suppliers can only manage their own data)
CREATE POLICY "Suppliers can view their own profile"
  ON suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can update their own profile"
  ON suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create a supplier profile"
  ON suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Categories Policies (public read, admin write - for now allow all authenticated users to read)
CREATE POLICY "Anyone authenticated can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Products Policies (suppliers manage their own products, buyers can view all active)
CREATE POLICY "Suppliers can view their own products"
  ON products FOR SELECT
  USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can view active products"
  ON products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Suppliers can create their own products"
  ON products FOR INSERT
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can update their own products"
  ON products FOR UPDATE
  USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can delete their own products"
  ON products FOR DELETE
  USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

-- Inventory Policies (suppliers manage their inventory)
CREATE POLICY "Suppliers can view their own inventory"
  ON inventory FOR SELECT
  USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can create inventory records"
  ON inventory FOR INSERT
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can update their own inventory"
  ON inventory FOR UPDATE
  USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

-- Buyers Policies (buyers can only manage their own data)
CREATE POLICY "Buyers can view their own profile"
  ON buyers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Buyers can update their own profile"
  ON buyers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create a buyer profile"
  ON buyers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Suppliers can view orders for their products"
  ON orders FOR SELECT
  USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  WITH CHECK (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can update their orders"
  ON orders FOR UPDATE
  USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

-- Order Items Policies
CREATE POLICY "Suppliers can view order items for their orders"
  ON order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Buyers can view their order items"
  ON order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);
