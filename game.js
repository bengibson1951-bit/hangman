// Pure game logic — no DOM. Tested with node:test.

export const MAX_WRONG = 8;

export function createGame(word) {
  return {
    word: word.toUpperCase(),
    guessed: [],
    wrongCount: 0,
    status: "playing",
  };
}

export function guessLetter(state, letter) {
  const l = letter.toUpperCase();
  if (state.status !== "playing" || state.guessed.includes(l)) return state;
  const guessed = [...state.guessed, l];
  const wrongCount = state.wrongCount + (state.word.includes(l) ? 0 : 1);
  let status = "playing";
  if ([...state.word].every((c) => guessed.includes(c))) status = "won";
  else if (wrongCount >= MAX_WRONG) status = "lost";
  return { ...state, guessed, wrongCount, status };
}

export function revealed(state) {
  return [...state.word].map((c) => (state.guessed.includes(c) ? c : "_"));
}

// --- Word selection ---

export function pickWord(pool, recent, rng = Math.random) {
  let candidates = pool.filter((w) => !recent.includes(w.en));
  if (candidates.length === 0) candidates = pool;
  return candidates[Math.floor(rng() * candidates.length)];
}

export function pickFromList(words, solvedEns, rng = Math.random) {
  const unsolved = words.filter((w) => !solvedEns.includes(w.en));
  const reset = unsolved.length === 0;
  const candidates = reset ? words : unsolved;
  return { entry: candidates[Math.floor(rng() * candidates.length)], reset };
}

export function resolveClue(entry, mode) {
  if (mode === "sv" && entry.sv) return { mode: "sv", text: entry.sv };
  if (mode === "def") {
    const text = entry.def ?? entry.hint;
    if (text) return { mode: "def", text };
  }
  return { mode: "classic", text: "" };
}

const LEVELS = { easy: 1, medium: 2, hard: 3 };

export function filterByLevel(pool, difficulty) {
  const level = LEVELS[difficulty];
  return level ? pool.filter((w) => w.level === level) : pool;
}
