// Netlify serverless function. Holds the API key server-side and returns a predicted journey.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, body: "Bad JSON" }; }

  const name = (payload.name || "").toString().slice(0, 40);
  const force = (payload.force || "3").toString().slice(0, 2);
  const surface = (payload.surface || "the interface").toString().slice(0, 60);
  const desc = (payload.desc || "").toString().slice(0, 300);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: "no key configured" }) };

  const system = [
    "You are a design researcher for a thesis on non-sticky social media.",
    "The framework has three layers: casino (variable-reward compulsion), congregation (parasocial bonds), commons (genuine peer connection).",
    "Three principles: Reverse Reward Loop (value accrues to the user offline), Modularity (temporal and feature-level), Ethical Gamification.",
    "Guardrail, the puritan trap: never destroy the commons while targeting the casino.",
    "A verb is an interface intervention. It has a STRENGTH from 1 (gentle) to 5 (heavy), and acts on a concrete UI SURFACE (for example notification pings, the feed, infinite scroll, recommendations, like and comment counts, app open, pull to refresh, direct messages, your time).",
    "Predict the realistic user journey grounded in HCI evidence (notification batching, one-second friction, chronological feeds, greyscale, hidden likes, app-open prompts).",
    "Return ONLY valid JSON, no markdown, no preamble, with exactly these keys:",
    '{"def": string (one sentence), "layer": string, "principle": string, "journey": [[stageTitle, text], [stageTitle, text], [stageTitle, text]] (exactly 3 common-path stages), "holds": {"when": string, "then": string}, "fails": {"when": string, "then": string}, "guard": string (the commons check), "basis": string (closest real study or pattern)}',
    "holds is the condition under which the verb works and the good outcome. fails is the condition under which it breaks and the bad outcome. Keep each field short. Do not wrap strings in extra quotes."
  ].join(" ");

  const user = `Verb: ${name}. Strength: ${force} of 5. UI surface: ${surface}.${desc ? " Intent: " + desc : ""} Predict its journey as specified.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 900,
        system: system,
        messages: [{ role: "user", content: user }]
      })
    });
    if (!r.ok) {
      const t = await r.text();
      return { statusCode: 502, body: JSON.stringify({ error: "model error", detail: t.slice(0, 300) }) };
    }
    const data = await r.json();
    let text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "prediction failed", detail: (e.message || "").slice(0, 200) }) };
  }
};
