// DOM wiring + localStorage. All game rules live in game.js.
import {
  MAX_WRONG, createGame, guessLetter, revealed,
  ORDER_LIVES, createOrderGame, guessOrdered,
  pickWord, pickFromList, resolveClue, filterByLevel,
} from "./game.js";

const $ = (id) => document.getElementById(id);

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// --- Navigation ---
function show(name) {
  document.querySelectorAll("[data-screen]").forEach((s) => {
    s.classList.toggle("active", s.dataset.screen === name);
  });
  window.scrollTo(0, 0);
}
document.querySelectorAll(".back-btn[data-back]").forEach((b) => {
  b.addEventListener("click", () => {
    if (b.dataset.back === "lists") renderLists();
    show(b.dataset.back);
  });
});

// --- Toast ---
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// --- Clue mode ---
let clueMode = load("hangman.clueMode", "sv");
function renderClueMode() {
  $("clue-mode").querySelectorAll("button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.mode === clueMode);
  });
}
$("clue-mode").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  clueMode = b.dataset.mode;
  save("hangman.clueMode", clueMode);
  renderClueMode();
});
renderClueMode();

// --- Play style ---
let playStyle = load("hangman.playStyle", "any");
function renderPlayStyle() {
  $("play-style").querySelectorAll("button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.style === playStyle);
  });
}
$("play-style").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  playStyle = b.dataset.style;
  save("hangman.playStyle", playStyle);
  renderPlayStyle();
});
renderPlayStyle();

function renderBestLine() {
  const best = load("hangman.orderBest", 0);
  const el = $("best-line");
  el.hidden = best <= 0;
  el.textContent = `🏆 Best in-order run: ${best} ${best === 1 ? "word" : "words"}`;
}
renderBestLine();

// --- Session score ---
const score = { solved: 0, streak: 0 };
let runCount = 0; // words completed in the current in-order run
function renderScore() {
  const run = playStyle === "order" ? `📝 ${runCount} &nbsp; ` : "";
  $("score").innerHTML = `${run}⭐ ${score.solved} &nbsp; 🔥 ${score.streak}`;
}

// --- Gameplay ---
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WIN_EMOJI = ["🎉", "🌟", "🦄", "🏆", "🎈", "🍭"];
let game = null;
let currentEntry = null;
let nextFn = null;
let onSolved = null;
let quitTo = "home";

function startRound(entry, next, solvedCb, backTo) {
  currentEntry = entry;
  nextFn = next;
  onSolved = solvedCb;
  quitTo = backTo;
  game = playStyle === "order" ? createOrderGame(entry.en) : createGame(entry.en);

  const clue = resolveClue(entry, clueMode);
  const banner = $("clue-banner");
  if (clue.mode === "sv") {
    banner.innerHTML = `<div><span class="clue-label">🇸🇪 På svenska:</span><b>${esc(clue.text)}</b></div>`;
  } else if (clue.mode === "def") {
    banner.innerHTML = `<div><span class="clue-label">💡 Clue:</span>${esc(clue.text)}</div>`;
  } else {
    banner.innerHTML = `<div>🙈 Mystery word — good luck!</div>`;
  }

  $("gallows").classList.remove("lost");
  $("end-banner").hidden = true;
  $("end-banner").classList.remove("win", "lose");
  $("end-banner").querySelectorAll(".confetti").forEach((c) => c.remove());
  $("keyboard").hidden = false;

  buildKeyboard();
  renderScore();
  renderRound();
  show("play");
}

function buildKeyboard() {
  const kb = $("keyboard");
  kb.innerHTML = "";
  for (const l of LETTERS) {
    const b = document.createElement("button");
    b.textContent = l;
    b.dataset.letter = l;
    b.addEventListener("click", () => {
      if (playStyle === "order") {
        const before = game.lives;
        game = guessOrdered(game, l);
        if (game.lives < before) {
          b.classList.add("flash");
          setTimeout(() => b.classList.remove("flash"), 400);
          const wb = $("word-blanks");
          wb.classList.remove("shake");
          void wb.offsetWidth; // restart the animation
          wb.classList.add("shake");
        }
      } else {
        game = guessLetter(game, l);
      }
      renderRound();
    });
    kb.appendChild(b);
  }
}

