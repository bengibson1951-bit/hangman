import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_WRONG, createGame, guessLetter, revealed } from "../game.js";

test("createGame uppercases the word and starts playing", () => {
  const g = createGame("dog");
  assert.equal(g.word, "DOG");
  assert.equal(g.status, "playing");
  assert.equal(g.wrongCount, 0);
  assert.deepEqual(g.guessed, []);
});

test("correct guess fills letters without counting wrong", () => {
  let g = createGame("dog");
  g = guessLetter(g, "o");
  assert.deepEqual(g.guessed, ["O"]);
  assert.equal(g.wrongCount, 0);
  assert.equal(g.status, "playing");
});

test("wrong guess increments wrongCount", () => {
  let g = createGame("dog");
  g = guessLetter(g, "z");
  assert.equal(g.wrongCount, 1);
  assert.equal(g.status, "playing");
});

test("repeat guess is a no-op", () => {
  let g = createGame("dog");
  g = guessLetter(g, "z");
  const again = guessLetter(g, "Z");
  assert.deepEqual(again, g);
});

test("guessing every letter wins", () => {
  let g = createGame("dog");
  for (const l of ["d", "o", "g"]) g = guessLetter(g, l);
  assert.equal(g.status, "won");
});

test("8 wrong guesses loses and further guesses are no-ops", () => {
  let g = createGame("dog");
  for (const l of ["a", "b", "c", "e", "f", "h", "i", "j"]) g = guessLetter(g, l);
  assert.equal(g.wrongCount, MAX_WRONG);
  assert.equal(g.status, "lost");
  const after = guessLetter(g, "d");
  assert.deepEqual(after, g);
});

test("revealed masks unguessed letters", () => {
  let g = createGame("dog");
  g = guessLetter(g, "d");
  g = guessLetter(g, "g");
  assert.deepEqual(revealed(g), ["D", "_", "G"]);
});
