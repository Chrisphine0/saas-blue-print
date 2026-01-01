-- Enable RLS on admin tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;

-- Admin policies - admins can read their own profile
CREATE POLICY "Admins can view their own profile"
  ON admins FOR SELECT
  USING (auth.uid() = auth_id);

-- Only super admins can manage other admins
CREATE POLICY "Super admins can manage admins"
  ON admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Platform settings - admins can view, super admins can modify
CREATE POLICY "Admins can view platform settings"
  ON platform_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can manage platform settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Audit logs - admins can view all, system can insert
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- User verifications - admins can manage
CREATE POLICY "Admins can manage verifications"
  ON user_verifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Commission records - admins can view and manage
CREATE POLICY "Admins can view commission records"
  ON commission_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage commission records"
  ON commission_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );
