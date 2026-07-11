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
const autoLoadCostInput = document.getElementById('autoLoadCostInput');
const summary = document.getElementById('summary');
const resultsBody = document.getElementById('resultsBody');
let activeMode = '';

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
  tradingControls.classList.toggle('is-hidden', !isTrading);
  tradingResults.classList.toggle('is-hidden', !isTrading);
  shoppingControls.classList.toggle('is-hidden', isTrading || isShips || isGroundVehicles);
  shoppingResults.classList.toggle('is-hidden', isTrading || isShips || isGroundVehicles);
  shoppingResults.classList.toggle('is-components-view', isComponents);
  shipControls.classList.toggle('is-hidden', !isShips);
  shipResults.classList.toggle('is-hidden', !isShips);
  groundVehicleControls.classList.toggle('is-hidden', !isGroundVehicles);
  groundVehicleResults.classList.toggle('is-hidden', !isGroundVehicles);

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

function getAutoLoadCostPerScu() {
  const value = Number(autoLoadCostInput.value);
  return Number.isFinite(value) && value > 0 ? value : 0;
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
    return section === 'systems';
  }
  return section !== 'commodities' && section !== 'systems';
}

function shoppingItemCategory(item) {
  if (item.category === 'Docking Collars') {
    return 'Fuel Nozzles';
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

  const resultName = activeMode === 'components' ? 'Schiffskomponenten' : 'Shopping-Items';
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
  const autoLoadCost = getAutoLoadCostPerScu();
  return data.prices
    .filter((price) => price.commodityId === commodityId)
    .filter((price) => price.terminalId !== startTerminalId)
    .filter((price) => Number(price.priceSell) > 0)
    .map((price) => {
      const terminal = terminalsById.get(price.terminalId);
      const sellPrice = Number(price.priceSell);
      const buyPrice = Number(startPrice.priceBuy);
      const totalCost = buyPrice + autoLoadCost;
      const profitPerScu = sellPrice - totalCost;
      const margin = totalCost > 0 ? (profitPerScu / totalCost) * 100 : 0;
      return {
        terminal,
        price,
        sellPrice,
        buyPrice,
        autoLoadCost,
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
  if (row.autoLoadCost) {
    flags.push(`${formatCredits(row.autoLoadCost)} Auto-Load / SCU`);
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

  const profitable = buyers.filter((row) => row.profitPerScu > 0).length;
  const autoLoadCost = getAutoLoadCostPerScu();
  const costText = autoLoadCost ? ` Auto-Load: ${formatCredits(autoLoadCost)} / SCU abgezogen.` : '';
  summary.textContent = `${buyers.length} Verkaufsstellen fuer ${commodityLabel(commodity)} ab ${terminalLabel(startTerminal)} gefunden, davon ${profitable} profitabel.${costText}`;

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
autoLoadCostInput.addEventListener('input', renderRoutes);
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
showModeGate();
