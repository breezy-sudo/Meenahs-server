const { PRICE_TABLE, BRIDAL_PRICE, HOME_SERVICE_BANDS } = require('../config/pricing');

// Adds up: every (hennaType, bodyArea) pair the customer built themselves,
// plus a fixed Bridal price if chosen, plus a home-service distance fee if applicable.
// This is the ONLY place a real charge amount is ever calculated —
// never trust a total sent from the browser.
function calculateTotalPrice({ selections, bridal, location, distanceBand }) {
    let total = 0;

    (selections || []).forEach(({ hennaType, bodyArea }) => {
        const areaPrices = PRICE_TABLE[hennaType];
        if (areaPrices && areaPrices[bodyArea] != null) {
            total += areaPrices[bodyArea];
        }
    });

    if (bridal) {
        total += BRIDAL_PRICE;
    }

    if (location === 'home' && distanceBand && HOME_SERVICE_BANDS[distanceBand] != null) {
        total += HOME_SERVICE_BANDS[distanceBand];
    }

    return total;
}

module.exports = { calculateTotalPrice };