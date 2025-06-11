import { TaskPlan, SubTask } from '../lib/supabase'

// This simulates LLM-powered planning logic
// In a real implementation, this would call an actual LLM API
export function generateTaskPlan(goal: string): {
  plans: Omit<TaskPlan, 'id' | 'goal_id' | 'created_at'>[]
  subTasks: Record<number, Omit<SubTask, 'id' | 'plan_id' | 'created_at'>[]>
} {
  // Analyze goal and generate appropriate plans
  const plans = analyzeGoalAndCreatePlans(goal)
  const subTasks: Record<number, Omit<SubTask, 'id' | 'plan_id' | 'created_at'>[]> = {}

  // Generate sub-tasks for each plan
  plans.forEach((plan, index) => {
    subTasks[index] = generateSubTasks(plan.title, plan.description || '')
  })

  return { plans, subTasks }
}

function analyzeGoalAndCreatePlans(goal: string): Omit<TaskPlan, 'id' | 'goal_id' | 'created_at'>[] {
  const lowerGoal = goal.toLowerCase()
  
  // Business-related goals
  if (lowerGoal.includes('business') || lowerGoal.includes('startup') || lowerGoal.includes('company')) {
    return [
      {
        title: "Market Research & Validation",
        description: "Research your target market, validate your business idea, and analyze competitors",
        sequence_order: 1,
        estimated_duration: "2-3 weeks",
        priority: "high",
        status: "pending"
      },
      {
        title: "Business Plan Development",
        description: "Create a comprehensive business plan including financial projections and strategy",
        sequence_order: 2,
        estimated_duration: "1-2 weeks",
        priority: "high",
        status: "pending"
      },
      {
        title: "Legal Structure & Registration",
        description: "Choose business structure, register your business, and handle legal requirements",
        sequence_order: 3,
        estimated_duration: "1 week",
        priority: "medium",
        status: "pending"
      },
      {
        title: "Product/Service Development",
        description: "Develop your minimum viable product or service offering",
        sequence_order: 4,
        estimated_duration: "4-8 weeks",
        priority: "high",
        status: "pending"
      },
      {
        title: "Marketing & Launch Strategy",
        description: "Develop marketing materials, build online presence, and plan your launch",
        sequence_order: 5,
        estimated_duration: "2-3 weeks",
        priority: "medium",
        status: "pending"
      }
    ]
  }

  // Learning/Education goals
  if (lowerGoal.includes('learn') || lowerGoal.includes('study') || lowerGoal.includes('development')) {
    return [
      {
        title: "Foundation & Prerequisites",
        description: "Establish fundamental knowledge and ensure you have necessary prerequisites",
        sequence_order: 1,
        estimated_duration: "1-2 weeks",
        priority: "high",
        status: "pending"
      },
      {
        title: "Structured Learning Path",
        description: "Follow a systematic curriculum with hands-on practice and projects",
        sequence_order: 2,
        estimated_duration: "8-12 weeks",
        priority: "high",
        status: "pending"
      },
      {
        title: "Practical Application",
        description: "Build real projects to apply your knowledge and create a portfolio",
        sequence_order: 3,
        estimated_duration: "4-6 weeks",
        priority: "medium",
        status: "pending"
      },
      {
        title: "Advanced Topics",
        description: "Dive deeper into specialized areas and advanced concepts",
        sequence_order: 4,
        estimated_duration: "3-4 weeks",
        priority: "medium",
        status: "pending"
      },
      {
        title: "Community & Networking",
        description: "Join communities, attend events, and build professional connections",
        sequence_order: 5,
        estimated_duration: "Ongoing",
        priority: "low",
        status: "pending"
      }
    ]
  }

  // Travel/Vacation goals
  if (lowerGoal.includes('travel') || lowerGoal.includes('vacation') || lowerGoal.includes('trip')) {
    return [
      {
        title: "Destination Research & Planning",
        description: "Research destinations, create itinerary, and plan activities",
        sequence_order: 1,
        estimated_duration: "1-2 weeks",
        priority: "high",
        status: "pending"
      },
      {
        title: "Budget Planning & Booking",
        description: "Set budget, book flights, accommodations, and major activities",
        sequence_order: 2,
        estimated_duration: "1 week",
        priority: "high",
        status: "pending"
      },
      {
        title: "Documentation & Preparation",
        description: "Handle passports, visas, travel insurance, and packing preparation",
        sequence_order: 3,
        estimated_duration: "2-3 weeks",
        priority: "medium",
        status: "pending"
      },
      {
        title: "Final Preparations",
        description: "Complete packing, arrange transportation, and handle last-minute details",
        sequence_order: 4,
        estimated_duration: "3-5 days",
        priority: "medium",
        status: "pending"
      }
    ]
  }

  // Event planning goals
  if (lowerGoal.includes('event') || lowerGoal.includes('party') || lowerGoal.includes('fundrais')) {
    return [
      {
        title: "Event Concept & Planning",
        description: "Define event goals, theme, target audience, and initial planning",
        sequence_order: 1,
        estimated_duration: "1 week",
        priority: "high",
        status: "pending"
      },
      {
        title: "Venue & Date Selection",
        description: "Research and book venue, set date, and handle initial logistics",
        sequence_order: 2,
        estimated_duration: "1-2 weeks",
        priority: "high",
        status: "pending"
      },
      {
        title: "Vendor Coordination",
        description: "Book catering, entertainment, equipment, and other necessary services",
        sequence_order: 3,
        estimated_duration: "2-3 weeks",
        priority: "medium",
        status: "pending"
      },
      {
        title: "Marketing & Promotion",
        description: "Create promotional materials, manage registrations, and build awareness",
        sequence_order: 4,
        estimated_duration: "3-4 weeks",
        priority: "medium",
        status: "pending"
      },
      {
        title: "Final Preparations & Execution",
        description: "Handle final details, coordinate day-of logistics, and execute the event",
        sequence_order: 5,
        estimated_duration: "1 week",
        priority: "high",
        status: "pending"
      }
    ]
  }

  // Generic goal breakdown
  return [
    {
      title: "Goal Analysis & Requirements",
      description: "Break down the goal into specific requirements and success criteria",
      sequence_order: 1,
      estimated_duration: "2-3 days",
      priority: "high",
      status: "pending"
    },
    {
      title: "Resource Planning",
      description: "Identify and secure necessary resources, tools, and support",
      sequence_order: 2,
      estimated_duration: "3-5 days",
      priority: "high",
      status: "pending"
    },
    {
      title: "Implementation Phase",
      description: "Execute the main work required to achieve your goal",
      sequence_order: 3,
      estimated_duration: "2-4 weeks",
      priority: "high",
      status: "pending"
    },
    {
      title: "Review & Optimization",
      description: "Review progress, make adjustments, and optimize your approach",
      sequence_order: 4,
      estimated_duration: "3-5 days",
      priority: "medium",
      status: "pending"
    },
    {
      title: "Completion & Follow-up",
      description: "Finalize deliverables and plan for maintenance or next steps",
      sequence_order: 5,
      estimated_duration: "1-2 days",
      priority: "medium",
      status: "pending"
    }
  ]
}

