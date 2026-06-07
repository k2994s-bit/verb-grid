// Netlify serverless function. Holds the API key server-side and returns a predicted verb profile.
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
    "A verb is an interface intervention. It has a STRENGTH from 1 (gentle) to 5 (heavy, paternalistic), and acts on a concrete UI surface.",
    "Important: strength is not neutral. The friction and restriction literature shows a sweet spot. Too gentle (1 to 2) and the move is ignored or habituated to. The middle (3) is where behaviour actually shifts. Too heavy (4 to 5) and it is circumvented, abandoned, or it damages genuine connection. The tool computes the strength-dependent journey itself, so you only describe the verb's identity, not a fixed journey.",
    "Return ONLY valid JSON, no markdown, no preamble, with exactly these keys:",
    '{"def": string (one clear plain sentence saying what the verb does to the user), "mech": string (a short gerund phrase naming the mechanism, e.g. "silencing the broadcast alerts"), "anchor": string (the realistic good outcome at a MODERATE strength, grounded, one clause, cite a real study in parentheses if apt), "layer": string, "principle": string, "guard": string (the commons check, what it must not touch), "basis": string (closest real study or pattern)}',
    "Keep every field short. Do not wrap strings in extra quotes."
  ].join(" ");

  const user = `Verb: ${name}. Strength: ${force} of 5. UI surface: ${surface}.${desc ? " Intent: " + desc : ""} Describe it as specified.`;

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
        max_tokens: 700,
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
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "prediction failed", detail: (e.message || "").slice(0, 200) }) };
  }
};
