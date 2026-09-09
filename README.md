# Monglish · Power Up Adaptive Placement Test

A branded, adaptive English placement web app for young learners (ages 5–12).
It places a learner across the whole Power Up ladder — **Power Up 1 (Pre-A1 Starters) → Power Up 6 (B1 Preliminary)** — and outputs the recommended **book + sub-level** with a full learner/teacher report.

> CEFR-referenced and Cambridge-aligned. **Not** an official Cambridge English examination.

---

## Quick start

Just open **`index.html`** in a modern browser (Chrome, Edge, Firefox, Safari).
No installation, no server, no internet needed — everything runs locally.

Use headphones. Listening plays recorded American-accent audio from `audio/`;
each track can be played up to **3 times** (one play + two replays).

## Folder structure

```
monglish-placement-app/
├── index.html          all screens (landing → report)
├── styles.css          Monglish design system (navy #0f2a47 · orange #e8852b)
├── app.js              adaptive engine, scoring, reports
├── data/questions.js   question bank + config (edit content here)
├── assets/             monglish_coloured.png · monglish_white.png
├── audio/              listening mp3s (American accent) + LISTENING-SCRIPTS.md
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

- **Instruction video:** `assets/instructions.mp4` (720p, self-hosted — no Google Drive / YouTube dependency) with `assets/instructions-poster.jpg` as the still. It plays in two places: the **"▶ Watch how it works"** popup on the landing screen (close with ✕, click outside, or Esc) and inline on the **Instructions** screen. To swap it, replace those two files — no code change needed.
- **Mascot / speech bubble:** edit the `.mascot-col` block in `index.html` (image + the "Hi! I'm Mongiz" `.speech` text).
- **Questions:** edit `data/questions.js`. Each tier `1..6` = Power Up `1..6`. Items carry metadata (skill, objective, answer, level) used by the engine but never shown to the learner.
- **Listening audio:** each tier plays `audio/listen-N.mp3` via its `audioSrc`. All six tracks are **American-accent** recordings made with ElevenLabs using the Monglish brand voices (Mongiz, Imy, Mother, Father, Grandma, Grandpa, Monglish Narrator). Full scripts, casting and re-recording instructions are in **`audio/LISTENING-SCRIPTS.md`**.
- **Listening answers:** one field per item — the **number** (1–6) for Power Up 1–2, the **a / b** choice for Power Up 3–4, and the **picture letter** (a–f) for Power Up 5–6. Each exercise is marked out of **5** (the example item is not scored), matching the paper worksheet.
- **Thresholds/weights:** all in the `CONFIG` object at the top of `data/questions.js`.

## Staff test code

**`MPU-TEST`** (or `MPU-TEST-XX`, e.g. `MPU-TEST-SOHA`) is a permanent QA code.
It is **reusable** — it skips the one-time device-locked check, so running it never
spends a real student code, and it works on any device as often as you like.

The attempt **is** recorded in the results sheet, labelled so it cannot be mistaken
for a student placement: the name column reads **"TEST TRIAL - Dr. Abir Wafa"**, the
class column notes the name that was typed in, the attempt id is prefixed `TEST-`,
and the payload carries `test: true`. A yellow **TEST TRIAL** badge shows in the
header for the whole run. The row appears once the Writing step is submitted.

Note: this code lives in `app.js`, so anyone reading the page source could find it.
That is an accepted trade-off — every run it produces is labelled, so misuse is
visible in the sheet. To change or retire it, edit `TEST_CODE` in `app.js`.

## Privacy

- All data stays **in the browser** — results are kept in `localStorage` (key `mpt_results`) and can be exported as a JSON file.
- No external services, no tracking, no ads. Use **New student** / clear your browser storage to remove data.

## Accessibility

Semantic HTML, keyboard-operable controls, visible focus rings, high-contrast text, alt text on the logo, ARIA roles on the answer options, and a print-friendly report.
