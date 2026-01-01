-- Add cart functionality for buyers
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);

-- Add buyer favorites/wishlist
CREATE TABLE IF NOT EXISTS buyer_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);

-- Add reorder alerts for buyers
CREATE TABLE IF NOT EXISTS reorder_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  threshold_quantity INTEGER NOT NULL,
  alert_frequency TEXT DEFAULT 'weekly' CHECK (alert_frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT TRUE,
  last_alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);

-- Add product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id, order_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer_id ON cart_items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_buyer_favorites_buyer_id ON buyer_favorites(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reorder_alerts_buyer_id ON reorder_alerts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_buyer_id ON product_reviews(buyer_id);
