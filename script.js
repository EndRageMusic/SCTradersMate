const data = window.TRADERSMATE_DATA || { commodities: [], terminals: [], prices: [] };
const shoppingItems = window.TRADERSMATE_SHOPPING_ITEMS || [];
const componentAttributes = window.TRADERSMATE_COMPONENT_ATTRIBUTES || {};
const shoppingPrices = window.TRADERSMATE_SHOPPING_PRICES || [];
const ships = window.TRADERSMATE_SHIPS || [];
const groundVehicles = window.TRADERSMATE_GROUND_VEHICLES || [];

const modeGate = document.getElementById('modeGate');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const modeReset = document.getElementById('modeReset');
const modeEyebrow = document.getElementById('modeEyebrow');
const modeTitle = document.getElementById('modeTitle');
const tradingControls = document.getElementById('tradingControls');
const tradingResults = document.getElementById('tradingResults');
const shoppingControls = document.getElementById('shoppingControls');
const shoppingResults = document.getElementById('shoppingResults');
const shoppingSearch = document.getElementById('shoppingSearch');
const shoppingCategory = document.getElementById('shoppingCategory');
const shoppingBody = document.getElementById('shoppingBody');
const shipControls = document.getElementById('shipControls');
const shipResults = document.getElementById('shipResults');
const shipSearch = document.getElementById('shipSearch');
const shipManufacturer = document.getElementById('shipManufacturer');
const shipBody = document.getElementById('shipBody');
const groundVehicleControls = document.getElementById('groundVehicleControls');
const groundVehicleResults = document.getElementById('groundVehicleResults');
const groundVehicleSearch = document.getElementById('groundVehicleSearch');
const groundVehicleManufacturer = document.getElementById('groundVehicleManufacturer');
const groundVehicleBody = document.getElementById('groundVehicleBody');
const systemSelect = document.getElementById('systemSelect');
const subsystemSelect = document.getElementById('subsystemSelect');
const stationSelect = document.getElementById('stationSelect');
const materialSelect = document.getElementById('materialSelect');
const scuMultiplierInput = document.getElementById('scuMultiplierInput');
const summary = document.getElementById('summary');
const resultsBody = document.getElementById('resultsBody');
const tradingMetrics = document.getElementById('tradingMetrics');
const bestProfitMetric = document.getElementById('bestProfitMetric');
const bestProfitTarget = document.getElementById('bestProfitTarget');
const bestMarginMetric = document.getElementById('bestMarginMetric');
const bestMarginMaterial = document.getElementById('bestMarginMaterial');
const destinationCountMetric = document.getElementById('destinationCountMetric');
const profitableCountMetric = document.getElementById('profitableCountMetric');
const purchasePriceMetric = document.getElementById('purchasePriceMetric');
const purchaseStationMetric = document.getElementById('purchaseStationMetric');
const selectedRoute = document.getElementById('selectedRoute');
const selectedRouteDestination = document.getElementById('selectedRouteDestination');
const selectedRouteSystem = document.getElementById('selectedRouteSystem');
const selectedRouteBuy = document.getElementById('selectedRouteBuy');
const selectedRouteSell = document.getElementById('selectedRouteSell');
const selectedRouteProfit = document.getElementById('selectedRouteProfit');
const selectedRouteMargin = document.getElementById('selectedRouteMargin');
const selectedRouteFlags = document.getElementById('selectedRouteFlags');
let activeMode = '';
let currentBuyerRows = [];
let currentStartTerminal = null;

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
    const location = (station || cleanedName
      .replace(/^TDD - /i, 'TDD - ')
      .replace(/^TDD - (Cloudview Center - )?/i, 'TDD - ')
      .replace(/^TDD - (Commons - )?/i, 'TDD - ')
      .replace(/^TDD - /i, '')).replace(/\s*\([^)]*\)\s*$/, '');
    return location ? `${location} - TDD` : 'TDD';
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
  const isComponents = mode === 'components';
  const isShips = mode === 'ships';
  const isGroundVehicles = mode === 'groundVehicles';

  modeEyebrow.textContent = isTrading
    ? 'Star Citizen Trading'
    : isComponents
      ? 'Star Citizen Komponenten'
      : isShips
        ? 'Star Citizen Schiffe'
        : isGroundVehicles
          ? 'Star Citizen Bodenfahrzeuge'
          : 'Star Citizen Shopping';
  modeTitle.textContent = isTrading
    ? 'Handelsrouten'
    : isComponents
      ? 'Komponenten & Schiffswaffen'
      : isShips
        ? 'Schiffe kaufen'
        : isGroundVehicles
          ? 'Bodenfahrzeuge'
          : 'Shopping';
  tradingControls.classList.toggle('is-hidden', !isTrading);
  tradingResults.classList.toggle('is-hidden', !isTrading);
  shoppingControls.classList.toggle('is-hidden', isTrading || isShips || isGroundVehicles);
  shoppingResults.classList.toggle('is-hidden', isTrading || isShips || isGroundVehicles);
  shoppingResults.classList.toggle('is-components-view', isComponents);
  shipControls.classList.toggle('is-hidden', !isShips);
  shipResults.classList.toggle('is-hidden', !isShips);
  groundVehicleControls.classList.toggle('is-hidden', !isGroundVehicles);
  groundVehicleResults.classList.toggle('is-hidden', !isGroundVehicles);
  tradingMetrics.classList.toggle('is-hidden', !isTrading);
  selectedRoute.classList.toggle('is-hidden', !isTrading || !selectedRoute.dataset.selected);
  modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  });

  if (isTrading) {
    renderRoutes();
  } else if (isShips) {
    renderShips();
  } else if (isGroundVehicles) {
    renderGroundVehicles();
  } else {
    shoppingSearch.value = '';
    shoppingCategory.value = '';
    fillSelect(shoppingCategory, shoppingCategoryOptions(), 'Alle Kategorien');
    renderShopping();
  }
}

