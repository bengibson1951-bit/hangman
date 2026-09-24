# Hangman Spelling 🐙

A free, kid-friendly hangman game for practising English spelling, built for a bilingual (English/Swedish) 10-year-old. No server, no accounts — plain static files, installable on a phone.

## Play

Serve the folder with any static server, e.g.:

```
npx serve .
```

On a phone, "Add to Home Screen" installs it as an app that works offline.

## Game modes

- **My Words** — a parent creates named word lists (e.g. "Week 39 spelling words") right in the app. Each word is English, with optional Swedish translation and optional hint. Lists are saved on the device. Playing a list skips already-solved words until the whole list is done, then starts over.
- **Random Words** — ~300 bundled common English nouns with Swedish translations and kid-friendly definitions, in Easy / Medium / Hard / Mixed levels. Recently used words are avoided until the pool runs dry.

## Clue modes

Chosen on the home screen (remembered between sessions):

- **Swedish** (default) — the Swedish word is the clue; spell the English word.
- **Meaning** — a simple English definition or hint is the clue.
- **No clue** — classic hangman.

A custom word without the needed clue data falls back to classic for that round. 8 wrong guesses lose the round; the friendly figure only looks dizzy, never grim.

## Play styles

Also chosen on the home screen:

- **Any order** — normal hangman: guess letters in any order, 8 wrong guesses.
- **In order · 3 ❤️** — real spelling practice: letters must be tapped left to right (the next blank bounces). A wrong tap breaks one of 3 hearts; losing all 3 ends the run. Score is how many words she completes in a run, and the all-time best run is saved and shown on the home screen.

## Word list

`words.json` — each entry is `{ "en", "sv", "def", "level" }` (level 1–3). After editing, check it:

```
node tools/validate-words.js
```

## Development

- No build step. `index.html` + `style.css` + `app.js` (DOM) + `game.js` (pure logic).
- Tests: `npm test` (Node's built-in test runner).
- Player data lives in `localStorage` under `hangman.*` keys.

## Deploy

Any static host works. For GitHub Pages: push the repo, enable Pages on the main branch, done. Bump the `CACHE` version in `sw.js` when shipping changes so installed phones pick them up.
