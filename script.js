let data = window.TRADERSMATE_DATA || { commodities: [], terminals: [], prices: [] };
let shoppingItems = window.TRADERSMATE_SHOPPING_ITEMS || [];
let componentAttributes = window.TRADERSMATE_COMPONENT_ATTRIBUTES || {};
let shoppingPrices = window.TRADERSMATE_SHOPPING_PRICES || [];
let ships = window.TRADERSMATE_SHIPS || [];
let flyableShips = window.TRADERSMATE_FLYABLE_SHIPS || ships.filter((ship) => Number(ship.scu) > 0);
let groundVehicles = window.TRADERSMATE_GROUND_VEHICLES || [];

const modeGate = document.getElementById('modeGate');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const modeReset = document.getElementById('modeReset');
const refreshDataButton = document.getElementById('refreshDataButton');
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
const cargoCapacityAlert = document.getElementById('cargoCapacityAlert');
const cargoCapacityAlertText = document.getElementById('cargoCapacityAlertText');
const dismissCargoCapacityAlert = document.getElementById('dismissCargoCapacityAlert');
const systemSelect = document.getElementById('systemSelect');
const subsystemSelect = document.getElementById('subsystemSelect');
const stationSelect = document.getElementById('stationSelect');
const materialSelect = document.getElementById('materialSelect');
const scuMultiplierInput = document.getElementById('scuMultiplierInput');
const tradeBudgetInput = document.getElementById('tradeBudgetInput');
const fullAvailabilityOnly = document.getElementById('fullAvailabilityOnly');
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
const selectedRouteAmount = document.getElementById('selectedRouteAmount');
const selectedRouteBuy = document.getElementById('selectedRouteBuy');
const selectedRouteSell = document.getElementById('selectedRouteSell');
const selectedRouteProfit = document.getElementById('selectedRouteProfit');
const selectedRouteMargin = document.getElementById('selectedRouteMargin');
const selectedRouteFlags = document.getElementById('selectedRouteFlags');
const addCargoButton = document.getElementById('addCargoButton');
const openRoutePlanner = document.getElementById('openRoutePlanner');
const routePlannerControls = document.getElementById('routePlannerControls');
const routePlanner = document.getElementById('routePlanner');
const routeSystemSelect = document.getElementById('routeSystemSelect');
const routeShipSelect = document.getElementById('routeShipSelect');
const routeShipCapacity = document.getElementById('routeShipCapacity');
const routeStartSelect = document.getElementById('routeStartSelect');
const routeDestinationSelect = document.getElementById('routeDestinationSelect');
const routeWaypointSelect = document.getElementById('routeWaypointSelect');
const addRouteWaypointButton = document.getElementById('addRouteWaypointButton');
const routeWaypointList = document.getElementById('routeWaypointList');
const routeSwapButton = document.getElementById('routeSwapButton');
const routeClearButton = document.getElementById('routeClearButton');
const routeMap = document.getElementById('routeMap');
const routeMapEmpty = document.getElementById('routeMapEmpty');
const routeMapTitle = document.getElementById('routeMapTitle');
const routeStartLabel = document.getElementById('routeStartLabel');
const routeStartArea = document.getElementById('routeStartArea');
const routeConnectionLabel = document.getElementById('routeConnectionLabel');
const routeDestinationLabel = document.getElementById('routeDestinationLabel');
const routeDestinationArea = document.getElementById('routeDestinationArea');
const routeOpportunitiesBody = document.getElementById('routeOpportunitiesBody');
const clearCargoButton = document.getElementById('clearCargoButton');
const planCargoRouteButton = document.getElementById('planCargoRouteButton');
const exportCargoJsonButton = document.getElementById('exportCargoJsonButton');
const exportCargoCsvButton = document.getElementById('exportCargoCsvButton');
const cargoSummary = document.getElementById('cargoSummary');
const cargoBody = document.getElementById('cargoBody');
let activeMode = '';
let currentBuyerRows = [];
let currentStartTerminal = null;
let selectedTradeRoute = null;
let cargoManifest = loadCargoManifest();
let routeWaypoints = [];
let plannedStopCargo = new Map();
let cargoCapacityAlertTimer = null;

let commoditiesById;
let terminalsById;
let shipsById;
let pricesByTerminalMaterial;
let shoppingPricesByItem;
let routeTerminalIds;

function rebuildDataIndexes() {
  commoditiesById = new Map(data.commodities.map((commodity) => [commodity.id, commodity]));
  terminalsById = new Map(data.terminals.map((terminal) => [terminal.id, terminal]));
  shipsById = new Map(flyableShips.map((ship) => [ship.id, ship]));
  pricesByTerminalMaterial = new Map();
  shoppingPricesByItem = new Map();
  routeTerminalIds = new Set(
    data.prices
      .filter((price) => Number(price.priceBuy) > 0 || Number(price.priceSell) > 0)
      .map((price) => price.terminalId),
  );

  data.prices.forEach((price) => {
    pricesByTerminalMaterial.set(`${price.terminalId}:${price.commodityId}`, price);
  });
  shoppingPrices.forEach((price) => {
    const rows = shoppingPricesByItem.get(price.itemId) || [];
    rows.push(price);
    shoppingPricesByItem.set(price.itemId, rows);
  });
}

rebuildDataIndexes();

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
  const previousMode = activeMode;
  activeMode = mode;
  modeGate.classList.add('is-hidden');
  const isTrading = mode === 'trading';
  const isRoutePlanner = mode === 'routePlanner';
  const isComponents = mode === 'components';
  const isShips = mode === 'ships';
  const isGroundVehicles = mode === 'groundVehicles';

  modeEyebrow.textContent = isTrading
    ? 'Star Citizen Trading'
    : isRoutePlanner
      ? 'Star Citizen Navigation'
    : isComponents
      ? 'Star Citizen Komponenten'
      : isShips
        ? 'Star Citizen Schiffe'
        : isGroundVehicles
          ? 'Star Citizen Bodenfahrzeuge'
          : 'Star Citizen Shopping';
  modeTitle.textContent = isTrading
    ? 'Handelsrouten'
    : isRoutePlanner
      ? 'Routenplaner'
    : isComponents
      ? 'Komponenten & Schiffswaffen'
      : isShips
        ? 'Schiffe kaufen'
        : isGroundVehicles
          ? 'Bodenfahrzeuge'
          : 'Shopping';
  tradingControls.classList.toggle('is-hidden', !isTrading);
  tradingResults.classList.toggle('is-hidden', !isTrading);
  routePlannerControls.classList.toggle('is-hidden', !isRoutePlanner);
  routePlanner.classList.toggle('is-hidden', !isRoutePlanner);
  shoppingControls.classList.toggle('is-hidden', isTrading || isRoutePlanner || isShips || isGroundVehicles);
  shoppingResults.classList.toggle('is-hidden', isTrading || isRoutePlanner || isShips || isGroundVehicles);
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
  } else if (isRoutePlanner) {
    if (previousMode !== 'routePlanner') {
      resetRoutePlannerState();
    } else {
      refreshRoutePlannerOptions();
      renderRouteMap();
    }
    renderCargoManifest();
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
  hideCargoCapacityAlert();
  summary.textContent = 'Waehle Trading, Routenplaner, Shopping, Komponenten, Schiffe oder Bodenfahrzeuge.';
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

function getTradeBudget() {
  const value = Number(tradeBudgetInput.value);
  return Number.isFinite(value) && value > 0 ? value : null;
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
  return /mining (facility|area)/i.test(text);
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
  resultsBody.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(text)}</td></tr>`;
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
  selectedTradeRoute = null;
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
  selectedRouteAmount.textContent = `${formatNumber(row.sellableScu)} / ${formatNumber(row.requestedScu)} SCU`;
  selectedRouteBuy.textContent = formatCredits(row.buyPrice);
  selectedRouteSell.textContent = formatCredits(row.sellPrice);
  selectedRouteProfit.textContent = formatSignedCredits(row.profitTotal);
  selectedRouteProfit.className = row.profitTotal > 0 ? 'profit' : row.profitTotal < 0 ? 'loss' : '';
  selectedRouteMargin.textContent = `${formatNumber(row.margin)}%`;
  selectedRouteMargin.className = row.margin > 0 ? 'profit' : row.margin < 0 ? 'loss' : '';
  selectedRouteFlags.textContent = flags.length ? flags.join(' · ') : '-';
  selectedRoute.dataset.selected = 'true';
  selectedRoute.classList.remove('is-hidden');
  selectedTradeRoute = {
    startId: currentStartTerminal.id,
    destinationId: row.terminal.id,
    purchasableScu: row.purchasableScu,
  };
}

function routeTerminalAvailable(terminal) {
  return !isMiningFacility(terminal) && routeTerminalIds.has(terminal.id);
}

function routeTerminalOptions(system = '') {
  return data.terminals
    .filter(routeTerminalAvailable)
    .filter((terminal) => !system || terminal.system === system)
    .map((terminal) => ({
      value: String(terminal.id),
      label: `${terminal.system || 'Unbekannt'} / ${terminalSubsystem(terminal)} / ${terminalLabel(terminal)}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
}

