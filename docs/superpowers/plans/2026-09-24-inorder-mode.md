# In-Order Spelling Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "In order — 3 lives" play style to the Hangman Spelling app: letters must be tapped left to right, 3 hearts per word, survival-run scoring with a saved best.

**Architecture:** New pure functions in `game.js` (`createOrderGame`, `guessOrdered`, `ORDER_LIVES`) with node:test coverage; `app.js` branches on a persisted `hangman.playStyle` inside the existing `startRound`/render flow; home screen gains a second segmented control + best-score line.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules), node:test. No new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-24-inorder-mode-design.md`.
- `hangman.playStyle`: `"any"` (default) | `"order"`. Best run stored as number in `hangman.orderBest`. All storage reads via existing `load(key, fallback)`.
- In-order: 3 lives per word (refill each word), keyboard keys never disabled, wrong tap shakes word + flashes key, figure builds in 3 chunks, run ends on failed word, quitting resets the run.
- Classic ("any") behaviour must remain byte-for-byte identical in feel: 8 wrong guesses, keys disable, hit/miss colors.
- Kid-friendly styling consistent with existing `style.css` tokens; commits end with the Claude Fable 5 co-author line.

---

### Task 1: Order-game logic in `game.js`

**Files:**
- Modify: `game.js`
- Test: `tests/order.test.js`

**Interfaces:**
- Produces: `ORDER_LIVES = 3`; `createOrderGame(word) -> { word, pos, lives, status }` (word uppercased, pos 0, lives 3, status "playing"); `guessOrdered(state, letter) -> state` (pure): correct next letter advances `pos` (status "won" when `pos === word.length`), wrong letter decrements `lives` (status "lost" at 0), case-insensitive, no-op after game over.

- [ ] **Step 1: Write failing tests** in `tests/order.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ORDER_LIVES, createOrderGame, guessOrdered } from "../game.js";

test("createOrderGame uppercases and starts at position 0 with 3 lives", () => {
  const g = createOrderGame("dog");
  assert.deepEqual(g, { word: "DOG", pos: 0, lives: ORDER_LIVES, status: "playing" });
});

test("correct next letter advances position", () => {
  let g = createOrderGame("dog");
  g = guessOrdered(g, "d");
  assert.equal(g.pos, 1);
  assert.equal(g.lives, 3);
});

test("wrong letter costs a life without advancing", () => {
  let g = createOrderGame("dog");
  g = guessOrdered(g, "o");
  assert.equal(g.pos, 0);
  assert.equal(g.lives, 2);
});

test("repeat letters work in sequence (BALL)", () => {
  let g = createOrderGame("ball");
  for (const l of ["b", "a", "l", "l"]) g = guessOrdered(g, l);
  assert.equal(g.status, "won");
});

test("third wrong letter loses", () => {
  let g = createOrderGame("dog");
  for (const l of ["x", "y", "z"]) g = guessOrdered(g, l);
  assert.equal(g.status, "lost");
  assert.equal(g.lives, 0);
});

test("guesses after game over are no-ops", () => {
  let g = createOrderGame("dog");
  for (const l of ["x", "y", "z"]) g = guessOrdered(g, l);
  const after = guessOrdered(g, "d");
  assert.deepEqual(after, g);
});
```

- [ ] **Step 2: Run `npm test`** — new file FAILS (missing exports).
- [ ] **Step 3: Implement** in `game.js`:

```js
export const ORDER_LIVES = 3;

export function createOrderGame(word) {
  return { word: word.toUpperCase(), pos: 0, lives: ORDER_LIVES, status: "playing" };
}

export function guessOrdered(state, letter) {
  if (state.status !== "playing") return state;
  const l = letter.toUpperCase();
  if (state.word[state.pos] === l) {
    const pos = state.pos + 1;
    return { ...state, pos, status: pos === state.word.length ? "won" : "playing" };
  }
  const lives = state.lives - 1;
  return { ...state, lives, status: lives === 0 ? "lost" : "playing" };
}
```

- [ ] **Step 4: Run `npm test`** — all pass (16 existing + 6 new).
- [ ] **Step 5: Commit** `feat: in-order game logic`.

### Task 2: Play-style toggle + full in-order UI in `app.js`/`index.html`/`style.css`

**Files:**
- Modify: `index.html` (home card + play header), `style.css`, `app.js`

**Interfaces:**
- Consumes: `createOrderGame`, `guessOrdered`, `ORDER_LIVES` from Task 1; existing `startRound`, `renderRound`, `endRound`, `load`/`save`.
- Produces: `hangman.playStyle` persisted toggle; run counter + `hangman.orderBest`.

- [ ] **Step 1: Home screen** — add to the clue card in `index.html` (below the clue segmented control):

```html
<h2 class="card-title" style="margin-top:14px">How do you want to play?</h2>
<div class="segmented" id="play-style">
  <button data-style="any">🎲<span>Any order</span></button>
  <button data-style="order">✍️<span>In order · 3 ❤️</span></button>
