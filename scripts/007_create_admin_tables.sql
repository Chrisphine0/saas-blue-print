-- Admin tables and schema
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit log for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- User verification/approval tracking
CREATE TABLE IF NOT EXISTS user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL CHECK (user_type IN ('supplier', 'buyer')),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES admins(id),
  verification_notes text,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Platform commission tracking
CREATE TABLE IF NOT EXISTS commission_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  supplier_id uuid REFERENCES suppliers(id),
  order_total decimal(10,2) NOT NULL,
  commission_rate decimal(5,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_admins_auth_id ON admins(auth_id);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_user_verifications_status ON user_verifications(status);
CREATE INDEX idx_commission_records_order_id ON commission_records(order_id);
CREATE INDEX idx_commission_records_supplier_id ON commission_records(supplier_id);

-- Triggers
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
