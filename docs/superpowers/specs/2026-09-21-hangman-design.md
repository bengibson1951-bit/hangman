# Hangman Spelling Game — Design

**Date:** 2026-09-21
**Purpose:** A hangman game for a 10-year-old to practice English spelling, playable on a phone. Built and deployed like the imposter game: a static PWA, no server, no accounts.

## Overview

A standalone static web app in `hangman/` (sibling of `imposter/`): plain `index.html` + `style.css` + `app.js` + `game.js`, no build step. Installable via "Add to Home Screen" (manifest + service worker), works offline, deployable to GitHub Pages or any static host.

Two game modes:

1. **My Words** — parent-entered word lists saved on the device.
2. **Random Words** — a bundled list of ~300 common English nouns a 10-year-old would know.

## Clue modes

A global setting on the home screen, remembered in `localStorage`. Applies to both game modes:

- **Swedish (default)** — the Swedish translation is shown as the clue; she spells the English word.
- **Definition** — a simple one-line English definition/hint is shown.
- **Classic** — no clue; deduce the word from revealed letters.

If a custom word lacks the data for the chosen mode (no Swedish translation / no hint), that word falls back to classic for that round.

## Home screen

- Title + two big buttons: **My Words** and **Random Words**.
- Clue-mode picker: Swedish / Definition / Classic.
- Link to **Edit lists** (list management screen). Not hidden or locked — just a separate screen.

## My Words mode

- Named lists (e.g. "Week 38 spelling words"), stored in `localStorage`.
- Each entry: English word (required), Swedish translation (optional), hint (optional).
- Edit screen: create/rename/delete lists; add/edit/remove words in a list.
- Play flow: pick a list → play through its words in random order. Words already solved (per list, tracked in `localStorage`) are skipped until every word in the list is solved, then progress resets and the list starts over.

## Random Words mode

- Bundled `words.json`: ~300 common English nouns, each with:
  - `en` — the English word (single word, letters A–Z only)
  - `sv` — Swedish translation
  - `def` — one-line, kid-friendly English definition
  - `level` — 1 (easy), 2 (medium), 3 (hard), assigned by word length and familiarity
- Difficulty picker (Easy / Medium / Hard / Mixed) before playing.
- Recently used words avoided via `localStorage` until the pool for the chosen difficulty runs dry, then the history resets (same pattern as the imposter game).

## Gameplay screen

- Clue shown at top (per clue mode).
- Word rendered as blanks; correctly guessed letters fill in.
- On-screen A–Z keyboard with big touch targets (native mobile keyboard never opens). Guessed letters are disabled and colored right/wrong.
- **8 wrong guesses** allowed. A simple inline SVG hangman drawing builds up one part per wrong guess (gallows base, post, beam, rope, head, body, arms, legs — grouped to total 8 steps).
- **Win:** word completed → celebration state, show the word with its Swedish translation and/or definition (whatever data exists).
- **Lose:** 8th wrong guess → reveal the word, also with Swedish/definition.
- Both end states: "Next word" button; running per-session score (words solved + current streak). Score resets when the app reloads; nothing is sent anywhere.

## Architecture

| File | Responsibility |
|---|---|
| `index.html` | All screens as sections; app shell |
| `style.css` | Mobile-first styling, large touch targets |
| `game.js` | Pure logic: game state, guess handling, win/lose, word selection (recent-avoidance, list progress), no DOM |
| `app.js` | DOM wiring, screen navigation, `localStorage` persistence, rendering |
| `words.json` | Bundled random-mode word list |
| `manifest.json`, `sw.js`, `icons/` | PWA install + offline |
| `tests/` | Node built-in test runner tests for `game.js` |
| `tools/validate-words.js` | Sanity-check `words.json` (shape, A–Z only, levels, duplicates) |

## localStorage keys

- `hangman.clueMode` — chosen clue mode
- `hangman.lists` — custom lists (array of `{id, name, words: [{en, sv?, hint?}]}`)
- `hangman.listProgress` — solved-word tracking per list
- `hangman.recentWords` — recently used random-mode words
- `hangman.difficulty` — last chosen difficulty

All reads wrapped in try/catch with sane defaults.

## Error handling

- Corrupt/missing `localStorage` data → treated as empty, app still works.
- Custom word input normalized (trim, uppercase for play, reject non A–Z characters with a friendly message).
- `words.json` fetch failure (shouldn't happen offline thanks to service worker) → error message with retry.

## Testing

- `npm test` runs Node built-in test runner against `game.js`: guess handling (right/wrong/repeat), win/lose detection, wrong-guess counting, word selection respecting recent-history and list progress, clue-mode fallback.
- `node tools/validate-words.js` validates the bundled word list.

## Out of scope (YAGNI)

- Accounts, sync, server anything.
- Sound effects / speech synthesis.
- Multiple player profiles.
- Swedish UI localization (UI is in English; only clues are Swedish).
