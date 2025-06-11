import React, { useState, useEffect } from 'react'
import { Play, Code, Terminal, Globe, FileText, Settings, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'
import { TaskPlan, ExecutionRequest, ExecutionResult } from '../lib/supabase'
import { executeTask, getExecutionHistory } from '../services/executionService'

interface ExecutionAgentProps {
  plan: TaskPlan
  onClose: () => void
}

export default function ExecutionAgent({ plan, onClose }: ExecutionAgentProps) {
  const [selectedType, setSelectedType] = useState<ExecutionRequest['execution_type']>('code_generation')
  const [instructions, setInstructions] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [requests, setRequests] = useState<ExecutionRequest[]>([])
  const [results, setResults] = useState<Record<string, ExecutionResult[]>>({})
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadExecutionHistory()
  }, [plan.id])

  const loadExecutionHistory = async () => {
    try {
      const { requests: existingRequests, results: existingResults } = await getExecutionHistory(plan.id)
      setRequests(existingRequests)
      setResults(existingResults)
      
      // Auto-expand the most recent request
      if (existingRequests.length > 0) {
        setExpandedRequests(new Set([existingRequests[0].id]))
      }
    } catch (error) {
      console.error('Error loading execution history:', error)
    }
  }

  const handleExecution = async () => {
    if (!instructions.trim() || isExecuting) return

    setIsExecuting(true)
    try {
      await executeTask(plan.id, selectedType, instructions.trim())
      
      // Reload execution history
      await loadExecutionHistory()
      setInstructions('')
      
      // Expand the new request
      const newRequest = requests.find(r => r.instructions === instructions.trim())
      if (newRequest) {
        setExpandedRequests(new Set([newRequest.id]))
      }
    } catch (error) {
      console.error('Execution failed:', error)
      alert('Execution failed. Please try again.')
    } finally {
      setIsExecuting(false)
    }
  }

  const toggleRequestExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedRequests)
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId)
    } else {
      newExpanded.add(requestId)
    }
    setExpandedRequests(newExpanded)
  }

  const executionTypes = [
    { 
      value: 'code_generation', 
      label: 'Code Generation', 
      icon: Code,
      description: 'Generate code files and components'
    },
    { 
      value: 'script_execution', 
      label: 'Script Execution', 
      icon: Terminal,
      description: 'Run scripts and commands'
    },
    { 
      value: 'api_call', 
      label: 'API Integration', 
      icon: Globe,
      description: 'Make API calls and integrations'
    },
    { 
      value: 'file_creation', 
      label: 'File Creation', 
      icon: FileText,
      description: 'Create files and documentation'
    },
    { 
      value: 'environment_setup', 
      label: 'Environment Setup', 
      icon: Settings,
      description: 'Configure development environments'
    }
  ] as const

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'code_generation': return 'text-purple-600 bg-purple-100'
      case 'script_execution': return 'text-green-600 bg-green-100'
      case 'api_call': return 'text-blue-600 bg-blue-100'
      case 'file_creation': return 'text-orange-600 bg-orange-100'
      case 'environment_setup': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const suggestedInstructions = {
    code_generation: [
      `Create a React component for ${plan.title}`,
      `Generate API endpoints for ${plan.title}`,
      `Write a utility function for ${plan.title}`,
      `Create a database schema for ${plan.title}`
    ],
    script_execution: [
      `Run tests for ${plan.title}`,
      `Execute build process for ${plan.title}`,
      `Deploy ${plan.title} to production`,
      `Run database migrations for ${plan.title}`
    ],
    api_call: [
      `Integrate with external API for ${plan.title}`,
      `Fetch data required for ${plan.title}`,
      `Send notifications for ${plan.title}`,
      `Sync data for ${plan.title}`
    ],
    file_creation: [
      `Create documentation for ${plan.title}`,
      `Generate configuration files for ${plan.title}`,
      `Create README for ${plan.title}`,
      `Generate test files for ${plan.title}`
    ],
    environment_setup: [
      `Setup development environment for ${plan.title}`,
      `Configure CI/CD pipeline for ${plan.title}`,
      `Setup testing environment for ${plan.title}`,
      `Configure production environment for ${plan.title}`
    ]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Execution Agent</h2>
                <p className="text-purple-100">Bringing {plan.title} to life</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center text-white">×</div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Execution Controls */}
          <div className="p-6 border-b border-gray-200">
            {/* Execution Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Execution Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {executionTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedType === type.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <IconComponent className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Instructions Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Execution Instructions
              </label>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder={`Enter instructions for ${executionTypes.find(t => t.value === selectedType)?.label.toLowerCase()}...`}
                    className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all resize-none"
                    disabled={isExecuting}
                  />
                </div>
                <button
                  onClick={handleExecution}
                  disabled={!instructions.trim() || isExecuting}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 self-start"
                >
                  {isExecuting ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Execute</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Suggested Instructions */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Suggested instructions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedInstructions[selectedType].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInstructions(suggestion)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    disabled={isExecuting}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Execution History */}
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Terminal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No executions yet</h3>
                <p className="text-gray-600">Start by selecting an execution type and entering instructions</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Terminal className="w-5 h-5 mr-2 text-purple-600" />
                  Execution History
                </h3>
                
                {requests.map((request) => {
                  const requestResults = results[request.id] || []
                  const isExpanded = expandedRequests.has(request.id)
                  const hasResults = requestResults.length > 0
                  
                  return (
                    <div key={request.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleRequestExpansion(request.id)}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(request.execution_type)}`}>
                                {request.execution_type.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span>{request.status}</span>
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 text-sm">{request.instructions}</p>
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && hasResults && (
                        <div className="p-4 bg-white border-t border-gray-100">
                          <div className="space-y-4">
                            {requestResults.map((result) => (
                              <div key={result.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                <div className={`px-4 py-2 flex items-center justify-between ${
                                  result.success ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                  <div className="flex items-center space-x-2">
                                    {result.success ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className="text-sm font-medium capitalize">
                                      {result.output_type.replace('_', ' ')}
                                    </span>
                                    {result.file_path && (
                                      <span className="text-xs text-gray-500">
                                        → {result.file_path}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="p-4">
                                  {result.error_message ? (
                                    <div className="text-red-600 text-sm">
                                      <strong>Error:</strong> {result.error_message}
                                    </div>
                                  ) : (
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded overflow-x-auto">
                                      {result.content}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}