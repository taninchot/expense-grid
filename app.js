const STORAGE_KEY = "vexly_flow_data";
let subs = [];
let step = 1;

// prettier-ignore
const colors = [
  { id: "purple", bg: "#FAF5FF", accent: "#E9D5FF" },
  { id: "blue", bg: "#EFF6FF", accent: "#BFDBFE" },
  { id: "cyan", bg: "#ECFEFF", accent: "#A5F3FC" },
  { id: "green", bg: "#F0FDF4", accent: "#BBF7D0" },
  { id: "yellow", bg: "#FEFCE8", accent: "#FEF08A" },
  { id: "orange", bg: "#FFF7ED", accent: "#FED7AA" },
  { id: "pink", bg: "#FDF2F8", accent: "#FBCFE8" },
  { id: "rose", bg: "#FFF1F2", accent: "#FECDD3" },
  { id: "slate", bg: "#F8FAFC", accent: "#E2E8F0" },
  { id: "indigo", bg: "#EEF2FF", accent: "#C7D2FE" },
  { id: "teal", bg: "#F0FDFA", accent: "#99F6E4" },
  { id: "amber", bg: "#FFFBEB", accent: "#FDE68A" },
];

const randColor = () => colors[Math.floor(Math.random() * colors.length)];
const getColor = (id) => colors.find((c) => c.id === id) || randColor();

// convert to monthly cost - weekly uses 4.33 which is close enough
function toMonthly(sub) {
  if (sub.cycle === "Yearly") return sub.price / 12;
  if (sub.cycle === "Weekly") return sub.price * 4.33;
  return sub.price;
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  initColorPicker();
  renderList();
  // default to today
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
});

function goToStep(n) {
  document.querySelectorAll(".step-panel").forEach((el) => el.classList.remove("active"));
  document.getElementById(`step-${n}`).classList.add("active");

  const bar = document.getElementById("progress-bar");
  const ind = document.getElementById("step-indicator");

  // kinda hacky but works
  bar.className = `h-full bg-indigo-600 w-${n}/3 transition-all duration-500 ease-out rounded-full`;
  if (n === 1) bar.className = "h-full bg-indigo-600 w-1/3 transition-all duration-500 ease-out rounded-full";
  if (n === 2) {
    bar.className = "h-full bg-indigo-600 w-2/3 transition-all duration-500 ease-out rounded-full";
    renderGrid();
  }
  if (n === 3) {
    bar.className = "h-full bg-indigo-600 w-full transition-all duration-500 ease-out rounded-full";
    renderStats();
  }

  ind.innerText = `Step ${n} of 3`;
  step = n;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) subs = JSON.parse(saved);
  } catch (e) {
    // corrupted data, just reset
    subs = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  renderList();
}

function renderList() {
  const list = document.getElementById("sub-list-container");
  const empty = document.getElementById("empty-state");
  const nextBtn = document.getElementById("next-btn-1");
  const clearBtn = document.getElementById("clear-btn");

  if (!subs.length) {
    list.classList.add("hidden");
    empty.classList.remove("hidden");
    nextBtn.disabled = true;
    nextBtn.classList.add("opacity-50", "cursor-not-allowed");
    clearBtn.classList.add("hidden");
    clearBtn.classList.remove("flex");
    return;
  }

  empty.classList.add("hidden");
  list.classList.remove("hidden");
  nextBtn.disabled = false;
  nextBtn.classList.remove("opacity-50", "cursor-not-allowed");
  clearBtn.classList.remove("hidden");
  clearBtn.classList.add("flex");

  let html = "";
  for (const sub of subs) {
    const c = getColor(sub.color);
    html += `
      <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onclick="editSub('${sub.id}')">
          <div class="w-1 h-10 rounded-full shrink-0" style="background: linear-gradient(180deg, ${c.bg} 0%, ${c.accent} 100%);"></div>
          ${iconHtml(sub, "w-10 h-10")}
          <div class="min-w-0">
            <div class="font-bold text-slate-900 truncate">${sub.name}</div>
            <div class="text-xs text-slate-500">$${sub.price} / ${sub.cycle}</div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="editSub('${sub.id}')" class="text-slate-300 hover:text-indigo-500 p-2"><span class="iconify" data-icon="ph:pencil-simple-bold"></span></button>
          <button onclick="removeSub('${sub.id}')" class="text-slate-300 hover:text-red-500 p-2"><span class="iconify" data-icon="ph:trash-bold"></span></button>
        </div>
      </div>`;
  }

  html += `<button onclick="openModal()" class="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center gap-2"><span class="iconify w-5 h-5" data-icon="ph:plus-bold"></span> Add Another</button>`;
  list.innerHTML = html;
}

