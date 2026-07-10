const data = window.TRADERSMATE_DATA || { commodities: [], terminals: [], prices: [] };
const shoppingItems = window.TRADERSMATE_SHOPPING_ITEMS || [];
const shoppingPrices = window.TRADERSMATE_SHOPPING_PRICES || [];

const modeGate = document.getElementById('modeGate');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const modeReset = document.getElementById('modeReset');
const modeEyebrow = document.getElementById('modeEyebrow');
const riskSwitch = document.getElementById('riskSwitch');
const tradingControls = document.getElementById('tradingControls');
const tradingResults = document.getElementById('tradingResults');
const shoppingControls = document.getElementById('shoppingControls');
const shoppingResults = document.getElementById('shoppingResults');
const shoppingSearch = document.getElementById('shoppingSearch');
const shoppingCategory = document.getElementById('shoppingCategory');
const shoppingBody = document.getElementById('shoppingBody');
const stationSelect = document.getElementById('stationSelect');
const materialSelect = document.getElementById('materialSelect');
const summary = document.getElementById('summary');
const resultsBody = document.getElementById('resultsBody');
const riskButtons = [...document.querySelectorAll('[data-risk]')];
let activeRisk = 'low';
let activeMode = '';

const riskLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const commoditiesById = new Map(data.commodities.map((commodity) => [commodity.id, commodity]));
const terminalsById = new Map(data.terminals.map((terminal) => [terminal.id, terminal]));
const pricesByTerminalMaterial = new Map();
const shoppingPricesByItem = new Map();

data.prices.forEach((price) => {
  pricesByTerminalMaterial.set(`${price.terminalId}:${price.commodityId}`, price);
});

shoppingPrices.forEach((price) => {
  const rows = shoppingPricesByItem.get(price.itemId) || [];
  rows.push(price);
  shoppingPricesByItem.set(price.itemId, rows);
});

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.label.localeCompare(b.label, 'de'));
}

function terminalLabel(terminal) {
  const rawName = terminal.terminalName || terminal.fullName || terminal.name;
  const system = terminal.system || '';
  const station = terminal.station || terminal.city || terminal.outpost || terminal.planet || '';
  const cleanedName = rawName
    .replace(/^Commodity Shop - /i, '')
    .replace(/^TDD - Trade and Development Division - /i, 'TDD - ')
    .replace(/^Admin - /i, 'Admin ');

  if (/^TDD - /i.test(cleanedName)) {
    return cleanedName
      .replace(/^TDD - /i, 'TDD - ')
      .replace(/^TDD - (Cloudview Center - )?/i, 'TDD - ')
      .replace(/^TDD - (Commons - )?/i, 'TDD - ');
  }

  if (/^Admin /i.test(cleanedName)) {
    const location = (station || cleanedName.replace(/^Admin /i, '')).replace(/\s*\([^)]*\)\s*$/, '');
    return system ? `${location} - Admin - ${system}` : `${location} - Admin`;
  }

  if (/^Platinum Bay/i.test(cleanedName)) {
    const location = (station || cleanedName.replace(/^Platinum Bay\s*-?\s*/i, '')).replace(/\s*\([^)]*\)\s*$/, '');
    return system ? `${location} - Platinum Bay - ${system}` : `${location} - Platinum Bay`;
  }

  return system ? `${cleanedName} - ${system}` : cleanedName;
}

function commodityLabel(commodity) {
  return commodity.code ? `${commodity.name} (${commodity.code})` : commodity.name;
}

function commodityRisk(commodity) {
  const name = commodity.name.toLowerCase();
  const kind = String(commodity.kind || '').toLowerCase();

  if (
    commodity.isIllegal ||
    /drug|vice|temporary/.test(kind) ||
    /maze|neon|etam|altruciatoxin|osoian|hadanite|dolivine|aphorite|janalite|quantainium|feynmaline|beradom|glacosite|luminalia|year of/.test(
      name,
    )
  ) {
    return 'high';
  }

  if (
    /metal|mineral|explosive|medical|man-made|man-made|raw materials|chemical|electronics|crafting/.test(kind) ||
    /gold|diamond|laranite|agricium|bexalite|taranite|titanium|tungsten|mercury|dyna|astatine|iodine|recycled material composite/.test(
      name,
    )
  ) {
    return 'medium';
  }

  return 'low';
}

