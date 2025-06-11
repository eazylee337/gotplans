import React, { useState, useEffect } from 'react'
import { Search, Globe, FileText, Star, ExternalLink, ChevronDown, ChevronRight, Brain, Loader2, AlertCircle, CheckCircle, Clock, TrendingUp, BookOpen, BarChart3 } from 'lucide-react'
import { TaskPlan, ResearchRequest, ResearchResult } from '../lib/supabase'
import { conductResearch, getResearchResults } from '../services/researchService'

interface ResearchAgentProps {
  plan: TaskPlan
  onClose: () => void
}

export default function ResearchAgent({ plan, onClose }: ResearchAgentProps) {
  const [query, setQuery] = useState('')
  const [depth, setDepth] = useState<'basic' | 'detailed' | 'comprehensive'>('detailed')
  const [isResearching, setIsResearching] = useState(false)
  const [requests, setRequests] = useState<ResearchRequest[]>([])
  const [results, setResults] = useState<Record<string, ResearchResult[]>>({})
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())
  const [researchProgress, setResearchProgress] = useState<string>('')

  useEffect(() => {
    loadExistingResearch()
  }, [plan.id])

  const loadExistingResearch = async () => {
    try {
      const { requests: existingRequests, results: existingResults } = await getResearchResults(plan.id)
      setRequests(existingRequests)
      setResults(existingResults)
      
      // Auto-expand the most recent request
      if (existingRequests.length > 0) {
        setExpandedRequests(new Set([existingRequests[0].id]))
      }
    } catch (error) {
      console.error('Error loading research:', error)
    }
  }

  const handleResearch = async () => {
    if (!query.trim() || isResearching) return

    setIsResearching(true)
    setResearchProgress('Initializing research...')
    
    try {
      // Show progress updates
      const progressSteps = [
        'Analyzing query...',
        'Searching web sources...',
        'Extracting relevant information...',
        'Analyzing content quality...',
        'Ranking by relevance...',
        'Finalizing results...'
      ]

      let currentStep = 0
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length - 1) {
          currentStep++
          setResearchProgress(progressSteps[currentStep])
        }
      }, 2000)

      const researchResults = await conductResearch(plan.id, query.trim(), depth)
      
      clearInterval(progressInterval)
      setResearchProgress('Research completed!')
      
      // Reload all research to get the updated data
      await loadExistingResearch()
      setQuery('')
      
      // Expand the new request
      const newRequest = requests.find(r => r.query === query.trim())
      if (newRequest) {
        setExpandedRequests(new Set([newRequest.id]))
      }
    } catch (error) {
      console.error('Research failed:', error)
      setResearchProgress('Research failed. Please try again.')
      setTimeout(() => setResearchProgress(''), 3000)
    } finally {
      setIsResearching(false)
      setTimeout(() => setResearchProgress(''), 5000)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Clock className="w-4 h-4 animate-spin" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDepthDescription = (depth: string) => {
    switch (depth) {
      case 'basic': return 'Quick overview with 3-5 key sources'
      case 'comprehensive': return 'Exhaustive research with 8-12 detailed sources'
      default: return 'Balanced research with 5-8 quality sources'
    }
  }

  const suggestedQueries = [
    `Market analysis for ${plan.title}`,
    `Best practices for ${plan.title}`,
    `Case studies: ${plan.title}`,
    `Tools and resources for ${plan.title}`,
    `Common challenges in ${plan.title}`,
    `Success metrics for ${plan.title}`
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Research Agent</h2>
                <p className="text-emerald-100">Gathering insights for: {plan.title}</p>
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
          {/* Research Input */}
          <div className="p-6 border-b border-gray-200">
            {/* Research Depth Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Research Depth
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['basic', 'detailed', 'comprehensive'] as const).map((depthOption) => (
                  <button
                    key={depthOption}
                    onClick={() => setDepth(depthOption)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      depth === depthOption
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    disabled={isResearching}
                  >
                    <div className="font-medium capitalize">{depthOption}</div>
                    <div className="text-xs mt-1">{getDepthDescription(depthOption)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Query
              </label>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What would you like to research?"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                    disabled={isResearching}
                  />
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                <button
                  onClick={handleResearch}
                  disabled={!query.trim() || isResearching}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Researching...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5" />
                      <span>Research</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Progress Indicator */}
              {isResearching && researchProgress && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">{researchProgress}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Queries */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Suggested research topics:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    disabled={isResearching}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Research Results */}
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No research conducted yet</h3>
                <p className="text-gray-600">Start by entering a research query above</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                  Research History ({requests.length} searches)
                </h3>
                
                {requests.map((request) => {
                  const requestResults = results[request.id] || []
                  const isExpanded = expandedRequests.has(request.id)
                  const avgRelevance = requestResults.length > 0 
                    ? Math.round(requestResults.reduce((sum, r) => sum + r.relevance_score, 0) / requestResults.length)
                    : 0
                  
                  return (
                    <div key={request.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleRequestExpansion(request.id)}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-3 text-left flex-1">
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{request.query}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span>{request.status}</span>
                              </span>
                              <span className="text-sm text-gray-500 flex items-center space-x-1">
                                <BarChart3 className="w-4 h-4" />
                                <span>{requestResults.length} results</span>
                              </span>
                              {avgRelevance > 0 && (
                                <span className={`px-2 py-1 text-xs rounded-full ${getRelevanceColor(avgRelevance)}`}>
                                  {avgRelevance}/10 avg relevance
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && requestResults.length > 0 && (
                        <div className="p-4 bg-white">
                          <div className="space-y-4">
                            {requestResults.map((result) => (
                              <div key={result.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900 flex-1">{result.title}</h4>
                                  <div className="flex items-center space-x-2 ml-4">
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-4 h-4 text-yellow-500" />
                                      <span className="text-sm text-gray-600">{result.relevance_score}/10</span>
                                    </div>
                                    {result.source_url && (
                                      <a
                                        href={result.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                                        title="View source"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                                
                                {result.summary && (
                                  <div className="mb-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                                    <p className="text-sm font-medium text-emerald-800 mb-1 flex items-center">
                                      <TrendingUp className="w-4 h-4 mr-1" />
                                      Key Finding:
                                    </p>
                                    <p className="text-sm text-emerald-700">{result.summary}</p>
                                  </div>
                                )}
                                
                                <p className="text-gray-600 text-sm leading-relaxed">{result.content}</p>
                                
                                {result.source_url && (
                                  <div className="mt-3 pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 flex items-center">
                                      <BookOpen className="w-3 h-3 mr-1" />
                                      Source: {result.source_url}
                                    </p>
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