function showModeGate() {
  activeMode = '';
  modeGate.classList.remove('is-hidden');
  summary.textContent = 'Waehle Trading, Shopping, Komponenten, Schiffe oder Bodenfahrzeuge.';
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

function getScuMultiplier() {
  const value = Math.floor(Number(scuMultiplierInput.value));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function allTerminalOptions() {
  const selectedSystem = systemSelect.value;
  const selectedSubsystem = subsystemSelect.value;
  return data.terminals
    .filter((terminal) => terminalHasSellGoods(terminal.id))
    .filter((terminal) => !isMiningFacility(terminal))
    .filter((terminal) => terminal.system === selectedSystem)
    .filter((terminal) => terminalSubsystem(terminal) === selectedSubsystem)
    .map((terminal) => ({
      value: String(terminal.id),
      label: terminalLabel(terminal),
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
  fillSelect(systemSelect, systemOptions(), 'System waehlen');
  const selectedSystem = systemSelect.value;
  fillSelect(
    subsystemSelect,
    selectedSystem ? subsystemOptions(selectedSystem) : [],
    selectedSystem ? 'Untersystem waehlen' : 'Erst System waehlen',
  );
  subsystemSelect.disabled = !selectedSystem;

  const selectedSubsystem = subsystemSelect.value;
  fillSelect(
    stationSelect,
    selectedSystem && selectedSubsystem ? uniqueSorted(allTerminalOptions()) : [],
    selectedSubsystem ? 'Station waehlen' : 'Erst Untersystem waehlen',
  );
  stationSelect.disabled = !selectedSystem || !selectedSubsystem;
  const stationId = Number(stationSelect.value);
  const materialOptions = stationId ? commodityOptionsForStation(stationId) : [];
  const placeholder = stationId
    ? 'Material waehlen'
    : 'Erst Startstation waehlen';

  fillSelect(materialSelect, uniqueSorted(materialOptions), placeholder);
  materialSelect.disabled = !stationId || materialOptions.length === 0;
}

function renderEmpty(text) {
  resultsBody.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(text)}</td></tr>`;
  summary.textContent = text;
  resetTradingMetrics();
}

function populateDatasetStatus() {
  const values = {
    gateTerminalCount: data.terminals.length,
    statusTerminalCount: data.terminals.length,
    gateCommodityCount: data.commodities.length,
    statusCommodityCount: data.commodities.length,
    gateItemCount: shoppingItems.length,
    statusItemCount: shoppingItems.length,
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = formatNumber(value);
    }
  });

  const generatedAt = document.getElementById('statusGeneratedAt');
  if (generatedAt) {
    generatedAt.textContent = String(data.generatedAt || '-').slice(0, 10);
  }
}

function resetTradingMetrics() {
  bestProfitMetric.textContent = '-';
  bestProfitMetric.className = '';
  bestProfitTarget.textContent = 'Route wählen';
  bestMarginMetric.textContent = '-';
  bestMarginMetric.className = '';
  bestMarginMaterial.textContent = 'Material wählen';
  destinationCountMetric.innerHTML = '0 <em>Ziele</em>';
  profitableCountMetric.textContent = '0 profitabel';
  purchasePriceMetric.textContent = '-';
  purchaseStationMetric.textContent = 'Startstation wählen';
  clearSelectedRoute();
}

function clearSelectedRoute() {
  selectedRoute.classList.add('is-hidden');
  delete selectedRoute.dataset.selected;
  currentBuyerRows = [];
  currentStartTerminal = null;
}

function selectRoute(index) {
  const row = currentBuyerRows[index];
  if (!row || !currentStartTerminal) {
    return;
  }

  const flags = routeFlags(row, currentStartTerminal);
  resultsBody.querySelectorAll('[data-route-index]').forEach((tableRow) => {
    const isSelected = Number(tableRow.dataset.routeIndex) === index;
    tableRow.classList.toggle('is-selected', isSelected);
    tableRow.setAttribute('aria-selected', String(isSelected));
  });

  selectedRouteDestination.textContent = terminalLabel(row.terminal);
  selectedRouteSystem.textContent = row.terminal.system || '-';
  selectedRouteBuy.textContent = formatCredits(row.buyPrice);
  selectedRouteSell.textContent = formatCredits(row.sellPrice);
  selectedRouteProfit.textContent = formatSignedCredits(row.profitTotal);
  selectedRouteProfit.className = row.profitTotal > 0 ? 'profit' : row.profitTotal < 0 ? 'loss' : '';
  selectedRouteMargin.textContent = `${formatNumber(row.margin)}%`;
  selectedRouteMargin.className = row.margin > 0 ? 'profit' : row.margin < 0 ? 'loss' : '';
  selectedRouteFlags.textContent = flags.length ? flags.join(' · ') : '-';
  selectedRoute.dataset.selected = 'true';
  selectedRoute.classList.remove('is-hidden');
}

function shoppingCategoryOptions() {
  return [...new Set(shoppingItems.filter(isShoppingItemVisible).map(shoppingItemCategory).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map((category) => ({
      value: category,
      label: category,
    }));
}

function systemOptions() {
  const availableSystems = new Set(
    data.terminals
      .filter((terminal) => terminalHasSellGoods(terminal.id))
      .filter((terminal) => !isMiningFacility(terminal))
      .map((terminal) => terminal.system)
      .filter(Boolean),
  );

  return ['Stanton', 'Nyx', 'Pyro']
    .filter((system) => availableSystems.has(system))
    .map((system) => ({ value: system, label: system }));
}

function terminalSubsystem(terminal) {
  return terminal.planet || 'Stationen & Gateways';
}

function subsystemOptions(system) {
  return [...new Set(
    data.terminals
      .filter((terminal) => terminal.system === system)
      .filter((terminal) => terminalHasSellGoods(terminal.id))
      .filter((terminal) => !isMiningFacility(terminal))
      .map(terminalSubsystem),
  )]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map((subsystem) => ({ value: subsystem, label: subsystem }));
}

function isShoppingItemVisible(item) {
  const section = String(item.section || '').toLowerCase();
  if (activeMode === 'components') {
    return section === 'systems' || section === 'vehicle weapons';
  }
  return section !== 'commodities' && section !== 'systems';
}

function shoppingItemCategory(item) {
  if (item.category === 'Docking Collars') {
    return 'Fuel Nozzles';
  }

  if (item.section === 'Vehicle Weapons' && item.category === 'Guns') {
    const name = String(item.name || '');
    if (/\bscattergun\b/i.test(name)) {
      return 'Scatterguns';
    }
    if (/\bgatling\b/i.test(name)) {
      return 'Gatlings';
    }
    if (/^(SW16BR[123]|Tigerstrike T-19P)$/i.test(name)) {
      return 'Gatlings';
    }
    if (/\brepeater\b/i.test(name)) {
      return 'Repeaters';
    }
    if (/\bcannon\b/i.test(name)) {
      return 'Cannons';
    }
    return 'Other Guns';
  }

  const isWeaponMagazine =
    String(item.section || '').toLowerCase() === 'personal weapons' &&
    /\bmagazine\b/i.test(item.name || '');
  return isWeaponMagazine ? 'Munition' : item.category;
}

function componentAttribute(item, attribute) {
  return componentAttributes[item.id]?.[attribute] || '';
}

function shoppingShopLabel(terminalName) {
  const name = String(terminalName || '').trim();
  const knownShops = {
    'centermass area 18': 'CenterMass - IO North Tower - Area 18',
    "dumper's area 18": "Dumper's Depot - Area 18",
    "dumper's grimhex": "Dumper's Depot - Grim HEX",
  };
  const knownShop = knownShops[name.toLowerCase()];
  if (knownShop) {
    return knownShop;
  }

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
    .filter(isShoppingItemVisible)
    .filter((item) => !category || shoppingItemCategory(item) === category)
    .filter((item) => {
      if (!query) {
        return true;
      }
      return [
        item.name,
        item.section,
        shoppingItemCategory(item),
        componentAttribute(item, 'grade'),
        componentAttribute(item, 'class'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  const matches = filteredItems.filter((item) => shoppingPricesByItem.has(item.id));
  const unavailableMatches = filteredItems.length - matches.length;

  const resultName = activeMode === 'components' ? 'Komponenten und Schiffswaffen' : 'Shopping-Items';
  summary.textContent = `${matches.length} kaufbare ${resultName} angezeigt.`;
  if (!matches.length) {
    const text = unavailableMatches
      ? 'Gefundene Items stehen aktuell nicht zum Verkauf.'
      : 'Keine Items gefunden.';
    shoppingBody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(text)}</td></tr>`;
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
          <td>${escapeHtml(shoppingItemCategory(item) || '-')}</td>
          <td>${escapeHtml(componentAttribute(item, 'grade') || '-')}</td>
          <td>${escapeHtml(componentAttribute(item, 'class') || '-')}</td>
          <td><div class="shop-list">${shopHtml}${hiddenShopHtml}${extra}</div></td>
        </tr>
      `;
    })
    .join('');
}

function shipManufacturerOptions() {
  return [...new Set(ships.map((ship) => ship.manufacturer).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map((manufacturer) => ({ value: manufacturer, label: manufacturer }));
}

function renderShips() {
  const query = shipSearch.value.trim().toLowerCase();
  const manufacturer = shipManufacturer.value;
  const matches = ships
    .filter((ship) => !manufacturer || ship.manufacturer === manufacturer)
    .filter((ship) => {
      if (!query) {
        return true;
      }
      return [ship.name, ship.manufacturer]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

  summary.textContent = `${matches.length} ingame kaufbare Schiffe angezeigt.`;
  if (!matches.length) {
    shipBody.innerHTML = '<tr><td colspan="5" class="empty">Keine kaufbaren Schiffe gefunden.</td></tr>';
    return;
  }

  shipBody.innerHTML = matches
    .map((ship) => {
      const shopHtml = ship.shops
        .slice(0, 3)
        .map((shop) => `<span>${escapeHtml(shop.terminal)} - ${formatCredits(shop.price)}</span>`)
        .join('');
      const hiddenShopHtml = ship.shops
        .slice(3)
        .map(
          (shop) =>
            `<span class="extra-shop is-hidden">${escapeHtml(shop.terminal)} - ${formatCredits(shop.price)}</span>`,
        )
        .join('');
      const extra =
        ship.shops.length > 3
          ? `<button type="button" class="more-shops-button" data-more-shops>+${ship.shops.length - 3} weitere</button>`
          : '';

      return `
        <tr>
          <td><strong>${escapeHtml(ship.name)}</strong></td>
          <td>${escapeHtml(ship.manufacturer || '-')}</td>
          <td>${ship.scu ? `${formatNumber(ship.scu)} SCU` : '-'}</td>
          <td>${escapeHtml(ship.crew || '-')}</td>
          <td><div class="shop-list">${shopHtml}${hiddenShopHtml}${extra}</div></td>
        </tr>
      `;
    })
    .join('');
}

function groundVehicleManufacturerOptions() {
  return [...new Set(groundVehicles.map((vehicle) => vehicle.manufacturer).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map((manufacturer) => ({ value: manufacturer, label: manufacturer }));
}

function renderGroundVehicles() {
  const query = groundVehicleSearch.value.trim().toLowerCase();
  const manufacturer = groundVehicleManufacturer.value;
  const matches = groundVehicles
    .filter((vehicle) => !manufacturer || vehicle.manufacturer === manufacturer)
    .filter((vehicle) => {
      if (!query) {
        return true;
      }
      return [vehicle.name, vehicle.manufacturer]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

  summary.textContent = `${matches.length} ingame kaufbare Bodenfahrzeuge angezeigt.`;
  if (!matches.length) {
    groundVehicleBody.innerHTML =
      '<tr><td colspan="5" class="empty">Keine kaufbaren Bodenfahrzeuge gefunden.</td></tr>';
    return;
  }

  groundVehicleBody.innerHTML = matches
    .map((vehicle) => {
      const shopHtml = vehicle.shops
        .slice(0, 3)
        .map((shop) => `<span>${escapeHtml(shop.terminal)} - ${formatCredits(shop.price)}</span>`)
        .join('');
      const hiddenShopHtml = vehicle.shops
        .slice(3)
        .map(
          (shop) =>
            `<span class="extra-shop is-hidden">${escapeHtml(shop.terminal)} - ${formatCredits(shop.price)}</span>`,
        )
        .join('');
      const extra =
        vehicle.shops.length > 3
          ? `<button type="button" class="more-shops-button" data-more-shops>+${vehicle.shops.length - 3} weitere</button>`
          : '';

      return `
        <tr>
          <td><strong>${escapeHtml(vehicle.name)}</strong></td>
          <td>${escapeHtml(vehicle.manufacturer || '-')}</td>
          <td>${vehicle.scu ? `${formatNumber(vehicle.scu)} SCU` : '-'}</td>
          <td>${escapeHtml(vehicle.crew || '-')}</td>
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
  const scuMultiplier = getScuMultiplier();
  return data.prices
    .filter((price) => price.commodityId === commodityId)
    .filter((price) => price.terminalId !== startTerminalId)
    .filter((price) => Number(price.priceSell) > 0)
    .map((price) => {
      const terminal = terminalsById.get(price.terminalId);
      const sellPrice = Number(price.priceSell) * scuMultiplier;
      const buyPrice = Number(startPrice.priceBuy) * scuMultiplier;
      const profitTotal = sellPrice - buyPrice;
      const margin = buyPrice > 0 ? (profitTotal / buyPrice) * 100 : 0;
      return {
        terminal,
        price,
        sellPrice,
        buyPrice,
        scuMultiplier,
        profitTotal,
        margin,
      };
    })
    .filter((row) => row.terminal)
    .filter((row) => !isMiningFacility(row.terminal))
    .sort(
      (a, b) =>
        b.profitTotal - a.profitTotal ||
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
      `${data.terminals.length} Terminals und ${data.commodities.length} Waren geladen. Waehle Startstation und Material.`,
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

  const profitable = buyers.filter((row) => row.profitTotal > 0).length;
  clearSelectedRoute();
  currentBuyerRows = buyers;
  currentStartTerminal = startTerminal;
  const bestProfit = buyers[0];
  const bestMargin = [...buyers].sort((a, b) => b.margin - a.margin)[0];
  const scuMultiplier = getScuMultiplier();
  summary.textContent = `${buyers.length} Verkaufsstellen fuer ${formatNumber(scuMultiplier)} SCU ${commodityLabel(commodity)} ab ${terminalLabel(startTerminal)} gefunden, davon ${profitable} profitabel.`;
  bestProfitMetric.textContent = formatSignedCredits(bestProfit.profitTotal);
  bestProfitMetric.className = bestProfit.profitTotal > 0 ? 'profit' : bestProfit.profitTotal < 0 ? 'loss' : '';
  bestProfitTarget.textContent = `→ ${terminalLabel(bestProfit.terminal)}`;
  bestMarginMetric.textContent = `${formatNumber(bestMargin.margin)}%`;
  bestMarginMetric.className = bestMargin.margin > 0 ? 'profit' : bestMargin.margin < 0 ? 'loss' : '';
  bestMarginMaterial.textContent = commodityLabel(commodity);
  destinationCountMetric.innerHTML = `${buyers.length} <em>Ziele</em>`;
  profitableCountMetric.textContent = `${profitable} profitabel`;
  purchasePriceMetric.textContent = formatCredits(Number(startPrice.priceBuy) * scuMultiplier);
  purchaseStationMetric.textContent = `${formatNumber(scuMultiplier)} SCU · ${terminalLabel(startTerminal)}`;

  resultsBody.innerHTML = buyers
    .map((row, index) => {
      const profitClass = row.profitTotal > 0 ? 'profit' : row.profitTotal < 0 ? 'loss' : '';
      const marginClass = row.margin > 0 ? 'profit' : row.margin < 0 ? 'loss' : '';
      const area = terminalArea(row.terminal);
      const flags = routeFlags(row, startTerminal);

      return `
        <tr data-route-index="${index}" tabindex="0" role="button" aria-selected="false">
          <td>
            <strong>${escapeHtml(terminalLabel(row.terminal))}</strong>
            ${area ? `<span class="destination-sub">${escapeHtml(area)}</span>` : ''}
          </td>
          <td>${escapeHtml(row.terminal.system || '-')}</td>
          <td>${formatCredits(row.buyPrice)}</td>
          <td>${formatCredits(row.sellPrice)}</td>
          <td class="${profitClass}">${formatSignedCredits(row.profitTotal)}</td>
          <td class="${marginClass}">${formatNumber(row.margin)}%</td>
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

resultsBody.addEventListener('click', (event) => {
  const row = event.target.closest('[data-route-index]');
  if (row) {
    selectRoute(Number(row.dataset.routeIndex));
  }
});

resultsBody.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }
  const row = event.target.closest('[data-route-index]');
  if (row) {
    event.preventDefault();
    selectRoute(Number(row.dataset.routeIndex));
  }
});

stationSelect.addEventListener('change', () => {
  refreshOptions();
  renderRoutes();
});
systemSelect.addEventListener('change', () => {
  subsystemSelect.value = '';
  stationSelect.value = '';
  materialSelect.value = '';
  refreshOptions();
  renderRoutes();
});
subsystemSelect.addEventListener('change', () => {
  stationSelect.value = '';
  materialSelect.value = '';
  refreshOptions();
  renderRoutes();
});
materialSelect.addEventListener('change', renderRoutes);
scuMultiplierInput.addEventListener('input', renderRoutes);
shoppingSearch.addEventListener('input', renderShopping);
shoppingCategory.addEventListener('change', renderShopping);
shipSearch.addEventListener('input', renderShips);
shipManufacturer.addEventListener('change', renderShips);
groundVehicleSearch.addEventListener('input', renderGroundVehicles);
groundVehicleManufacturer.addEventListener('change', renderGroundVehicles);
shoppingBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-more-shops]');
  if (!button) {
    return;
  }

  const shopList = button.closest('.shop-list');
  shopList.querySelectorAll('.extra-shop').forEach((shop) => shop.classList.remove('is-hidden'));
  button.remove();
});
shipBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-more-shops]');
  if (!button) {
    return;
  }

  const shopList = button.closest('.shop-list');
  shopList.querySelectorAll('.extra-shop').forEach((shop) => shop.classList.remove('is-hidden'));
  button.remove();
});
groundVehicleBody.addEventListener('click', (event) => {
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

refreshOptions();
fillSelect(shoppingCategory, shoppingCategoryOptions(), 'Alle Kategorien');
fillSelect(shipManufacturer, shipManufacturerOptions(), 'Alle Hersteller');
fillSelect(groundVehicleManufacturer, groundVehicleManufacturerOptions(), 'Alle Hersteller');
populateDatasetStatus();
showModeGate();
