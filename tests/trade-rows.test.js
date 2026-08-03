const test = require('node:test');
const assert = require('node:assert/strict');
const calculator = require('../trade-calculator');
const { buildTradeRows } = require('../trade-rows');

test('builds buyer rows and keeps an unknown demand destination', () => {
  const rows = buildTradeRows({
    prices: [
      { commodityId: 7, terminalId: 1, priceSell: 0, scuSell: null },
      { commodityId: 7, terminalId: 2, priceSell: 130, scuSell: null },
      { commodityId: 8, terminalId: 3, priceSell: 500, scuSell: 20 },
    ],
    commodityId: 7,
    startTerminalId: 1,
    requestedScu: 10,
    budget: null,
    stockScu: 50,
    buyUnitPrice: 100,
    calculator,
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].price.terminalId, 2);
  assert.equal(rows[0].profitTotal, 300);
  assert.equal(rows[0].demandKnown, false);
});

test('excludes an explicitly unavailable destination', () => {
  const rows = buildTradeRows({
    prices: [{ commodityId: 7, terminalId: 2, priceSell: 130, scuSell: 0 }],
    commodityId: 7,
    startTerminalId: 1,
    requestedScu: 10,
    budget: null,
    stockScu: 50,
    buyUnitPrice: 100,
    calculator,
  });
  assert.equal(rows.length, 0);
});
