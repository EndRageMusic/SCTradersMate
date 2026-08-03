const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTrade, isDropoffAvailable } = require('../trade-calculator');

test('calculates a fully tradable load', () => {
  const result = calculateTrade({
    requestedScu: 10,
    stockScu: 100,
    demandScu: 50,
    buyUnitPrice: 100,
    sellUnitPrice: 130,
  });

  assert.equal(result.purchasableScu, 10);
  assert.equal(result.sellableScu, 10);
  assert.equal(result.profitTotal, 300);
  assert.equal(result.margin, 30);
  assert.equal(result.fullyTradable, true);
});

test('limits the purchase to reported stock', () => {
  const result = calculateTrade({
    requestedScu: 20,
    stockScu: 7,
    demandScu: 100,
    buyUnitPrice: 100,
    sellUnitPrice: 150,
  });

  assert.equal(result.purchasableScu, 7);
  assert.equal(result.sellableScu, 7);
  assert.equal(result.buyTotal, 700);
  assert.equal(result.profitTotal, 350);
  assert.equal(result.fullyTradable, false);
});

test('counts unsold cargo as purchased cost', () => {
  const result = calculateTrade({
    requestedScu: 10,
    stockScu: 100,
    demandScu: 4,
    buyUnitPrice: 100,
    sellUnitPrice: 150,
  });

  assert.equal(result.unsoldScu, 6);
  assert.equal(result.buyTotal, 1000);
  assert.equal(result.sellTotal, 600);
  assert.equal(result.profitTotal, -400);
  assert.equal(result.margin, -40);
});

test('applies the available budget before stock and demand', () => {
  const result = calculateTrade({
    requestedScu: 20,
    stockScu: 100,
    demandScu: 100,
    budget: 950,
    buyUnitPrice: 100,
    sellUnitPrice: 125,
  });

  assert.equal(result.purchasableScu, 9);
  assert.equal(result.sellableScu, 9);
  assert.equal(result.budgetLimited, true);
  assert.equal(result.profitTotal, 225);
});

test('respects an explicit zero budget', () => {
  const result = calculateTrade({
    requestedScu: 20,
    stockScu: 100,
    demandScu: 100,
    budget: 0,
    buyUnitPrice: 100,
    sellUnitPrice: 125,
  });

  assert.equal(result.purchasableScu, 0);
  assert.equal(result.sellableScu, 0);
  assert.equal(result.budgetLimited, true);
});

test('treats an explicitly reported zero stock and demand as unavailable', () => {
  const result = calculateTrade({
    requestedScu: 5,
    stockScu: 0,
    demandScu: 0,
    buyUnitPrice: 10,
    sellUnitPrice: 12,
  });

  assert.equal(result.stockKnown, true);
  assert.equal(result.demandKnown, true);
  assert.equal(result.purchasableScu, 0);
  assert.equal(result.sellableScu, 0);
  assert.equal(result.fullyTradable, false);
});

test('keeps missing stock and demand values explicitly unknown', () => {
  const result = calculateTrade({
    requestedScu: 5,
    stockScu: null,
    demandScu: null,
    buyUnitPrice: 10,
    sellUnitPrice: 12,
  });

  assert.equal(result.stockKnown, false);
  assert.equal(result.demandKnown, false);
  assert.equal(result.sellableScu, 5);
  assert.equal(result.fullyTradable, false);
});

test('rejects priced drop-offs with explicitly zero demand', () => {
  assert.equal(isDropoffAvailable({ sellUnitPrice: 3600, demandScu: 0 }), false);
  assert.equal(isDropoffAvailable({ sellUnitPrice: 3500, demandScu: 2737 }), true);
});

test('allows a priced drop-off when demand was not reported', () => {
  assert.equal(isDropoffAvailable({ sellUnitPrice: 3500, demandScu: null }), true);
  assert.equal(isDropoffAvailable({ sellUnitPrice: 0, demandScu: 100 }), false);
});
