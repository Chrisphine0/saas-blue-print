-- Reviews already exist in the product_reviews table, let's enhance it
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden'));
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT true;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Supplier reviews table
CREATE TABLE IF NOT EXISTS supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden')),
  verified_purchase BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, order_id)
);

-- Indexes
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id, status);
CREATE INDEX idx_product_reviews_buyer ON product_reviews(buyer_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating DESC);
CREATE INDEX idx_supplier_reviews_supplier ON supplier_reviews(supplier_id, status);
CREATE INDEX idx_supplier_reviews_buyer ON supplier_reviews(buyer_id);
CREATE INDEX idx_supplier_reviews_order ON supplier_reviews(order_id);

-- Function to calculate product average rating
CREATE OR REPLACE FUNCTION calculate_product_rating(p_product_id UUID)
RETURNS TABLE(avg_rating DECIMAL, total_reviews INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2) as avg_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM product_reviews
  WHERE product_id = p_product_id AND status = 'published';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate supplier average rating
CREATE OR REPLACE FUNCTION calculate_supplier_rating(p_supplier_id UUID)
RETURNS TABLE(avg_rating DECIMAL, total_reviews INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2) as avg_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM supplier_reviews
  WHERE supplier_id = p_supplier_id AND status = 'published';
END;
$$ LANGUAGE plpgsql;

-- Notify on new review
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  supplier_id_val UUID;
BEGIN
  SELECT name, supplier_id INTO product_name, supplier_id_val 
  FROM products 
  WHERE id = NEW.product_id;
  
  PERFORM create_notification(
    'supplier',
    supplier_id_val,
    'review',
    'New Product Review',
    'Your product "' || product_name || '" received a ' || NEW.rating || '-star review',
    '/dashboard/products/' || NEW.product_id::TEXT,
    jsonb_build_object('product_id', NEW.product_id, 'review_id', NEW.id, 'rating', NEW.rating)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_product_review
AFTER INSERT ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION notify_new_review();

-- Notify on new supplier review
CREATE OR REPLACE FUNCTION notify_new_supplier_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    'supplier',
    NEW.supplier_id,
    'review',
    'New Supplier Review',
    'You received a ' || NEW.rating || '-star review',
    '/dashboard/reviews',
    jsonb_build_object('review_id', NEW.id, 'rating', NEW.rating)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_supplier_review
AFTER INSERT ON supplier_reviews
FOR EACH ROW
EXECUTE FUNCTION notify_new_supplier_review();