function generateSubTasks(planTitle: string, planDescription: string): Omit<SubTask, 'id' | 'plan_id' | 'created_at'>[] {
  const lowerTitle = planTitle.toLowerCase()

  // Market Research tasks
  if (lowerTitle.includes('market research') || lowerTitle.includes('validation')) {
    return [
      { title: "Define target customer persona", description: "Create detailed profiles of your ideal customers", sequence_order: 1, completed: false },
      { title: "Conduct customer interviews", description: "Interview 10-15 potential customers about their needs", sequence_order: 2, completed: false },
      { title: "Analyze competitor landscape", description: "Research direct and indirect competitors", sequence_order: 3, completed: false },
      { title: "Validate market size", description: "Estimate total addressable market and demand", sequence_order: 4, completed: false },
      { title: "Document findings", description: "Compile research into actionable insights", sequence_order: 5, completed: false }
    ]
  }

  // Business Plan tasks
  if (lowerTitle.includes('business plan')) {
    return [
      { title: "Executive summary", description: "Write compelling overview of your business", sequence_order: 1, completed: false },
      { title: "Financial projections", description: "Create 3-year revenue and expense forecasts", sequence_order: 2, completed: false },
      { title: "Marketing strategy", description: "Define how you'll reach and acquire customers", sequence_order: 3, completed: false },
      { title: "Operations plan", description: "Outline how your business will operate day-to-day", sequence_order: 4, completed: false },
      { title: "Risk analysis", description: "Identify potential risks and mitigation strategies", sequence_order: 5, completed: false }
    ]
  }

  // Foundation & Prerequisites tasks
  if (lowerTitle.includes('foundation') || lowerTitle.includes('prerequisite')) {
    return [
      { title: "Assess current knowledge", description: "Take assessment tests to identify knowledge gaps", sequence_order: 1, completed: false },
      { title: "Set up learning environment", description: "Install necessary tools and software", sequence_order: 2, completed: false },
      { title: "Gather learning resources", description: "Collect books, courses, and online materials", sequence_order: 3, completed: false },
      { title: "Create study schedule", description: "Plan daily/weekly study time blocks", sequence_order: 4, completed: false },
      { title: "Join learning community", description: "Find online forums or local groups", sequence_order: 5, completed: false }
    ]
  }

  // Destination Research tasks
  if (lowerTitle.includes('destination') || lowerTitle.includes('research')) {
    return [
      { title: "Research destinations", description: "Compare different travel destinations and attractions", sequence_order: 1, completed: false },
      { title: "Check travel requirements", description: "Verify visa, vaccination, and documentation needs", sequence_order: 2, completed: false },
      { title: "Plan daily itinerary", description: "Create day-by-day activity schedule", sequence_order: 3, completed: false },
      { title: "Research local customs", description: "Learn about culture, etiquette, and local practices", sequence_order: 4, completed: false },
      { title: "Create packing checklist", description: "List all items needed for the trip", sequence_order: 5, completed: false }
    ]
  }

  // Generic sub-tasks
  return [
    { title: "Define specific objectives", description: "Set clear, measurable goals for this phase", sequence_order: 1, completed: false },
    { title: "Gather required resources", description: "Collect all necessary tools, information, and materials", sequence_order: 2, completed: false },
    { title: "Create action timeline", description: "Break down work into daily/weekly milestones", sequence_order: 3, completed: false },
    { title: "Execute planned activities", description: "Complete the main work items for this phase", sequence_order: 4, completed: false },
    { title: "Review and document progress", description: "Assess results and document lessons learned", sequence_order: 5, completed: false }
  ]
}