/*
  # Execution Agent Database Schema

  1. New Tables
    - `execution_requests`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, references task_plans)
      - `execution_type` (text: 'code_generation', 'script_execution', 'api_call', 'file_creation')
      - `instructions` (text)
      - `status` (text: 'pending', 'in_progress', 'completed', 'failed')
      - `created_at` (timestamp)
    
    - `execution_results`
      - `id` (uuid, primary key)  
      - `request_id` (uuid, references execution_requests)
      - `output_type` (text: 'code', 'file', 'api_response', 'error')
      - `content` (text)
      - `file_path` (text, optional)
      - `success` (boolean)
      - `error_message` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own executions
*/

-- Create execution_requests table
CREATE TABLE IF NOT EXISTS execution_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES task_plans(id) ON DELETE CASCADE,
  execution_type text NOT NULL CHECK (execution_type IN ('code_generation', 'script_execution', 'api_call', 'file_creation', 'environment_setup')),
  instructions text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create execution_results table
CREATE TABLE IF NOT EXISTS execution_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES execution_requests(id) ON DELETE CASCADE,
  output_type text NOT NULL CHECK (output_type IN ('code', 'file', 'api_response', 'command_output', 'error')),
  content text NOT NULL,
  file_path text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE execution_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_results ENABLE ROW LEVEL SECURITY;

-- Create policies for execution_requests
CREATE POLICY "Users can manage executions for their plans"
  ON execution_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_plans 
      JOIN user_goals ON user_goals.id = task_plans.goal_id
      WHERE task_plans.id = execution_requests.plan_id 
      AND user_goals.user_id = auth.uid()
    )
  );

-- Create policies for execution_results
CREATE POLICY "Users can view execution results for their requests"
  ON execution_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM execution_requests 
      JOIN task_plans ON task_plans.id = execution_requests.plan_id
      JOIN user_goals ON user_goals.id = task_plans.goal_id
      WHERE execution_requests.id = execution_results.request_id 
      AND user_goals.user_id = auth.uid()
    )
  );