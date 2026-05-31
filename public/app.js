let STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "Nasdaq", currency: "USD", price: 201.34, day: 1.24 },
  { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "Nasdaq", currency: "USD", price: 137.82, day: 2.78 },
  { symbol: "MSFT", name: "Microsoft Corp.", exchange: "Nasdaq", currency: "USD", price: 457.11, day: 0.63 },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "Nasdaq", currency: "USD", price: 212.08, day: -0.41 },
  { symbol: "META", name: "Meta Platforms", exchange: "Nasdaq", currency: "USD", price: 651.27, day: 1.83 },
  { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE", currency: "USD", price: 267.84, day: 0.49 },
  { symbol: "KO", name: "Coca-Cola Co.", exchange: "NYSE", currency: "USD", price: 71.22, day: -0.15 },
  { symbol: "BABA", name: "Alibaba Group ADR", exchange: "NYSE", currency: "USD", price: 124.55, day: 1.08 },
  { symbol: "TSM", name: "Taiwan Semiconductor ADR", exchange: "NYSE", currency: "USD", price: 195.76, day: 2.12 },
  { symbol: "0700", name: "Tencent Holdings", exchange: "HKSE", currency: "HKD", price: 512.5, day: 1.99 },
  { symbol: "9988", name: "Alibaba Group", exchange: "HKSE", currency: "HKD", price: 118.1, day: 0.85 },
  { symbol: "3690", name: "Meituan", exchange: "HKSE", currency: "HKD", price: 142.4, day: -1.18 },
  { symbol: "1810", name: "Xiaomi Corp.", exchange: "HKSE", currency: "HKD", price: 53.65, day: 2.39 },
  { symbol: "600519", name: "Kweichow Moutai", exchange: "ShanghaiSE", currency: "CNY", price: 1568.4, day: -0.34 },
  { symbol: "601318", name: "Ping An Insurance", exchange: "ShanghaiSE", currency: "CNY", price: 53.29, day: 0.92 },
  { symbol: "600036", name: "China Merchants Bank", exchange: "ShanghaiSE", currency: "CNY", price: 45.78, day: 0.38 },
  { symbol: "000858", name: "Wuliangye Yibin", exchange: "ShenzhenSE", currency: "CNY", price: 128.64, day: -0.73 },
  { symbol: "300750", name: "CATL", exchange: "ShenzhenSE", currency: "CNY", price: 268.12, day: 1.67 },
  { symbol: "000333", name: "Midea Group", exchange: "ShenzhenSE", currency: "CNY", price: 72.36, day: 0.56 }
];

const DEFAULT_STATE = {
  holdings: [
    { symbol: "NVDA", shares: 42, cost: 102.45 },
    { symbol: "0700", shares: 300, cost: 374.8 },
    { symbol: "AAPL", shares: 55, cost: 168.2 },
    { symbol: "600519", shares: 20, cost: 1412 },
    { symbol: "300750", shares: 120, cost: 231.7 }
  ],
  combinations: [
    { id: "ai-growth", name: "AI growth", symbols: ["NVDA", "MSFT", "TSM"] },
    { id: "china-core", name: "China core", symbols: ["0700", "9988", "600519"] }
  ]
};

const FX_TO_USD = { USD: 1, HKD: 0.128, CNY: 0.138 };
const FX_FROM_USD = { USD: 1, HKD: 7.81, CNY: 7.25 };
const DEFAULT_CURRENCIES = { HKSE: "HKD", NYSE: "USD", Nasdaq: "USD", ShanghaiSE: "CNY", ShenzhenSE: "CNY" };
const MARKET_COLORS = { Nasdaq: "#d86142", NYSE: "#d6a24e", HKSE: "#2f6258", ShanghaiSE: "#91aaa1", ShenzhenSE: "#b9cbbd" };
const DISPLAY_EXCHANGES = ["All", "HKSE", "NYSE", "Nasdaq", "ShanghaiSE", "ShenzhenSE"];
const PROVIDER_EXCHANGES = { HKSE: "XHKG", NYSE: "XNYS", Nasdaq: "XNAS", ShanghaiSE: "XSHG", ShenzhenSE: "XSHE" };
const REMOTE_EXCHANGES = Object.keys(PROVIDER_EXCHANGES);
const loadedExchanges = new Set();
let loadingCatalog = false;
let catalogError = "";
let selectedExchange = "All";
let state = loadState();
let displayCurrency = localStorage.getItem("northstar-currency") || "USD";
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("northstar-portfolio"));
    return saved && saved.holdings && saved.combinations ? saved : structuredClone(DEFAULT_STATE);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}
