# The verb grid — hosted version

This is the interactive tool plus a tiny server function so the "add a verb"
prediction works live on a normal website, full screen, in any browser.

Your secret key lives only in Netlify, never in the page. Follow the steps once
and you have a public link.

## What is in this folder
- `index.html` — the tool
- `netlify/functions/predict.js` — the small server function that talks to the model
- `netlify.toml` — tells Netlify how to serve it

Do not type your key into any of these files. It goes in Netlify (Part 2, step 6).

---

## Part 1 — Get an API key (about 3 minutes)
1. Go to console.anthropic.com and sign in (or sign up).
2. Open Billing and add a small amount of credit. A few dollars is far more than a demo needs.
3. Open API keys, click Create key, and copy it somewhere safe. You only see it once.

## Part 2 — Put it online with Netlify, no coding (about 10 minutes)
1. Make a free account at github.com.
2. Click New repository. Give it any name. Click Create repository.
3. On the new repo page, click "uploading an existing file". Drag in the
   whole contents of this folder, keeping the structure: `index.html`,
   `netlify.toml`, and the `netlify` folder with `functions/predict.js` inside.
   Click Commit changes.
4. Go to netlify.com and sign up. Using the "Log in with GitHub" option is easiest.
5. Click Add new site, then Import an existing project, then GitHub, then pick
   your repository. Leave all build settings as they are. Click Deploy.
6. When it finishes, open Site configuration, then Environment variables, then
   Add a variable. Name it exactly `ANTHROPIC_API_KEY` and paste your key as the
   value. If it asks about scope, make sure Functions is ticked. Save.
7. Go to Deploys, click Trigger deploy, then Deploy site. (A new key only takes
   effect after a fresh deploy.)
8. Open your site link (something like your-name.netlify.app). The grid works,
   and adding a verb now predicts live.

## Part 3 — Present it
Open the link in any browser and go full screen (Control Command F on Safari,
F11 elsewhere). Live prediction works, no laptop setup needed.

---

## Good to know
- Cost: each prediction is roughly a cent. A whole presentation is pennies. To
  cut it about 3x, open `predict.js` and change the model to `claude-haiku-4-5`.
- If a prediction ever fails, the tool quietly falls back to estimating from
  neighbouring verbs, so it never dead-ends.
- The standalone offline file still works with no setup; this hosted version
  only adds the live prediction at full screen.
