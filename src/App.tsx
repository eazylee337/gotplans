import React, { useState, useEffect } from 'react'
import { LogOut, Plus, User, ExternalLink } from 'lucide-react'
import GoalInput from './components/GoalInput'
import PlanVisualization from './components/PlanVisualization'
import AuthModal from './components/AuthModal'
import { useSupabaseAuth } from './hooks/useSupabaseAuth'
import { supabase, UserGoal, TaskPlan, SubTask } from './lib/supabase'
import { generateTaskPlan } from './services/planningService'

function App() {
  const { user, loading: authLoading, signOut } = useSupabaseAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentGoal, setCurrentGoal] = useState<UserGoal | null>(null)
  const [plans, setPlans] = useState<TaskPlan[]>([])
  const [subTasks, setSubTasks] = useState<Record<string, SubTask[]>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedGoals, setSavedGoals] = useState<UserGoal[]>([])
  const [appError, setAppError] = useState<string | null>(null)

  // Debug component mounting
  useEffect(() => {
    console.log('App component mounted')
    console.log('Environment variables:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'set' : 'missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'missing'
    })
  }, [])

  // Load saved goals when user signs in
  useEffect(() => {
    if (user) {
      loadSavedGoals()
    } else {
      setSavedGoals([])
      setCurrentGoal(null)
      setPlans([])
      setSubTasks({})
    }
  }, [user])

  const loadSavedGoals = async () => {
    if (!user) return

    try {
      const { data: goals, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading goals:', error)
        setAppError(`Database error: ${error.message}`)
        return
      }

      if (goals) {
        setSavedGoals(goals)
      }
    } catch (error) {
      console.error('Error in loadSavedGoals:', error)
      setAppError(`Failed to load goals: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadGoalPlan = async (goal: UserGoal) => {
    setCurrentGoal(goal)

    try {
      // Load plans for this goal
      const { data: goalPlans, error: plansError } = await supabase
        .from('task_plans')
        .select('*')
        .eq('goal_id', goal.id)
        .order('sequence_order')

      if (plansError) {
        console.error('Error loading plans:', plansError)
        setAppError(`Failed to load plans: ${plansError.message}`)
        return
      }

      if (goalPlans) {
        setPlans(goalPlans)

        // Load sub-tasks for each plan
        const subTasksData: Record<string, SubTask[]> = {}
        
        for (const plan of goalPlans) {
          const { data: planSubTasks, error: subTasksError } = await supabase
            .from('sub_tasks')
            .select('*')
            .eq('plan_id', plan.id)
            .order('sequence_order')

          if (subTasksError) {
            console.error('Error loading sub-tasks:', subTasksError)
            continue
          }

          if (planSubTasks) {
            subTasksData[plan.id] = planSubTasks
          }
        }
        
        setSubTasks(subTasksData)
      }
    } catch (error) {
      console.error('Error in loadGoalPlan:', error)
      setAppError(`Failed to load goal plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleGoalSubmit = async (goalText: string) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setIsGenerating(true)
    setAppError(null)

    try {
      // Generate the plan using our AI service
      const { plans: generatedPlans, subTasks: generatedSubTasks } = generateTaskPlan(goalText)

      // Save goal to database
      const { data: savedGoal, error: goalError } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          title: goalText,
          description: `Generated plan for: ${goalText}`,
          status: 'planning'
        })
        .select()
        .single()

      if (goalError || !savedGoal) {
        throw new Error(`Failed to save goal: ${goalError?.message || 'Unknown error'}`)
      }

      // Save plans to database
      const plansToInsert = generatedPlans.map(plan => ({
        ...plan,
        goal_id: savedGoal.id
      }))

      const { data: savedPlans, error: plansError } = await supabase
        .from('task_plans')
        .insert(plansToInsert)
        .select()

      if (plansError || !savedPlans) {
        throw new Error(`Failed to save plans: ${plansError?.message || 'Unknown error'}`)
      }

      // Save sub-tasks to database
      const allSubTasks: any[] = []
      savedPlans.forEach((plan, planIndex) => {
        const planSubTasks = generatedSubTasks[planIndex] || []
        planSubTasks.forEach(subTask => {
          allSubTasks.push({
            ...subTask,
            plan_id: plan.id
          })
        })
      })

      if (allSubTasks.length > 0) {
        const { data: savedSubTasks, error: subTasksError } = await supabase
          .from('sub_tasks')
          .insert(allSubTasks)
          .select()

        if (subTasksError) {
          console.error('Error saving sub-tasks:', subTasksError)
        }

        // Organize sub-tasks by plan_id
        const subTasksByPlan: Record<string, SubTask[]> = {}
        savedSubTasks?.forEach(subTask => {
          if (!subTasksByPlan[subTask.plan_id]) {
            subTasksByPlan[subTask.plan_id] = []
          }
          subTasksByPlan[subTask.plan_id].push(subTask)
        })
        setSubTasks(subTasksByPlan)
      }

      // Update UI
      setCurrentGoal(savedGoal)
      setPlans(savedPlans)
      loadSavedGoals()

    } catch (error) {
      console.error('Error generating plan:', error)
      setAppError(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleSubTask = async (subTaskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('sub_tasks')
        .update({ completed })
        .eq('id', subTaskId)

      if (error) {
        console.error('Error updating sub-task:', error)
        setAppError(`Failed to update task: ${error.message}`)
        return
      }

      // Update local state
      setSubTasks(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(planId => {
          updated[planId] = updated[planId].map(task =>
            task.id === subTaskId ? { ...task, completed } : task
          )
        })
        return updated
      })
    } catch (error) {
      console.error('Error in handleToggleSubTask:', error)
      setAppError(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleNewGoal = () => {
    setCurrentGoal(null)
    setPlans([])
    setSubTasks({})
    setAppError(null)
  }

  // Error boundary
  if (appError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Error</h2>
            <p className="text-gray-600 mb-6">{appError}</p>
            <button
              onClick={() => {
                setAppError(null)
                window.location.reload()
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📋</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Got Plans?</h1>
                  <p className="text-xs text-gray-600">AI-Powered Goal Planning</p>
                </div>
              </div>
              
              {savedGoals.length > 0 && (
                <button
                  onClick={handleNewGoal}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Goal</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Built with Bolt.new Badge */}
              <a
                href="https://bolt.new"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="text-xs">⚡</span>
                <span>Built with Bolt.new</span>
                <ExternalLink className="w-3 h-3 opacity-75 group-hover:opacity-100 transition-opacity" />
              </a>

              {/* Environment status indicator */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? '🟢 Connected' : '🟡 Demo Mode'}
              </div>

              {user ? (
                <>
                  <span className="text-gray-700">Welcome, {user.email}</span>
                  <button
                    onClick={signOut}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Saved Goals Sidebar */}
        {user && savedGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => loadGoalPlan(goal)}
                  className={`p-4 bg-white rounded-lg border-2 text-left hover:shadow-md transition-all ${
                    currentGoal?.id === goal.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 mb-2 truncate">{goal.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                      goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(goal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Interface */}
        {currentGoal && plans.length > 0 ? (
          <PlanVisualization
            goalTitle={currentGoal.title}
            plans={plans}
            subTasks={subTasks}
            onToggleSubTask={handleToggleSubTask}
          />
        ) : (
          <GoalInput onSubmit={handleGoalSubmit} isLoading={isGenerating} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

export default App