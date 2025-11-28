-- Migration: Add delivery_data column
ALTER TABLE projects ADD COLUMN delivery_data JSON;
