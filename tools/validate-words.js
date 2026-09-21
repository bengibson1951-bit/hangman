// Sanity-check words.json. Run: node tools/validate-words.js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = fileURLToPath(new URL("../words.json", import.meta.url));
const { words } = JSON.parse(readFileSync(path, "utf8"));

const errors = [];
const seen = new Set();
const perLevel = { 1: 0, 2: 0, 3: 0 };

if (!Array.isArray(words) || words.length < 250) {
  errors.push(`need at least 250 words, got ${words?.length ?? 0}`);
}

for (const w of words ?? []) {
  const id = w.en ?? JSON.stringify(w);
  if (!/^[A-Z]{2,}$/.test(w.en ?? "")) errors.push(`${id}: en must be A-Z only, uppercase`);
  if (typeof w.sv !== "string" || !w.sv.trim()) errors.push(`${id}: missing sv`);
  if (typeof w.def !== "string" || !w.def.trim()) errors.push(`${id}: missing def`);
  if (![1, 2, 3].includes(w.level)) errors.push(`${id}: level must be 1-3`);
  else perLevel[w.level]++;
  if (seen.has(w.en)) errors.push(`${id}: duplicate`);
  seen.add(w.en);
  if (w.def && w.en && w.def.toUpperCase().includes(w.en)) {
    errors.push(`${id}: definition contains the word itself`);
  }
}

for (const level of [1, 2, 3]) {
  if (perLevel[level] < 60) errors.push(`level ${level}: only ${perLevel[level]} words, need 60+`);
}

console.log(`words: ${words?.length ?? 0}  level1: ${perLevel[1]}  level2: ${perLevel[2]}  level3: ${perLevel[3]}`);
if (errors.length) {
  for (const e of errors) console.error("ERROR:", e);
  process.exit(1);
}
console.log("OK");