function renderRound() {
  const order = playStyle === "order";

  // Word blanks
  const blanks = $("word-blanks");
  blanks.innerHTML = "";
  const letters = order
    ? [...game.word].map((c, i) => (i < game.pos ? c : "_"))
    : revealed(game);
  letters.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "blank" + (c === "_" ? "" : " filled");
    if (order && i === game.pos && game.status === "playing") d.classList.add("next");
    d.textContent = c === "_" ? "" : c;
    blanks.appendChild(d);
  });

  // Keyboard states (any-order only; in-order keys stay live for repeat letters)
  if (!order) {
    $("keyboard").querySelectorAll("button").forEach((b) => {
      const l = b.dataset.letter;
      if (game.guessed.includes(l)) {
        b.disabled = true;
        b.classList.add(game.word.includes(l) ? "hit" : "miss");
      }
    });
  }

  // Figure + lives
  const parts = $("gallows").querySelectorAll(".part");
  const wrongParts = order
    ? Math.ceil((8 * (ORDER_LIVES - game.lives)) / ORDER_LIVES)
    : game.wrongCount;
  parts.forEach((p, i) => p.classList.toggle("shown", i < wrongParts));
  $("wrong-left").textContent = order
    ? "❤️".repeat(game.lives) + "💔".repeat(ORDER_LIVES - game.lives)
    : "❤️ " + (MAX_WRONG - game.wrongCount);

  if (game.status !== "playing") endRound();
}

function endRound() {
  const banner = $("end-banner");
  const won = game.status === "won";
  banner.hidden = false;
  banner.classList.add(won ? "win" : "lose");
  $("keyboard").hidden = true;

  const order = playStyle === "order";
  $("end-emoji").textContent = won
    ? WIN_EMOJI[Math.floor(Math.random() * WIN_EMOJI.length)]
    : "💙";
  $("end-title").textContent = won ? "You did it!" : order ? "Run over!" : "Ohh, so close!";
  $("end-word").textContent = currentEntry.en;

  const extras = [];
  if (order && won) runCount += 1;
  if (order && !won) {
    const best = load("hangman.orderBest", 0);
    let runMsg = `You spelled ${runCount} ${runCount === 1 ? "word" : "words"} this run!`;
    if (runCount > best) {
      save("hangman.orderBest", runCount);
      renderBestLine();
      runMsg += " New record! 🏆";
    } else if (best > 0) {
      runMsg += ` 🏆 Best: ${best}`;
    }
    extras.push(runMsg);
    runCount = 0; // next word starts a fresh run
  }
  if (currentEntry.sv) extras.push(`🇸🇪 ${currentEntry.sv}`);
  const def = currentEntry.def ?? currentEntry.hint;
  if (def) extras.push(def);
  $("end-extra").textContent = extras.join(" — ");

  if (won) {
    score.solved += 1;
    score.streak += 1;
    onSolved?.(currentEntry.en);
    for (let i = 0; i < 14; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.textContent = ["🎊", "✨", "⭐", "🎈"][i % 4];
      c.style.left = Math.random() * 90 + 5 + "%";
      c.style.animationDelay = Math.random() * 0.6 + "s";
      banner.appendChild(c);
    }
  } else {
    score.streak = 0;
    $("gallows").classList.add("lost");
  }
  renderScore();
}

$("btn-next").addEventListener("click", () => nextFn?.());
$("play-back").addEventListener("click", () => {
  runCount = 0; // quitting ends the in-order run
  if (quitTo === "lists") renderLists();
  show(quitTo);
});

$("word-blanks").addEventListener("animationend", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("shake");
});

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// --- Random Words mode ---
let wordsCache = null;
async function loadWords() {
  if (wordsCache) return wordsCache;
  const res = await fetch("words.json");
  if (!res.ok) throw new Error("HTTP " + res.status);
  wordsCache = (await res.json()).words;
  return wordsCache;
}

let retryFn = null;
function showError(msg, retry) {
  $("error-msg").textContent = msg;
  retryFn = retry;
  show("error");
}
$("btn-retry").addEventListener("click", () => retryFn?.());

$("btn-random").addEventListener("click", () => show("difficulty"));

$("difficulty-buttons").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-difficulty]");
  if (!b) return;
  save("hangman.difficulty", b.dataset.difficulty);
  runCount = 0; // entering play starts a fresh in-order run
  startRandom(b.dataset.difficulty);
});

async function startRandom(difficulty) {
  let words;
  try {
    words = await loadWords();
  } catch {
    showError("Could not load the words. Check your connection!", () => startRandom(difficulty));
    return;
  }
  const pool = filterByLevel(words, difficulty);
  let recent = load("hangman.recentWords", []);
  const entry = pickWord(pool, recent);
  recent = recent.filter((en) => en !== entry.en);
  recent.push(entry.en);
  if (recent.length >= pool.length) recent = [entry.en];
  save("hangman.recentWords", recent);
  startRound(entry, () => startRandom(difficulty), null, "home");
}

// --- My Words mode ---
const loadLists = () => load("hangman.lists", []);
const loadProgress = () => load("hangman.listProgress", {});
let currentListId = null;

$("btn-my-words").addEventListener("click", () => {
  renderLists();
  show("lists");
});

