(function () {
  'use strict';

  const API_BASE = 'https://api.uexcorp.uk/2.0/';
  const DB_NAME = 'tradersmate-daily-data-v3';
  const STORE_NAME = 'snapshots';
  const SNAPSHOT_KEY = 'latest';
  const COMPONENT_CATEGORY_IDS = [19, 21, 22, 23];
  const refreshHelpers = window.TRADERSMATE_REFRESH_HELPERS;

  function localDay() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function setStatus(text, failed) {
    const status = document.getElementById('apiStatusText');
    if (status) {
      status.textContent = text;
      status.classList.toggle('is-error', Boolean(failed));
    }
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readSnapshot() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(SNAPSHOT_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
    });
  }

  async function writeSnapshot(snapshot) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(snapshot, SNAPSHOT_KEY);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function fetchData(endpoint, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`${endpoint}: HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!Array.isArray(payload.data)) {
        throw new Error(`${endpoint}: ungueltige Antwort`);
      }
      return payload.data;
    } catch (error) {
      throw new Error(`${endpoint}: ${error.name === 'AbortError' ? 'Zeitlimit erreicht' : error.message}`);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function applySnapshot(payload) {
    window.TRADERSMATE_DATA = payload.trading;
    window.TRADERSMATE_SHOPPING_ITEMS = payload.shoppingItems;
    window.TRADERSMATE_SHOPPING_PRICES = payload.shoppingPrices;
    window.TRADERSMATE_COMPONENT_ATTRIBUTES = payload.componentAttributes;
    window.TRADERSMATE_SHIPS = payload.ships;
    window.TRADERSMATE_FLYABLE_SHIPS = payload.flyableShips || payload.ships;
    window.TRADERSMATE_GROUND_VEHICLES = payload.groundVehicles;
    window.dispatchEvent(new CustomEvent('tradersmate:data-updated'));
  }

  const { nullableNumber, normalizeSellDemand, fetchEndpointList, isCompleteDailySnapshot } = refreshHelpers;

  function normalizeTerminal(terminal) {
    return {
      id: terminal.id,
      name: terminal.displayname || terminal.name,
      terminalName: terminal.name,
      fullName: terminal.fullname,
      nickname: terminal.nickname,
      type: terminal.type,
      system: terminal.star_system_name,
      planet: terminal.planet_name,
      city: terminal.city_name,
      station: terminal.space_station_name,
      outpost: terminal.outpost_name,
      hasLoadingDock: Boolean(Number(terminal.has_loading_dock)),
      isAutoLoad: Boolean(Number(terminal.is_auto_load)),
    };
  }

  function buildVehicleData(vehicles, prices, terminals, groundOnly) {
    const terminalById = new Map(terminals.map((terminal) => [terminal.id, terminal]));
    const shopsByVehicle = new Map();

    prices.forEach((price) => {
      if (Number(price.price_buy) <= 0) {
        return;
      }
      const terminal = terminalById.get(price.id_terminal);
      const shops = shopsByVehicle.get(price.id_vehicle) || [];
      shops.push({
        terminal: terminal?.fullname || price.terminal_name,
        price: Number(price.price_buy),
      });
      shopsByVehicle.set(price.id_vehicle, shops);
    });

    return vehicles
      .filter((vehicle) =>
        groundOnly ? Number(vehicle.is_ground_vehicle) === 1 : Number(vehicle.is_spaceship) === 1,
      )
      .filter((vehicle) => shopsByVehicle.has(vehicle.id))
      .map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name_full || vehicle.name,
        manufacturer: vehicle.company_name || '',
        scu: Number(vehicle.scu) || 0,
        crew: vehicle.crew || '',
        shops: shopsByVehicle
          .get(vehicle.id)
          .sort((a, b) => a.price - b.price || a.terminal.localeCompare(b.terminal, 'de')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  function buildFlyableShipData(vehicles) {
    return vehicles
      .filter((vehicle) => Number(vehicle.is_spaceship) === 1)
      .filter((vehicle) => Number(vehicle.is_ground_vehicle) !== 1)
      .filter((vehicle) => Number(vehicle.is_concept) !== 1)
      .filter((vehicle) => Number(vehicle.is_addon) !== 1)
      .filter((vehicle) => Number(vehicle.scu) > 0)
      .map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name_full || vehicle.name,
        manufacturer: vehicle.company_name || '',
        scu: Number(vehicle.scu),
        crew: vehicle.crew || '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  async function downloadTradingSnapshot() {
    const [commodities, commodityPrices, terminals] = await fetchEndpointList([
      'commodities',
      'commodities_prices_all',
      'terminals',
    ], fetchData, 30000);

    return {
      terminals,
      trading: {
        source: 'UEX Corp API 2.0',
        generatedAt: new Date().toISOString(),
        commodities: commodities.map((commodity) => ({
          id: commodity.id,
          name: commodity.name,
          code: commodity.code,
          kind: commodity.kind,
          isIllegal: Boolean(Number(commodity.is_illegal)),
          isFuel: Boolean(Number(commodity.is_fuel)),
          isBuyable: Boolean(Number(commodity.is_buyable)),
          isSellable: Boolean(Number(commodity.is_sellable)),
        })),
        terminals: terminals.filter((terminal) => terminal.type === 'commodity').map(normalizeTerminal),
        prices: commodityPrices
          .filter((price) => Number(price.id_commodity) > 0 && Number(price.id_terminal) > 0)
          .map((price) => ({
            commodityId: price.id_commodity,
            terminalId: price.id_terminal,
            priceBuy: Number(price.price_buy) || 0,
            priceSell: Number(price.price_sell) || 0,
            scuBuy: nullableNumber(price.scu_buy),
            scuSell: normalizeSellDemand(price.scu_sell, price.status_sell),
            stock: nullableNumber(price.scu_sell_stock),
            statusBuy: nullableNumber(price.status_buy),
            statusSell: nullableNumber(price.status_sell),
            containerSizes: price.container_sizes || '',
            modified: Number(price.date_modified) || 0,
          })),
      },
    };
  }

  function currentOptionalSnapshot() {
    return {
      shoppingItems: window.TRADERSMATE_SHOPPING_ITEMS || [],
      shoppingPrices: window.TRADERSMATE_SHOPPING_PRICES || [],
      componentAttributes: window.TRADERSMATE_COMPONENT_ATTRIBUTES || {},
      ships: window.TRADERSMATE_SHIPS || [],
      flyableShips: window.TRADERSMATE_FLYABLE_SHIPS || [],
      groundVehicles: window.TRADERSMATE_GROUND_VEHICLES || [],
    };
  }

  async function downloadOptionalSnapshot(terminals) {
    const endpoints = [
      'categories?type=item',
      'items_prices_all',
      'vehicles',
      'vehicles_purchases_prices_all',
      ...COMPONENT_CATEGORY_IDS.map((id) => `items_attributes?id_category=${id}`),
    ];
    const responses = await fetchEndpointList(endpoints, fetchData, 15000);
    const [categories, itemPrices, vehicles, vehiclePrices] = responses;
    const attributeRows = responses.slice(4).flat();
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const terminalById = new Map(terminals.map((terminal) => [terminal.id, terminal]));
    const buyableItemPrices = itemPrices.filter((price) => Number(price.price_buy) > 0);
    const shoppingItemsById = new Map();

    buyableItemPrices.forEach((price) => {
      const category = categoryById.get(price.id_category) || {};
      shoppingItemsById.set(price.id_item, {
        id: price.id_item,
        name: price.item_name,
        section: category.section || '',
        category: category.name || '',
      });
    });

    const componentAttributes = {};
    attributeRows.forEach((row) => {
      if (row.attribute_name !== 'Grade' && row.attribute_name !== 'Class') {
        return;
      }
      componentAttributes[row.id_item] ||= {};
      componentAttributes[row.id_item][row.attribute_name.toLowerCase()] = row.value;
    });

    return {
      shoppingItems: [...shoppingItemsById.values()].sort((a, b) => a.name.localeCompare(b.name, 'de')),
      shoppingPrices: buyableItemPrices.map((price) => ({
        itemId: price.id_item,
        terminal: terminalById.get(price.id_terminal)?.fullname || price.terminal_name,
        price: Number(price.price_buy),
      })),
      componentAttributes,
      ships: buildVehicleData(vehicles, vehiclePrices, terminals, false),
      flyableShips: buildFlyableShipData(vehicles),
      groundVehicles: buildVehicleData(vehicles, vehiclePrices, terminals, true),
    };
  }

  async function refresh(force = false) {
    let cached = null;
    try {
      cached = await readSnapshot();
    } catch (error) {
      console.warn('TradersMate Cache konnte nicht gelesen werden:', error);
    }

    try {
      if (!force && isCompleteDailySnapshot(cached, localDay())) {
        applySnapshot(cached.payload);
        setStatus('· HEUTE AKTUELL');
        return;
      }

      setStatus('· AKTUALISIERE');
      const downloaded = await downloadTradingSnapshot();
      let payload = {
        trading: downloaded.trading,
        ...currentOptionalSnapshot(),
      };
      applySnapshot(payload);
      setStatus('· LIVE HANDEL');
      try {
        await writeSnapshot({ day: localDay(), payload, complete: false });
      } catch (error) {
        console.warn('TradersMate Tagesstand konnte nicht gespeichert werden:', error);
      }

      try {
        const optional = await downloadOptionalSnapshot(downloaded.terminals);
        payload = { trading: downloaded.trading, ...optional };
        applySnapshot(payload);
        await writeSnapshot({ day: localDay(), payload, complete: true });
        setStatus('· LIVE AKTUALISIERT');
      } catch (error) {
        setStatus('· LIVE HANDEL');
        console.warn('Optionale UEX-Daten konnten nicht aktualisiert werden:', error);
      }
    } catch (error) {
      if (cached?.payload) {
        applySnapshot(cached.payload);
        setStatus('· CACHE', true);
      } else {
        setStatus('· LOKALER STAND', true);
      }
      console.warn('TradersMate Tagesupdate fehlgeschlagen:', error);
    }
  }

  window.TRADERSMATE_REFRESH_NOW = () => refresh(true);
  window.TRADERSMATE_DAILY_REFRESH = refresh(false);
})();
