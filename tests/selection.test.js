import { test } from "node:test";
import assert from "node:assert/strict";
import { pickWord, pickFromList, resolveClue, filterByLevel } from "../game.js";

const pool = [
  { en: "DOG", sv: "hund", def: "Barks.", level: 1 },
  { en: "CAT", sv: "katt", def: "Meows.", level: 1 },
  { en: "HORSE", sv: "häst", def: "Neighs.", level: 2 },
];
const first = () => 0; // rng that always picks the first candidate

test("pickWord avoids recent words", () => {
  const entry = pickWord(pool, ["DOG"], first);
  assert.equal(entry.en, "CAT");
});

test("pickWord ignores history when everything is recent", () => {
  const entry = pickWord(pool, ["DOG", "CAT", "HORSE"], first);
  assert.equal(entry.en, "DOG");
});

test("pickFromList skips solved words", () => {
  const { entry, reset } = pickFromList(pool, ["DOG"], first);
  assert.equal(entry.en, "CAT");
  assert.equal(reset, false);
});

test("pickFromList resets when all words are solved", () => {
  const { entry, reset } = pickFromList(pool, ["DOG", "CAT", "HORSE"], first);
  assert.equal(entry.en, "DOG");
  assert.equal(reset, true);
});

test("resolveClue returns swedish text in sv mode", () => {
  assert.deepEqual(resolveClue(pool[0], "sv"), { mode: "sv", text: "hund" });
});

test("resolveClue uses def or hint in def mode", () => {
  assert.deepEqual(resolveClue(pool[0], "def"), { mode: "def", text: "Barks." });
  assert.deepEqual(resolveClue({ en: "DOG", hint: "Barks a lot." }, "def"), {
    mode: "def",
    text: "Barks a lot.",
  });
});

test("resolveClue falls back to classic when data is missing", () => {
  assert.deepEqual(resolveClue({ en: "DOG" }, "sv"), { mode: "classic", text: "" });
  assert.deepEqual(resolveClue({ en: "DOG" }, "def"), { mode: "classic", text: "" });
});

test("resolveClue classic mode is always classic", () => {
  assert.deepEqual(resolveClue(pool[0], "classic"), { mode: "classic", text: "" });
});

test("filterByLevel maps difficulties to levels, mixed keeps all", () => {
  assert.deepEqual(filterByLevel(pool, "easy").map((w) => w.en), ["DOG", "CAT"]);
  assert.deepEqual(filterByLevel(pool, "medium").map((w) => w.en), ["HORSE"]);
  assert.deepEqual(filterByLevel(pool, "hard"), []);
  assert.equal(filterByLevel(pool, "mixed").length, 3);
});
