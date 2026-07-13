export interface Part2RouteDetail {
  name: string;
  description: string;
  whatItInvolves: string[];
  bestFitFor: string[];
  nextSteps: string[];
  timeline: string;
  considerations: string[];
}

export const part2RouteDetails: Record<string, Part2RouteDetail> = {
  "University Degree Route": {
    name: "University Degree Route",
    description:
      "4+ year university program leading to a bachelor's degree or higher. Focus on academic learning, theory, research, and critical thinking in your chosen field.",
    whatItInvolves: [
      "Academic courses with lectures, readings, and research",
      "Independent study and critical thinking",
      "Thesis or capstone projects",
      "Potential for co-op or internship opportunities",
      "Option to continue to graduate school",
    ],
    bestFitFor: [
      "Strong academic performance and study habits",
      "Interest in theory and research",
      "Career goals requiring a degree",
      "Willingness to invest 4+ years in education",
      "Ability to manage costs through loans, scholarships, or family support",
    ],
    nextSteps: [
      "Pick 2–3 degree areas you're curious about (not a forever choice)",
      "Check prerequisites + grade/courses you need; ask a counselor what to change next term if needed",
      "Compare 3 schools: program fit, co-op/internships, and graduation outcomes",
      "Map the money: tuition, housing, scholarships/bursaries, and deadlines",
      "Make a simple 8-week plan: 1 visit/info session + 1 application task each week",
    ],
    timeline: "4-6 years for bachelor's degree",
    considerations: [
      "Highest education cost upfront",
      "Requires strong academic readiness",
      "May need to relocate",
      "Delayed income (though co-ops can help)",
      "Best return on investment for careers requiring degrees",
    ],
  },
  "College / Polytechnic Route": {
    name: "College / Polytechnic Route",
    description:
      "1–3 year diploma or certificate program with hands-on training for specific careers. Programs often include work placements and practical skills for immediate employment.",
    whatItInvolves: [
      "Applied learning with hands-on training",
      "Work placements or co-op terms",
      "Smaller class sizes and instructor support",
      "Programs aligned to specific careers",
      "Option to transfer credits to university later",
    ],
    bestFitFor: [
      "Want job-ready skills quickly",
      "Prefer hands-on learning over pure theory",
      "Have a specific career field in mind",
      "Want to enter workforce sooner",
      "Looking for practical training with work experience",
    ],
    nextSteps: [
      "Pick 2–3 programs that teach job-ready skills (look for co-op or work placement)",
      "Talk to 1 student/graduate or attend an info session to confirm what the day-to-day is like",
      "Compare costs + length + entry requirements across 3 options",
      "Build a shortlist + deadline list (applications, housing, financial aid)",
      "Create a 6-week plan: one small action each week (visit, call, application step)",
    ],
    timeline: "1-3 years for diploma/certificate",
    considerations: [
      "Lower cost and shorter time than university",
      "Earlier entry to workforce",
      "More structured and hands-on than university",
      "May need additional credentials for advancement",
      "Strong job placement rates in many programs",
    ],
  },
  "Trades / Apprenticeship Route": {
    name: "Trades / Apprenticeship Route",
    description:
      "Earn while you learn through apprenticeship or trade certification. Hands-on skilled work in construction, mechanics, electrical, plumbing, welding, and other trades.",
    whatItInvolves: [
      "On-the-job training with experienced tradespeople",
      "Block training periods for technical learning",
      "Progressive skill development and certifications",
      "Physical work in various environments",
      "Eventual journeyperson certification",
    ],
    bestFitFor: [
      "Learn best by doing and hands-on practice",
      "Enjoy physical work and problem-solving",
      "Want to earn income while training",
      "Interested in skilled trades careers",
      "Prefer working with tools and equipment",
    ],
    nextSteps: [
      "Choose 2–3 trades you'd actually like to try (based on hands-on interests)",
      "Find local pathways: union/training center, pre-apprenticeship, or employer-sponsored programs",
      "Check requirements (math/credits, driver's license, safety tickets) and fill gaps",
      "Do 1 job shadow or talk to a tradesperson about pay, hours, and training timeline",
      "Apply to 2 pathways and set a start date goal (even if it's 'explore for 30 days')",
    ],
    timeline: "2-5 years to journeyperson certification",
    considerations: [
      "Earn income while learning",
      "Physical demands of the work",
      "Strong job market and wages",
      "Need to find employer/sponsor for apprenticeship",
      "Potential for self-employment later",
    ],
  },
  "Work-First + Upgrade Route": {
    name: "Work-First + Upgrade Route",
    description:
      "Start working soon to gain experience and income, while upgrading skills through part-time training, certificates, or courses. Build your path step-by-step.",
    whatItInvolves: [
      "Entry-level employment in chosen field",
      "Evening/weekend courses or online training",
      "Gradual skill building while earning",
      "On-the-job experience and references",
      "Flexibility to pivot as you learn what you like",
    ],
    bestFitFor: [
      "Need income now or soon",
      "Want work experience before committing to training",
      "Prefer to learn what you like by trying it",
      "Have responsibilities that limit full-time school",
      "Motivated by earning and independence",
    ],
    nextSteps: [
      "Pick a job target that builds skills (not just any job): customer service, warehouse, admin, tech support, etc.",
      "Update a simple resume + apply to 10 roles; ask 1 adult to review",
      "Choose 1 upgrade skill for nights/weekends (certificate, online course, community class)",
      "Make a budget plan: how much you need + how much you can save for training",
      "Set a 3-month checkpoint: if you like the work, stay; if not, pivot using your backup route",
    ],
    timeline: "Variable - ongoing while working",
    considerations: [
      "Immediate income and experience",
      "Requires self-motivation for upgrading",
      "Progress may be slower than full-time training",
      "Good for exploring while earning",
      "Can transition to formal training later",
    ],
  },
  "Gap / Explore Route": {
    name: "Gap / Explore Route",
    description:
      "Planned time to explore options, work, volunteer, travel, or focus on health/family before committing to a training path. Structured exploration with clear goals.",
    whatItInvolves: [
      "Exploration activities (job shadows, volunteering, short courses)",
      "Part-time or temporary work",
      "Self-reflection and goal-setting",
      "Saving money for next steps",
      "Building life skills and independence",
    ],
    bestFitFor: [
      "Unsure which path fits best",
      "Need time for health, family, or personal reasons",
      "Want hands-on exploration before deciding",
      "Benefit from a structured break",
      "Need to save money or build maturity",
    ],
    nextSteps: [
      "Write your purpose for a gap (explore, earn, health, family, travel) and set a clear time box",
      "Plan 2 exploration actions/month: job shadow, volunteer, short course, or info interview",
      "Track what you learn weekly (what energized you / drained you)",
      "Build stability: savings goal + daily routine + support check-ins",
      "Pick your next decision date and what evidence you need to choose a route",
    ],
    timeline: "6 months to 1 year typically",
    considerations: [
      "Must be structured with goals",
      "Risk of drifting without a plan",
      "Opportunity to explore without pressure",
      "Can build savings and maturity",
      "Should have a transition plan to next step",
    ],
  },
  "Entrepreneur / Create Route": {
    name: "Entrepreneur / Create Route",
    description:
      "Build your own business, freelance career, content creation, or services independently. Create your own path by solving problems or offering value to customers.",
    whatItInvolves: [
      "Developing business or creative ideas",
      "Testing products/services with real customers",
      "Managing finances and operations",
      "Marketing and building a customer base",
      "Continuous learning and adaptation",
    ],
    bestFitFor: [
      "Self-motivated and comfortable with uncertainty",
      "Have an idea or problem you want to solve",
      "Enjoy creating and building things",
      "Willing to learn business skills",
      "Prepared for financial ups and downs",
    ],
    nextSteps: [
      "Pick 1 problem you'd love to solve (for a real group of people)",
      "Talk to 5 potential users/customers this month to learn what they actually need",
      "Build a tiny test (flyer, landing page, prototype, small service) — not a big business plan",
      "Find 1 mentor/community (teacher, local entrepreneur group, incubator) and get feedback weekly",
      "Keep a Plan B route for income/skills while you test the idea",
    ],
    timeline: "Variable - ongoing development",
    considerations: [
      "High uncertainty and risk",
      "Need backup income plan",
      "Requires business and financial skills",
      "Opportunity for independence and creativity",
      "Can combine with other routes for stability",
    ],
  },
};