/*
 * Squarified treemap - based on the Bruls algorithm
 * honestly this took forever to get right, dont touch it
 */
class Treemap {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.gap = 4;
  }

  layout(data) {
    if (!data.length) return [];

    const total = data.reduce((sum, d) => sum + d.val, 0);
    const norm = data.map((d) => ({
      ...d,
      area: (d.val / total) * this.w * this.h,
    }));

    const rects = [];
    this._squarify(norm, [], 0, 0, this.w, this.h, rects);
    return rects;
  }

  _squarify(children, row, x, y, w, h, rects) {
    if (!children.length) {
      this._layoutRow(row, x, y, w, h, rects);
      return;
    }

    const c = children[0];
    const newRow = [...row, c];

    if (!row.length || this._worst(row, w, h) >= this._worst(newRow, w, h)) {
      this._squarify(children.slice(1), newRow, x, y, w, h, rects);
    } else {
      const { nx, ny, nw, nh } = this._layoutRow(row, x, y, w, h, rects);
      this._squarify(children, [], nx, ny, nw, nh, rects);
    }
  }

  _worst(row, w, h) {
    if (!row.length) return Infinity;
    const sum = row.reduce((s, r) => s + r.area, 0);
    const side = Math.min(w, h);
    const rowW = sum / side;

    let worst = 0;
    for (const item of row) {
      const itemH = item.area / rowW;
      const ratio = Math.max(rowW / itemH, itemH / rowW);
      if (ratio > worst) worst = ratio;
    }
    return worst;
  }

  _layoutRow(row, x, y, w, h, rects) {
    if (!row.length) return { nx: x, ny: y, nw: w, nh: h };

    const sum = row.reduce((s, r) => s + r.area, 0);
    const horiz = w >= h;
    const side = horiz ? h : w;
    const thick = sum / side;
    const g = this.gap;

    let pos = 0;
    for (const item of row) {
      const size = item.area / thick;
      if (horiz) {
        rects.push({ ...item, x: x + g / 2, y: y + pos + g / 2, w: thick - g, h: size - g });
      } else {
        rects.push({ ...item, x: x + pos + g / 2, y: y + g / 2, w: size - g, h: thick - g });
      }
      pos += size;
    }

    return horiz
      ? { nx: x + thick, ny: y, nw: w - thick, nh: h }
      : { nx: x, ny: y + thick, nw: w, nh: h - thick };
  }
}

