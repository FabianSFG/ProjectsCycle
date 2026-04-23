import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../../lib/supabase";

const SYSTEM_PROMPT = `... (TU PROMPT IGUAL, LO DEJO IGUAL) ...`;

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idea } = req.body;

  if (!idea || typeof idea !== "string" || !idea.trim()) {
    return res.status(400).json({ error: "Please provide a project idea." });
  }

  // 🔥 1. VALIDACIÓN CRÍTICA DE VARIABLES
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    console.error("❌ Missing CLAUDE_API_KEY");
    return res.status(500).json({ error: "Missing API key on server" });
  }

  try {
    // 🔥 2. LLAMADA A CLAUDE
    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Idea: ${idea.trim()}` }],
    });

    const text =
      message.content.find((b) => b.type === "text")?.text ?? "";

    // 🔥 3. PARSE SEGURO (IMPORTANTE EN PRODUCCIÓN)
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ JSON parse error:", text);
      return res.status(500).json({
        error: "Invalid JSON returned by model",
        raw: text,
      });
    }

    // 🔥 4. SUPABASE (CON PROTECCIÓN)
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
        console.error("❌ Supabase error:", dbError.message);
      }
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("❌ API ERROR:", err);

    return res.status(500).json({
      error: err.message ?? "Internal server error",
    });
  }
}