function commodityMatchesRisk(commodity) {
  return commodityRisk(commodity) === activeRisk;
}

function fillSelect(select, options, placeholder) {
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
  if (options.some((item) => item.value === current)) {
    select.value = current;
  }
}

function showMode(mode) {
  activeMode = mode;
  modeGate.classList.add('is-hidden');
  const isTrading = mode === 'trading';

  modeEyebrow.textContent = isTrading ? 'Star Citizen Trading' : 'Star Citizen Shopping';
  riskSwitch.classList.toggle('is-hidden', !isTrading);
  tradingControls.classList.toggle('is-hidden', !isTrading);
  tradingResults.classList.toggle('is-hidden', !isTrading);
  shoppingControls.classList.toggle('is-hidden', isTrading);
  shoppingResults.classList.toggle('is-hidden', isTrading);

  if (isTrading) {
    renderRoutes();
  } else {
    renderShopping();
  }
}

function showModeGate() {
  activeMode = '';
  modeGate.classList.remove('is-hidden');
  summary.textContent = 'Waehle Trading oder Shopping.';
}

function formatNumber(value) {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value);
}

function formatCredits(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return '-';
  }
  return `${formatNumber(number)} aUEC`;
}

function formatSignedCredits(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '-';
  }
  if (number === 0) {
    return '0 aUEC';
  }
  return `${number > 0 ? '+' : '-'}${formatCredits(Math.abs(number))}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSelectedPrice() {
  const stationId = Number(stationSelect.value);
  const commodityId = Number(materialSelect.value);
  if (!stationId || !commodityId) {
    return null;
  }
  return pricesByTerminalMaterial.get(`${stationId}:${commodityId}`) || null;
}

function allTerminalOptions() {
  return data.terminals
    .filter((terminal) => terminalHasSellGoods(terminal.id))
    .filter((terminal) => !isMiningFacility(terminal))
    .map((terminal) => ({
      value: String(terminal.id),
      label: terminalLabel(terminal),
    }));
}

function allCommodityOptions() {
  return data.commodities
    .filter(commodityMatchesRisk)
    .map((commodity) => ({
      value: String(commodity.id),
      label: commodityLabel(commodity),
    }));
}

function commodityOptionsForStation(stationId) {
  const commodityIds = new Set(
    data.prices
      .filter((price) => price.terminalId === stationId)
      .filter((price) => Number(price.priceBuy) > 0)
      .map((price) => price.commodityId),
  );

  return data.commodities
    .filter((commodity) => commodityIds.has(commodity.id))
    .filter(commodityMatchesRisk)
    .map((commodity) => ({
      value: String(commodity.id),
      label: commodityLabel(commodity),
    }));
}

function terminalHasSellGoods(terminalId) {
  return data.prices.some(
    (price) => price.terminalId === terminalId && Number(price.priceBuy) > 0,
  );
}

function isMiningFacility(terminal) {
  const text = [
    terminal.name,
    terminal.terminalName,
    terminal.fullName,
    terminal.nickname,
    terminal.station,
    terminal.outpost,
  ]
    .filter(Boolean)
    .join(' ');
  return /mining facility/i.test(text);
}

function refreshOptions() {
  fillSelect(stationSelect, uniqueSorted(allTerminalOptions()), 'Station waehlen');
  const stationId = Number(stationSelect.value);
  const materialOptions = stationId ? commodityOptionsForStation(stationId) : [];
  const placeholder = stationId
    ? `${riskLabels[activeRisk]} Material waehlen`
    : 'Erst Startstation waehlen';

  fillSelect(materialSelect, uniqueSorted(materialOptions), placeholder);
  materialSelect.disabled = !stationId || materialOptions.length === 0;
}

function renderEmpty(text) {
  resultsBody.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(text)}</td></tr>`;
  summary.textContent = text;
}