function saveState() { localStorage.setItem("northstar-portfolio", JSON.stringify(state)); }
function stockFor(symbol) { return STOCKS.find((stock) => stock.symbol === symbol); }
function usd(amount, currency = "USD") { return amount * FX_TO_USD[currency]; }
function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: displayCurrency, maximumFractionDigits: 0 }).format(value * FX_FROM_USD[displayCurrency]);
}
function stockMoney(value, currency) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function currentPrice(stock) { return stock.price ? stockMoney(stock.price, stock.currency) : "Price pending"; }
function signedMoney(value) { return `${value >= 0 ? "+" : "-"}${money(Math.abs(value))}`; }
function percent(value) { return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`; }
function initials(stock) { return stock?.symbol ? stock.symbol.slice(0, 2) : "·"; }

function portfolioRows() {
  return state.holdings.map((holding) => {
    const stock = stockFor(holding.symbol) || holding;
    const cost = usd(holding.shares * holding.cost, stock.currency);
    const value = usd(holding.shares * stock.price, stock.currency);
    const profit = value - cost;
    return { ...holding, stock, cost, value, profit, returnPct: cost ? profit / cost * 100 : 0 };
  });
}

function render() {
  const rows = portfolioRows();
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const invested = rows.reduce((sum, row) => sum + row.cost, 0);
  const totalProfit = totalValue - invested;
  const totalReturn = invested ? totalProfit / invested * 100 : 0;
  const dayMove = rows.reduce((sum, row) => sum + row.value * row.stock.day / (100 + row.stock.day), 0);
  const best = [...rows].sort((a, b) => b.returnPct - a.returnPct)[0];

  document.querySelector("#total-value").textContent = money(totalValue);
  document.querySelector("#invested-value").textContent = money(invested);
  document.querySelector("#total-return-value").textContent = signedMoney(totalProfit);
  document.querySelector("#total-return-value").className = totalProfit >= 0 ? "positive" : "negative";
  document.querySelector("#total-return-percent").textContent = percent(totalReturn);
  document.querySelector("#total-return-percent").className = `trend-tag ${totalReturn >= 0 ? "positive" : "negative"}`;
  document.querySelector("#day-movement").textContent = signedMoney(dayMove);
  document.querySelector("#day-movement").className = dayMove >= 0 ? "positive" : "negative";
  document.querySelector("#day-movement-percent").textContent = `${percent(totalValue ? dayMove / totalValue * 100 : 0)} since open`;
  document.querySelector("#holding-count").textContent = `${rows.length} holding${rows.length === 1 ? "" : "s"}`;
  document.querySelector("#combination-count").textContent = state.combinations.length;
  document.querySelector("#best-performer").textContent = best ? best.stock.symbol : "—";
  document.querySelector("#best-performer-return").textContent = best ? percent(best.returnPct) : "No holdings yet";
  document.querySelector("#best-performer-return").className = best && best.returnPct < 0 ? "negative" : "positive";
  document.querySelectorAll(".currency-pill").forEach((button) => button.classList.toggle("active", button.textContent === displayCurrency));
  renderHoldings();
  renderAllocation(rows);
  renderCombinations();
}

function renderHoldings() {
  const query = document.querySelector("#holding-search").value.trim().toLowerCase();
  const rows = portfolioRows().filter(({ stock }) => `${stock.symbol} ${stock.name}`.toLowerCase().includes(query));
  document.querySelector("#holdings-body").innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td>
        <div class="stock-cell">
          <span class="stock-logo">${initials(row.stock)}</span>
          <span class="stock-name"><strong>${row.stock.symbol}</strong><span>${row.stock.name} · ${row.stock.exchange}</span></span>
        </div>
      </td>
      <td>${row.shares.toLocaleString()}</td>
      <td>${stockMoney(row.cost / row.shares / FX_TO_USD[row.stock.currency], row.stock.currency)}</td>
      <td>${currentPrice(row.stock)}</td>
      <td>${money(row.value)}</td>
      <td class="return-value ${row.profit >= 0 ? "positive" : "negative"}"><strong>${signedMoney(row.profit)}</strong><span>${percent(row.returnPct)}</span></td>
      <td><button class="table-edit" data-edit="${row.symbol}" aria-label="Edit ${row.symbol}">⋯</button></td>
    </tr>
  `).join("") : `<tr class="empty-row"><td colspan="7">No holdings found. Add a stock to start tracking it.</td></tr>`;
  document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => openHoldingEditor(button.dataset.edit)));
}

