CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
  discount_value DECIMAL(10,2),
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  buy_quantity INTEGER,
  get_quantity INTEGER,
  applies_to VARCHAR(50) NOT NULL CHECK (applies_to IN ('all_products', 'specific_products', 'category')),
  product_ids UUID[],
  category_ids UUID[],
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_buyer_limit INTEGER,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_supplier ON promotions(supplier_id);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(is_active, start_date, end_date);
CREATE INDEX idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_buyer ON promotion_usage(buyer_id);
