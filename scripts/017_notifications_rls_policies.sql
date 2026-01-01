-- RLS policies for notifications

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY notifications_select ON notifications
  FOR SELECT
  TO authenticated
  USING (
    (user_type = 'buyer' AND user_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()))
    OR (user_type = 'supplier' AND user_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()))
    OR (user_type = 'admin' AND user_id::TEXT = auth.uid()::TEXT)
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    (user_type = 'buyer' AND user_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()))
    OR (user_type = 'supplier' AND user_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()))
    OR (user_type = 'admin' AND user_id::TEXT = auth.uid()::TEXT)
  );

-- Users can delete their own notifications
CREATE POLICY notifications_delete ON notifications
  FOR DELETE
  TO authenticated
  USING (
    (user_type = 'buyer' AND user_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()))
    OR (user_type = 'supplier' AND user_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()))
    OR (user_type = 'admin' AND user_id::TEXT = auth.uid()::TEXT)
  );
