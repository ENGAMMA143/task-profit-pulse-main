
-- Update profiles table to match your requirements
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_deposited NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_level investment_level DEFAULT 'bronze';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_profit NUMERIC DEFAULT 0;

-- Create levels configuration table
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level investment_level NOT NULL UNIQUE,
  min_deposit NUMERIC NOT NULL,
  max_deposit NUMERIC NOT NULL,
  tasks_per_day INTEGER NOT NULL,
  min_daily_earning NUMERIC NOT NULL,
  max_daily_earning NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert level configurations
INSERT INTO levels (level, min_deposit, max_deposit, tasks_per_day, min_daily_earning, max_daily_earning) 
VALUES 
  ('bronze', 5.00, 20.00, 10, 1.00, 2.00),
  ('silver', 20.00, 50.00, 10, 3.00, 5.00),
  ('gold', 50.00, 100.00, 10, 6.00, 10.00)
ON CONFLICT (level) DO UPDATE SET
  min_deposit = EXCLUDED.min_deposit,
  max_deposit = EXCLUDED.max_deposit,
  tasks_per_day = EXCLUDED.tasks_per_day,
  min_daily_earning = EXCLUDED.min_daily_earning,
  max_daily_earning = EXCLUDED.max_daily_earning;

-- Update deposits table structure
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS binance_address TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS amount_expected NUMERIC;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS level_requested investment_level;

-- Update daily_tasks table structure  
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS task_number INTEGER DEFAULT 1;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS earnings NUMERIC DEFAULT 0;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS available_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update profits table to ensure level_at_time column exists
ALTER TABLE profits ADD COLUMN IF NOT EXISTS level_at_time investment_level NOT NULL DEFAULT 'bronze';

-- Enable RLS on levels table
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- Create policy for levels (publicly readable)
CREATE POLICY "Anyone can view levels" ON levels FOR SELECT USING (true);

-- Update RLS policies for deposits to include new columns
DROP POLICY IF EXISTS "Users can view their own deposits" ON deposits;
CREATE POLICY "Users can view their own deposits" ON deposits 
  FOR SELECT USING (auth.uid() = user_id);

-- Create session tracking table for security
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON user_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions 
  FOR UPDATE USING (auth.uid() = user_id);
