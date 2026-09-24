# "In Order" Spelling Mode — Design

**Date:** 2026-09-24
**Purpose:** A second play style for the Hangman Spelling app where letters must be tapped in the word's order, so spelling is practised for real. Survival-run scoring with a saved best.

## Play-style toggle

New segmented control on the home screen next to the clue picker — **How to play:**

- 🎲 **Any order** — the existing hangman game, unchanged (8 wrong guesses, letters in any order).
- ✍️ **In order — 3 lives** — the new mode.

Persisted as `hangman.playStyle` (`"any"` default, `"order"`). Applies to both game modes (My Words, Random Words) and combines freely with all three clue modes.

## In-order gameplay

- Blanks fill strictly left to right. The next empty blank is visually highlighted (bouncing marker).
- Tapping the correct next letter fills the blank. Tapping any other letter: the word row shakes, the tapped key flashes red, and one of **3 hearts** breaks.
- Keyboard keys are never disabled or greyed out (repeat letters like BALLOON's L/O must stay tappable).
- Hearts display replaces the ❤️ 8 counter: ❤️❤️❤️, breaking to 💔 as lives are lost.
- The hangman figure builds in 3 chunks instead of 8 (parts grouped ~3 per wrong guess) so the drawing still completes on the 3rd mistake.
- Word completed → same win celebration as classic; hearts refill to 3 for the next word.
- 3rd mistake on a word → word revealed, **run ends**.

## Run scoring

- A run starts when she enters play in in-order mode and counts words completed this run (shown in the play header as 📝 n alongside the session stars).
- Run ends on a failed word (or quitting resets the current run counter).
- Run-over screen: "You spelled N words!" plus the revealed word and its clue info, with **Best: M** from `hangman.orderBest` (single global number). New best → extra celebration ("New record! 🏆") and the stored best updates.
- Best score is shown on the home screen under the play-style toggle when > 0.
- "Next word ▶" after a failed word starts a fresh run (score back to 0).

## Interactions with existing features

- Clue modes work identically (Swedish / definition / classic fallback).
- List progress: a word completed in-order still marks it solved in `hangman.listProgress`; a failed word does not. List-complete reset behaviour unchanged.
- Random-mode recent-word avoidance unchanged.
- Session star/streak counters keep working in both styles.

## Logic (game.js, pure + tested)

- `createOrderGame(word)` → `{ word, pos: 0, lives: 3, status: "playing" }`
- `guessOrdered(state, letter)` → new state: correct next letter advances `pos` (win at end of word); wrong letter decrements `lives` (lost at 0); no-ops after the game ends. Case-insensitive.
- `ORDER_LIVES = 3` exported.

## Out of scope (YAGNI)

- Per-difficulty or per-list best scores (one global best).
- Shared/global leaderboards, timers, hints during a word.