</div>
<p class="best-line" id="best-line" hidden></p>
```

Wire in `app.js` exactly like the clue-mode control (`playStyle` variable, `hangman.playStyle`, default `"any"`); `renderBestLine()` shows `🏆 Best in-order run: N words` when `load("hangman.orderBest", 0) > 0`, called on load and whenever returning home.

- [ ] **Step 2: startRound branches.** Add module state `let runCount = 0;`. In `startRound`, `game = playStyle === "order" ? createOrderGame(entry.en) : createGame(entry.en)`. Reset `runCount = 0` only when play is entered from a screen other than play itself — implement by resetting in the two entry points (`difficulty` click handler and `playList` when arriving from the lists screen) via a new `startRun()` helper that sets `runCount = 0` before the first `startRound` (subsequent "next word" rounds keep it). Quit button also sets `runCount = 0`.
- [ ] **Step 3: renderRound branches.**
  - Blanks: in order mode, filled = `game.word.slice(0, game.pos)`, the blank at index `game.pos` gets class `next` (bouncing marker via CSS `::after` with `▲` or animated border).
  - Keyboard: order mode never disables buttons and never applies hit/miss classes permanently; instead on a wrong guess add a temporary `flash` class to the pressed key (remove after 400ms) and `shake` to `#word-blanks` (remove on animationend).
  - Hearts: `#wrong-left` shows `"❤️".repeat(lives) + "💔".repeat(3 - lives)` in order mode; classic keeps `❤️ N`.
  - Figure: parts shown = `Math.ceil(8 * (ORDER_LIVES - game.lives) / ORDER_LIVES)` in order mode (0→0, 1→3, 2→6, 3→8).
  - Header score shows `📝 runCount` alongside ⭐/🔥 in order mode.
- [ ] **Step 4: endRound branches.** Win in order mode: `runCount++` before rendering (score/star logic unchanged, `onSolved` still fires). Loss in order mode: run over — title "Run over!", extra line prepends `You spelled ${runCount} ${runCount === 1 ? "word" : "words"} this run!` plus `New record! 🏆` (and save `hangman.orderBest`) when `runCount > best`, else `🏆 Best: ${best}`; then keep showing the failed word + its sv/def. `btn-next` after an order-mode loss starts a fresh run (`runCount = 0` — handled because `nextFn` re-enters via the same round loop, so reset `runCount` in `endRound` loss branch after composing the message).
- [ ] **Step 5: CSS** — `.blank.next` highlight (sky border + bounce animation), `.shake` keyframes on the blanks row, `.keyboard button.flash` (red background pulse), `.best-line` (small centered ink-soft text).

```css
.blank.next { border-bottom-color: var(--sunny); animation: nudge 1s ease-in-out infinite; }
@keyframes nudge { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.word-blanks.shake { animation: shake 0.4s ease; }
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
.keyboard button.flash { background: var(--wrong); color: #fff; }
.best-line { text-align: center; color: var(--ink-soft); font-size: 15px; margin: 10px 0 0; }
```

- [ ] **Step 6: Verify in preview** (mobile width): toggle persists; in-order round fills left to right with bouncing marker; wrong tap shakes + flashes + breaks a heart + draws 3 figure parts; BALL-style repeat letters typable; run counter increments across words; loss shows run-over with best; new best persists to home screen; classic mode unchanged.
- [ ] **Step 7: Commit** `feat: in-order spelling mode with 3-lives survival runs`.

### Task 3: Ship

**Files:**
- Modify: `sw.js` (CACHE → `hangman-v2`), `README.md` (mention the play-style toggle)

- [ ] **Step 1:** Bump `sw.js` CACHE to `"hangman-v2"`; add a README paragraph under Clue modes: the How-to-play toggle, 3 lives, run scoring, saved best.
- [ ] **Step 2:** `npm test` green; final preview smoke test of both play styles.
- [ ] **Step 3: Commit** `chore: bump cache for in-order mode release` and `git push`; poll the live URL and verify the toggle appears.