function refreshRoutePlannerOptions() {
  const system = routeSystemSelect.value;
  fillSelect(routeSystemSelect, systemOptions(), 'Alle Systeme');
  const options = routeTerminalOptions(system);
  fillSelect(routeStartSelect, options, 'Start waehlen');
  fillSelect(routeDestinationSelect, options, 'Ziel waehlen');
  fillSelect(routeWaypointSelect, options, 'Station als Stopp waehlen');
  routeWaypoints = routeWaypoints.filter((terminalId) => options.some((option) => Number(option.value) === terminalId));
  renderRouteWaypointList();
}

function resetRoutePlannerState() {
  routeSystemSelect.value = '';
  routeStartSelect.value = '';
  routeDestinationSelect.value = '';
  routeWaypointSelect.value = '';
  routeWaypoints = [];
  plannedStopCargo = new Map();
  refreshRoutePlannerOptions();
  renderRouteWaypointList();
  renderRouteMap();
}

function routeAreaLabel(terminal) {
  const area = [terminal.system, terminal.planet, terminal.city || terminal.station || terminal.outpost]
    .filter(Boolean);
  return [...new Set(area)].join(' / ');
}

function routePointLabel(terminal) {
  const name = terminalLabel(terminal);
  return name.length > 34 ? `${name.slice(0, 31)}...` : name;
}