function shoppingCategoryOptions() {
  return [...new Set(shoppingItems.map((item) => item.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map((category) => ({
      value: category,
      label: category,
    }));
}

function shoppingShopLabel(terminalName) {
  const name = String(terminalName || '').trim();
  const locations = [
    'Area 18',
    'New Babbage',
    'Orison',
    'Lorville',
    'Grim HEX',
    'Levski',
    'Port Tressler',
    'Everus Harbor',
    'Baijini Point',
    'Seraphim Station',
  ];
  const location = locations.find((item) => name.toLowerCase().endsWith(item.toLowerCase()));
  if (!location) {
    return name;
  }

  const shop = name.slice(0, -location.length).trim().replace(/\s+-\s+$/, '').trim();
  return shop ? `${shop} - ${location}` : location;
}

function renderShopping() {
  const query = shoppingSearch.value.trim().toLowerCase();
  const category = shoppingCategory.value;
  const filteredItems = shoppingItems
    .filter((item) => !category || item.category === category)
    .filter((item) => {
      if (!query) {
        return true;
      }
      return [item.name, item.section, item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  const matches = filteredItems.filter((item) => shoppingPricesByItem.has(item.id));
  const unavailableMatches = filteredItems.length - matches.length;

  summary.textContent = `${matches.length} kaufbare Shopping-Items angezeigt.`;
  if (!matches.length) {
    const text = unavailableMatches
      ? 'Gefundene Items stehen aktuell nicht zum Verkauf.'
      : 'Keine Items gefunden.';
    shoppingBody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(text)}</td></tr>`;
    summary.textContent = text;
    return;
  }

  shoppingBody.innerHTML = matches
    .map((item) => {
      const shops = (shoppingPricesByItem.get(item.id) || [])
        .sort((a, b) => a.price - b.price || a.terminal.localeCompare(b.terminal, 'de'));
      const shopHtml = shops
        .slice(0, 6)
        .map((shop) => `<span>${escapeHtml(shoppingShopLabel(shop.terminal))} - ${formatCredits(shop.price)}</span>`)
        .join('');
      const hiddenShopHtml = shops
        .slice(6)
        .map(
          (shop) =>
            `<span class="extra-shop is-hidden">${escapeHtml(shoppingShopLabel(shop.terminal))} - ${formatCredits(shop.price)}</span>`,
        )
        .join('');
      const extra =
        shops.length > 6
          ? `<button type="button" class="more-shops-button" data-more-shops>+${shops.length - 6} weitere</button>`
          : '';

      return `
        <tr>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>${escapeHtml(item.section || '-')}</td>
          <td>${escapeHtml(item.category || '-')}</td>
          <td><div class="shop-list">${shopHtml}${hiddenShopHtml}${extra}</div></td>
        </tr>
      `;
    })
    .join('');
}

function terminalArea(terminal) {
  return [terminal.station, terminal.city, terminal.outpost, terminal.planet]
    .filter(Boolean)
    .join(' / ');
}

function buildBuyerRows(startPrice, commodityId, startTerminalId) {
  return data.prices
    .filter((price) => price.commodityId === commodityId)
    .filter((price) => price.terminalId !== startTerminalId)
    .filter((price) => Number(price.priceSell) > 0)
    .map((price) => {
      const terminal = terminalsById.get(price.terminalId);
      const sellPrice = Number(price.priceSell);
      const buyPrice = Number(startPrice.priceBuy);
      const profitPerScu = sellPrice - buyPrice;
      const margin = buyPrice > 0 ? (profitPerScu / buyPrice) * 100 : 0;
      return {
        terminal,
        price,
        sellPrice,
        buyPrice,
        profitPerScu,
        margin,
      };
    })
    .filter((row) => row.terminal)
    .filter((row) => !isMiningFacility(row.terminal))
    .sort(
      (a, b) =>
        b.profitPerScu - a.profitPerScu ||
        terminalLabel(a.terminal).localeCompare(terminalLabel(b.terminal), 'de'),
    );
}

function routeFlags(row, startTerminal) {
  const flags = [];
  if (startTerminal.system && row.terminal.system && startTerminal.system === row.terminal.system) {
    flags.push('gleiches System');
  }
  if (row.terminal.isAutoLoad) {
    flags.push('Auto-Load');
  }
  if (row.terminal.hasLoadingDock) {
    flags.push('Loading Dock');
  }
  if (row.price.scuSell) {
    flags.push(`${formatNumber(row.price.scuSell)} SCU Nachfrage`);
  }
  return flags;
}

function renderRoutes() {
  const startTerminalId = Number(stationSelect.value);
  const commodityId = Number(materialSelect.value);

  if (!startTerminalId || !commodityId) {
    renderEmpty(
      `${data.terminals.length} Terminals und ${data.commodities.length} Waren geladen. Risiko ${riskLabels[activeRisk]}: Waehle Startstation und Material.`,
    );
    return;
  }

  const startTerminal = terminalsById.get(startTerminalId);
  const commodity = commoditiesById.get(commodityId);
  const startPrice = getSelectedPrice();

  if (!startPrice || Number(startPrice.priceBuy) <= 0) {
    renderEmpty(`${commodityLabel(commodity)} kannst du an ${terminalLabel(startTerminal)} aktuell nicht kaufen.`);
    return;
  }

  const buyers = buildBuyerRows(startPrice, commodityId, startTerminalId);
  if (!buyers.length) {
    renderEmpty(`Keine Verkaufsstellen fuer ${commodityLabel(commodity)} gefunden.`);
    return;
  }

  const profitable = buyers.filter((row) => row.profitPerScu > 0).length;
  summary.textContent = `${buyers.length} Verkaufsstellen fuer ${commodityLabel(commodity)} ab ${terminalLabel(startTerminal)} gefunden, davon ${profitable} profitabel.`;

  resultsBody.innerHTML = buyers
    .map((row) => {
      const profitClass = row.profitPerScu > 0 ? 'profit' : row.profitPerScu < 0 ? 'loss' : '';
      const area = terminalArea(row.terminal);
      const flags = routeFlags(row, startTerminal);

      return `
        <tr>
          <td>
            <strong>${escapeHtml(terminalLabel(row.terminal))}</strong>
            ${area ? `<span class="destination-sub">${escapeHtml(area)}</span>` : ''}
          </td>
          <td>${escapeHtml(row.terminal.system || '-')}</td>
          <td>${formatCredits(row.buyPrice)}</td>
          <td>${formatCredits(row.sellPrice)}</td>
          <td class="${profitClass}">${formatSignedCredits(row.profitPerScu)}</td>
          <td>${formatNumber(row.margin)}%</td>
          <td>
            <div class="flags">
              ${flags.map((flag) => `<span>${escapeHtml(flag)}</span>`).join('')}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

stationSelect.addEventListener('change', () => {
  refreshOptions();
  renderRoutes();
});
materialSelect.addEventListener('change', renderRoutes);
shoppingSearch.addEventListener('input', renderShopping);
shoppingCategory.addEventListener('change', renderShopping);
shoppingBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-more-shops]');
  if (!button) {
    return;
  }

  const shopList = button.closest('.shop-list');
  shopList.querySelectorAll('.extra-shop').forEach((shop) => shop.classList.remove('is-hidden'));
  button.remove();
});
modeReset.addEventListener('click', showModeGate);

modeButtons.forEach((button) => {
  button.addEventListener('click', () => showMode(button.dataset.mode));
});

riskButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeRisk = button.dataset.risk;
    riskButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    refreshOptions();
    renderRoutes();
  });
});

refreshOptions();
fillSelect(shoppingCategory, shoppingCategoryOptions(), 'Alle Kategorien');
showModeGate();
