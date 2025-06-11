/*
  # Add Deployment Agent Tables

  1. New Tables
    - `deployment_requests`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, foreign key to task_plans)
      - `execution_request_id` (uuid, foreign key to execution_requests)
      - `deployment_type` (text, deployment method)
      - `configuration` (jsonb, deployment settings)
      - `status` (text, deployment status)
      - `created_at` (timestamp)

    - `deployment_results`
      - `id` (uuid, primary key)  
      - `request_id` (uuid, foreign key to deployment_requests)
      - `deployment_url` (text, live URL)
      - `claim_url` (text, ownership claim URL)
      - `deploy_id` (text, provider deployment ID)
      - `success` (boolean, deployment success)
      - `error_message` (text, error details)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their deployments
*/

CREATE TABLE IF NOT EXISTS deployment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES task_plans(id) ON DELETE CASCADE,
  execution_request_id uuid REFERENCES execution_requests(id) ON DELETE CASCADE,
  deployment_type text NOT NULL CHECK (deployment_type = ANY (ARRAY['netlify_static', 'vercel_static', 'github_pages', 'custom_hosting'])),
  configuration jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'in_progress', 'completed', 'failed'])),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deployment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES deployment_requests(id) ON DELETE CASCADE,
  deployment_url text,
  claim_url text,
  deploy_id text,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  build_logs text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE deployment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_results ENABLE ROW LEVEL SECURITY;

-- Policies for deployment_requests
CREATE POLICY "Users can manage deployments for their plans"
  ON deployment_requests
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM task_plans
    JOIN user_goals ON user_goals.id = task_plans.goal_id
    WHERE task_plans.id = deployment_requests.plan_id
    AND user_goals.user_id = uid()
  ));

-- Policies for deployment_results  
CREATE POLICY "Users can view deployment results for their requests"
  ON deployment_results
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM deployment_requests
    JOIN task_plans ON task_plans.id = deployment_requests.plan_id
    JOIN user_goals ON user_goals.id = task_plans.goal_id
    WHERE deployment_requests.id = deployment_results.request_id
    AND user_goals.user_id = uid()
  ));

-- Indexes for performance
CREATE INDEX idx_deployment_requests_plan_id ON deployment_requests(plan_id);
CREATE INDEX idx_deployment_requests_status ON deployment_requests(status);
CREATE INDEX idx_deployment_results_request_id ON deployment_results(request_id);