function renderLists() {
  const lists = loadLists();
  const progress = loadProgress();
  const container = $("lists-container");
  container.innerHTML = "";
  $("lists-empty").hidden = lists.length > 0;
  for (const list of lists) {
    const solved = (progress[list.id] ?? []).length;
    const row = document.createElement("div");
    row.className = "list-row";

    const info = document.createElement("div");
    info.className = "list-info";
    info.innerHTML = `<div class="list-name">${esc(list.name)}</div>
      <div class="list-progress">${list.words.length} words · ${solved}/${list.words.length} solved ⭐</div>`;
    info.addEventListener("click", () => {
      runCount = 0; // entering play starts a fresh in-order run
      playList(list.id);
    });

    const edit = document.createElement("button");
    edit.className = "icon-btn";
    edit.textContent = "✏️";
    edit.setAttribute("aria-label", "Edit " + list.name);
    edit.addEventListener("click", () => openEditor(list.id));

    row.append(info, edit);
    container.appendChild(row);
  }
}

$("btn-new-list").addEventListener("click", () => {
  const lists = loadLists();
  const list = { id: "l" + Date.now(), name: "New list", words: [] };
  lists.push(list);
  save("hangman.lists", lists);
  openEditor(list.id);
});

function openEditor(id) {
  currentListId = id;
  const list = loadLists().find((l) => l.id === id);
  if (!list) return;
  $("list-name").value = list.name;
  $("word-error").hidden = true;
  renderWordRows();
  show("edit-list");
}

function updateList(id, fn) {
  const lists = loadLists();
  const list = lists.find((l) => l.id === id);
  if (!list) return;
  fn(list);
  save("hangman.lists", lists);
}

$("list-name").addEventListener("input", () => {
  const name = $("list-name").value.trim() || "New list";
  updateList(currentListId, (l) => { l.name = name; });
});

function renderWordRows() {
  const list = loadLists().find((l) => l.id === currentListId);
  const rows = $("word-rows");
  rows.innerHTML = "";
  for (const [i, w] of (list?.words ?? []).entries()) {
    const row = document.createElement("div");
    row.className = "word-row";
    const extra = [w.sv && "🇸🇪 " + w.sv, w.hint && "💡 " + w.hint].filter(Boolean).join(" · ");
    row.innerHTML = `<span class="w-en">${esc(w.en)}</span><span class="w-extra">${esc(extra)}</span>`;
    const del = document.createElement("button");
    del.className = "icon-btn";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Remove " + w.en);
    del.addEventListener("click", () => {
      updateList(currentListId, (l) => l.words.splice(i, 1));
      renderWordRows();
    });
    row.appendChild(del);
    rows.appendChild(row);
  }
}

$("add-word-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("word-error");
  const en = $("new-en").value.trim();
  if (!/^[a-zA-Z]+$/.test(en)) {
    err.textContent = "Words can only use the letters A to Z (no spaces).";
    err.hidden = false;
    return;
  }
  const upper = en.toUpperCase();
  const list = loadLists().find((l) => l.id === currentListId);
  if (list?.words.some((w) => w.en === upper)) {
    err.textContent = `${upper} is already in this list!`;
    err.hidden = false;
    return;
  }
  err.hidden = true;
  const sv = $("new-sv").value.trim();
  const hint = $("new-hint").value.trim();
  const word = { en: upper };
  if (sv) word.sv = sv;
  if (hint) word.hint = hint;
  updateList(currentListId, (l) => l.words.push(word));
  $("new-en").value = "";
  $("new-sv").value = "";
  $("new-hint").value = "";
  $("new-en").focus();
  renderWordRows();
});

$("btn-delete-list").addEventListener("click", () => {
  const list = loadLists().find((l) => l.id === currentListId);
  if (!list) return;
  if (!window.confirm(`Delete "${list.name}" and all its words?`)) return;
  save("hangman.lists", loadLists().filter((l) => l.id !== currentListId));
  const progress = loadProgress();
  delete progress[currentListId];
  save("hangman.listProgress", progress);
  renderLists();
  show("lists");
});

function playList(id) {
  const list = loadLists().find((l) => l.id === id);
  if (!list) return;
  if (list.words.length === 0) {
    toast("Add some words to this list first! ✏️");
    openEditor(id);
    return;
  }
  const progress = loadProgress();
  const solved = progress[id] ?? [];
  const { entry, reset } = pickFromList(list.words, solved);
  if (reset && solved.length > 0) {
    progress[id] = [];
    save("hangman.listProgress", progress);
    toast("List complete! 🏆 Starting over.");
  }
  startRound(entry, () => playList(id), (en) => {
    const p = loadProgress();
    p[id] = [...(p[id] ?? []), en];
    save("hangman.listProgress", p);
  }, "lists");
}

// --- Home buttons already wired above; service worker (added in PWA task) ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
