-- Migration: Add portal and delivery fields to projects table
-- Removing IF NOT EXISTS for compatibility

ALTER TABLE projects ADD COLUMN portal_token VARCHAR(255);
ALTER TABLE projects ADD COLUMN portal_pin VARCHAR(10);
ALTER TABLE projects ADD COLUMN portal_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN portal_expires_at TIMESTAMP NULL;
ALTER TABLE projects ADD COLUMN delivery_data JSON;
ALTER TABLE projects ADD COLUMN drive_link VARCHAR(500);
ALTER TABLE projects ADD COLUMN requirements TEXT;

-- Add indexes for performance
CREATE INDEX idx_portal_token ON projects(portal_token);
