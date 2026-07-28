(function (root, factory) {
  const calculator = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = calculator;
  }
  root.TRADERSMATE_TRADE_CALCULATOR = calculator;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function positiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function calculateTrade(options) {
    const requestedScu = Math.max(1, Math.floor(Number(options.requestedScu) || 1));
    const buyUnitPrice = Math.max(0, Number(options.buyUnitPrice) || 0);
    const sellUnitPrice = Math.max(0, Number(options.sellUnitPrice) || 0);
    const stockScu = positiveNumber(options.stockScu);
    const demandScu = positiveNumber(options.demandScu);
    const budget = positiveNumber(options.budget);
    const affordableScu = budget && buyUnitPrice > 0 ? Math.floor(budget / buyUnitPrice) : requestedScu;
    const budgetLimitedScu = Math.min(requestedScu, affordableScu);
    const purchasableScu = Math.max(0, Math.min(budgetLimitedScu, stockScu || budgetLimitedScu));
    const sellableScu = Math.max(0, Math.min(purchasableScu, demandScu || purchasableScu));
    const unsoldScu = Math.max(0, purchasableScu - sellableScu);
    const buyTotal = buyUnitPrice * purchasableScu;
    const sellTotal = sellUnitPrice * sellableScu;
    const profitTotal = sellTotal - buyTotal;

    return {
      requestedScu,
      purchasableScu,
      sellableScu,
      unsoldScu,
      buyTotal,
      sellTotal,
      profitTotal,
      margin: buyTotal > 0 ? (profitTotal / buyTotal) * 100 : 0,
      stockKnown: stockScu !== null,
      demandKnown: demandScu !== null,
      budgetLimited: budget !== null && affordableScu < requestedScu,
      fullyTradable: stockScu !== null
        && demandScu !== null
        && purchasableScu === requestedScu
        && sellableScu === requestedScu,
    };
  }

  return { calculateTrade };
});
