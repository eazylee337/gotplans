import React, { useState, useEffect } from 'react'
import { Upload, Globe, ExternalLink, Settings, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Clock, Rocket, Link } from 'lucide-react'
import { TaskPlan, DeploymentRequest, DeploymentResult, ExecutionRequest, ExecutionResult } from '../lib/supabase'
import { deployProject, getDeploymentHistory, getExecutionOutputs, getDeploymentProviders } from '../services/deploymentService'

interface DeploymentAgentProps {
  plan: TaskPlan
  onClose: () => void
}

export default function DeploymentAgent({ plan, onClose }: DeploymentAgentProps) {
  const [selectedProvider, setSelectedProvider] = useState<DeploymentRequest['deployment_type']>('netlify_static')
  const [configuration, setConfiguration] = useState<Record<string, any>>({})
  const [isDeploying, setIsDeploying] = useState(false)
  const [requests, setRequests] = useState<DeploymentRequest[]>([])
  const [results, setResults] = useState<Record<string, DeploymentResult[]>>({})
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())
  const [executionOutputs, setExecutionOutputs] = useState<{requests: ExecutionRequest[], results: Record<string, ExecutionResult[]>}>({ requests: [], results: {} })
  const [selectedExecution, setSelectedExecution] = useState<string>('')

  const providers = getDeploymentProviders()

  useEffect(() => {
    loadDeploymentHistory()
    loadExecutionOutputs()
  }, [plan.id])

  const loadDeploymentHistory = async () => {
    try {
      const { requests: existingRequests, results: existingResults } = await getDeploymentHistory(plan.id)
      setRequests(existingRequests)
      setResults(existingResults)
      
      // Auto-expand the most recent request
      if (existingRequests.length > 0) {
        setExpandedRequests(new Set([existingRequests[0].id]))
      }
    } catch (error) {
      console.error('Error loading deployment history:', error)
    }
  }

  const loadExecutionOutputs = async () => {
    try {
      const outputs = await getExecutionOutputs(plan.id)
      setExecutionOutputs(outputs)
    } catch (error) {
      console.error('Error loading execution outputs:', error)
    }
  }

  const handleDeployment = async () => {
    if (isDeploying) return

    setIsDeploying(true)
    try {
      await deployProject(
        plan.id,
        selectedProvider,
        configuration,
        selectedExecution || undefined
      )
      
      // Reload deployment history
      await loadDeploymentHistory()
      setConfiguration({})
      
      // Expand the new request
      const newRequest = requests[0]
      if (newRequest) {
        setExpandedRequests(new Set([newRequest.id]))
      }
    } catch (error) {
      console.error('Deployment failed:', error)
      alert('Deployment failed. Please try again.')
    } finally {
      setIsDeploying(false)
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

  const updateConfiguration = (key: string, value: any) => {
    setConfiguration(prev => ({ ...prev, [key]: value }))
  }

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

  const getProviderColor = (type: string) => {
    switch (type) {
      case 'netlify_static': return 'text-emerald-600 bg-emerald-100'
      case 'vercel_static': return 'text-black bg-gray-100'
      case 'github_pages': return 'text-gray-900 bg-gray-100'
      case 'custom_hosting': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const selectedProviderInfo = providers[selectedProvider]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Deployment Agent</h2>
                <p className="text-orange-100">Making {plan.title} accessible to the world</p>
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
          {/* Deployment Controls */}
          <div className="p-6 border-b border-gray-200">
            {/* Source Selection */}
            {executionOutputs.requests.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Source Code to Deploy
                </label>
                <select
                  value={selectedExecution}
                  onChange={(e) => setSelectedExecution(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all"
                >
                  <option value="">Select from execution outputs...</option>
                  {executionOutputs.requests.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.execution_type.replace('_', ' ')} - {request.instructions.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Provider Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Deployment Provider
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(providers).map(([key, provider]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedProvider(key as DeploymentRequest['deployment_type'])}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedProvider === key
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Globe className="w-5 h-5 mr-2" />
                      <div className="font-medium">{provider.name}</div>
                    </div>
                    <p className="text-xs">{provider.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Deployment Configuration
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProvider === 'netlify_static' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Subdomain</label>
                      <input
                        type="text"
                        placeholder="my-awesome-site"
                        value={configuration.subdomain || ''}
                        onChange={(e) => updateConfiguration('subdomain', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Build Command</label>
                      <input
                        type="text"
                        placeholder="npm run build"
                        value={configuration.buildCommand || selectedProviderInfo.buildCommand}
                        onChange={(e) => updateConfiguration('buildCommand', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </>
                )}

                {selectedProvider === 'vercel_static' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Project Name</label>
                      <input
                        type="text"
                        placeholder="my-project"
                        value={configuration.projectName || ''}
                        onChange={(e) => updateConfiguration('projectName', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Framework</label>
                      <select
                        value={configuration.framework || 'react'}
                        onChange={(e) => updateConfiguration('framework', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="react">React</option>
                        <option value="nextjs">Next.js</option>
                        <option value="vue">Vue.js</option>
                        <option value="static">Static</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedProvider === 'github_pages' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">GitHub Username</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={configuration.username || ''}
                        onChange={(e) => updateConfiguration('username', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Repository Name</label>
                      <input
                        type="text"
                        placeholder="my-repository"
                        value={configuration.repository || ''}
                        onChange={(e) => updateConfiguration('repository', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </>
                )}

                {selectedProvider === 'custom_hosting' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Domain</label>
                      <input
                        type="text"
                        placeholder="example.com"
                        value={configuration.domain || ''}
                        onChange={(e) => updateConfiguration('domain', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Server Type</label>
                      <select
                        value={configuration.serverType || 'apache'}
                        onChange={(e) => updateConfiguration('serverType', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="apache">Apache</option>
                        <option value="nginx">Nginx</option>
                        <option value="cloudflare">Cloudflare Pages</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Deploy Button */}
            <button
              onClick={handleDeployment}
              disabled={isDeploying}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-lg font-medium"
            >
              {isDeploying ? (
                <>
                  <Upload className="w-6 h-6 animate-bounce" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  <span>Deploy to {selectedProviderInfo.name}</span>
                </>
              )}
            </button>
          </div>

          {/* Deployment History */}
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deployments yet</h3>
                <p className="text-gray-600">Start by selecting a deployment provider and configuration</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-orange-600" />
                  Deployment History
                </h3>
                
                {requests.map((request) => {
                  const requestResults = results[request.id] || []
                  const isExpanded = expandedRequests.has(request.id)
                  const hasResults = requestResults.length > 0
                  const latestResult = requestResults[requestResults.length - 1]
                  
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
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getProviderColor(request.deployment_type)}`}>
                                {providers[request.deployment_type]?.name}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span>{request.status}</span>
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleString()}
                              </span>
                            </div>
                            {latestResult?.deployment_url && (
                              <div className="flex items-center space-x-2">
                                <Link className="w-4 h-4 text-green-600" />
                                <a
                                  href={latestResult.deployment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {latestResult.deployment_url}
                                </a>
                                <ExternalLink className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && hasResults && (
                        <div className="p-4 bg-white border-t border-gray-100">
                          <div className="space-y-4">
                            {requestResults.map((result) => (
                              <div key={result.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                <div className={`px-4 py-3 flex items-center justify-between ${
                                  result.success ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                  <div className="flex items-center space-x-2">
                                    {result.success ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="font-medium">
                                      {result.success ? 'Deployment Successful' : 'Deployment Failed'}
                                    </span>
                                  </div>
                                  
                                  {result.deployment_url && (
                                    <div className="flex items-center space-x-2">
                                      <a
                                        href={result.deployment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Visit Site</span>
                                      </a>
                                      
                                      {result.claim_url && (
                                        <a
                                          href={result.claim_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                          <Settings className="w-4 h-4" />
                                          <span>Manage</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {result.build_logs && (
                                  <div className="p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Build Logs</h4>
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-900 text-green-400 p-4 rounded overflow-x-auto max-h-64">
                                      {result.build_logs}
                                    </pre>
                                  </div>
                                )}
                                
                                {result.error_message && (
                                  <div className="p-4">
                                    <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                                    <div className="text-red-700 text-sm bg-red-50 p-3 rounded">
                                      {result.error_message}
                                    </div>
                                  </div>
                                )}
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