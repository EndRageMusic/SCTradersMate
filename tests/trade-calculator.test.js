const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTrade } = require('../trade-calculator');

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

test('marks missing zero values as unknown and keeps the requested amount', () => {
  const result = calculateTrade({
    requestedScu: 5,
    stockScu: 0,
    demandScu: null,
    buyUnitPrice: 10,
    sellUnitPrice: 12,
  });

  assert.equal(result.stockKnown, false);
  assert.equal(result.demandKnown, false);
  assert.equal(result.sellableScu, 5);
  assert.equal(result.fullyTradable, false);
});