function renderGrid() {
  const grid = document.getElementById("bento-grid");
  const totalEl = document.getElementById("step-2-total");
  const yearlyEl = document.getElementById("step-2-yearly");

  let total = 0;
  const items = subs
    .map((s) => {
      const cost = toMonthly(s);
      total += cost;
      return { ...s, cost };
    })
    .sort((a, b) => b.cost - a.cost);

  totalEl.innerText = `$${total.toFixed(2)}`;
  yearlyEl.innerText = `$${(total * 12).toFixed(2)}`;

  if (!items.length) {
    grid.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400">Add subscriptions to see visualization</div>';
    return;
  }

  // FIXME: sometimes returns 0 on initial render, needs investigation
  const rect = grid.getBoundingClientRect();
  const W = rect.width || 600;
  const H = rect.height || 450;

  const data = items.map((s, i) => ({ ...s, val: s.cost, idx: i }));
  const treemap = new Treemap(W, H);
  const layout = treemap.layout(data);

  grid.innerHTML = layout.map((r) => {
    const pct = (r.cost / total) * 100;
    const c = getColor(r.color);

    const minDim = Math.min(r.w, r.h);
    const clamped = Math.max(3, Math.min(60, pct));

    // scale padding/radius based on cell size
    const pad = Math.round(Math.max(6, Math.min(minDim * 0.08, 16)) + (clamped / 60) * 8);
    const radius = Math.round(Math.max(6, Math.min(minDim * 0.12, 20)) + (clamped / 60) * 6);

    const innerW = r.w - pad * 2;
    const innerH = r.h - pad * 2;

    // font sizing - clamp to what actually fits
    const maxPrice = Math.min(Math.floor(innerW * 0.16), Math.floor(innerH * 0.28));
    const priceSize = Math.max(10, Math.min(12 + (clamped / 60) * 36, maxPrice, 48));
    const titleSize = Math.max(8, Math.min(9 + (clamped / 60) * 15, priceSize * 0.55, 24));
    const iconSz = Math.max(14, Math.min(18 + (clamped / 60) * 30, innerH * 0.3, innerW * 0.35, 48));

    // different layouts for different sizes
    const isMicro = minDim < 40 || (r.w < 50 && r.h < 50);
    const isTiny = minDim < 55 || (r.w < 65 && r.h < 65);
    const isSmall = minDim < 85 || r.w < 95;

    let content;
    if (isMicro) {
      const sz = Math.max(12, Math.min(iconSz, minDim * 0.5));
      content = `<div class="flex items-center justify-center h-full w-full">${iconHtml(r, `w-[${sz}px] h-[${sz}px]`)}</div>`;
    } else if (isTiny) {
      const sz = Math.max(14, Math.min(iconSz, minDim * 0.4));
      const ps = Math.max(9, Math.min(priceSize, 13, innerW * 0.16));
      content = `
        <div class="flex flex-col items-center justify-center h-full w-full gap-1">
          ${iconHtml(r, `w-[${sz}px] h-[${sz}px]`)}
          <div class="font-bold text-slate-900" style="font-size:${ps}px">$${r.cost.toFixed(0)}</div>
        </div>`;
    } else if (isSmall) {
      const sz = Math.max(16, Math.min(iconSz, innerW * 0.35, innerH * 0.25));
      const ts = Math.max(8, Math.min(titleSize, 11, innerW * 0.12));
      const ps = Math.max(11, Math.min(priceSize, 18, innerW * 0.18));
      content = `
        <div class="flex flex-col items-center justify-center h-full w-full gap-1 text-center">
          ${iconHtml(r, `w-[${sz}px] h-[${sz}px]`)}
          <div class="min-w-0 w-full">
            <div class="font-semibold text-slate-900 treemap-cell-name" style="font-size:${ts}px">${r.name}</div>
            <div class="font-black text-slate-900" style="font-size:${ps}px">$${r.cost.toFixed(0)}</div>
          </div>
        </div>`;
    } else {
      // full layout
      const showBadge = r.w > 80 && r.h > 70;
      const showYearly = r.h > 130 && r.w > 110 && pct > 8;
      content = `
        <div class="flex justify-between items-start">
          ${iconHtml(r, `w-[${iconSz}px] h-[${iconSz}px]`)}
          ${showBadge ? `<span class="text-[10px] font-bold bg-white/70 px-2 py-1 rounded-full text-slate-700">${Math.round(pct)}%</span>` : ""}
        </div>
        <div class="mt-auto min-w-0">
          <div class="font-bold text-slate-900 treemap-cell-name" style="font-size:${titleSize}px">${r.name}</div>
          <div class="font-black text-slate-900 tracking-tight leading-none" style="font-size:${priceSize}px">$${r.cost.toFixed(2)}</div>
          ${showYearly ? `<div class="text-xs font-medium text-slate-500 mt-1">~$${(r.cost * 12).toFixed(0)}/yr</div>` : ""}
        </div>`;
    }

    return `
      <div class="treemap-cell" data-id="${r.id}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;border-radius:${radius}px">
        <div class="treemap-cell-inner" style="background:linear-gradient(135deg,${c.bg} 0%,${c.accent} 100%);padding:${pad}px;border-radius:${Math.max(4, radius - 3)}px">
          ${content}
        </div>
      </div>`;
  }).join("");
}

// TODO: add loading state, this can be slow on older devices
async function exportAsImage() {
  const container = document.getElementById("export-container");
  if (!container) return;

  const btn = event.target.closest("button");
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="iconify h-5 w-5 animate-spin" data-icon="ph:spinner-bold"></span> Exporting...';
  btn.disabled = true;

  try {
    // modern-screenshot lib handles most of the heavy lifting
    const url = await modernScreenshot.domToPng(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      style: {
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        borderRadius: "2.5rem",
        overflow: "hidden",
      },
      onCloneNode: (node) => {
        // force system font on clone since custom fonts dont export well
        if (node.style) {
          node.style.fontFamily = "system-ui, -apple-system, sans-serif";
        }
        if (node.querySelectorAll) {
          node.querySelectorAll("*").forEach((el) => {
            if (el.style) el.style.fontFamily = "system-ui, -apple-system, sans-serif";
          });
        }
        return node;
      },
      fetch: { bypassingCache: true },
    });

    const a = document.createElement("a");
    a.href = url;
    a.download = `subs-${new Date().toISOString().split("T")[0]}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("export failed:", err);
    alert("Export failed: " + err.message);
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}

function renderStats() {
  let total = 0;
  subs.forEach((s) => (total += toMonthly(s)));
  const yearly = total * 12;

  document.getElementById("final-yearly").innerText = `$${yearly.toFixed(0)}`;
  document.getElementById("final-count").innerText = subs.length;
  document.getElementById("savings-estimate").innerText = `$${yearly.toFixed(0)}`;
}

function iconHtml(sub, cls) {
  if (!sub.url) {
    return `<span class="iconify ${cls} text-slate-400 shrink-0" data-icon="ph:cube-bold"></span>`;
  }
  // strip protocol and www
  const domain = sub.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  const src = `https://img.logo.dev/${domain}?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png`;
  return `<img src="${src}" class="${cls} object-contain rounded-lg shrink-0" crossorigin="anonymous">`;
}