function renderAllocation(rows) {
  const totals = rows.reduce((map, row) => ({ ...map, [row.stock.exchange]: (map[row.stock.exchange] || 0) + row.value }), {});
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const allocation = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  let cursor = 0;
  const slices = allocation.map(([market, value]) => {
    const next = cursor + (total ? value / total * 100 : 0);
    const slice = `${MARKET_COLORS[market]} ${cursor.toFixed(1)}% ${next.toFixed(1)}%`;
    cursor = next;
    return slice;
  });
  document.querySelector("#allocation-donut").style.background = slices.length ? `conic-gradient(${slices.join(",")})` : "#edf2ec";
  document.querySelector("#market-count").textContent = allocation.length;
  document.querySelector("#allocation-legend").innerHTML = allocation.slice(0, 4).map(([market, value]) => `
    <div class="legend-row"><span class="legend-label"><i class="legend-dot" style="background:${MARKET_COLORS[market]}"></i>${market}</span><b>${(value / total * 100).toFixed(0)}%</b></div>
  `).join("") || `<span class="combination-empty">No allocation yet</span>`;
}

function renderCombinations() {
  document.querySelector("#combination-list").innerHTML = state.combinations.length ? state.combinations.map((combo) => `
    <article class="combination-card">
      <div class="combination-card-top"><strong>${combo.name}</strong><button class="combination-remove" data-remove-combo="${combo.id}" aria-label="Remove ${combo.name}">×</button></div>
      <p>${combo.symbols.length} compan${combo.symbols.length === 1 ? "y" : "ies"} · custom selection</p>
      <div class="combo-symbols">${combo.symbols.slice(0, 5).map((symbol) => `<span title="${symbol}">${initials(stockFor(symbol))}</span>`).join("")}</div>
    </article>
  `).join("") : `<p class="combination-empty">Create a combination to organize stocks by idea, region or strategy.</p>`;
  document.querySelectorAll("[data-remove-combo]").forEach((button) => button.addEventListener("click", () => {
    state.combinations = state.combinations.filter((combo) => combo.id !== button.dataset.removeCombo);
    saveState(); render();
  }));
}

