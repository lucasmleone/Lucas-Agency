-- Migration: Add portal and delivery fields to projects table

ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_token VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_pin VARCHAR(10);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_expires_at TIMESTAMP NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivery_data JSON;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS drive_link VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_token ON projects(portal_token);
