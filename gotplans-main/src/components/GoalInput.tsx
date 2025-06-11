import React, { useState } from 'react'
import { Send, Target, Sparkles } from 'lucide-react'

interface GoalInputProps {
  onSubmit: (goal: string) => void
  isLoading: boolean
}

export default function GoalInput({ onSubmit, isLoading }: GoalInputProps) {
  const [goal, setGoal] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (goal.trim() && !isLoading) {
      onSubmit(goal.trim())
      setGoal('')
    }
  }

  const exampleGoals = [
    "Launch a successful online business",
    "Learn web development in 6 months", 
    "Plan a two-week European vacation",
    "Organize a charity fundraising event"
  ]

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <div className="text-3xl">📋</div>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-3">Got Plans?</h1>
        <p className="text-xl text-gray-600 mb-2">
          Transform your goals into structured, actionable plans
        </p>
        <p className="text-lg text-gray-500">
          Powered by AI agents for research, execution, and deployment
        </p>
      </div>

      {/* Goal Input Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your goal or objective in detail..."
            className="w-full h-32 p-6 pr-16 text-lg border-2 border-gray-200 rounded-2xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!goal.trim() || isLoading}
            className="absolute bottom-4 right-4 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Example Goals */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
          Try these example goals:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleGoals.map((example, index) => (
            <button
              key={index}
              onClick={() => setGoal(example)}
              className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-gray-700 hover:text-gray-900"
              disabled={isLoading}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}