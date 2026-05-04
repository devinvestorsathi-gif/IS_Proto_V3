-- ============================================================
-- SEED DATA — Run AFTER migrations
-- Creates test accounts for all 3 roles
-- ============================================================

-- NOTE: You cannot directly insert into auth.users via SQL.
-- Create these users via Supabase Dashboard → Authentication → Users:
--
--   admin@investorsaathi.com    (password: Admin@123!)
--   teamlead@investorsaathi.com (password: TeamLead@123!)
--   salesrep@investorsaathi.com (password: Sales@123!)
--
-- Then run the SQL below to set their roles and create a team.

-- After creating users in dashboard, get their UUIDs and replace below.
-- Or use this approach: update by email after they sign up.

-- Step 1: Create a team
INSERT INTO teams (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Team Alpha');

-- Step 2: Set roles (replace emails with your actual users after creating them)
-- Run these AFTER creating the users in Supabase Dashboard:

-- UPDATE profiles SET role = 'admin', team_id = NULL
--   WHERE email = 'admin@investorsaathi.com';

-- UPDATE profiles SET role = 'team_lead', team_id = '11111111-1111-1111-1111-111111111111'
--   WHERE email = 'teamlead@investorsaathi.com';

-- UPDATE teams SET team_lead_id = (SELECT id FROM profiles WHERE email = 'teamlead@investorsaathi.com')
--   WHERE id = '11111111-1111-1111-1111-111111111111';

-- UPDATE profiles SET role = 'sales_rep', team_id = '11111111-1111-1111-1111-111111111111'
--   WHERE email = 'salesrep@investorsaathi.com';

-- Step 3: Sample lead data (run after setting roles)
-- INSERT INTO leads (full_name, phone, email, city, source, stage, assigned_to, team_id)
-- VALUES (
--   'Rajesh Kumar', '+919876543210', 'rajesh@example.com', 'Mumbai',
--   'referral', 'interested',
--   (SELECT id FROM profiles WHERE email = 'salesrep@investorsaathi.com'),
--   '11111111-1111-1111-1111-111111111111'
-- );