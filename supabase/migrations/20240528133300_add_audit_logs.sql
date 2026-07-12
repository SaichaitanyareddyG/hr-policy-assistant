-- =====================================================
-- AUDIT LOGS & FAQ SYSTEM MIGRATION
-- =====================================================
-- Created: 2026-05-28
-- Purpose: Add audit logging and HR-approved FAQ system
-- =====================================================

-- =====================================================
-- PART 1: AUDIT LOGS TABLE
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON public.audit_logs USING gin(metadata);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs

-- Policy 1: Service role can insert (server-side only)
CREATE POLICY "Service role can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy 2: ORG_ADMIN can view all org audit logs
CREATE POLICY "ORG_ADMIN can view org audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = audit_logs.org_id
            AND profiles.role = 'ORG_ADMIN'
        )
    );

-- Policy 3: DEPARTMENT_ADMIN can view limited audit logs for their department
CREATE POLICY "DEPARTMENT_ADMIN can view department audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = audit_logs.org_id
            AND profiles.role = 'DEPARTMENT_ADMIN'
            AND (
                -- Can see their own actions
                audit_logs.actor_user_id = auth.uid()
                -- Can see actions related to documents in their scope
                OR (audit_logs.metadata->>'department_scope' = profiles.department_scope)
            )
        )
    );

-- =====================================================
-- PART 2: APPROVED FAQ TABLE
-- =====================================================

-- Create approved_faqs table
CREATE TABLE IF NOT EXISTS public.approved_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    audience_type TEXT DEFAULT 'ALL' CHECK (audience_type IN ('ALL', 'RESTRICTED')),
    allowed_departments TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_employment_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_approved_faqs_org_id ON public.approved_faqs(org_id);
CREATE INDEX IF NOT EXISTS idx_approved_faqs_status ON public.approved_faqs(status);
CREATE INDEX IF NOT EXISTS idx_approved_faqs_category ON public.approved_faqs(category);
CREATE INDEX IF NOT EXISTS idx_approved_faqs_audience_type ON public.approved_faqs(audience_type);
CREATE INDEX IF NOT EXISTS idx_approved_faqs_created_at ON public.approved_faqs(created_at DESC);

-- Create full-text search index on question
CREATE INDEX IF NOT EXISTS idx_approved_faqs_question_fts 
    ON public.approved_faqs 
    USING gin(to_tsvector('english', question));

-- Enable RLS
ALTER TABLE public.approved_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approved_faqs

-- Policy 1: Admins can manage FAQs
CREATE POLICY "Admins can manage FAQs"
    ON public.approved_faqs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = approved_faqs.org_id
            AND profiles.role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = approved_faqs.org_id
            AND profiles.role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
        )
    );

-- Policy 2: Employees can read active FAQs they have access to
CREATE POLICY "Employees can read accessible FAQs"
    ON public.approved_faqs
    FOR SELECT
    TO authenticated
    USING (
        approved_faqs.status = 'ACTIVE'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = approved_faqs.org_id
            AND (
                -- ALL audience type
                approved_faqs.audience_type = 'ALL'
                OR (
                    -- RESTRICTED audience type with matching criteria
                    approved_faqs.audience_type = 'RESTRICTED'
                    AND (
                        -- No department restriction or employee's department is allowed
                        (approved_faqs.allowed_departments = ARRAY[]::TEXT[] 
                         OR profiles.department = ANY(approved_faqs.allowed_departments))
                        -- No location restriction or employee's location is allowed
                        AND (approved_faqs.allowed_locations = ARRAY[]::TEXT[] 
                             OR profiles.location = ANY(approved_faqs.allowed_locations))
                        -- No employment type restriction or employee's type is allowed
                        AND (approved_faqs.allowed_employment_types = ARRAY[]::TEXT[] 
                             OR profiles.employment_type = ANY(approved_faqs.allowed_employment_types))
                    )
                )
            )
        )
    );

-- =====================================================
-- PART 3: HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approved_faqs updated_at
DROP TRIGGER IF EXISTS update_approved_faqs_updated_at ON public.approved_faqs;
CREATE TRIGGER update_approved_faqs_updated_at
    BEFORE UPDATE ON public.approved_faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 4: INITIAL DATA COMMENTS
-- =====================================================

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'System-wide audit log for tracking all important actions';
COMMENT ON TABLE public.approved_faqs IS 'HR-approved frequently asked questions with audience targeting';

COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (e.g., organization_created, user_invited, document_uploaded)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (e.g., organization, user, document, faq)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'UUID of the affected resource';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context as JSON (e.g., old_value, new_value, details)';

COMMENT ON COLUMN public.approved_faqs.audience_type IS 'ALL = everyone in org, RESTRICTED = specific departments/locations/types';
COMMENT ON COLUMN public.approved_faqs.allowed_departments IS 'Array of department names (empty = all departments)';
COMMENT ON COLUMN public.approved_faqs.allowed_locations IS 'Array of location names (empty = all locations)';
COMMENT ON COLUMN public.approved_faqs.allowed_employment_types IS 'Array of employment types (empty = all types)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Apply this migration to Supabase
-- 2. Implement audit log helpers in application code
-- 3. Add audit logging to all key actions
-- 4. Build FAQ management UI
-- 5. Update chat flow to check FAQs first
-- =====================================================
