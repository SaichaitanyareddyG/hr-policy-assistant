-- =====================================================
-- STEP 4: Employee Chatbot - Chat History
-- =====================================================
-- This migration adds:
-- 1. chat_sessions table for conversation sessions
-- 2. chat_messages table for storing messages
-- 3. Indexes for performance
-- 4. RLS policies for security
-- =====================================================

-- =====================================================
-- 1. CREATE chat_sessions TABLE
-- =====================================================

CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comments
COMMENT ON TABLE chat_sessions IS 'Stores employee chat sessions with PolicyPal AI assistant';
COMMENT ON COLUMN chat_sessions.title IS 'Auto-generated title from first question or manually set';
COMMENT ON COLUMN chat_sessions.user_id IS 'Employee who created this session';

-- =====================================================
-- 2. CREATE chat_messages TABLE
-- =====================================================

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb,
  confidence text CHECK (confidence IN ('High', 'Medium', 'Low')),
  created_at timestamp with time zone DEFAULT now()
);

-- Add comments
COMMENT ON TABLE chat_messages IS 'Stores individual messages in chat conversations';
COMMENT ON COLUMN chat_messages.role IS 'user (employee question) or assistant (AI response)';
COMMENT ON COLUMN chat_messages.content IS 'Message text content';
COMMENT ON COLUMN chat_messages.sources IS 'JSON array of source documents cited in assistant responses';
COMMENT ON COLUMN chat_messages.confidence IS 'AI confidence level in the answer';

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Index for user's sessions
CREATE INDEX idx_chat_sessions_user_id 
ON chat_sessions(user_id);

-- Index for org sessions
CREATE INDEX idx_chat_sessions_org_id 
ON chat_sessions(org_id);

-- Index for session messages
CREATE INDEX idx_chat_messages_session_id 
ON chat_messages(session_id);

-- Index for user messages
CREATE INDEX idx_chat_messages_user_id 
ON chat_messages(user_id);

-- Index for org messages
CREATE INDEX idx_chat_messages_org_id 
ON chat_messages(org_id);

-- Index for chronological ordering
CREATE INDEX idx_chat_messages_created_at 
ON chat_messages(created_at);

-- =====================================================
-- 4. CREATE TRIGGER FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_updated_at();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Employees can read their own sessions
CREATE POLICY "Employees can read their own chat sessions"
ON chat_sessions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND org_id = (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Policy 2: Employees can create their own sessions
CREATE POLICY "Employees can create their own chat sessions"
ON chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND org_id = (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Policy 3: Employees can update their own sessions
CREATE POLICY "Employees can update their own chat sessions"
ON chat_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: HR Admins can read all sessions in their org
CREATE POLICY "HR admins can read all chat sessions in their org"
ON chat_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = chat_sessions.org_id
    AND profiles.role = 'HR_ADMIN'
  )
);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy 5: Employees can read their own messages
CREATE POLICY "Employees can read their own chat messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND org_id = (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Policy 6: Employees can create their own messages
CREATE POLICY "Employees can create their own chat messages"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND org_id = (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Policy 7: HR Admins can read all messages in their org
CREATE POLICY "HR admins can read all chat messages in their org"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = chat_messages.org_id
    AND profiles.role = 'HR_ADMIN'
  )
);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get recent sessions for a user
CREATE OR REPLACE FUNCTION get_recent_chat_sessions(user_uuid uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  message_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.title,
    cs.created_at,
    cs.updated_at,
    COUNT(cm.id) as message_count
  FROM chat_sessions cs
  LEFT JOIN chat_messages cm ON cm.session_id = cs.id
  WHERE cs.user_id = user_uuid
  GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at
  ORDER BY cs.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get messages for a session
CREATE OR REPLACE FUNCTION get_session_messages(session_uuid uuid)
RETURNS TABLE (
  id uuid,
  role text,
  content text,
  sources jsonb,
  confidence text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.role,
    cm.content,
    cm.sources,
    cm.confidence,
    cm.created_at
  FROM chat_messages cm
  WHERE cm.session_id = session_uuid
  ORDER BY cm.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'chat_sessions'
  ) THEN
    RAISE EXCEPTION 'Migration failed: chat_sessions table not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'chat_messages'
  ) THEN
    RAISE EXCEPTION 'Migration failed: chat_messages table not created';
  END IF;
  
  RAISE NOTICE 'Step 4 migration completed successfully!';
END $$;
