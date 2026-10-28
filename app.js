const PRESETS = {
  korean: ["김치찌개", "된장찌개", "제육볶음", "비빔밥", "순대국", "냉면", "갈비탕", "부대찌개"],
  chinese: ["짜장면", "짬뽕", "탕수육", "마라탕", "볶음밥"],
  japanese: ["돈까스", "초밥", "라멘", "우동", "규동"],
  western: ["파스타", "햄버거", "피자", "샐러드", "샌드위치"],
  snack: ["떡볶이", "김밥", "라면", "순대", "쫄면"],
};
PRESETS.all = [
  "김치찌개", "제육볶음", "비빔밥", "짜장면", "짬뽕",
  "돈까스", "초밥", "파스타", "햄버거", "떡볶이", "쌀국수", "국밥",
];

const COLORS = [
  "#e8573f", "#f2a541", "#f6d55c", "#7bc47f", "#3caea3",
  "#4a90d9", "#7a6ad8", "#d76bb0", "#ef8a62", "#9ccc65",
];

const STORAGE_KEY = "lunch-roulette";
const MAX_HISTORY = 5;

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin");
const resultEl = document.getElementById("result");
const listEl = document.getElementById("menu-list");
const countEl = document.getElementById("count");
const historyEl = document.getElementById("history-list");
const addForm = document.getElementById("add-form");
const addInput = document.getElementById("add-input");

let state = load();
let rotation = 0; // radians, wheel rotation
let spinning = false;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.menus)) {
      return { menus: saved.menus, history: saved.history || [] };
    }
  } catch {}
  return { menus: [...PRESETS.all], history: [] };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function colorAt(i, n) {
  // Avoid the first and last slice sharing a color when wrapping around.
  if (n > 1 && i === n - 1 && n % COLORS.length === 1) return COLORS[1];
  return COLORS[i % COLORS.length];
}

function drawWheel() {
  const size = canvas.width;
  const r = size / 2;
  const menus = state.menus;
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
    ctx.fillText(menus[i], r - 22, 0, r * 0.62);
    ctx.restore();
  }
  ctx.restore();
}

function indexAtPointer() {
  const n = state.menus.length;
  const slice = (Math.PI * 2) / n;
  // Pointer sits at the top; find which slice is under it after rotation.
  const a = ((-rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(a / slice) % n;
}

function spin() {
  const n = state.menus.length;
  if (spinning || n < 2) {
    if (n < 2) showResult("메뉴를 2개 이상 넣어주세요", false);
    return;
  }
  spinning = true;
  spinBtn.disabled = true;
  resultEl.classList.remove("pop");
  resultEl.innerHTML = "&nbsp;";

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
      const picked = state.menus[indexAtPointer()];
      showResult(`오늘 점심은 ${picked}! 🎉`, true);
      addHistory(picked);
    }
  }
  requestAnimationFrame(frame);
}

function showResult(text, celebrate) {
  resultEl.textContent = text;
  if (celebrate) {
    void resultEl.offsetWidth; // restart animation
    resultEl.classList.add("pop");
  }
}

function addHistory(menu) {
  const time = new Date().toLocaleString("ko-KR", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  state.history.unshift({ menu, time });
  state.history = state.history.slice(0, MAX_HISTORY);
  save();
  renderHistory();
}

function renderList() {
  listEl.innerHTML = "";
  state.menus.forEach((m, i) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = colorAt(i, state.menus.length);
    const label = document.createElement("span");
    label.textContent = m;
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "×";
    del.setAttribute("aria-label", `${m} 삭제`);
    del.addEventListener("click", () => removeMenu(i));
    li.append(dot, label, del);
    listEl.append(li);
  });
  countEl.textContent = `메뉴 ${state.menus.length}개`;
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
  renderList();
  renderHistory();
}

function setMenus(menus) {
  if (spinning) return;
  state.menus = menus;
  save();
  render();
}

function removeMenu(i) {
  setMenus(state.menus.filter((_, j) => j !== i));
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = addInput.value.trim();
  if (!value) return;
  if (state.menus.includes(value)) {
    showResult(`'${value}'는 이미 있어요`, false);
  } else {
    setMenus([...state.menus, value]);
  }
  addInput.value = "";
  addInput.focus();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => setMenus([...PRESETS[btn.dataset.preset]]));
});

document.getElementById("clear").addEventListener("click", () => {
  if (confirm("메뉴를 모두 지울까요?")) setMenus([]);
});

spinBtn.addEventListener("click", spin);

render();
