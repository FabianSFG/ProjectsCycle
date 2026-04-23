import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../../lib/supabase";

const SYSTEM_PROMPT = `You are a senior software architect and solutions engineer specialized in AI-powered development.

Transform the client idea into a detailed software proposal. Return ONLY valid JSON — no markdown, no explanation.

Use this exact structure:

{
  "summary": "2-3 sentence executive summary",
  "epics": [
    {
      "name": "Epic name",
      "type": "Feature | Infrastructure | Integration | Security | UX",
      "role": "Frontend | Backend | DevOps | AI | QA | PM",
      "priority": "High | Medium | Low",
      "estimated_hours": 40,
      "user_stories": [
        "As a [user], I want to [action] so that [benefit]"
      ],
      "acceptance_criteria": [
        "Given [context], when [action], then [result]"
      ]
    }
  ],
  "architecture": {
    "stack": ["Next.js", "Node.js", "PostgreSQL"],
    "description": "Short description of the overall architecture"
  },
  "ai_architecture": {
    "components": [
      {
        "name": "Component name",
        "role": "What it does in the system",
        "model": "claude-3-5-sonnet | embedding model | etc"
      }
    ],
    "data_flow": "Step-by-step description of how data flows through the AI layer",
    "description": "How Claude and AI are used to power this product"
  },
  "team": [
    {
      "role": "Frontend Developer",
      "allocation": "Full-time",
      "hourly_rate": 45,
      "total_cost": 7200,
      "tools": ["VS Code", "Figma", "GitHub Copilot"]
    }
  ],
  "tools": [
    {
      "name": "Tool name",
      "category": "AI | DevOps | Design | Analytics | Communication | Database | Infrastructure",
      "monthly_cost": 20,
      "purpose": "What this tool does for the project"
    }
  ],
  "estimation": {
    "total_hours": 0,
    "breakdown": [
      {
        "role": "Role name",
        "hours": 0
      }
    ]
  },
  "vibe_coding": {
    "time_saved_percent": 40,
    "dev_savings_percent": 30,
    "description": "Explanation of how AI-assisted development accelerates this specific project",
    "optimizations": [
      "Specific optimization or automation Claude enables in this project"
    ]
  },
  "comparison": {
    "traditional": {
      "hours": 0,
      "cost": 0,
      "team_size": 0,
      "timeline": "16-20 weeks"
    },
    "ai_powered": {
      "hours": 0,
      "cost": 0,
      "team_size": 0,
      "timeline": "8-10 weeks"
    },
    "savings": {
      "hours": 0,
      "cost": 0,
      "percent": 0
    }
  },
  "totals": {
    "team_total_cost": 0,
    "tools_monthly_cost": 0,
    "grand_total": 0
  },
  "timeline": "8-10 weeks",
  "cost": 0
}

Rules:
- Provide 5-8 realistic epics with 2-3 user stories and 2 acceptance criteria each
- Team hourly rates: Junior $30-40, Mid $45-65, Senior $70-100, AI/ML $80-110
- total_cost per team member = hourly_rate * hours from estimation breakdown
- tools array: include Claude API, GitHub Copilot, and any relevant SaaS tools with real pricing
- vibe_coding time_saved_percent: typically 35-55% with AI-assisted development
- comparison.traditional uses 2x the hours and 1.5x the team of ai_powered
- totals.grand_total = team_total_cost + (tools_monthly_cost * project_duration_months)
- cost = totals.grand_total
- All numbers must be consistent and calculated correctly`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idea } = req.body;
  if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a project idea." });
  }

  const apiKey = (process.env.CLAUDE_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({ error: "Server error: CLAUDE_API_KEY is not configured." });
  }

  // Inicialización limpia para producción
  const client = new Anthropic({
    apiKey,
    baseURL: "https://api.anthropic.com"
  });

  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022", // Modelo estable para producción
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Idea: ${idea.trim()}` }],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "";

    // Validamos que el texto sea JSON antes de parsear
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      return res.status(500).json({ error: "Model returned invalid JSON format." });
    }

    if (supabase) {
      const { error: dbError } = await supabase.from("projects").insert({
        idea: idea.trim(),
        result: parsed,
        summary: parsed.summary,
        total_hours: parsed.estimation?.total_hours ?? null,
        total_cost: parsed.totals?.grand_total ?? parsed.cost ?? null,
        tools_monthly: parsed.totals?.tools_monthly_cost ?? null,
        timeline: parsed.timeline,
        stack: parsed.architecture?.stack ?? [],
      });

      if (dbError) {
        console.error("Supabase insert error:", dbError);
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Anthropic API Error:", err);
    return res.status(500).json({
      error: err.message || "Internal server error.",
      details: err.type || "Unknown Error"
    });
  }
}