function renderStockResults() {
  const query = document.querySelector("#stock-search").value.trim().toLowerCase();
  const stocks = STOCKS.filter((stock) => (selectedExchange === "All" || stock.exchange === selectedExchange) && `${stock.symbol} ${stock.name}`.toLowerCase().includes(query));
  const visibleStocks = stocks.slice(0, 100);
  const catalogStatus = document.querySelector("#catalog-status");
  catalogStatus.className = `catalog-status ${catalogError ? "error" : ""}`;
  catalogStatus.textContent = loadingCatalog
    ? "Loading full exchange catalog…"
    : catalogError
      ? `${catalogError} Showing available cached symbols.`
      : `${stocks.length.toLocaleString()} matching companies${stocks.length > visibleStocks.length ? ` · showing first ${visibleStocks.length}` : ""}`;
  document.querySelector("#stock-results").innerHTML = visibleStocks.map((stock) => `
    <button class="stock-result" data-stock="${stock.symbol}">
      <span class="stock-result-main"><span class="stock-logo">${initials(stock)}</span><span class="stock-result-info"><strong>${stock.name}</strong><span>${stock.symbol} · ${stock.exchange}</span></span></span>
      <span class="stock-result-price"><strong>${currentPrice(stock)}</strong><span class="${stock.day >= 0 ? "positive" : "negative"}">${stock.price ? percent(stock.day) : "Fetches when added"}</span></span>
    </button>
  `).join("") || `<p class="combination-empty">No companies match your search.</p>`;
  document.querySelectorAll("[data-stock]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#stock-picker").close();
    openHoldingEditor(button.dataset.stock);
  }));
}

async function fetchExchangeCatalog(exchange) {
  if (loadedExchanges.has(exchange)) return;
  const providerExchange = PROVIDER_EXCHANGES[exchange];
  const localUrl = `/api/stocks?exchange=${encodeURIComponent(exchange)}`;
  const publicUrl = `https://api.twelvedata.com/stocks?exchange=${encodeURIComponent(providerExchange)}&format=JSON`;
  let response;
  try {
    response = await fetch(localUrl);
    if (!response.ok || !response.headers.get("content-type")?.includes("json")) throw new Error("Pages Function unavailable");
  } catch {
    response = await fetch(publicUrl);
  }
  if (!response.ok) throw new Error(`Could not load ${exchange}`);
  const payload = await response.json();
  const remoteStocks = (payload.data || payload).map((stock) => ({
    symbol: stock.symbol,
    name: stock.name || stock.symbol,
    exchange,
    currency: stock.currency || DEFAULT_CURRENCIES[exchange],
    price: 0,
    day: 0
  }));
  const existing = new Set(STOCKS.map((stock) => `${stock.exchange}:${stock.symbol}`));
  STOCKS = [...STOCKS, ...remoteStocks.filter((stock) => !existing.has(`${stock.exchange}:${stock.symbol}`))];
  loadedExchanges.add(exchange);
}

async function loadCatalog(exchange = selectedExchange) {
  loadingCatalog = true;
  catalogError = "";
  renderStockResults();
  try {
    const exchanges = exchange === "All" ? REMOTE_EXCHANGES : [exchange];
    await Promise.all(exchanges.map(fetchExchangeCatalog));
  } catch (error) {
    catalogError = "Live catalog could not be reached.";
  } finally {
    loadingCatalog = false;
    renderStockResults();
  }
}

async function openHoldingEditor(symbol) {
  const holding = state.holdings.find((item) => item.symbol === symbol);
  const stock = stockFor(symbol) || holding;
  document.querySelector("#holding-symbol").value = symbol;
  document.querySelector("#holding-form-title").textContent = holding ? `Edit ${symbol}` : `Add ${symbol}`;
  document.querySelector("#holding-form-subtitle").textContent = `${stock.name} · ${stock.exchange} · ${currentPrice(stock)}`;
  document.querySelector("#holding-shares").value = holding?.shares ?? "";
  document.querySelector("#holding-cost").value = holding?.cost ?? stock.price;
  document.querySelector("#remove-holding").style.visibility = holding ? "visible" : "hidden";
  document.querySelector("#holding-editor").showModal();
  if (!stock.price) {
    const quoteLoaded = await refreshStockQuote(stock);
    document.querySelector("#holding-form-subtitle").textContent = quoteLoaded
      ? `${stock.name} · ${stock.exchange} · ${currentPrice(stock)}`
      : `${stock.name} · ${stock.exchange} · Live quote unavailable in the static preview`;
    if (!holding && stock.price) document.querySelector("#holding-cost").value = stock.price;
  }
}

