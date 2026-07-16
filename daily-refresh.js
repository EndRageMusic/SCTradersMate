(function () {
  'use strict';

  const API_BASE = 'https://api.uexcorp.uk/2.0/';
  const MISSION_API_BASE = 'https://api.star-citizen.wiki/api/missions';
  const DB_NAME = 'tradersmate-daily-data-v2';
  const STORE_NAME = 'snapshots';
  const SNAPSHOT_KEY = 'latest';
  const COMPONENT_CATEGORY_IDS = [19, 21, 22, 23];

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

  async function fetchData(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`${endpoint}: HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.data)) {
      throw new Error(`${endpoint}: ungueltige Antwort`);
    }
    return payload.data;
  }

  function applySnapshot(payload) {
    window.TRADERSMATE_DATA = payload.trading;
    window.TRADERSMATE_SHOPPING_ITEMS = payload.shoppingItems;
    window.TRADERSMATE_SHOPPING_PRICES = payload.shoppingPrices;
    window.TRADERSMATE_COMPONENT_ATTRIBUTES = payload.componentAttributes;
    window.TRADERSMATE_SHIPS = payload.ships;
    window.TRADERSMATE_FLYABLE_SHIPS = payload.flyableShips || payload.ships;
    window.TRADERSMATE_GROUND_VEHICLES = payload.groundVehicles;
    window.TRADERSMATE_MISSIONS = payload.missions || [];
  }

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

  async function downloadSnapshot() {
    const endpoints = [
      'commodities',
      'commodities_prices_all',
      'terminals',
      'categories?type=item',
      'items_prices_all',
      'vehicles',
      'vehicles_purchases_prices_all',
      ...COMPONENT_CATEGORY_IDS.map((id) => `items_attributes?id_category=${id}`),
    ];
    const [responses, missions] = await Promise.all([
      Promise.all(endpoints.map(fetchData)),
      fetchMissions().catch((error) => {
        console.warn('Missionsdaten konnten nicht aktualisiert werden:', error);
        return window.TRADERSMATE_MISSIONS || [];
      }),
    ]);
    const [commodities, commodityPrices, terminals, categories, itemPrices, vehicles, vehiclePrices] =
      responses;
    const attributeRows = responses.slice(7).flat();
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

    const generatedAt = new Date().toISOString();
    return {
      trading: {
        source: 'UEX Corp API 2.0',
        generatedAt,
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
        prices: commodityPrices.map((price) => ({
          commodityId: price.id_commodity,
          terminalId: price.id_terminal,
          priceBuy: Number(price.price_buy) || 0,
          priceSell: Number(price.price_sell) || 0,
          scuBuy: Number(price.scu_buy) || 0,
          scuSell: Number(price.scu_sell) || 0,
          stock: Number(price.scu_sell_stock) || 0,
          statusBuy: Boolean(Number(price.status_buy)),
          statusSell: Boolean(Number(price.status_sell)),
          containerSizes: price.container_sizes || '',
          modified: Number(price.date_modified) || 0,
        })),
      },
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
      missions,
    };
  }

  async function fetchMissionPage(page) {
    const response = await fetch(`${MISSION_API_BASE}?page[size]=100&page[number]=${page}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Missionen Seite ${page}: HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.data)) {
      throw new Error(`Missionen Seite ${page}: ungueltige Antwort`);
    }
    return payload;
  }

  async function fetchMissions() {
    const firstPage = await fetchMissionPage(1);
    const pageCount = Number(firstPage.meta?.last_page) || 1;
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => fetchMissionPage(index + 2)),
    );
    return [firstPage, ...remainingPages].flatMap((payload) => payload.data);
  }

  window.TRADERSMATE_DAILY_REFRESH = (async () => {
    let cached = null;
    try {
      cached = await readSnapshot();
    } catch (error) {
      console.warn('TradersMate Cache konnte nicht gelesen werden:', error);
    }

    try {
      if (cached?.day === localDay() && cached.payload && Array.isArray(cached.payload.missions)) {
        applySnapshot(cached.payload);
        setStatus('· HEUTE AKTUELL');
        return;
      }

      setStatus('· AKTUALISIERE');
      const payload = await downloadSnapshot();
      applySnapshot(payload);
      try {
        await writeSnapshot({ day: localDay(), payload });
      } catch (error) {
        console.warn('TradersMate Tagesstand konnte nicht gespeichert werden:', error);
      }
      setStatus('· LIVE AKTUALISIERT');
    } catch (error) {
      if (cached?.payload) {
        applySnapshot(cached.payload);
        setStatus('· CACHE', true);
      } else {
        setStatus('· LOKALER STAND', true);
      }
      console.warn('TradersMate Tagesupdate fehlgeschlagen:', error);
    }
  })();
})();
