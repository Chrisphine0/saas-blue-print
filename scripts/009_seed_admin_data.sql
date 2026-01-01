-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('commission_rate', '{"default": 5, "min": 0, "max": 20}'::jsonb, 'Platform commission rate percentage'),
  ('order_approval_required', 'false'::jsonb, 'Whether orders require admin approval'),
  ('supplier_verification_required', 'true'::jsonb, 'Whether suppliers need verification before listing products'),
  ('buyer_verification_required', 'false'::jsonb, 'Whether buyers need verification before placing orders'),
  ('maintenance_mode', 'false'::jsonb, 'Platform maintenance mode'),
  ('min_order_amount', '{"KES": 500, "USD": 5}'::jsonb, 'Minimum order amounts by currency'),
  ('payment_methods', '["mpesa", "cash_on_delivery", "bank_transfer"]'::jsonb, 'Enabled payment methods'),
  ('supported_currencies', '["KES", "USD"]'::jsonb, 'Supported currencies'),
  ('notification_settings', '{"email": true, "sms": false, "push": false}'::jsonb, 'Notification preferences')
ON CONFLICT (key) DO NOTHING;

-- Note: First admin must be created manually through Supabase Auth
-- Then run: INSERT INTO admins (auth_id, email, full_name, role) 
-- VALUES ('auth-user-id', 'admin@example.com', 'Admin Name', 'super_admin');
