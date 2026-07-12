-- PolicyPal AI - Step 2: Document Management Migration
-- Run this in Supabase SQL Editor after Step 1 migration

-- Create policy_documents table
CREATE TABLE policy_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    version TEXT,
    effective_date DATE,
    audience_type TEXT NOT NULL DEFAULT 'ALL' CHECK (audience_type IN ('ALL', 'CUSTOM')),
    allowed_departments TEXT[],
    allowed_locations TEXT[],
    allowed_employment_types TEXT[],
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_policy_documents_org_id ON policy_documents(org_id);
CREATE INDEX idx_policy_documents_status ON policy_documents(status);
CREATE INDEX idx_policy_documents_category ON policy_documents(category);
CREATE INDEX idx_policy_documents_uploaded_by ON policy_documents(uploaded_by);
CREATE INDEX idx_policy_documents_effective_date ON policy_documents(effective_date);

-- Enable Row Level Security
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: HR_ADMIN can do everything in their organization
CREATE POLICY "HR_ADMIN can manage all documents in their org"
    ON policy_documents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'HR_ADMIN'
            AND profiles.org_id = policy_documents.org_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'HR_ADMIN'
            AND profiles.org_id = policy_documents.org_id
        )
    );

-- RLS Policy: EMPLOYEE can view ACTIVE documents in their org
-- Note: Audience filtering is done at application level for simplicity
-- This policy only enforces org-level and status-level access
CREATE POLICY "EMPLOYEE can view ACTIVE documents in their org"
    ON policy_documents
    FOR SELECT
    USING (
        status = 'ACTIVE'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id = policy_documents.org_id
        )
    );

-- Create updated_at trigger function (if not already exists from Step 1)
CREATE OR REPLACE FUNCTION update_policy_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to policy_documents table
CREATE TRIGGER update_policy_documents_updated_at
    BEFORE UPDATE ON policy_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_policy_documents_updated_at();

-- Create storage bucket setup (run separately in Supabase Storage UI or via SQL)
-- Note: This is informational - actual bucket creation done in Supabase Dashboard

-- Bucket configuration:
-- Name: policy-documents
-- Public: false (private bucket)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf

-- Storage policies will be created via Supabase Dashboard:
-- 1. Allow authenticated users to upload based on app logic
-- 2. Allow authenticated users to read based on app logic
