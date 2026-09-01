# DeepGuard AI — Forensic Ops Console

Full live multi-modal deepfake detection console matching the product UI.

## Features

- **Landing page** — hero, wireframe globe, stats, Deploy Console CTA
- **Live Detection** — webcam engage, frame capture, real-time analysis
- **Upload Analysis** — VIDEO / AUDIO / IMAGE drag-drop → forensic verdict
- **Detection History** — localStorage-backed scan log
- **Analytics** — verdict split, modality breakdown, latency / confidence

Detection uses deterministic heuristics (no API key required).  
Optionally set `ANTHROPIC_API_KEY` for real Claude Sonnet image analysis.

## Quick start (local)

```bash
cd deepguard-ai
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo (or use Vercel CLI).
2. Import project on [vercel.com](https://vercel.com) → Framework: Next.js.
3. (Optional) Add env var `ANTHROPIC_API_KEY`.
4. Deploy.

CLI:

```bash
npx vercel --prod
```

## Project structure

```
app/
  page.js              # Landing
  console/page.js      # Ops console (sidebar + views)
  api/analyze/         # Analysis endpoint
  api/health/
components/            # UI modules
lib/detection.js       # Heuristic engine
```

## License

MIT — demo / portfolio use.
