CREATE TABLE IF NOT EXISTS supplier_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  communication_rating DECIMAL(3,2) DEFAULT 0,
  delivery_rating DECIMAL(3,2) DEFAULT 0,
  quality_rating DECIMAL(3,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id)
);

CREATE TABLE IF NOT EXISTS supplier_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, supplier_id)
);

CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update supplier ratings
CREATE OR REPLACE FUNCTION update_supplier_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE supplier_ratings
  SET 
    average_rating = (
      SELECT AVG(rating) 
      FROM supplier_reviews 
      WHERE supplier_id = NEW.supplier_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM supplier_reviews 
      WHERE supplier_id = NEW.supplier_id
    ),
    communication_rating = (
      SELECT AVG(communication_rating) 
      FROM supplier_reviews 
      WHERE supplier_id = NEW.supplier_id
    ),
    delivery_rating = (
      SELECT AVG(delivery_rating) 
      FROM supplier_reviews 
      WHERE supplier_id = NEW.supplier_id
    ),
    quality_rating = (
      SELECT AVG(quality_rating) 
      FROM supplier_reviews 
      WHERE supplier_id = NEW.supplier_id
    ),
    updated_at = NOW()
  WHERE supplier_id = NEW.supplier_id;
  
  -- Create rating record if it doesn't exist
  INSERT INTO supplier_ratings (supplier_id)
  VALUES (NEW.supplier_id)
  ON CONFLICT (supplier_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_supplier_ratings_trigger
AFTER INSERT OR UPDATE ON supplier_reviews
FOR EACH ROW
EXECUTE FUNCTION update_supplier_ratings();

CREATE INDEX idx_supplier_ratings_avg ON supplier_ratings(average_rating DESC);
CREATE INDEX idx_supplier_follows_buyer ON supplier_follows(buyer_id);
CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_buyer ON product_views(buyer_id);
