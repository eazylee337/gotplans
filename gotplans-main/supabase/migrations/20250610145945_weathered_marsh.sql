/*
  # Research Agent Database Schema

  1. New Tables
    - `research_requests`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, references task_plans)
      - `query` (text)
      - `status` (text: 'pending', 'in_progress', 'completed', 'failed')
      - `created_at` (timestamp)
    
    - `research_results`
      - `id` (uuid, primary key)
      - `request_id` (uuid, references research_requests)
      - `source_url` (text)
      - `title` (text)
      - `content` (text)
      - `summary` (text)
      - `relevance_score` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access research related to their goals
*/

-- Create research_requests table
CREATE TABLE IF NOT EXISTS research_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES task_plans(id) ON DELETE CASCADE,
  query text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create research_results table
CREATE TABLE IF NOT EXISTS research_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES research_requests(id) ON DELETE CASCADE,
  source_url text,
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  relevance_score integer DEFAULT 5 CHECK (relevance_score >= 1 AND relevance_score <= 10),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE research_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_results ENABLE ROW LEVEL SECURITY;

-- Create policies for research_requests
CREATE POLICY "Users can manage research for their plans"
  ON research_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_plans 
      JOIN user_goals ON user_goals.id = task_plans.goal_id
      WHERE task_plans.id = research_requests.plan_id 
      AND user_goals.user_id = auth.uid()
    )
  );

-- Create policies for research_results
CREATE POLICY "Users can view research results for their requests"
  ON research_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM research_requests 
      JOIN task_plans ON task_plans.id = research_requests.plan_id
      JOIN user_goals ON user_goals.id = task_plans.goal_id
      WHERE research_requests.id = research_results.request_id 
      AND user_goals.user_id = auth.uid()
    )
  );