let subs = [];
let step = 1;
let selectedCurrency = "USD";

window.currencies = {
  USD: { symbol: "$", name: "US Dollar", rate: 1 },
  EUR: { symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { symbol: "£", name: "British Pound", rate: 0.79 },
  JPY: { symbol: "¥", name: "Japanese Yen", rate: 149.5 },
  CNY: { symbol: "¥", name: "Chinese Yuan", rate: 7.24 },
  KRW: { symbol: "₩", name: "South Korean Won", rate: 1320 },
  INR: { symbol: "₹", name: "Indian Rupee", rate: 83.12 },
  CAD: { symbol: "C$", name: "Canadian Dollar", rate: 1.36 },
  AUD: { symbol: "A$", name: "Australian Dollar", rate: 1.53 },
  CHF: { symbol: "CHF", name: "Swiss Franc", rate: 0.88 },
  HKD: { symbol: "HK$", name: "Hong Kong Dollar", rate: 7.82 },
  SGD: { symbol: "S$", name: "Singapore Dollar", rate: 1.34 },
  SEK: { symbol: "kr", name: "Swedish Krona", rate: 10.42 },
  NOK: { symbol: "kr", name: "Norwegian Krone", rate: 10.85 },
  DKK: { symbol: "kr", name: "Danish Krone", rate: 6.87 },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar", rate: 1.64 },
  MXN: { symbol: "MX$", name: "Mexican Peso", rate: 17.15 },
  BRL: { symbol: "R$", name: "Brazilian Real", rate: 4.97 },
  ZAR: { symbol: "R", name: "South African Rand", rate: 18.65 },
  RUB: { symbol: "₽", name: "Russian Ruble", rate: 92.5 },
  TRY: { symbol: "₺", name: "Turkish Lira", rate: 29.2 },
  PLN: { symbol: "zł", name: "Polish Zloty", rate: 3.98 },
  THB: { symbol: "฿", name: "Thai Baht", rate: 35.2 },
  IDR: { symbol: "Rp", name: "Indonesian Rupiah", rate: 15650 },
  MYR: { symbol: "RM", name: "Malaysian Ringgit", rate: 4.72 },
  PHP: { symbol: "₱", name: "Philippine Peso", rate: 55.8 },
  VND: { symbol: "₫", name: "Vietnamese Dong", rate: 24500 },
  TWD: { symbol: "NT$", name: "Taiwan Dollar", rate: 31.5 },
  AED: { symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
  SAR: { symbol: "﷼", name: "Saudi Riyal", rate: 3.75 },
  ILS: { symbol: "₪", name: "Israeli Shekel", rate: 3.68 },
  CZK: { symbol: "Kč", name: "Czech Koruna", rate: 22.8 },
  HUF: { symbol: "Ft", name: "Hungarian Forint", rate: 356 },
  RON: { symbol: "lei", name: "Romanian Leu", rate: 4.57 },
  BGN: { symbol: "лв", name: "Bulgarian Lev", rate: 1.8 },
  HRK: { symbol: "kn", name: "Croatian Kuna", rate: 6.93 },
  CLP: { symbol: "CLP$", name: "Chilean Peso", rate: 880 },
  COP: { symbol: "COL$", name: "Colombian Peso", rate: 3950 },
  ARS: { symbol: "ARS$", name: "Argentine Peso", rate: 365 },
  PEN: { symbol: "S/", name: "Peruvian Sol", rate: 3.72 },
  EGP: { symbol: "E£", name: "Egyptian Pound", rate: 30.9 },
  NGN: { symbol: "₦", name: "Nigerian Naira", rate: 785 },
  KES: { symbol: "KSh", name: "Kenyan Shilling", rate: 153 },
  PKR: { symbol: "₨", name: "Pakistani Rupee", rate: 278 },
  BDT: { symbol: "৳", name: "Bangladeshi Taka", rate: 110 },
  UAH: { symbol: "₴", name: "Ukrainian Hryvnia", rate: 37.5 },
};

// tailwind color palette - bg is the lighter shade, accent for gradients
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

function getColor(colorId) {
  const found = colors.find(c => c.id === colorId);
  return found ? found : randColor();
}

function formatCurrency(usdAmount, decimals = 2) {
  const curr = currencies[selectedCurrency];
  const converted = usdAmount * curr.rate;
  // skip decimals for currencies like JPY, KRW where it looks weird
  const dec = curr.rate > 100 ? 0 : decimals;
  return curr.symbol + converted.toFixed(dec);
}

// compact format for tight spaces in the treemap
function formatCurrencyShort(usdAmount) {
  const curr = currencies[selectedCurrency];
  const amt = usdAmount * curr.rate;

  if (amt >= 1_000_000) return curr.symbol + (amt / 1_000_000).toFixed(1) + "M";
  if (amt >= 10_000) return curr.symbol + (amt / 1_000).toFixed(0) + "k";
  if (curr.rate > 100) return curr.symbol + Math.round(amt);
  return curr.symbol + amt.toFixed(0);
}

// normalize everything to monthly for comparison
function toMonthly(sub) {
  if (sub.cycle === "Yearly") return sub.price / 12;
  if (sub.cycle === "Weekly") return sub.price * 4.33; // ~4.33 weeks per month
  return sub.price;
}

function iconHtml(sub, className) {
  if (!sub.url) {
    return '<span class="iconify ' + className + ' text-slate-400 shrink-0" data-icon="ph:cube-bold"></span>';
  }

  const domain = sub.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

  // logo.dev is pretty good at finding logos, free tier is enough for this
  const logoUrl = "https://img.logo.dev/" + domain + "?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png";
  return '<img src="' + logoUrl + '" class="' + className + ' object-contain rounded-lg shrink-0" crossorigin="anonymous">';
}

function goToStep(stepNum) {
  document.querySelectorAll(".step-panel").forEach(panel => panel.classList.remove("active"));
  document.getElementById("step-" + stepNum).classList.add("active");

  const progressBar = document.getElementById("progress-bar");
  const indicator = document.getElementById("step-indicator");

  // tailwind doesn't support dynamic class names so we gotta hardcode these
  // tried using style.width but the transition didn't look as smooth
  const barClasses = "h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full";
  if (stepNum === 1) {
    progressBar.className = barClasses + " w-1/3";
  } else if (stepNum === 2) {
    progressBar.className = barClasses + " w-2/3";
    renderGrid();
  } else {
    progressBar.className = barClasses + " w-full";
    renderStats();
  }

  indicator.innerText = "Step " + stepNum + " of 3";
  step = stepNum;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderList() {
  const listContainer = document.getElementById("sub-list-container");
  const emptyState = document.getElementById("empty-state");
  const nextBtn = document.getElementById("next-btn-1");
  const clearBtn = document.getElementById("clear-btn");

  if (subs.length === 0) {
    listContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
    nextBtn.disabled = true;
    nextBtn.classList.add("opacity-50", "cursor-not-allowed");
    clearBtn.classList.add("hidden");
    clearBtn.classList.remove("flex");
    return;
  }

  emptyState.classList.add("hidden");
  listContainer.classList.remove("hidden");
  nextBtn.disabled = false;
  nextBtn.classList.remove("opacity-50", "cursor-not-allowed");
  clearBtn.classList.remove("hidden");
  clearBtn.classList.add("flex");

  let html = "";
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    const color = getColor(sub.color);

    html += '<div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">';
    html += '<div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onclick="editSub(\'' + sub.id + '\')">';
    html += '<div class="w-1 h-10 rounded-full shrink-0" style="background: linear-gradient(180deg, ' + color.bg + ' 0%, ' + color.accent + ' 100%);"></div>';
    html += iconHtml(sub, "w-10 h-10");
    html += '<div class="min-w-0">';
    html += '<div class="font-bold text-slate-900 truncate">' + sub.name + '</div>';
    html += '<div class="text-xs text-slate-500">' + formatCurrency(sub.price) + ' / ' + sub.cycle + '</div>';
    html += '</div></div>';
    html += '<div class="flex items-center gap-1">';
    html += '<button onclick="editSub(\'' + sub.id + '\')" class="text-slate-300 hover:text-indigo-500 p-2"><span class="iconify" data-icon="ph:pencil-simple-bold"></span></button>';
    html += '<button onclick="removeSub(\'' + sub.id + '\')" class="text-slate-300 hover:text-red-500 p-2"><span class="iconify" data-icon="ph:trash-bold"></span></button>';
    html += '</div></div>';
  }

  html += '<button onclick="openModal()" class="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center gap-2">';
  html += '<span class="iconify w-5 h-5" data-icon="ph:plus-bold"></span> Add Another</button>';

  listContainer.innerHTML = html;
}

function renderStats() {
  let monthlyTotal = 0;
  for (const sub of subs) {
    monthlyTotal += toMonthly(sub);
  }

  const yearlyTotal = formatCurrency(monthlyTotal * 12, 0);

  document.getElementById("final-yearly").innerText = yearlyTotal;
  document.getElementById("final-count").innerText = subs.length;
  document.getElementById("savings-estimate").innerText = yearlyTotal;

  const statsCount = document.getElementById("stats-count");
  if (statsCount) statsCount.innerText = subs.length;

  const vexlyBtn = document.getElementById("vexly-cta");
  if (vexlyBtn) {
    vexlyBtn.href = getVexlyImportUrl();
    vexlyBtn.querySelector(".sub-count").innerText = subs.length;
  }

  updateEmailPreview();
}

function updateEmailPreview() {
  if (subs.length === 0) return;

  const sorted = [...subs].sort((a, b) => toMonthly(b) - toMonthly(a));

  if (sorted[0]) {
    const name1 = document.getElementById("preview-name-1");
    const price1 = document.getElementById("preview-price-1");
    if (name1) name1.innerText = sorted[0].name;
    if (price1) price1.innerText = formatCurrency(toMonthly(sorted[0]));
  }

  const previewRow2 = document.getElementById("preview-sub-2");
  if (sorted[1]) {
    const name2 = document.getElementById("preview-name-2");
    const price2 = document.getElementById("preview-price-2");
    if (name2) name2.innerText = sorted[1].name;
    if (price2) price2.innerText = formatCurrency(toMonthly(sorted[1]));
    if (previewRow2) previewRow2.style.display = "flex";
  } else {
    if (previewRow2) previewRow2.style.display = "none";
  }

  const moreCount = document.getElementById("preview-more-count");
  if (moreCount) {
    const remaining = Math.max(0, subs.length - 2);
    moreCount.innerText = remaining;
    moreCount.parentElement.style.display = remaining > 0 ? "block" : "none";
  }
}

function getVexlyImportUrl() {
  const exportData = {
    currency: selectedCurrency,
    subscriptions: subs.map(sub => ({
      name: sub.name,
      price: sub.price,
      cycle: sub.cycle.toLowerCase(),
      ...(sub.url && {
        url: sub.url.startsWith("http") ? sub.url : "https://" + sub.url
      })
    }))
  };

  const encoded = encodeURIComponent(JSON.stringify(exportData));
  return "https://vexly.app/import?subs=" + encoded + "&utm_source=subgrid&utm_medium=email&utm_campaign=import";
}

function renderPresets() {
  const grid = document.getElementById("presets-grid");
  if (!grid) return;

  // full list is overwhelming, just show common ones here
  const popular = presets.filter(p => p.popular);

  let html = "";
  for (let i = 0; i < popular.length; i++) {
    const preset = popular[i];
    const presetIndex = presets.indexOf(preset);
    const logo = "https://img.logo.dev/" + preset.domain + "?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png";

    html += '<button onclick="openModalWithPreset(' + presetIndex + ')" ';
    html += 'class="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md active:scale-95 sm:p-3">';
    html += '<img src="' + logo + '" class="h-8 w-8 rounded-lg object-contain sm:h-10 sm:w-10" crossorigin="anonymous" alt="' + preset.name + '">';
    html += '<span class="text-[10px] font-semibold text-slate-600 truncate w-full text-center sm:text-xs">' + preset.name + '</span>';
    html += '</button>';
  }
  grid.innerHTML = html;
}

function removeSub(subId) {
  subs = subs.filter(s => s.id !== subId);
  save();
}

function clearAllSubs() {
  if (!confirm("Delete all subscriptions?")) return;
  subs = [];
  save();
}

function editSub(subId) {
  const sub = subs.find(s => s.id === subId);
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
  const container = document.getElementById("color-selector");
  let html = "";
  for (const color of colors) {
    html += '<div onclick="pickColor(\'' + color.id + '\')" ';
    html += 'class="color-option cursor-pointer rounded-lg h-10 border-2 border-transparent transition-all hover:scale-105" ';
    html += 'data-val="' + color.id + '" ';
    html += 'style="background:linear-gradient(135deg,' + color.bg + ' 0%,' + color.accent + ' 100%)"></div>';
  }
  container.innerHTML = html;
}

function pickColor(colorId) {
  document.getElementById("selected-color").value = colorId;

  const options = document.querySelectorAll(".color-option");
  for (const opt of options) {
    if (opt.dataset.val === colorId) {
      opt.classList.add("ring-2", "ring-indigo-500", "ring-offset-2");
    } else {
      opt.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2");
    }
  }
}

// debounce the favicon preview so we're not hammering the api on every keystroke
let faviconDebounce = null;

function updateFavicon(urlInput) {
  clearTimeout(faviconDebounce);

  faviconDebounce = setTimeout(function() {
    const preview = document.getElementById("favicon-preview");

    if (!urlInput) {
      preview.innerHTML = '<span class="iconify text-slate-300 w-5 h-5" data-icon="ph:globe-simple"></span>';
      return;
    }

    const domain = urlInput.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    // only fetch if domain looks legit (at least has a tld)
    if (domain.length > 3) {
      const logoUrl = "https://img.logo.dev/" + domain + "?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png";
      preview.innerHTML = '<img src="' + logoUrl + '" class="w-full h-full object-cover" crossorigin="anonymous">';
    }
  }, 400);
}

function initCurrencySelector() {
  const dropdown = document.getElementById("currency-selector");
  if (!dropdown) return;

  let html = "";
  const currencyCodes = Object.keys(currencies);

  for (let i = 0; i < currencyCodes.length; i++) {
    const code = currencyCodes[i];
    const curr = currencies[code];
    const selected = (code === selectedCurrency) ? " selected" : "";
    html += '<option value="' + code + '"' + selected + '>' + curr.symbol + ' ' + code + ' - ' + curr.name + '</option>';
  }

  dropdown.innerHTML = html;
  dropdown.addEventListener("change", function(e) {
    saveCurrency(e.target.value);
  });
}

function handleFormSubmit(evt) {
  evt.preventDefault();

  const existingId = document.getElementById("entry-id").value;

  const subData = {
    id: existingId || Date.now().toString(),
    name: document.getElementById("name").value,
    price: parseFloat(document.getElementById("price").value),
    cycle: document.getElementById("cycle").value,
    url: document.getElementById("url").value,
    color: document.getElementById("selected-color").value || randColor().id
  };

  if (existingId) {
    const index = subs.findIndex(s => s.id === existingId);
    if (index !== -1) {
      subs[index] = subData;
    }
  } else {
    subs.push(subData);
  }

  save();
  hideModal();
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.initRates();
  load();
  loadCurrency();
  initColorPicker();
  initCurrencySelector();
  renderPresets();
  renderList();
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
});
