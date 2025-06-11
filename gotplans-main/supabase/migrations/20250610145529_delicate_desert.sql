/*
  # Planning Agent Database Schema

  1. New Tables
    - `user_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `status` (text: 'planning', 'in_progress', 'completed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `task_plans`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, references user_goals)
      - `title` (text)
      - `description` (text)
      - `sequence_order` (integer)
      - `estimated_duration` (text)
      - `priority` (text: 'low', 'medium', 'high')
      - `status` (text: 'pending', 'in_progress', 'completed')
      - `created_at` (timestamp)
    
    - `sub_tasks`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, references task_plans)
      - `title` (text)
      - `description` (text)
      - `sequence_order` (integer)
      - `completed` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_plans table
CREATE TABLE IF NOT EXISTS task_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES user_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sequence_order integer NOT NULL,
  estimated_duration text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Create sub_tasks table
CREATE TABLE IF NOT EXISTS sub_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES task_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sequence_order integer NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_goals
CREATE POLICY "Users can manage their own goals"
  ON user_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for task_plans
CREATE POLICY "Users can manage plans for their goals"
  ON task_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_goals 
      WHERE user_goals.id = task_plans.goal_id 
      AND user_goals.user_id = auth.uid()
    )
  );

-- Create policies for sub_tasks
CREATE POLICY "Users can manage sub-tasks for their plans"
  ON sub_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_plans 
      JOIN user_goals ON user_goals.id = task_plans.goal_id
      WHERE task_plans.id = sub_tasks.plan_id 
      AND user_goals.user_id = auth.uid()
    )
  );