function loadCargoManifest() {
  try {
    const stored = JSON.parse(window.localStorage.getItem('tradersmate-cargo-manifest') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function populateRouteShipOptions() {
  const options = flyableShips
    .filter((ship) => Number(ship.scu) > 0)
    .map((ship) => ({
      value: String(ship.id),
      label: `${ship.name} - ${formatNumber(ship.scu)} SCU`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
  fillSelect(routeShipSelect, options, 'Schiff waehlen');
  try {
    const storedShipId = window.localStorage.getItem('tradersmate-route-ship');
    if (storedShipId && options.some((option) => option.value === storedShipId)) {
      routeShipSelect.value = storedShipId;
    }
  } catch (error) {
    // Ship selection remains available for the current session.
  }
  updateRouteShipCapacity();
}

function selectedRouteShip() {
  return shipsById.get(Number(routeShipSelect.value)) || null;
}

function cargoScuTotal(excludedItemId = '') {
  return cargoManifest.reduce((total, item) => (
    item.id === excludedItemId ? total : total + Math.max(1, Number(item.scu) || 1)
  ), 0);
}

function hideCargoCapacityAlert() {
  cargoCapacityAlert.classList.add('is-hidden');
  if (cargoCapacityAlertTimer) {
    window.clearTimeout(cargoCapacityAlertTimer);
    cargoCapacityAlertTimer = null;
  }
}

function showCargoCapacityAlert(ship, currentScu, requestedScu) {
  const freeScu = Math.max(0, Number(ship.scu) - currentScu);
  cargoCapacityAlertText.textContent = `${ship.name} hat ${formatNumber(ship.scu)} SCU. ${formatNumber(currentScu)} SCU sind bereits eingetragen, ${formatNumber(requestedScu)} SCU sollten hinzukommen. Frei sind nur ${formatNumber(freeScu)} SCU.`;
  cargoCapacityAlert.classList.remove('is-hidden');
  if (cargoCapacityAlertTimer) {
    window.clearTimeout(cargoCapacityAlertTimer);
  }
  cargoCapacityAlertTimer = window.setTimeout(hideCargoCapacityAlert, 7000);
}

function showExistingCargoCapacityAlert(ship, loadedScu) {
  cargoCapacityAlertText.textContent = `${ship.name} hat ${formatNumber(ship.scu)} SCU, eingetragen sind aber ${formatNumber(loadedScu)} SCU. Entferne mindestens ${formatNumber(loadedScu - Number(ship.scu))} SCU.`;
  cargoCapacityAlert.classList.remove('is-hidden');
  if (cargoCapacityAlertTimer) {
    window.clearTimeout(cargoCapacityAlertTimer);
  }
  cargoCapacityAlertTimer = window.setTimeout(hideCargoCapacityAlert, 7000);
}

function cargoFitsShip(requestedScu, excludedItemId = '') {
  const ship = selectedRouteShip();
  if (!ship) {
    return true;
  }
  const currentScu = cargoScuTotal(excludedItemId);
  if (currentScu + requestedScu <= Number(ship.scu)) {
    hideCargoCapacityAlert();
    return true;
  }
  showCargoCapacityAlert(ship, currentScu, requestedScu);
  return false;
}

function updateRouteShipCapacity() {
  const ship = selectedRouteShip();
  const loadedScu = cargoScuTotal();
  routeShipCapacity.className = 'route-ship-capacity';
  if (!ship) {
    routeShipCapacity.textContent = loadedScu > 0
      ? `Kein Schiff gewaehlt · ${formatNumber(loadedScu)} SCU eingetragen`
      : 'Kapazitaet: - SCU';
    return;
  }
  const capacity = Number(ship.scu) || 0;
  const remaining = capacity - loadedScu;
  routeShipCapacity.textContent = remaining >= 0
    ? `${formatNumber(loadedScu)} / ${formatNumber(capacity)} SCU · ${formatNumber(remaining)} SCU frei`
    : `${formatNumber(loadedScu)} / ${formatNumber(capacity)} SCU · ${formatNumber(Math.abs(remaining))} SCU zu viel`;
  routeShipCapacity.classList.add(remaining >= 0 ? 'profit' : 'loss');
}

function saveCargoManifest() {
  try {
    window.localStorage.setItem('tradersmate-cargo-manifest', JSON.stringify(cargoManifest));
  } catch (error) {
    // The planner still works for this session when browser storage is unavailable.
  }
}

function downloadFile(filename, content, type) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function cargoExportRows() {
  return cargoManifest.map((item) => {
    const commodity = commoditiesById.get(Number(item.commodityId));
    const start = terminalsById.get(Number(item.startTerminalId));
    const destination = cargoBestDestination(item);
    return {
      material: commodity ? commodityLabel(commodity) : String(item.commodityId),
      scu: Number(item.scu) || 0,
      einkauf_pro_scu: Number(item.unitBuyPrice) || 0,
      gekauft_bei: start ? terminalLabel(start) : String(item.startTerminalId),
      bester_abladeort: destination ? terminalLabel(destination.terminal) : '',
      verkauf_pro_scu: destination ? destination.unitSellPrice : 0,
      erwarteter_gewinn: destination ? destination.profit : 0,
    };
  });
}

function exportCargoJson() {
  downloadFile(
    `tradersmate-fracht-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(cargoExportRows(), null, 2),
    'application/json',
  );
}

function exportCargoCsv() {
  const rows = cargoExportRows();
  const columns = ['material', 'scu', 'einkauf_pro_scu', 'gekauft_bei', 'bester_abladeort', 'verkauf_pro_scu', 'erwarteter_gewinn'];
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [columns.join(';'), ...rows.map((row) => columns.map((column) => quote(row[column])).join(';'))].join('\r\n');
  downloadFile(
    `tradersmate-fracht-${new Date().toISOString().slice(0, 10)}.csv`,
    `\uFEFF${csv}`,
    'text/csv;charset=utf-8',
  );
}

function cargoBestDestination(item) {
  const startTerminalId = Number(item.startTerminalId);
  const commodityId = Number(item.commodityId);
  const scu = Math.max(1, Number(item.scu) || 1);
  const purchaseTotal = Math.max(0, Number(item.unitBuyPrice) || 0) * scu;

  const rows = data.prices
    .filter((price) => price.commodityId === commodityId)
    .filter((price) => price.terminalId !== startTerminalId)
    .filter((price) => Number(price.priceSell) > 0)
    .map((price) => {
      const reportedDemand = Math.max(0, Number(price.scuSell) || 0);
      const sellableScu = reportedDemand > 0 ? Math.min(scu, reportedDemand) : scu;
      const saleTotal = Number(price.priceSell) * sellableScu;
      return {
        terminal: terminalsById.get(price.terminalId),
        unitSellPrice: Number(price.priceSell),
        reportedDemand,
        sellableScu,
        saleTotal,
        purchaseTotal,
        profit: saleTotal - purchaseTotal,
      };
    })
    .filter((row) => row.terminal && !isMiningFacility(row.terminal));
  const plannedDestination = rows.find((row) => row.terminal.id === Number(item.plannedDestinationId));
  return plannedDestination
    || rows.sort((a, b) => b.profit - a.profit || terminalLabel(a.terminal).localeCompare(terminalLabel(b.terminal), 'de'))[0]
    || null;
}

function addCurrentCargo() {
  const commodityId = Number(materialSelect.value);
  const startPrice = getSelectedPrice();
  if (!currentStartTerminal || !commodityId || !startPrice) {
    return;
  }

  const scu = Math.max(0, Number(selectedTradeRoute?.purchasableScu) || 0);
  if (!scu) {
    return;
  }
  if (!cargoFitsShip(scu)) {
    return;
  }
  cargoManifest.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    startTerminalId: currentStartTerminal.id,
    commodityId,
    scu,
    unitBuyPrice: Number(startPrice.priceBuy),
  });
  saveCargoManifest();
  addCargoButton.textContent = 'Gespeichert';
  window.setTimeout(() => {
    addCargoButton.textContent = 'Fracht merken';
  }, 1400);
}

function renderCargoManifest() {
  updateRouteShipCapacity();
  const validItems = cargoManifest.filter((item) => (
    terminalsById.has(Number(item.startTerminalId))
    && commoditiesById.has(Number(item.commodityId))
  ));
  if (validItems.length !== cargoManifest.length) {
    cargoManifest = validItems;
    saveCargoManifest();
  }

  if (!cargoManifest.length) {
    cargoSummary.textContent = 'Noch keine gekauften Waren gespeichert.';
    cargoBody.innerHTML = '<tr><td colspan="9" class="empty">Fuege im Trading oder an einem Routenstopp einen gekauften Posten hinzu.</td></tr>';
    clearCargoButton.disabled = true;
    planCargoRouteButton.disabled = true;
    return;
  }

  clearCargoButton.disabled = false;
  planCargoRouteButton.disabled = false;
  let totalScu = 0;
  let totalPurchase = 0;
  let totalSale = 0;
  let totalProfit = 0;

  cargoBody.innerHTML = cargoManifest.map((item) => {
    const commodity = commoditiesById.get(Number(item.commodityId));
    const start = terminalsById.get(Number(item.startTerminalId));
    const scu = Math.max(1, Number(item.scu) || 1);
    const unitBuyPrice = Math.max(0, Number(item.unitBuyPrice) || 0);
    const best = cargoBestDestination(item);
    const purchase = unitBuyPrice * scu;
    const sale = best ? best.saleTotal : 0;
    const profit = best ? best.profit : -purchase;
    const margin = purchase > 0 ? (profit / purchase) * 100 : 0;
    totalScu += scu;
    totalPurchase += purchase;
    totalSale += sale;
    totalProfit += profit;
    const profitClass = profit > 0 ? 'profit' : profit < 0 ? 'loss' : '';

    return `
      <tr data-cargo-id="${escapeHtml(item.id)}">
        <td><strong>${escapeHtml(commodityLabel(commodity))}</strong></td>
        <td><input class="cargo-number-input" data-cargo-field="scu" type="number" min="1" step="1" value="${scu}"></td>
        <td><input class="cargo-number-input" data-cargo-field="unitBuyPrice" type="number" min="0" step="0.01" value="${unitBuyPrice}"></td>
        <td>${escapeHtml(terminalLabel(start))}</td>
        <td>${best ? `<strong>${escapeHtml(terminalLabel(best.terminal))}</strong><span class="destination-sub">${escapeHtml(routeAreaLabel(best.terminal))} · ${formatCredits(best.unitSellPrice)} / SCU · ${formatNumber(best.sellableScu)}/${formatNumber(scu)} SCU abladbar</span>` : 'Keine Ankaufstelle'}</td>
        <td>${best ? formatCredits(sale) : '-'}</td>
        <td class="${profitClass}">${best ? formatSignedCredits(profit) : '-'}</td>
        <td class="${profitClass}">${best ? `${formatNumber(margin)}%` : '-'}</td>
        <td>
          <div class="cargo-actions">
            ${best ? `<button type="button" class="cargo-action-button" data-cargo-map="${escapeHtml(item.id)}">Karte</button>` : ''}
            <button type="button" class="cargo-remove-button" data-cargo-remove="${escapeHtml(item.id)}" title="Frachtposten entfernen" aria-label="Frachtposten entfernen">&times;</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const profitClass = totalProfit > 0 ? 'profit' : totalProfit < 0 ? 'loss' : '';
  cargoSummary.innerHTML = `${cargoManifest.length} Posten · ${formatNumber(totalScu)} SCU · Einkauf ${formatCredits(totalPurchase)} · möglicher Verkauf ${formatCredits(totalSale)} · <strong class="${profitClass}">${formatSignedCredits(totalProfit)}</strong>`;
}

function openCargoRoute(itemId) {
  const item = cargoManifest.find((entry) => entry.id === itemId);
  const best = item ? cargoBestDestination(item) : null;
  if (!item || !best) {
    return;
  }
  routeSystemSelect.value = '';
  refreshRoutePlannerOptions();
  routeStartSelect.value = String(item.startTerminalId);
  routeDestinationSelect.value = String(best.terminal.id);
  routeWaypoints = [];
  plannedStopCargo = new Map([[best.terminal.id, [commodityLabel(commoditiesById.get(Number(item.commodityId)))] ]]);
  renderRouteWaypointList();
  renderRouteMap();
  routePlanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function routeTravelScore(from, to) {
  if (from.id === to.id) {
    return 0;
  }
  if (from.system === to.system && terminalSubsystem(from) === terminalSubsystem(to)) {
    return 1;
  }
  if (from.system === to.system) {
    return 3;
  }
  const systemOrder = ['Stanton', 'Pyro', 'Nyx'];
  const fromIndex = systemOrder.indexOf(from.system);
  const toIndex = systemOrder.indexOf(to.system);
  return 10 + (fromIndex >= 0 && toIndex >= 0 ? Math.abs(fromIndex - toIndex) : 3);
}

function orderRouteStops(start, stops) {
  const remainingBySystem = new Map();
  stops.forEach((terminal) => {
    const system = terminal.system || 'Unbekannt';
    const systemStops = remainingBySystem.get(system) || [];
    systemStops.push(terminal);
    remainingBySystem.set(system, systemStops);
  });
  const ordered = [];
  let current = start;
  while (remainingBySystem.size) {
    let nextSystem = current.system;
    if (!remainingBySystem.has(nextSystem)) {
      nextSystem = [...remainingBySystem.keys()].sort((systemA, systemB) => {
        const terminalA = remainingBySystem.get(systemA)[0];
        const terminalB = remainingBySystem.get(systemB)[0];
        return routeTravelScore(current, terminalA) - routeTravelScore(current, terminalB)
          || systemA.localeCompare(systemB, 'de');
      })[0];
    }

    const systemStops = remainingBySystem.get(nextSystem);
    while (systemStops.length) {
      systemStops.sort((a, b) => (
        routeTravelScore(current, a) - routeTravelScore(current, b)
        || terminalLabel(a).localeCompare(terminalLabel(b), 'de')
      ));
      current = systemStops.shift();
      ordered.push(current);
    }
    remainingBySystem.delete(nextSystem);
  }
  return ordered;
}

function planAllCargoStops() {
  if (!cargoManifest.length) {
    return;
  }
  const start = terminalsById.get(Number(routeStartSelect.value))
    || terminalsById.get(Number(cargoManifest[0].startTerminalId));
  if (!start) {
    return;
  }

  const groupedCargo = new Map();
  cargoManifest.forEach((item) => {
    const best = cargoBestDestination(item);
    const commodity = commoditiesById.get(Number(item.commodityId));
    if (!best || !commodity) {
      return;
    }
    const materials = groupedCargo.get(best.terminal.id) || [];
    materials.push(`${commodityLabel(commodity)} (${formatNumber(item.scu)} SCU)`);
    groupedCargo.set(best.terminal.id, materials);
  });

  const destinations = [...groupedCargo.keys()]
    .filter((terminalId) => terminalId !== start.id)
    .map((terminalId) => terminalsById.get(terminalId))
    .filter(Boolean);
  if (!destinations.length) {
    summary.textContent = 'Fuer die gespeicherte Fracht wurde kein weiterer Abladeort gefunden.';
    return;
  }

  const ordered = orderRouteStops(start, destinations);
  routeSystemSelect.value = '';
  refreshRoutePlannerOptions();
  routeStartSelect.value = String(start.id);
  routeWaypoints = ordered.slice(0, -1).map((terminal) => terminal.id);
  routeDestinationSelect.value = String(ordered.at(-1).id);
  plannedStopCargo = groupedCargo;
  renderRouteWaypointList();
  renderRouteMap();
  routePlanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderRouteWaypointList() {
  if (!routeWaypoints.length) {
    routeWaypointList.innerHTML = '<span class="route-stop-empty">Keine Zwischenstopps geplant.</span>';
    return;
  }
  routeWaypointList.innerHTML = routeWaypoints.map((terminalId, index) => {
    const terminal = terminalsById.get(terminalId);
    if (!terminal) {
      return '';
    }
    const cargo = plannedStopCargo.get(terminalId) || [];
    return `
      <div class="route-stop-item" data-waypoint-index="${index}">
        <span class="route-stop-number">${index + 1}</span>
        <span class="route-stop-name">
          <strong>${escapeHtml(terminalLabel(terminal))}</strong>
          <small>${escapeHtml(cargo.length ? cargo.join(', ') : routeAreaLabel(terminal))}</small>
        </span>
        <span class="route-stop-actions">
          <button type="button" data-waypoint-action="up" title="Stopp nach oben" aria-label="Stopp nach oben" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
          <button type="button" data-waypoint-action="down" title="Stopp nach unten" aria-label="Stopp nach unten" ${index === routeWaypoints.length - 1 ? 'disabled' : ''}>&darr;</button>
          <button type="button" data-waypoint-action="remove" title="Stopp entfernen" aria-label="Stopp entfernen">&times;</button>
        </span>
      </div>
    `;
  }).join('');
}

function svgText(x, y, className, value, anchor = 'middle') {
  return `<text x="${x}" y="${y}" class="${className}" text-anchor="${anchor}">${escapeHtml(value)}</text>`;
}

const SYSTEM_MAP_LAYOUTS = {
  Stanton: {
    center: { x: 600, y: 310 },
    bodies: {
      Hurston: { x: 710, y: 150, radius: 25, kind: 'rock' },
      Crusader: { x: 840, y: 350, radius: 34, kind: 'gas' },
      ArcCorp: { x: 480, y: 470, radius: 24, kind: 'city' },
      MicroTech: { x: 260, y: 235, radius: 27, kind: 'ice' },
    },
    gateways: {
      Terra: { x: 100, y: 500 },
      Pyro: { x: 1090, y: 105 },
      Nyx: { x: 1080, y: 520 },
    },
    station: { x: 600, y: 520 },
  },
  Pyro: {
    center: { x: 600, y: 310 },
    bodies: {
      'Pyro I': { x: 675, y: 245, radius: 17, kind: 'rock' },
      Monox: { x: 760, y: 390, radius: 21, kind: 'rock' },
      Bloom: { x: 535, y: 465, radius: 23, kind: 'ice' },
      'Pyro IV': { x: 390, y: 370, radius: 28, kind: 'gas' },
      'Pyro V': { x: 335, y: 185, radius: 31, kind: 'gas' },
      Terminus: { x: 825, y: 150, radius: 22, kind: 'rock' },
    },
    gateways: {
      Stanton: { x: 100, y: 500 },
      Nyx: { x: 1090, y: 115 },
    },
    station: { x: 600, y: 535 },
  },
  Nyx: {
    center: { x: 600, y: 310 },
    bodies: {
      Delamar: { x: 470, y: 390, radius: 27, kind: 'rock' },
    },
    gateways: {
      Stanton: { x: 100, y: 130 },
      Pyro: { x: 1090, y: 500 },
    },
    station: { x: 470, y: 390 },
  },
};

const SYSTEM_NETWORK_POSITIONS = {
  Stanton: { x: 185, y: 335 },
  Pyro: { x: 600, y: 210 },
  Nyx: { x: 1015, y: 370 },
};

function textHash(value) {
  return [...String(value || '')].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function mapLayoutForSystem(system) {
  if (SYSTEM_MAP_LAYOUTS[system]) {
    return SYSTEM_MAP_LAYOUTS[system];
  }
  const subsystemNames = [...new Set(
    data.terminals
      .filter((terminal) => terminal.system === system)
      .map(terminalSubsystem)
      .filter((name) => name !== 'Stationen' && name !== 'Gateways'),
  )];
  const bodies = {};
  subsystemNames.forEach((name, index) => {
    const angle = ((Math.PI * 2) / Math.max(1, subsystemNames.length)) * index - Math.PI / 2;
    bodies[name] = {
      x: 600 + Math.cos(angle) * 310,
      y: 310 + Math.sin(angle) * 190,
      radius: 22,
      kind: 'rock',
    };
  });
  return {
    center: { x: 600, y: 310 },
    bodies,
    gateways: {},
    station: { x: 600, y: 510 },
  };
}

function terminalMapPoint(terminal, index = 0) {
  const system = terminal.system || 'Unbekannt';
  const layout = mapLayoutForSystem(system);
  const locationText = [
    terminal.name,
    terminal.terminalName,
    terminal.fullName,
    terminal.station,
  ].filter(Boolean).join(' ');
  const gatewayMatch = locationText.match(/\b(Terra|Pyro|Nyx|Stanton)\s+Gateway\b/i);
  if (gatewayMatch) {
    const gatewayName = Object.keys(layout.gateways).find((name) => name.toLowerCase() === gatewayMatch[1].toLowerCase());
    if (gatewayName) {
      const point = layout.gateways[gatewayName];
      return { ...point, area: `${gatewayName} Gateway`, kind: 'gateway' };
    }
  }

  if (system === 'Nyx' && /\blevski\b/i.test(locationText) && layout.bodies.Delamar) {
    return { ...layout.bodies.Delamar, area: 'Delamar / Levski', kind: 'station' };
  }

  const lagrangeMatch = locationText.match(/\b(ARC|CRU|HUR|MIC)-L([1-5])\b/i);
  if (lagrangeMatch) {
    const planetByCode = {
      ARC: 'ArcCorp',
      CRU: 'Crusader',
      HUR: 'Hurston',
      MIC: 'MicroTech',
    };
    const parent = layout.bodies[planetByCode[lagrangeMatch[1].toUpperCase()]];
    if (parent) {
      const offsets = [
        { x: 62, y: -48 },
        { x: 76, y: 24 },
        { x: 0, y: 72 },
        { x: -74, y: 24 },
        { x: -62, y: -48 },
      ];
      const offset = offsets[Number(lagrangeMatch[2]) - 1];
      return {
        x: parent.x + offset.x,
        y: parent.y + offset.y,
        area: `${lagrangeMatch[1].toUpperCase()}-L${lagrangeMatch[2]}`,
        kind: 'station',
      };
    }
  }

  const body = layout.bodies[terminal.planet];
  if (body) {
    const hash = textHash(`${terminal.id}-${terminalLabel(terminal)}`);
    const angle = ((hash % 360) / 180) * Math.PI;
    const distance = body.radius + 28 + (index % 3) * 9;
    return {
      x: body.x + Math.cos(angle) * distance,
      y: body.y + Math.sin(angle) * distance,
      area: terminal.planet,
      kind: 'station',
    };
  }

  const hash = textHash(`${terminal.id}-${terminalLabel(terminal)}`);
  const angle = ((hash % 300) / 150) * Math.PI;
  return {
    x: layout.station.x + Math.cos(angle) * (38 + (index % 3) * 10),
    y: layout.station.y + Math.sin(angle) * (28 + (index % 3) * 8),
    area: terminalSubsystem(terminal),
    kind: 'station',
  };
}

function routePolyline(points) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function routeLegLabels(points) {
  let sectionNumber = 0;
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    const x = (previous.x + point.x) / 2;
    const y = (previous.y + point.y) / 2 - 10;
    const isJump = previous.terminal.system !== point.terminal.system;
    const label = isJump ? 'QUANTUM JUMP' : `ABSCHNITT ${sectionNumber += 1}`;
    return svgText(x, y, 'route-map-leg-label', label);
  }).join('');
}

function routeStopMarkup(points) {
  return points.map((point, index) => {
    const isStart = !point.transit && point.routeIndex === 0;
    const isDestination = !point.transit && point.routeIndex === point.routeCount - 1;
    const type = point.transit ? 'transit' : isStart ? 'start' : isDestination ? 'destination' : 'waypoint';
    const number = point.transit ? 'G' : isStart ? 'S' : String(point.routeIndex);
    const labelAbove = index % 2 === 0;
    const labelY = point.y + (labelAbove ? -34 : 48);
    const areaY = labelY + 18;
    return [
      `<circle cx="${point.x}" cy="${point.y}" r="17" class="route-map-endpoint ${type}" />`,
      svgText(point.x, point.y + 5, 'route-map-stop-number', number),
      svgText(point.x, labelY, 'route-map-endpoint-label', routePointLabel(point.terminal)),
      svgText(point.x, areaY, 'route-map-caption', point.area || point.terminal.system || '-'),
    ].join('');
  }).join('');
}

function systemBaseMarkup(system, layout) {
  const parts = [
    '<g class="route-map-coordinate-grid">',
    '<path d="M 0 155 H 1200 M 0 310 H 1200 M 0 465 H 1200 M 300 0 V 620 M 600 0 V 620 M 900 0 V 620" />',
    '</g>',
  ];
  Object.entries(layout.bodies).forEach(([name, body]) => {
    const orbitRadius = Math.hypot(body.x - layout.center.x, body.y - layout.center.y);
    parts.push(`<circle cx="${layout.center.x}" cy="${layout.center.y}" r="${orbitRadius}" class="route-map-system-orbit" />`);
  });
  parts.push(`<circle cx="${layout.center.x}" cy="${layout.center.y}" r="32" class="route-map-star" />`);
  parts.push(svgText(layout.center.x, layout.center.y + 58, 'route-map-label', system));
  Object.entries(layout.bodies).forEach(([name, body]) => {
    parts.push(`<circle cx="${body.x}" cy="${body.y}" r="${body.radius}" class="route-map-planet ${body.kind}" />`);
    parts.push(svgText(body.x, body.y + body.radius + 22, 'route-map-body-label', name));
  });
  Object.entries(layout.gateways).forEach(([name, point]) => {
    parts.push(`<path d="M ${point.x - 9} ${point.y} L ${point.x} ${point.y - 9} L ${point.x + 9} ${point.y} L ${point.x} ${point.y + 9} Z" class="route-map-gateway" />`);
    parts.push(svgText(point.x, point.y + 26, 'route-map-caption', `${name} Gateway`));
  });
  return parts.join('');
}

function systemRouteMapMarkup(terminals) {
  const system = terminals[0].system || 'Unbekannt';
  const layout = mapLayoutForSystem(system);
  const points = terminals.map((terminal, index) => ({
    ...terminalMapPoint(terminal, index),
    terminal,
    routeIndex: index,
    routeCount: terminals.length,
  }));
  return [
    systemBaseMarkup(system, layout),
    `<polyline points="${routePolyline(points)}" class="route-map-route-glow" />`,
    `<polyline points="${routePolyline(points)}" class="route-map-route" />`,
    routeLegLabels(points),
    routeStopMarkup(points),
    svgText(1165, 590, 'route-map-scale-label', `${terminals.length - 1} ROUTENABSCHNITTE`, 'end'),
  ].join('');
}

function crossSystemRouteMapMarkup(terminals) {
  const systems = [...new Set([
    ...Object.keys(SYSTEM_NETWORK_POSITIONS),
    ...terminals.map((terminal) => terminal.system).filter(Boolean),
  ])];
  const fallbackPositions = {};
  systems.filter((system) => !SYSTEM_NETWORK_POSITIONS[system]).forEach((system, index) => {
    fallbackPositions[system] = { x: 250 + index * 300, y: 500 };
  });
  const systemPoint = (system) => SYSTEM_NETWORK_POSITIONS[system] || fallbackPositions[system];
  const positionsBySystem = new Map();
  const explicitPoints = terminals.map((terminal, index) => {
    const center = systemPoint(terminal.system);
    const used = positionsBySystem.get(terminal.system) || 0;
    positionsBySystem.set(terminal.system, used + 1);
    const angle = -Math.PI / 2 + used * (Math.PI / 3);
    return {
      terminal,
      x: center.x + Math.cos(angle) * 72,
      y: center.y + Math.sin(angle) * 72,
      area: terminalSubsystem(terminal),
      kind: /gateway/i.test(terminalLabel(terminal)) ? 'gateway' : 'station',
      routeIndex: index,
      routeCount: terminals.length,
    };
  });
  const points = [];
  explicitPoints.forEach((point, index) => {
    points.push(point);
    const next = explicitPoints[index + 1];
    if (!next || point.terminal.system === next.terminal.system) {
      return;
    }
    const sourceCenter = systemPoint(point.terminal.system);
    const targetCenter = systemPoint(next.terminal.system);
    const deltaX = targetCenter.x - sourceCenter.x;
    const deltaY = targetCenter.y - sourceCenter.y;
    const distance = Math.max(1, Math.hypot(deltaX, deltaY));
    const direction = { x: deltaX / distance, y: deltaY / distance };
    const sourceGateway = {
      system: point.terminal.system,
      name: `${next.terminal.system} Gateway`,
      terminalName: `${next.terminal.system} Gateway`,
    };
    const targetGateway = {
      system: next.terminal.system,
      name: `${point.terminal.system} Gateway`,
      terminalName: `${point.terminal.system} Gateway`,
    };
    if (!terminalLabel(point.terminal).toLowerCase().includes(`${next.terminal.system} gateway`.toLowerCase())) {
      points.push({
        terminal: sourceGateway,
        x: sourceCenter.x + direction.x * 92,
        y: sourceCenter.y + direction.y * 92,
        area: `${point.terminal.system} / Ausgang`,
        transit: true,
        routeCount: terminals.length,
      });
    }
    if (!terminalLabel(next.terminal).toLowerCase().includes(`${point.terminal.system} gateway`.toLowerCase())) {
      points.push({
        terminal: targetGateway,
        x: targetCenter.x - direction.x * 92,
        y: targetCenter.y - direction.y * 92,
        area: `${next.terminal.system} / Eingang`,
        transit: true,
        routeCount: terminals.length,
      });
    }
  });
  const parts = [
    '<g class="route-map-coordinate-grid"><path d="M 0 155 H 1200 M 0 310 H 1200 M 0 465 H 1200 M 300 0 V 620 M 600 0 V 620 M 900 0 V 620" /></g>',
  ];
  const visibleSystemPoints = systems.map((system) => ({ system, ...systemPoint(system) })).filter((point) => point.x);
  for (let index = 1; index < visibleSystemPoints.length; index += 1) {
    const previous = visibleSystemPoints[index - 1];
    const current = visibleSystemPoints[index];
    parts.push(`<line x1="${previous.x}" y1="${previous.y}" x2="${current.x}" y2="${current.y}" class="route-map-jump-link" />`);
  }
  visibleSystemPoints.forEach((point) => {
    parts.push(`<circle cx="${point.x}" cy="${point.y}" r="94" class="route-map-system-orbit" />`);
    parts.push(`<circle cx="${point.x}" cy="${point.y}" r="29" class="route-map-star" />`);
    parts.push(svgText(point.x, point.y + 126, 'route-map-label', point.system));
  });
  parts.push(`<polyline points="${routePolyline(points)}" class="route-map-route-glow" />`);
  parts.push(`<polyline points="${routePolyline(points)}" class="route-map-route" />`);
  parts.push(routeLegLabels(points));
  parts.push(routeStopMarkup(points));
  parts.push(svgText(1165, 590, 'route-map-scale-label', `${terminals.length - 1} ABSCHNITTE / ${systems.length} SYSTEME`, 'end'));
  return parts.join('');
}

function spatialRouteMapMarkup(terminals) {
  const systems = new Set(terminals.map((terminal) => terminal.system).filter(Boolean));
  return systems.size <= 1
    ? systemRouteMapMarkup(terminals)
    : crossSystemRouteMapMarkup(terminals);
}

function cargoAssignmentsForRoute(terminals) {
  const assignments = new Map();
  cargoManifest.forEach((item) => {
    const scu = Math.max(1, Number(item.scu) || 1);
    const purchaseTotal = Math.max(0, Number(item.unitBuyPrice) || 0) * scu;
    const options = terminals.slice(1).map((terminal) => {
      const price = pricesByTerminalMaterial.get(`${terminal.id}:${Number(item.commodityId)}`);
      if (!price || Number(price.priceSell) <= 0) {
        return null;
      }
      const demand = Math.max(0, Number(price.scuSell) || 0);
      const sellableScu = demand > 0 ? Math.min(scu, demand) : scu;
      const saleTotal = Number(price.priceSell) * sellableScu;
      return { terminal, price, sellableScu, saleTotal, profit: saleTotal - purchaseTotal };
    }).filter(Boolean).sort((a, b) => b.profit - a.profit);
    const best = options.find((option) => option.terminal.id === Number(item.plannedDestinationId)) || options[0];
    if (!best) {
      return;
    }
    const rows = assignments.get(best.terminal.id) || [];
    rows.push({
      item,
      commodity: commoditiesById.get(Number(item.commodityId)),
      ...best,
    });
    assignments.set(best.terminal.id, rows);
  });
  return assignments;
}

function pickupOpportunitiesAtStop(terminals, stopIndex) {
  const terminal = terminals[stopIndex];
  const laterTerminals = terminals.slice(stopIndex + 1);
  if (!terminal || !laterTerminals.length) {
    return [];
  }

  return data.prices
    .filter((price) => price.terminalId === terminal.id && Number(price.priceBuy) > 0)
    .map((buyPrice) => {
      const destination = laterTerminals
        .map((laterTerminal) => {
          const sellPrice = pricesByTerminalMaterial.get(`${laterTerminal.id}:${buyPrice.commodityId}`);
          const profitPerScu = sellPrice ? Number(sellPrice.priceSell) - Number(buyPrice.priceBuy) : 0;
          return sellPrice && Number(sellPrice.priceSell) > 0
            ? { terminal: laterTerminal, sellPrice, profitPerScu }
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.profitPerScu - a.profitPerScu)[0];
      return destination && destination.profitPerScu > 0
        ? {
            commodity: commoditiesById.get(buyPrice.commodityId),
            originTerminal: terminal,
            buyPrice: Number(buyPrice.priceBuy),
            margin: Number(buyPrice.priceBuy) > 0 ? (destination.profitPerScu / Number(buyPrice.priceBuy)) * 100 : 0,
            ...destination,
          }
        : null;
    })
    .filter((row) => row && row.commodity)
    .sort((a, b) => b.profitPerScu - a.profitPerScu || commodityLabel(a.commodity).localeCompare(commodityLabel(b.commodity), 'de'));
}

function pickupOpportunityMarkup(row, extraClass = '') {
  return `
    <div class="route-opportunity-row ${extraClass}" data-pickup-row>
      <span><strong>${escapeHtml(commodityLabel(row.commodity))}</strong><small>${formatCredits(row.buyPrice)} / SCU</small></span>
      <span class="route-opportunity-target">nach ${escapeHtml(terminalLabel(row.terminal))}</span>
      <span class="route-opportunity-return"><strong class="profit">${formatSignedCredits(row.profitPerScu)} / SCU</strong><small class="profit">${formatNumber(row.margin)}% Marge</small></span>
      <span class="route-pickup-action">
        <input data-pickup-scu class="route-pickup-input" type="number" min="1" step="1" value="1" aria-label="SCU-Menge">
        <button type="button" class="cargo-action-button" data-pickup-add data-origin-terminal="${row.originTerminal.id}" data-destination-terminal="${row.terminal.id}" data-commodity="${row.commodity.id}" data-buy-price="${row.buyPrice}">Mitnehmen</button>
      </span>
    </div>
  `;
}

function addRoutePickupToCargo(button) {
  const row = button.closest('[data-pickup-row]');
  const scuInput = row ? row.querySelector('[data-pickup-scu]') : null;
  const scu = Math.max(1, Math.floor(Number(scuInput?.value) || 1));
  const startTerminalId = Number(button.dataset.originTerminal);
  const plannedDestinationId = Number(button.dataset.destinationTerminal);
  const commodityId = Number(button.dataset.commodity);
  const unitBuyPrice = Number(button.dataset.buyPrice);
  if (!startTerminalId || !plannedDestinationId || !commodityId || unitBuyPrice <= 0) {
    return;
  }
  if (!cargoFitsShip(scu)) {
    return;
  }
  cargoManifest.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    startTerminalId,
    plannedDestinationId,
    commodityId,
    scu,
    unitBuyPrice,
  });
  saveCargoManifest();
  renderCargoManifest();
  renderRouteMap();
}

function renderRouteOpportunities(terminals) {
  if (terminals.length < 2) {
    routeOpportunitiesBody.innerHTML = '<p class="route-opportunities-empty">Plane mindestens einen Stopp, um passende Waren anzuzeigen.</p>';
    return;
  }
  const cargoAssignments = cargoAssignmentsForRoute(terminals);
  routeOpportunitiesBody.innerHTML = terminals.map((terminal, index) => {
    const unloadRows = cargoAssignments.get(terminal.id) || [];
    const pickupRows = pickupOpportunitiesAtStop(terminals, index);
    const visiblePickups = pickupRows.slice(0, 5).map((row) => pickupOpportunityMarkup(row)).join('');
    const extraPickups = pickupRows.slice(5).map((row) => pickupOpportunityMarkup(row)).join('');
    const unloadMarkup = unloadRows.length
      ? unloadRows.map((row) => {
          const profitClass = row.profit > 0 ? 'profit' : row.profit < 0 ? 'loss' : '';
          return `
            <div class="route-opportunity-row">
              <span><strong>${escapeHtml(commodityLabel(row.commodity))}</strong><small>${formatNumber(row.sellableScu)}/${formatNumber(row.item.scu)} SCU abladbar</small></span>
              <span class="route-opportunity-target">${formatCredits(Number(row.price.priceSell))} / SCU</span>
              <strong class="${profitClass}">${formatSignedCredits(row.profit)}</strong>
            </div>
          `;
        }).join('')
      : '<p class="route-opportunities-empty">Keine gespeicherte Fracht für diesen Stopp.</p>';
    const pickupMarkup = pickupRows.length
      ? `${visiblePickups}${extraPickups ? `<details class="route-opportunity-more"><summary>+${pickupRows.length - 5} weitere Waren</summary>${extraPickups}</details>` : ''}`
      : '<p class="route-opportunities-empty">Keine profitable Ware für einen späteren Stopp.</p>';

    return `
      <article class="route-stop-trade">
        <header>
          <span class="route-stop-number">${index === 0 ? 'S' : index}</span>
          <span><strong>${escapeHtml(terminalLabel(terminal))}</strong><small>${escapeHtml(routeAreaLabel(terminal))}</small></span>
        </header>
        <div class="route-stop-trade-grid">
          <section><h3>Abladen</h3>${index === 0 ? '<p class="route-opportunities-empty">Startpunkt der Route.</p>' : unloadMarkup}</section>
          <section><h3>Mitnehmen</h3>${pickupMarkup}</section>
        </div>
      </article>
    `;
  }).join('');
}

function renderRouteMap() {
  const start = terminalsById.get(Number(routeStartSelect.value));
  const selectedDestination = terminalsById.get(Number(routeDestinationSelect.value));
  const routeTerminals = [
    start,
    ...routeWaypoints.map((terminalId) => terminalsById.get(terminalId)),
    selectedDestination,
  ].filter((terminal, index, terminals) => terminal && terminals.findIndex((item) => item.id === terminal.id) === index);
  const destination = routeTerminals.at(-1);
  const sameEndpoint = Boolean(start && selectedDestination && start.id === selectedDestination.id && !routeWaypoints.length);
  const hasRoute = routeTerminals.length >= 2 && !sameEndpoint;
  routeMapEmpty.classList.toggle('is-hidden', hasRoute);
  renderRouteOpportunities(hasRoute ? routeTerminals : []);
  routeMapEmpty.textContent = sameEndpoint
    ? 'Start und Ziel muessen verschieden sein.'
    : 'Waehle Start und Ziel, um die Route darzustellen.';
  routeMap.innerHTML = hasRoute ? spatialRouteMapMarkup(routeTerminals) : '';

  routeStartLabel.textContent = start ? terminalLabel(start) : '-';
  routeStartArea.textContent = start ? routeAreaLabel(start) : '-';
  routeDestinationLabel.textContent = destination ? terminalLabel(destination) : '-';
  const destinationCargo = destination ? plannedStopCargo.get(destination.id) || [] : [];
  routeDestinationArea.textContent = destination
    ? destinationCargo.length ? destinationCargo.join(', ') : routeAreaLabel(destination)
    : '-';
  routeConnectionLabel.textContent = hasRoute
    ? routeTerminals.length > 2
      ? `${routeTerminals.length - 1} Stops / ${routeTerminals.length - 2} ${routeTerminals.length === 3 ? 'Zwischenstopp' : 'Zwischenstopps'}`
      : start.system === destination.system
        ? `Direkt in ${start.system}`
        : `${start.system} nach ${destination.system}`
    : '-';
  routeMapTitle.textContent = hasRoute
    ? `${terminalLabel(start)} nach ${terminalLabel(destination)}`
    : 'Route auswaehlen';
  summary.textContent = sameEndpoint
    ? 'Start und Ziel sind identisch. Waehle eine andere Zielstation.'
    : hasRoute
    ? `Route mit ${routeTerminals.length - 1} ${routeTerminals.length === 2 ? 'Stopp' : 'Stopps'} von ${terminalLabel(start)} nach ${terminalLabel(destination)} auf der Systemkarte.`
    : 'Waehle Start und Ziel fuer deine Route.';
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
  const locationText = [
    terminal.name,
    terminal.terminalName,
    terminal.fullName,
    terminal.station,
  ]
    .filter(Boolean)
    .join(' ');

  if (/\bgateway\b/i.test(locationText)) {
    return 'Gateways';
  }

  if (/\b(?:ARC|CRU|HUR|MIC)-L[1-5]\b/i.test(locationText) || !terminal.planet) {
    return 'Stationen';
  }

  return terminal.planet || 'Stationen';
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

function isComponentItem(item) {
  const section = String(item.section || '').toLowerCase();
  return section === 'systems' || section === 'vehicle weapons';
}

function isShoppingItemVisible(item) {
  const section = String(item.section || '').toLowerCase();
  if (activeMode === 'components') {
    return isComponentItem(item);
  }
  return section !== 'commodities' && !isComponentItem(item);
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
  const requestedScu = getScuMultiplier();
  const budget = getTradeBudget();
  return data.prices
    .filter((price) => price.commodityId === commodityId)
    .filter((price) => price.terminalId !== startTerminalId)
    .filter((price) => Number(price.priceSell) > 0)
    .map((price) => {
      const terminal = terminalsById.get(price.terminalId);
      const calculation = window.TRADERSMATE_TRADE_CALCULATOR.calculateTrade({
        requestedScu,
        budget,
        stockScu: startPrice.stock,
        demandScu: price.scuSell,
        buyUnitPrice: startPrice.priceBuy,
        sellUnitPrice: price.priceSell,
      });
      return {
        terminal,
        price,
        ...calculation,
        sellPrice: calculation.sellTotal,
        buyPrice: calculation.buyTotal,
      };
    })
    .filter((row) => row.terminal)
    .filter((row) => !isMiningFacility(row.terminal))
    .filter((row) => !fullAvailabilityOnly.checked || row.fullyTradable)
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
  if (row.demandKnown) {
    flags.push(`${formatNumber(row.price.scuSell)} SCU Nachfrage`);
  } else {
    flags.push('Nachfrage unbekannt');
  }
  if (!row.stockKnown) {
    flags.push('Bestand unbekannt');
  }
  if (row.budgetLimited) {
    flags.push('Budgetlimit');
  }
  if (row.unsoldScu > 0) {
    flags.push(`${formatNumber(row.unsoldScu)} SCU unverkauft`);
  }
  if (row.price.modified) {
    const modified = new Date(Number(row.price.modified) * 1000);
    if (!Number.isNaN(modified.getTime())) {
      const ageHours = Math.max(0, Math.floor((Date.now() - modified.getTime()) / 3600000));
      flags.push(ageHours < 24 ? `Preis ${ageHours} Std. alt` : `Preis ${Math.floor(ageHours / 24)} Tg. alt`);
    }
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
    const filterNote = fullAvailabilityOnly.checked
      ? ' Keine Route hat fuer die gesamte Menge einen gemeldeten Bestand und eine ausreichende Nachfrage.'
      : '';
    renderEmpty(`Keine Verkaufsstellen fuer ${commodityLabel(commodity)} gefunden.${filterNote}`);
    return;
  }

  const profitable = buyers.filter((row) => row.profitTotal > 0).length;
  clearSelectedRoute();
  currentBuyerRows = buyers;
  currentStartTerminal = startTerminal;
  const bestProfit = buyers[0];
  const bestMargin = [...buyers].sort((a, b) => b.margin - a.margin)[0];
  const scuMultiplier = getScuMultiplier();
  summary.textContent = `${buyers.length} Verkaufsstellen fuer bis zu ${formatNumber(scuMultiplier)} SCU ${commodityLabel(commodity)} ab ${terminalLabel(startTerminal)} gefunden, davon ${profitable} profitabel.`;
  bestProfitMetric.textContent = formatSignedCredits(bestProfit.profitTotal);
  bestProfitMetric.className = bestProfit.profitTotal > 0 ? 'profit' : bestProfit.profitTotal < 0 ? 'loss' : '';
  bestProfitTarget.textContent = `→ ${terminalLabel(bestProfit.terminal)}`;
  bestMarginMetric.textContent = `${formatNumber(bestMargin.margin)}%`;
  bestMarginMetric.className = bestMargin.margin > 0 ? 'profit' : bestMargin.margin < 0 ? 'loss' : '';
  bestMarginMaterial.textContent = commodityLabel(commodity);
  destinationCountMetric.innerHTML = `${buyers.length} <em>Ziele</em>`;
  profitableCountMetric.textContent = `${profitable} profitabel`;
  purchasePriceMetric.textContent = formatCredits(bestProfit.buyPrice);
  purchaseStationMetric.textContent = `${formatNumber(bestProfit.purchasableScu)} SCU · ${terminalLabel(startTerminal)}`;

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
          <td>${formatNumber(row.sellableScu)} / ${formatNumber(row.requestedScu)} SCU</td>
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
tradeBudgetInput.addEventListener('input', renderRoutes);
fullAvailabilityOnly.addEventListener('change', renderRoutes);
shoppingSearch.addEventListener('input', renderShopping);
shoppingCategory.addEventListener('change', renderShopping);
shipSearch.addEventListener('input', renderShips);
shipManufacturer.addEventListener('change', renderShips);
groundVehicleSearch.addEventListener('input', renderGroundVehicles);
groundVehicleManufacturer.addEventListener('change', renderGroundVehicles);
routeSystemSelect.addEventListener('change', () => {
  routeStartSelect.value = '';
  routeDestinationSelect.value = '';
  routeWaypoints = [];
  plannedStopCargo = new Map();
  refreshRoutePlannerOptions();
  renderRouteMap();
});
routeShipSelect.addEventListener('change', () => {
  try {
    if (routeShipSelect.value) {
      window.localStorage.setItem('tradersmate-route-ship', routeShipSelect.value);
    } else {
      window.localStorage.removeItem('tradersmate-route-ship');
    }
  } catch (error) {
    // The selected ship still applies until the page is closed.
  }
  updateRouteShipCapacity();
  const ship = selectedRouteShip();
  if (ship && cargoScuTotal() > Number(ship.scu)) {
    showExistingCargoCapacityAlert(ship, cargoScuTotal());
  } else {
    hideCargoCapacityAlert();
  }
});
routeStartSelect.addEventListener('change', renderRouteMap);
routeDestinationSelect.addEventListener('change', renderRouteMap);
addRouteWaypointButton.addEventListener('click', () => {
  const terminalId = Number(routeWaypointSelect.value);
  const startId = Number(routeStartSelect.value);
  const destinationId = Number(routeDestinationSelect.value);
  if (!terminalId || terminalId === startId || terminalId === destinationId || routeWaypoints.includes(terminalId)) {
    return;
  }
  routeWaypoints.push(terminalId);
  routeWaypointSelect.value = '';
  renderRouteWaypointList();
  renderRouteMap();
});
routeWaypointList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-waypoint-action]');
  const row = event.target.closest('[data-waypoint-index]');
  if (!button || !row) {
    return;
  }
  const index = Number(row.dataset.waypointIndex);
  if (button.dataset.waypointAction === 'remove') {
    routeWaypoints.splice(index, 1);
  } else if (button.dataset.waypointAction === 'up' && index > 0) {
    [routeWaypoints[index - 1], routeWaypoints[index]] = [routeWaypoints[index], routeWaypoints[index - 1]];
  } else if (button.dataset.waypointAction === 'down' && index < routeWaypoints.length - 1) {
    [routeWaypoints[index + 1], routeWaypoints[index]] = [routeWaypoints[index], routeWaypoints[index + 1]];
  }
  renderRouteWaypointList();
  renderRouteMap();
});
routeSwapButton.addEventListener('click', () => {
  const start = routeStartSelect.value;
  routeStartSelect.value = routeDestinationSelect.value;
  routeDestinationSelect.value = start;
  routeWaypoints.reverse();
  renderRouteWaypointList();
  renderRouteMap();
});
routeClearButton.addEventListener('click', () => {
  routeStartSelect.value = '';
  routeDestinationSelect.value = '';
  routeWaypointSelect.value = '';
  routeWaypoints = [];
  plannedStopCargo = new Map();
  renderRouteWaypointList();
  renderRouteMap();
});
openRoutePlanner.addEventListener('click', () => {
  if (!selectedTradeRoute) {
    return;
  }
  showMode('routePlanner');
  routeStartSelect.value = String(selectedTradeRoute.startId);
  routeDestinationSelect.value = String(selectedTradeRoute.destinationId);
  routeWaypoints = [];
  plannedStopCargo = new Map();
  renderRouteWaypointList();
  renderRouteMap();
});
addCargoButton.addEventListener('click', addCurrentCargo);
planCargoRouteButton.addEventListener('click', planAllCargoStops);
clearCargoButton.addEventListener('click', () => {
  cargoManifest = [];
  saveCargoManifest();
  renderCargoManifest();
});
exportCargoJsonButton.addEventListener('click', exportCargoJson);
exportCargoCsvButton.addEventListener('click', exportCargoCsv);
cargoBody.addEventListener('change', (event) => {
  const input = event.target.closest('[data-cargo-field]');
  const row = event.target.closest('[data-cargo-id]');
  if (!input || !row) {
    return;
  }
  const item = cargoManifest.find((entry) => entry.id === row.dataset.cargoId);
  if (!item) {
    return;
  }
  const minimum = input.dataset.cargoField === 'scu' ? 1 : 0;
  const nextValue = Math.max(minimum, Number(input.value) || minimum);
  if (input.dataset.cargoField === 'scu' && !cargoFitsShip(nextValue, item.id)) {
    renderCargoManifest();
    return;
  }
  item[input.dataset.cargoField] = nextValue;
  saveCargoManifest();
  renderCargoManifest();
});
cargoBody.addEventListener('click', (event) => {
  const mapButton = event.target.closest('[data-cargo-map]');
  const removeButton = event.target.closest('[data-cargo-remove]');
  if (mapButton) {
    openCargoRoute(mapButton.dataset.cargoMap);
  }
  if (removeButton) {
    cargoManifest = cargoManifest.filter((entry) => entry.id !== removeButton.dataset.cargoRemove);
    saveCargoManifest();
    renderCargoManifest();
  }
});
dismissCargoCapacityAlert.addEventListener('click', hideCargoCapacityAlert);
routeOpportunitiesBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-pickup-add]');
  if (button) {
    addRoutePickupToCargo(button);
  }
});
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
refreshDataButton.addEventListener('click', () => {
  refreshDataButton.disabled = true;
  Promise.resolve(window.TRADERSMATE_REFRESH_NOW?.()).finally(() => {
    refreshDataButton.disabled = false;
  });
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => showMode(button.dataset.mode));
});

window.addEventListener('tradersmate:data-updated', () => {
  data = window.TRADERSMATE_DATA || data;
  shoppingItems = window.TRADERSMATE_SHOPPING_ITEMS || shoppingItems;
  componentAttributes = window.TRADERSMATE_COMPONENT_ATTRIBUTES || componentAttributes;
  shoppingPrices = window.TRADERSMATE_SHOPPING_PRICES || shoppingPrices;
  ships = window.TRADERSMATE_SHIPS || ships;
  flyableShips = window.TRADERSMATE_FLYABLE_SHIPS || ships.filter((ship) => Number(ship.scu) > 0);
  groundVehicles = window.TRADERSMATE_GROUND_VEHICLES || groundVehicles;
  rebuildDataIndexes();
  refreshOptions();
  fillSelect(shoppingCategory, shoppingCategoryOptions(), 'Alle Kategorien');
  fillSelect(shipManufacturer, shipManufacturerOptions(), 'Alle Hersteller');
  fillSelect(groundVehicleManufacturer, groundVehicleManufacturerOptions(), 'Alle Hersteller');
  populateRouteShipOptions();
  refreshRoutePlannerOptions();
  renderCargoManifest();
  populateDatasetStatus();
  if (activeMode === 'trading') renderRoutes();
  if (activeMode === 'shopping' || activeMode === 'components') renderShopping();
  if (activeMode === 'ships') renderShips();
  if (activeMode === 'groundVehicles') renderGroundVehicles();
  if (activeMode === 'routePlanner') renderRouteMap();
});

refreshOptions();
fillSelect(shoppingCategory, shoppingCategoryOptions(), 'Alle Kategorien');
fillSelect(shipManufacturer, shipManufacturerOptions(), 'Alle Hersteller');
fillSelect(groundVehicleManufacturer, groundVehicleManufacturerOptions(), 'Alle Hersteller');
populateRouteShipOptions();
refreshRoutePlannerOptions();
renderCargoManifest();
populateDatasetStatus();
showModeGate();