async function refreshStockQuote(stock) {
  try {
    const response = await fetch(`/api/quote?symbol=${encodeURIComponent(stock.symbol)}&exchange=${encodeURIComponent(stock.exchange)}`);
    if (!response.ok) return false;
    const quote = await response.json();
    stock.price = Number(quote.close || quote.price || 0);
    stock.day = Number(quote.percent_change || 0);
    return Boolean(stock.price);
  } catch {
    // The static localhost demo has no Worker route. Quotes load after Pages deployment.
    return false;
  }
}

function renderCombinationChoices() {
  document.querySelector("#combination-choices").innerHTML = STOCKS.map((stock) => `
    <label class="choice-label"><input type="checkbox" name="combo-stock" value="${stock.symbol}" /> <strong>${stock.symbol}</strong> ${stock.name} · ${stock.exchange}</label>
  `).join("");
}

function openPicker() {
  document.querySelector("#stock-search").value = "";
  selectedExchange = "All";
  renderExchangeFilters();
  renderStockResults();
  document.querySelector("#stock-picker").showModal();
  loadCatalog();
}

function renderExchangeFilters() {
  document.querySelector("#exchange-filters").innerHTML = DISPLAY_EXCHANGES.map((exchange) => `<button class="filter-chip ${exchange === selectedExchange ? "active" : ""}" data-exchange="${exchange}">${exchange}</button>`).join("");
  document.querySelectorAll("[data-exchange]").forEach((button) => button.addEventListener("click", () => {
    selectedExchange = button.dataset.exchange; renderExchangeFilters(); renderStockResults(); loadCatalog();
  }));
}

document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.querySelector(`#${button.dataset.close}`).close()));
document.querySelector("#open-stock-picker").addEventListener("click", openPicker);
document.querySelector("#open-stock-picker-secondary").addEventListener("click", openPicker);
document.querySelector("#stock-search").addEventListener("input", renderStockResults);
document.querySelector("#holding-search").addEventListener("input", renderHoldings);
document.querySelector("#holding-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const symbol = document.querySelector("#holding-symbol").value;
  const stock = stockFor(symbol);
  const next = { ...stock, symbol, shares: Number(document.querySelector("#holding-shares").value), cost: Number(document.querySelector("#holding-cost").value) };
  state.holdings = [...state.holdings.filter((holding) => holding.symbol !== symbol), next];
  saveState(); document.querySelector("#holding-editor").close(); render();
});
document.querySelector("#remove-holding").addEventListener("click", () => {
  const symbol = document.querySelector("#holding-symbol").value;
  state.holdings = state.holdings.filter((holding) => holding.symbol !== symbol);
  saveState(); document.querySelector("#holding-editor").close(); render();
});
document.querySelector("#open-combination-modal").addEventListener("click", () => {
  document.querySelector("#combination-form").reset(); renderCombinationChoices(); document.querySelector("#combination-modal").showModal();
});
document.querySelector("#combination-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const symbols = [...document.querySelectorAll("[name='combo-stock']:checked")].map((input) => input.value);
  if (!symbols.length) return;
  const name = document.querySelector("#combination-name").value.trim();
  state.combinations.push({ id: `${Date.now()}`, name, symbols });
  saveState(); document.querySelector("#combination-modal").close(); render();
});
document.querySelectorAll(".currency-pill").forEach((button) => button.addEventListener("click", () => {
  displayCurrency = button.textContent;
  localStorage.setItem("northstar-currency", displayCurrency);
  render();
}));
document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  if (button.dataset.view === "markets") openPicker();
  if (button.dataset.view === "combinations") document.querySelector(".combination-panel").scrollIntoView({ behavior: "smooth" });
  if (button.dataset.view === "holdings") document.querySelector(".holdings-panel").scrollIntoView({ behavior: "smooth" });
}));
render();
