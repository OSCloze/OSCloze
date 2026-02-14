# Cloze Practice

A simple offline cloze sentence practice web app.

## Features

- Load sentences from `sentences.json` (or use built-in examples if the file isn’t available)
- One sentence at a time with a blank to fill
- Type the missing word and check your answer locally
- See correct/incorrect feedback and an explanation
- Score is tracked and stored in your browser (localStorage)

## How to run

**Option 1 – Open the file**  
Double-click `index.html` or open it in your browser. The app will use the built-in sentences if `sentences.json` can’t be loaded (e.g. when using `file://`).

**Option 2 – Local server (to load `sentences.json`)**  
From this folder run:

```bash
npx serve .
```

Then open the URL shown (e.g. http://localhost:3000).

## Editing sentences

Edit `sentences.json`. Each item should have:

- `id` – number (optional)
- `sentence` – text with `_____` for the blank
- `answer` – correct word(s) (case-insensitive)
- `explanation` – short explanation shown after checking
