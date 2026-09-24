import { test } from "node:test";
import assert from "node:assert/strict";
import { ORDER_LIVES, createOrderGame, guessOrdered } from "../game.js";

test("createOrderGame uppercases and starts at position 0 with full lives", () => {
  const g = createOrderGame("dog");
  assert.deepEqual(g, { word: "DOG", pos: 0, lives: ORDER_LIVES, status: "playing" });
  assert.equal(ORDER_LIVES, 5);
});

test("correct next letter advances position", () => {
  let g = createOrderGame("dog");
  g = guessOrdered(g, "d");
  assert.equal(g.pos, 1);
  assert.equal(g.lives, ORDER_LIVES);
  assert.equal(g.status, "playing");
});

test("wrong letter costs a life without advancing", () => {
  let g = createOrderGame("dog");
  g = guessOrdered(g, "o");
  assert.equal(g.pos, 0);
  assert.equal(g.lives, ORDER_LIVES - 1);
});

test("repeat letters work in sequence (BALL)", () => {
  let g = createOrderGame("ball");
  for (const l of ["b", "a", "l", "l"]) g = guessOrdered(g, l);
  assert.equal(g.status, "won");
});

test("losing every life loses the game", () => {
  let g = createOrderGame("dog");
  for (let i = 0; i < ORDER_LIVES; i++) g = guessOrdered(g, "x");
  assert.equal(g.status, "lost");
  assert.equal(g.lives, 0);
});

test("guesses after game over are no-ops", () => {
  let g = createOrderGame("dog");
  for (let i = 0; i < ORDER_LIVES; i++) g = guessOrdered(g, "x");
  const after = guessOrdered(g, "d");
  assert.deepEqual(after, g);
});
