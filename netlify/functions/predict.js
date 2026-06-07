// Netlify serverless function. It holds your API key as an environment
// variable (ANTHROPIC_API_KEY) and makes the model call on the server, so the
// key is never sent to the browser. The page calls this at /.netlify/functions/predict

const FORCE = { sub: "Subtract", res: "Reshape", add: "Add" };
const SURF = { flow: "Flow", boundary: "Boundary", endpoint: "Endpoint", architecture: "Architecture" };

const SYSTEM = `You predict user journeys for interface interventions in a design thesis on non-sticky social media.
Framework: every intervention has a FORCE (subtract, reshape, add) and a SURFACE (flow, boundary, endpoint, architecture). Three layers exist: casino (variable-reward compulsion mechanics), congregation (parasocial bonds and devotional return), commons (genuine peer-to-peer connection). Cardinal rule, the puritan trap: target the casino without damaging the commons.
Reason from these documented patterns: notification batching three times a day improves wellbeing while turning alerts fully off raises anxiety and FoMO (Fitz 2019); intent-pause friction gets about a third of openings abandoned but the effect decays over weeks and a bare deliberation message does nothing (Gruning 2023); chronological feeds reduce time but raise untrustworthy content, so less sticky is not healthier (Guess 2023); app blocking is heavily circumvented and risks cutting the commons (Lyngs 2019); greyscale cuts time modestly and raises perceived control but leaves checking frequency and mood unchanged (Holte 2020); awareness and reflection rarely convert to behaviour; gamified abstinence can become its own compulsion.
Predict a realistic journey with an honest failure mode. Output ONLY valid JSON, no markdown fences, no preamble, exactly this shape: {"def":"one line","layer":"which of casino, congregation or commons it touches","principle":"Reverse Reward Loop or Modularity or Ethical Gamification","journey":[["First encounter","..."],["Adaptation","..."],["Steady state","..."],["Failure mode","..."]],"up":["..",".."],"dn":["..",".."],"guard":"one sentence commons check","basis":"one sentence naming the closest analogous evidence"}. Keep every field concise. Do not use em dashes.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing ANTHROPIC_API_KEY environment variable" }) };
  }
  try {
    const { name, force, surface, desc } = JSON.parse(event.body || "{}");
    const user = `Verb: ${name}. Force: ${FORCE[force] || force}. Surface: ${SURF[surface] || surface}.` + (desc ? ` What it does: ${desc}` : "");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        // To cut cost about 3x, change this to "claude-haiku-4-5"
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM,
        messages: [{ role: "user", content: user }]
      })
    });

    const data = await r.json();
    if (!data.content) {
      return { statusCode: 502, body: JSON.stringify({ error: "Unexpected response from model API", detail: data }) };
    }
    let txt = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
    txt = txt.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: txt };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
