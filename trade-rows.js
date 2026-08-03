(function (root, factory) {
  const helpers = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = helpers;
  }
  root.TRADERSMATE_TRADE_ROWS = helpers;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function buildTradeRows(options) {
    const {
      prices,
      commodityId,
      startTerminalId,
      requestedScu,
      budget,
      stockScu,
      buyUnitPrice,
      calculator,
    } = options;

    return prices
      .filter((price) => Number(price.commodityId) === Number(commodityId))
      .filter((price) => Number(price.terminalId) !== Number(startTerminalId))
      .filter((price) => calculator.isDropoffAvailable({
        sellUnitPrice: price.priceSell,
        demandScu: price.scuSell,
      }))
      .map((price) => {
        const calculation = calculator.calculateTrade({
          requestedScu,
          budget,
          stockScu,
          demandScu: price.scuSell,
          buyUnitPrice,
          sellUnitPrice: price.priceSell,
        });
        return {
          price,
          ...calculation,
          sellPrice: calculation.sellTotal,
          buyPrice: calculation.buyTotal,
        };
      })
      .filter((row) => row.sellableScu > 0);
  }

  return { buildTradeRows };
});
