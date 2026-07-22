# Monglish · Power Up Adaptive Placement Test

A branded, adaptive English placement web app for young learners (ages 5–12).
It places a learner across the whole Power Up ladder — **Power Up 1 (Pre-A1 Starters) → Power Up 6 (B1 Preliminary)** — and outputs the recommended **book + sub-level** with a full learner/teacher report.

> CEFR-referenced and Cambridge-aligned. **Not** an official Cambridge English examination.

---

## Quick start

Just open **`index.html`** in a modern browser (Chrome, Edge, Firefox, Safari).
No installation, no server, no internet needed — everything runs locally.

If Listening has no sound: the app reads the questions aloud using your browser's
built-in speech (Web Speech API). Allow it a moment to load voices, and use
headphones. (See "Listening audio" below to use recorded audio instead.)

## Folder structure

```
monglish-placement-app/
├── index.html          all screens (landing → report)
├── styles.css          Monglish design system (navy #0f2a47 · orange #e8852b)
├── app.js              adaptive engine, scoring, reports
├── data/questions.js   question bank + config (edit content here)
├── assets/             monglish_coloured.png · monglish_white.png
├── audio/              (optional) drop recorded listening mp3s here
└── README.md
```

## What it does

1. **Landing** — your instruction video area, student registration (name, age 5–12, optional school/class), and a glowing **Start** button.
2. **Sound check** → **Instructions**.
3. **4 sections** — Listening, Reading (adaptive), Writing and Speaking (auto-selected at the learner's level).
4. **Adaptive routing** — starts around A1 and climbs/drops by performance; it finds the *highest level securely demonstrated* and never over-places on a lucky answer.
5. **Teacher scoring panel** — enter Writing & Speaking marks (0–3 per criterion) using the on-screen rubric.
6. **Report** — book + sub-level, CEFR band, Cambridge stage, confidence, weighted skill scores, strengths, gaps, recommendation and teacher flags. **Print** or **Export (JSON)**.

## Scoring model

- **Weighting:** Listening 30% · Reading 30% · Writing 20% · Speaking 20%.
  Listening + Reading (receptive, 60%) decide the book; Writing + Speaking confirm it (they can lower, never raise, the placement by more than one band).
- **Adaptive ladder:** a level "passes" at a majority score and the highest passed level sets the book; the sub-level (x.1 / x.2 / x.3) comes from how strong that level was.
- **Safeguards:** consistency across Listening *and* Reading; large L/R gaps, weak productive skills, one-skill-only, below-floor, and unusually fast answers are all flagged for teacher review with a confidence rating (High / Medium / Low).

Simulation across ability levels: **~90% exact book match, ~96% within one sub-level**; residual error is *downward* (safe under-placement, flagged for review).

## Design & assets

- **Style:** Claymorphism (soft 3D, rounded, playful) — brand navy `#0f2a47` + orange `#e8852b`, trust-blue accents.
- **Fonts:** Baloo 2 (headings) + Nunito (body), loaded from Google Fonts with a **system-font fallback**, so the app still works offline (it just uses your OS rounded font).
- **Mascot:** `assets/mongiz-student.png` (transparent PNG). Swap this file to change the character; keep it transparent.

## Customising

- **Instruction video:** the hero has a **"▶ Watch how it works"** button that opens a popup. Put your video at **`assets/instructions.mp4`** and it plays there automatically (until then a placeholder shows). Close with ✕, click outside, or Esc.
- **Mascot / speech bubble:** edit the `.mascot-col` block in `index.html` (image + the "Hi! I'm Mongiz" `.speech` text).
- **Questions:** edit `data/questions.js`. Each tier `1..6` = Power Up `1..6`. Items carry metadata (skill, objective, answer, level) used by the engine but never shown to the learner.
- **Listening audio:** by default the browser speaks each item. To use a recorded file, add `audioSrc:"audio/xxx.mp3"` to a listening item (engine support can be enabled in `app.js` — see the `speak()`/play handler).
- **Thresholds/weights:** all in the `CONFIG` object at the top of `data/questions.js`.

## Privacy

- All data stays **in the browser** — results are kept in `localStorage` (key `mpt_results`) and can be exported as a JSON file.
- No external services, no tracking, no ads. Use **New student** / clear your browser storage to remove data.

## Accessibility

Semantic HTML, keyboard-operable controls, visible focus rings, high-contrast text, alt text on the logo, ARIA roles on the answer options, and a print-friendly report.