function removeSub(id) {
  subs = subs.filter((s) => s.id !== id);
  save();
}

function clearAllSubs() {
  if (!confirm("Delete all subscriptions?")) return;
  subs = [];
  save();
}

function editSub(id) {
  const sub = subs.find((s) => s.id === id);
  if (!sub) return;

  document.getElementById("entry-id").value = sub.id;
  document.getElementById("name").value = sub.name;
  document.getElementById("price").value = sub.price;
  document.getElementById("cycle").value = sub.cycle;
  document.getElementById("url").value = sub.url || "";
  updateFavicon(sub.url || "");
  pickColor(sub.color || randColor().id);

  document.getElementById("modal-title").innerText = "Edit Subscription";
  document.querySelector("#sub-form button[type='submit']").innerText = "Save Changes";

  showModal();
}

function initColorPicker() {
  const el = document.getElementById("color-selector");
  el.innerHTML = colors.map((c) => `
    <div onclick="pickColor('${c.id}')" class="color-option cursor-pointer rounded-lg h-10 border-2 border-transparent transition-all hover:scale-105" data-val="${c.id}" style="background:linear-gradient(135deg,${c.bg} 0%,${c.accent} 100%)"></div>
  `).join("");
}

function pickColor(id) {
  document.getElementById("selected-color").value = id;
  document.querySelectorAll(".color-option").forEach((el) => {
    if (el.dataset.val === id) {
      el.classList.add("ring-2", "ring-indigo-500", "ring-offset-2");
    } else {
      el.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2");
    }
  });
}

let faviconTimer = null;
function updateFavicon(url) {
  clearTimeout(faviconTimer);
  faviconTimer = setTimeout(() => {
    const el = document.getElementById("favicon-preview");
    if (!url) {
      el.innerHTML = '<span class="iconify text-slate-300 w-5 h-5" data-icon="ph:globe-simple"></span>';
      return;
    }
    const domain = url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    if (domain.length > 3) {
      el.innerHTML = `<img src="https://img.logo.dev/${domain}?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png" class="w-full h-full object-cover" crossorigin="anonymous">`;
    }
  }, 400);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("entry-id").value;
  const sub = {
    id: id || Date.now().toString(),
    name: document.getElementById("name").value,
    price: parseFloat(document.getElementById("price").value),
    cycle: document.getElementById("cycle").value,
    url: document.getElementById("url").value,
    color: document.getElementById("selected-color").value || randColor().id,
  };

  if (id) {
    const idx = subs.findIndex((s) => s.id === id);
    if (idx !== -1) subs[idx] = sub;
  } else {
    subs.push(sub);
  }

  save();
  hideModal();
}

// modal stuff
const backdrop = document.getElementById("modal-backdrop");
const panel = document.getElementById("modal-panel");
const modalInner = panel?.querySelector("div");

function showModal() {
  backdrop.classList.remove("hidden");
  panel.classList.remove("hidden");
  requestAnimationFrame(() => {
    backdrop.classList.remove("opacity-0");
    modalInner.classList.remove("translate-y-full", "sm:scale-95", "opacity-0");
    modalInner.classList.add("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
  });
}

function hideModal() {
  backdrop.classList.add("opacity-0");
  modalInner.classList.remove("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
  modalInner.classList.add("translate-y-full", "sm:scale-95", "opacity-0");
  setTimeout(() => {
    backdrop.classList.add("hidden");
    panel.classList.add("hidden");
  }, 300);
}

function openModal() {
  document.getElementById("sub-form").reset();
  document.getElementById("entry-id").value = "";
  updateFavicon("");
  pickColor(randColor().id);

  document.getElementById("modal-title").innerText = "Add Subscription";
  document.querySelector("#sub-form button[type='submit']").innerText = "Save Item";

  showModal();
}

function closeModal() {
  hideModal();
}
