(function (root, factory) {
  const calculator = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = calculator;
  }
  root.TRADERSMATE_TRADE_CALCULATOR = calculator;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function optionalNonNegativeNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function calculateTrade(options) {
    const requestedScu = Math.max(1, Math.floor(Number(options.requestedScu) || 1));
    const buyUnitPrice = Math.max(0, Number(options.buyUnitPrice) || 0);
    const sellUnitPrice = Math.max(0, Number(options.sellUnitPrice) || 0);
    const stockScu = optionalNonNegativeNumber(options.stockScu);
    const demandScu = optionalNonNegativeNumber(options.demandScu);
    const budget = optionalNonNegativeNumber(options.budget);
    const affordableScu = budget && buyUnitPrice > 0 ? Math.floor(budget / buyUnitPrice) : requestedScu;
    const budgetLimitedScu = Math.min(requestedScu, affordableScu);
    const purchasableScu = Math.max(
      0,
      stockScu === null ? budgetLimitedScu : Math.min(budgetLimitedScu, stockScu),
    );
    const sellableScu = Math.max(
      0,
      demandScu === null ? purchasableScu : Math.min(purchasableScu, demandScu),
    );
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

  function isDropoffAvailable(options) {
    const sellUnitPrice = Number(options.sellUnitPrice);
    const demandScu = optionalNonNegativeNumber(options.demandScu);
    return Number.isFinite(sellUnitPrice)
      && sellUnitPrice > 0
      && (demandScu === null || demandScu > 0);
  }

  return { calculateTrade, isDropoffAvailable };
});
