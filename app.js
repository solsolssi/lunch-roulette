const CATEGORIES = {
  korean: "한식",
  chinese: "중식",
  japanese: "일식",
  western: "양식",
  snack: "분식",
};

const DEFAULT_MENUS = [
  ["김치찌개", "korean"], ["제육볶음", "korean"], ["비빔밥", "korean"], ["국밥", "korean"], ["냉면", "korean"],
  ["짜장면", "chinese"], ["짬뽕", "chinese"], ["마라탕", "chinese"], ["볶음밥", "chinese"],
  ["돈까스", "japanese"], ["초밥", "japanese"], ["라멘", "japanese"], ["우동", "japanese"],
  ["파스타", "western"], ["햄버거", "western"], ["피자", "western"], ["샐러드", "western"],
  ["떡볶이", "snack"], ["김밥", "snack"], ["라면", "snack"],
].map(([name, cat]) => ({ name, cat }));

const COLORS = [
  "#e8573f", "#f2a541", "#d9a520", "#7bc47f", "#3caea3",
  "#4a90d9", "#7a6ad8", "#d76bb0", "#ef8a62", "#9ccc65",
];

const STORAGE_KEY = "lunch-roulette-v2";
const MAX_HISTORY = 5;

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin");
const resultEl = document.getElementById("result");
const resultName = document.getElementById("result-name");
const resultLabel = document.getElementById("result-label");
const listEl = document.getElementById("menu-list");
const countEl = document.getElementById("count");
const historyEl = document.getElementById("history-list");
const filterEl = document.getElementById("filters");
const addForm = document.getElementById("add-form");
const addInput = document.getElementById("add-input");
const addCat = document.getElementById("add-cat");

let state = load();
let rotation = 0; // radians, wheel rotation
let spinning = false;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.menus)) {
      return { menus: saved.menus, history: saved.history || [], filter: saved.filter || "all" };
    }
  } catch {}
  return { menus: DEFAULT_MENUS.map((m) => ({ ...m })), history: [], filter: "all" };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// Menus currently on the wheel, after the category filter.
function visibleMenus() {
  if (state.filter === "all") return state.menus;
  return state.menus.filter((m) => m.cat === state.filter);
}

function colorAt(i, n) {
  // Avoid the first and last slice sharing a color when wrapping around.
  if (n > 1 && i === n - 1 && n % COLORS.length === 1) return COLORS[1];
  return COLORS[i % COLORS.length];
}

