-- Migration: 20261109000001_monochrome_design_system.sql
-- Description: Unify platform design system to Pure Black Monochrome.
-- Retains user_preferences table structure while updating defaults and existing rows.

-- 1. Update existing preferences to unified monochrome
UPDATE public.user_preferences
SET 
  theme_mode = 'dark',
  accent_color = 'monochrome',
  custom_accent_hex = NULL;

-- 2. Alter column defaults to enforce pure black monochrome
ALTER TABLE public.user_preferences 
  ALTER COLUMN theme_mode SET DEFAULT 'dark',
  ALTER COLUMN accent_color SET DEFAULT 'monochrome',
  ALTER COLUMN custom_accent_hex SET DEFAULT NULL;

-- Comment on table documenting single-theme architecture
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences. Theme is strictly unified Pure Black Monochrome + Solid Neumorphism.';

