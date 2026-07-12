-- PolicyPal AI - Database Schema Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('HR_ADMIN', 'EMPLOYEE')),
    department TEXT,
    location TEXT,
    employment_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create a demo organization for testing
INSERT INTO organizations (name) VALUES ('Demo Company Inc.');

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for organizations table
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Anyone can insert their own profile during signup"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- HR_ADMIN can view all profiles in their organization
CREATE POLICY "HR_ADMIN can view all profiles in their organization"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'HR_ADMIN'
            AND p.org_id = profiles.org_id
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Note: After running this migration, get the demo organization ID and use it in your signup process
-- Run this query to get it: SELECT id FROM organizations WHERE name = 'Demo Company Inc.';
