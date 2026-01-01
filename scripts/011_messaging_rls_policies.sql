-- RLS policies for messaging

-- Conversations policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Buyers can see their conversations
CREATE POLICY conversations_buyer_select ON conversations
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Suppliers can see their conversations
CREATE POLICY conversations_supplier_select ON conversations
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Buyers can create conversations with suppliers
CREATE POLICY conversations_buyer_insert ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM buyers WHERE user_id = auth.uid()
    )
  );

-- Both parties can update conversation status
CREATE POLICY conversations_update ON conversations
  FOR UPDATE
  TO authenticated
  USING (
    buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
    OR supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
  );

-- Messages policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages in their conversations
CREATE POLICY messages_select ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
         OR supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY messages_insert ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
         OR supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
    )
  );

-- Users can mark their messages as read
CREATE POLICY messages_update ON messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
         OR supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
    )
  );