function drawWheel() {
  const size = canvas.width;
  const r = size / 2;
  const menus = visibleMenus();
  const n = menus.length;
  ctx.clearRect(0, 0, size, size);

  if (n === 0) {
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#666";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("메뉴를 추가하세요", r, r + r * 0.55);
    return;
  }

  const slice = (Math.PI * 2) / n;
  ctx.save();
  ctx.translate(r, r);
  ctx.rotate(rotation);

  for (let i = 0; i < n; i++) {
    // Slice 0 starts at the top (-90deg) and runs clockwise.
    const start = -Math.PI / 2 + i * slice;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colorAt(i, n);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    const fontSize = Math.max(16, Math.min(34, 280 / n + 10));
    ctx.font = `bold ${fontSize}px -apple-system, "Apple SD Gothic Neo", sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 4;
    ctx.fillText(menus[i].name, r - 22, 0, r * 0.62);
    ctx.restore();
  }
  ctx.restore();
}

function indexAtPointer(n) {
  const slice = (Math.PI * 2) / n;
  // Pointer sits at the top; find which slice is under it after rotation.
  const a = ((-rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(a / slice) % n;
}

function spin() {
  const menus = visibleMenus();
  const n = menus.length;
  if (spinning) return;
  if (n < 2) {
    showMessage("메뉴를 2개 이상 넣어주세요");
    return;
  }
  spinning = true;
  spinBtn.disabled = true;
  resultEl.classList.remove("pop", "picked");
  resultLabel.textContent = "두근두근…";
  hideNearby();
  resultName.textContent = "?";

  const slice = (Math.PI * 2) / n;
  const target = Math.floor(Math.random() * n);
  // Land somewhere inside the target slice, not on its edge.
  const offset = slice * (0.15 + Math.random() * 0.7);
  const targetAngle = -(target * slice + offset);
  const current = rotation % (Math.PI * 2);
  let delta = targetAngle - current;
  delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const turns = 5 + Math.floor(Math.random() * 3);
  const startRot = rotation;
  const total = delta + turns * Math.PI * 2;
  const duration = 4200 + Math.random() * 800;
  const t0 = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    rotation = startRot + total * eased;
    drawWheel();
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      spinning = false;
      spinBtn.disabled = false;
      const picked = menus[indexAtPointer(n)];
      showPick(picked);
      addHistory(picked);
    }
  }
  requestAnimationFrame(frame);
}

function showPick(menu) {
  resultLabel.textContent = `오늘 점심은 · ${CATEGORIES[menu.cat]}`;
  resultName.textContent = `${menu.name} 🎉`;
  resultEl.classList.add("picked");
  void resultEl.offsetWidth; // restart animation
  resultEl.classList.add("pop");
  showNearby(menu.name);
}

function showMessage(text) {
  resultEl.classList.remove("pop", "picked");
  resultLabel.textContent = text;
  resultName.textContent = "";
}

function addHistory(menu) {
  const time = new Date().toLocaleString("ko-KR", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  state.history.unshift({ menu: menu.name, time });
  state.history = state.history.slice(0, MAX_HISTORY);
  save();
  renderHistory();
}

function renderFilters() {
  for (const btn of filterEl.querySelectorAll("[data-filter]")) {
    const active = btn.dataset.filter === state.filter;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active);
  }
}

function renderList() {
  const menus = visibleMenus();
  listEl.innerHTML = "";
  menus.forEach((m, i) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = colorAt(i, menus.length);
    const label = document.createElement("span");
    label.textContent = m.name;
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "×";
    del.setAttribute("aria-label", `${m.name} 삭제`);
    del.addEventListener("click", () => removeMenu(m));
    li.append(dot, label, del);
    listEl.append(li);
  });
  const scope = state.filter === "all" ? "전체" : CATEGORIES[state.filter];
  countEl.textContent = `${scope} 메뉴 ${menus.length}개`;
}

function renderHistory() {
  historyEl.innerHTML = "";
  if (state.history.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "아직 결과가 없어요.";
    historyEl.append(li);
    return;
  }
  for (const h of state.history) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = h.menu;
    li.append(name, ` · ${h.time}`);
    historyEl.append(li);
  }
}

function render() {
  drawWheel();
  renderFilters();
  renderList();
  renderHistory();
}

function update(changes) {
  if (spinning) return;
  Object.assign(state, changes);
  save();
  render();
}

function removeMenu(menu) {
  update({ menus: state.menus.filter((m) => m !== menu) });
}

filterEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  update({ filter: btn.dataset.filter });
  // Default new menus to the category being viewed.
  if (state.filter !== "all") addCat.value = state.filter;
});

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = addInput.value.trim();
  if (!name) return;
  if (state.menus.some((m) => m.name === name)) {
    showMessage(`'${name}'는 이미 있어요`);
  } else {
    const cat = addCat.value;
    // Switch to a view where the new menu is visible.
    const filter = state.filter === "all" || state.filter === cat ? state.filter : cat;
    update({ menus: [...state.menus, { name, cat }], filter });
  }
  addInput.value = "";
  addInput.focus();
});

document.getElementById("reset").addEventListener("click", () => {
  if (confirm("기본 메뉴로 되돌릴까요? 추가한 메뉴는 사라져요.")) {
    update({ menus: DEFAULT_MENUS.map((m) => ({ ...m })), filter: "all" });
  }
});

spinBtn.addEventListener("click", spin);

render();
