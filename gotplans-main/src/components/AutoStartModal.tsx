import React, { useState } from 'react'
import { X, Zap, Settings, Clock, Brain, Play, Rocket, CheckCircle } from 'lucide-react'
import { TaskPlan } from '../lib/supabase'

interface AutoStartModalProps {
  isOpen: boolean
  onClose: () => void
  plans: TaskPlan[]
  onStartAll: (preferences: AutoStartPreferences) => void
}

export interface AutoStartPreferences {
  enableResearch: boolean
  enableExecution: boolean
  enableDeployment: boolean
  autoProgressDelay: number
  researchDepth: 'basic' | 'detailed' | 'comprehensive'
  executionMode: 'conservative' | 'standard' | 'aggressive'
  deploymentProvider: 'netlify_static' | 'vercel_static' | 'github_pages'
  pauseBetweenTasks: boolean
}

export default function AutoStartModal({ isOpen, onClose, plans, onStartAll }: AutoStartModalProps) {
  const [preferences, setPreferences] = useState<AutoStartPreferences>({
    enableResearch: true,
    enableExecution: true,
    enableDeployment: false,
    autoProgressDelay: 5,
    researchDepth: 'standard',
    executionMode: 'standard',
    deploymentProvider: 'netlify_static',
    pauseBetweenTasks: true
  })

  const handleSubmit = () => {
    onStartAll(preferences)
    onClose()
  }

  const updatePreference = <K extends keyof AutoStartPreferences>(
    key: K,
    value: AutoStartPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Auto-Start All Tasks</h2>
                <p className="text-purple-100">Configure automated workflow for {plans.length} tasks</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Workflow Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Workflow Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Research Phase</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enableResearch}
                      onChange={(e) => updatePreference('enableResearch', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                {preferences.enableResearch && (
                  <select
                    value={preferences.researchDepth}
                    onChange={(e) => updatePreference('researchDepth', e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="basic">Basic Research</option>
                    <option value="detailed">Detailed Research</option>
                    <option value="comprehensive">Comprehensive Research</option>
                  </select>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Play className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Execution Phase</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enableExecution}
                      onChange={(e) => updatePreference('enableExecution', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {preferences.enableExecution && (
                  <select
                    value={preferences.executionMode}
                    onChange={(e) => updatePreference('executionMode', e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="conservative">Conservative Mode</option>
                    <option value="standard">Standard Mode</option>
                    <option value="aggressive">Aggressive Mode</option>
                  </select>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Rocket className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Deployment Phase</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enableDeployment}
                      onChange={(e) => updatePreference('enableDeployment', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                {preferences.enableDeployment && (
                  <select
                    value={preferences.deploymentProvider}
                    onChange={(e) => updatePreference('deploymentProvider', e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="netlify_static">Netlify</option>
                    <option value="vercel_static">Vercel</option>
                    <option value="github_pages">GitHub Pages</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Automation Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Progress Delay (seconds)
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={preferences.autoProgressDelay}
                  onChange={(e) => updatePreference('autoProgressDelay', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1s</span>
                  <span className="font-medium">{preferences.autoProgressDelay}s</span>
                  <span>30s</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pause Between Tasks
                  </label>
                  <p className="text-xs text-gray-500">Wait for confirmation between each task</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pauseBetweenTasks}
                    onChange={(e) => updatePreference('pauseBetweenTasks', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Task Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tasks to Execute ({plans.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {plans.map((plan, index) => (
                <div key={plan.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{plan.title}</p>
                    <p className="text-sm text-gray-600 truncate">{plan.description}</p>
                  </div>
                  <div className="flex space-x-1">
                    {preferences.enableResearch && (
                      <Brain className="w-4 h-4 text-emerald-600\" title="Research will be performed" />
                    )}
                    {preferences.enableExecution && (
                      <Play className="w-4 h-4 text-purple-600\" title="Execution will be performed" />
                    )}
                    {preferences.enableDeployment && (
                      <Rocket className="w-4 h-4 text-orange-600\" title="Deployment will be performed" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>This will automatically execute the selected workflow phases for all {plans.length} tasks.</p>
              <p className="text-xs mt-1">You can monitor progress and pause at any time.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!preferences.enableResearch && !preferences.enableExecution && !preferences.enableDeployment}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Start All Tasks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}