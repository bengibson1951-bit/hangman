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
