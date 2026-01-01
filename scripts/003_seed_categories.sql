-- Seed common B2B product categories
INSERT INTO categories (name, slug, description) VALUES
  ('Food & Beverages', 'food-beverages', 'Packaged foods, drinks, and perishables'),
  ('Electronics', 'electronics', 'Consumer electronics and accessories'),
  ('Home & Garden', 'home-garden', 'Home improvement and gardening supplies'),
  ('Office Supplies', 'office-supplies', 'Stationery, furniture, and office equipment'),
  ('Health & Beauty', 'health-beauty', 'Personal care and cosmetics'),
  ('Clothing & Textiles', 'clothing-textiles', 'Apparel and fabric materials'),
  ('Building Materials', 'building-materials', 'Construction and hardware supplies'),
  ('Agriculture', 'agriculture', 'Farming supplies and equipment')
ON CONFLICT (slug) DO NOTHING;
