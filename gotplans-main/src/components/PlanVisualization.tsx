import React from 'react'
import { CheckCircle, Circle, Clock, Star, ArrowRight, ChevronDown, ChevronRight, Search, Play, Rocket, Zap, Pause, StopCircle } from 'lucide-react'
import { TaskPlan, SubTask } from '../lib/supabase'
import ResearchAgent from './ResearchAgent'
import ExecutionAgent from './ExecutionAgent'
import DeploymentAgent from './DeploymentAgent'
import AutoStartModal, { AutoStartPreferences } from './AutoStartModal'
import { conductResearch } from '../services/researchService'
import { executeTask } from '../services/executionService'
import { deployProject } from '../services/deploymentService'

interface PlanVisualizationProps {
  goalTitle: string
  plans: TaskPlan[]
  subTasks: Record<string, SubTask[]>
  onToggleSubTask?: (subTaskId: string, completed: boolean) => void
}

export default function PlanVisualization({ 
  goalTitle, 
  plans, 
  subTasks, 
  onToggleSubTask 
}: PlanVisualizationProps) {
  const [expandedPlans, setExpandedPlans] = React.useState<Set<string>>(new Set())
  const [researchPlan, setResearchPlan] = React.useState<TaskPlan | null>(null)
  const [executionPlan, setExecutionPlan] = React.useState<TaskPlan | null>(null)
  const [deploymentPlan, setDeploymentPlan] = React.useState<TaskPlan | null>(null)
  const [startedTasks, setStartedTasks] = React.useState<Set<string>>(new Set())
  const [showAutoStartModal, setShowAutoStartModal] = React.useState(false)
  const [isAutoRunning, setIsAutoRunning] = React.useState(false)
  const [currentAutoTask, setCurrentAutoTask] = React.useState<string | null>(null)
  const [currentAutoPhase, setCurrentAutoPhase] = React.useState<'research' | 'execution' | 'deployment' | null>(null)
  const [autoPreferences, setAutoPreferences] = React.useState<AutoStartPreferences | null>(null)
  const [completedAutoTasks, setCompletedAutoTasks] = React.useState<Set<string>>(new Set())

  const togglePlanExpansion = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  const handleStartTask = (plan: TaskPlan) => {
    setStartedTasks(prev => new Set([...prev, plan.id]))
    // Auto-expand the plan when started
    setExpandedPlans(prev => new Set([...prev, plan.id]))
    // You could also auto-open the research agent as the first step
    setResearchPlan(plan)
  }

  const handleAutoStartAll = async (preferences: AutoStartPreferences) => {
    setAutoPreferences(preferences)
    setIsAutoRunning(true)
    setStartedTasks(new Set(plans.map(p => p.id)))
    
    // Auto-expand all plans
    setExpandedPlans(new Set(plans.map(p => p.id)))

    // Execute workflow for each plan
    for (const plan of plans) {
      if (!isAutoRunning) break // Allow stopping mid-execution

      setCurrentAutoTask(plan.id)

      try {
        // Research Phase
        if (preferences.enableResearch) {
          setCurrentAutoPhase('research')
          const researchQuery = generateAutoResearchQuery(plan, preferences.researchDepth)
          await conductResearch(plan.id, researchQuery)
          await delay(preferences.autoProgressDelay * 1000)
        }

        // Execution Phase
        if (preferences.enableExecution) {
          setCurrentAutoPhase('execution')
          const executionInstructions = generateAutoExecutionInstructions(plan, preferences.executionMode)
          await executeTask(plan.id, 'code_generation', executionInstructions)
          await delay(preferences.autoProgressDelay * 1000)
        }

        // Deployment Phase
        if (preferences.enableDeployment) {
          setCurrentAutoPhase('deployment')
          const deploymentConfig = generateAutoDeploymentConfig(plan, preferences.deploymentProvider)
          await deployProject(plan.id, preferences.deploymentProvider, deploymentConfig)
          await delay(preferences.autoProgressDelay * 1000)
        }

        setCompletedAutoTasks(prev => new Set([...prev, plan.id]))

        // Pause between tasks if enabled
        if (preferences.pauseBetweenTasks && plan !== plans[plans.length - 1]) {
          await delay(2000) // Brief pause between tasks
        }

      } catch (error) {
        console.error(`Error in auto-execution for plan ${plan.id}:`, error)
        // Continue with next task even if one fails
      }
    }

    // Reset auto-execution state
    setIsAutoRunning(false)
    setCurrentAutoTask(null)
    setCurrentAutoPhase(null)
  }

  const stopAutoExecution = () => {
    setIsAutoRunning(false)
    setCurrentAutoTask(null)
    setCurrentAutoPhase(null)
  }

  const generateAutoResearchQuery = (plan: TaskPlan, depth: string): string => {
    const baseQuery = `${plan.title} best practices and implementation guide`
    
    switch (depth) {
      case 'basic':
        return `Quick overview: ${baseQuery}`
      case 'comprehensive':
        return `Comprehensive analysis including market research, case studies, and detailed implementation for: ${baseQuery}`
      default:
        return `Detailed research on ${baseQuery} including tools, methods, and expert recommendations`
    }
  }

  const generateAutoExecutionInstructions = (plan: TaskPlan, mode: string): string => {
    const baseInstructions = `Create implementation for: ${plan.title}. ${plan.description || ''}`
    
    switch (mode) {
      case 'conservative':
        return `${baseInstructions}. Use simple, proven approaches with minimal dependencies.`
      case 'aggressive':
        return `${baseInstructions}. Use cutting-edge technologies and advanced features.`
      default:
        return `${baseInstructions}. Use modern best practices with good balance of features and stability.`
    }
  }

  const generateAutoDeploymentConfig = (plan: TaskPlan, provider: string): Record<string, any> => {
    const planSlug = plan.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)
    
    switch (provider) {
      case 'netlify_static':
        return { subdomain: planSlug, buildCommand: 'npm run build' }
      case 'vercel_static':
        return { projectName: planSlug, framework: 'react' }
      case 'github_pages':
        return { username: 'auto-user', repository: planSlug }
      default:
        return {}
    }
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAutoPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'research': return <Search className="w-4 h-4 text-emerald-600 animate-pulse" />
      case 'execution': return <Play className="w-4 h-4 text-purple-600 animate-pulse" />
      case 'deployment': return <Rocket className="w-4 h-4 text-orange-600 animate-pulse" />
      default: return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Goal Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{goalTitle}</h2>
            <p className="text-blue-100">
              {plans.length} main tasks • {Object.values(subTasks).flat().length} sub-tasks
            </p>
          </div>
          
          {/* Auto-Start Controls */}
          <div className="flex items-center space-x-3">
            {isAutoRunning ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm text-blue-100">Auto-executing tasks...</div>
                  {currentAutoPhase && (
                    <div className="flex items-center space-x-1 text-xs text-white">
                      {getAutoPhaseIcon(currentAutoPhase)}
                      <span>Phase: {currentAutoPhase}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={stopAutoExecution}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAutoStartModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center space-x-2 text-lg font-medium shadow-lg hover:shadow-xl"
              >
                <Zap className="w-5 h-5" />
                <span>Start All Tasks</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Plans Timeline */}
      <div className="space-y-6">
        {plans.map((plan, index) => {
          const planSubTasks = subTasks[plan.id] || []
          const isExpanded = expandedPlans.has(plan.id)
          const isStarted = startedTasks.has(plan.id)
          const isCurrentAutoTask = currentAutoTask === plan.id
          const isCompletedAutoTask = completedAutoTasks.has(plan.id)
          const completedSubTasks = planSubTasks.filter(task => task.completed).length
          const totalSubTasks = planSubTasks.length
          const completionPercentage = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0

          return (
            <div key={plan.id} className="relative">
              {/* Timeline connector */}
              {index < plans.length - 1 && (
                <div className="absolute left-6 top-20 w-0.5 h-16 bg-gray-200" />
              )}

              {/* Plan Card */}
              <div className="flex items-start space-x-4">
                {/* Timeline dot */}
                <div className={`flex-shrink-0 w-12 h-12 border-4 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isCompletedAutoTask
                    ? 'bg-green-500 border-green-500'
                    : isCurrentAutoTask
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 animate-pulse'
                    : isStarted 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500' 
                    : 'bg-white border-blue-500'
                }`}>
                  {isCompletedAutoTask ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : isCurrentAutoTask ? (
                    <Clock className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <span className={`font-bold text-sm ${isStarted ? 'text-white' : 'text-blue-600'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Plan content */}
                <div className={`flex-1 bg-white rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
                  isCurrentAutoTask
                    ? 'border-blue-500 ring-4 ring-blue-200'
                    : isCompletedAutoTask
                    ? 'border-green-300 ring-2 ring-green-100'
                    : isStarted 
                    ? 'border-blue-300 ring-2 ring-blue-100' 
                    : 'border-gray-200'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                          {isCurrentAutoTask && currentAutoPhase && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {getAutoPhaseIcon(currentAutoPhase)}
                              <span>Auto-{currentAutoPhase}</span>
                            </div>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-gray-600 mb-3">{plan.description}</p>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(plan.priority)}`}>
                            {plan.priority} priority
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                            {plan.status}
                          </span>
                          {plan.estimated_duration && (
                            <span className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {plan.estimated_duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Start Task Button */}
                    {!isStarted && !isAutoRunning ? (
                      <div className="mb-4">
                        <button
                          onClick={() => handleStartTask(plan)}
                          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 text-lg font-medium shadow-lg hover:shadow-xl"
                        >
                          <Zap className="w-5 h-5" />
                          <span>Start Task</span>
                        </button>
                      </div>
                    ) : isStarted && !isAutoRunning ? (
                      /* Multi-Agent Action Buttons */
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            <span>Task Started</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">Choose your next action:</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setResearchPlan(plan)}
                            className="p-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors duration-200 group flex flex-col items-center space-y-1"
                            title="Research this task"
                          >
                            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium">Research</span>
                          </button>
                          
                          <button
                            onClick={() => setExecutionPlan(plan)}
                            className="p-3 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors duration-200 group flex flex-col items-center space-y-1"
                            title="Execute this task"
                          >
                            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium">Execute</span>
                          </button>
                          
                          <button
                            onClick={() => setDeploymentPlan(plan)}
                            className="p-3 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors duration-200 group flex flex-col items-center space-y-1"
                            title="Deploy this task"
                          >
                            <Rocket className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium">Deploy</span>
                          </button>
                        </div>
                      </div>
                    ) : isAutoRunning ? (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-700">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">
                            {isCurrentAutoTask ? 'Currently executing...' : 'Waiting in queue...'}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Progress bar */}
                    {totalSubTasks > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{completedSubTasks}/{totalSubTasks} tasks</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Expand/Collapse Toggle */}
                    {totalSubTasks > 0 && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => togglePlanExpansion(plan.id)}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span className="text-sm">Hide Sub-tasks</span>
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4" />
                              <span className="text-sm">Show Sub-tasks ({totalSubTasks})</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Sub-tasks */}
                    {isExpanded && totalSubTasks > 0 && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Sub-tasks:</h4>
                        <div className="space-y-2">
                          {planSubTasks.map((subTask) => (
                            <div
                              key={subTask.id}
                              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                              <button
                                onClick={() => onToggleSubTask?.(subTask.id, !subTask.completed)}
                                className="flex-shrink-0"
                              >
                                {subTask.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                              <div className="flex-1">
                                <p className={`font-medium ${subTask.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {subTask.title}
                                </p>
                                {subTask.description && (
                                  <p className={`text-sm ${subTask.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {subTask.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Auto-Start Modal */}
      <AutoStartModal
        isOpen={showAutoStartModal}
        onClose={() => setShowAutoStartModal(false)}
        plans={plans}
        onStartAll={handleAutoStartAll}
      />

      {/* Agent Modals */}
      {researchPlan && (
        <ResearchAgent
          plan={researchPlan}
          onClose={() => setResearchPlan(null)}
        />
      )}

      {executionPlan && (
        <ExecutionAgent
          plan={executionPlan}
          onClose={() => setExecutionPlan(null)}
        />
      )}

      {deploymentPlan && (
        <DeploymentAgent
          plan={deploymentPlan}
          onClose={() => setDeploymentPlan(null)}
        />
      )}
    </div>
  )
}