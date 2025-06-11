import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined',
  keyPrefix: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined'
})

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseKey
  })
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder_key'
)

// Types for our database schema
export interface UserGoal {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'planning' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface TaskPlan {
  id: string
  goal_id: string
  title: string
  description?: string
  sequence_order: number
  estimated_duration?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface SubTask {
  id: string
  plan_id: string
  title: string
  description?: string
  sequence_order: number
  completed: boolean
  created_at: string
}

export interface ResearchRequest {
  id: string
  plan_id: string
  query: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  created_at: string
}

export interface ResearchResult {
  id: string
  request_id: string
  source_url?: string
  title: string
  content: string
  summary?: string
  relevance_score: number
  created_at: string
}

export interface ExecutionRequest {
  id: string
  plan_id: string
  execution_type: 'code_generation' | 'script_execution' | 'api_call' | 'file_creation' | 'environment_setup'
  instructions: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  created_at: string
}

export interface ExecutionResult {
  id: string
  request_id: string
  output_type: 'code' | 'file' | 'api_response' | 'command_output' | 'error'
  content: string
  file_path?: string
  success: boolean
  error_message?: string
  created_at: string
}

export interface DeploymentRequest {
  id: string
  plan_id: string
  execution_request_id?: string
  deployment_type: 'netlify_static' | 'vercel_static' | 'github_pages' | 'custom_hosting'
  configuration: Record<string, any>
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  created_at: string
}

export interface DeploymentResult {
  id: string
  request_id: string
  deployment_url?: string
  claim_url?: string
  deploy_id?: string
  success: boolean
  error_message?: string
  build_logs?: string
  created_at: string
}