// ══════════════════════════════════════════════════════════
// PRICE LIST — dummy numbers for now. These MUST match the
// PRICE_TABLE / BRIDAL_PRICE / HOME_SERVICE_BANDS in app.js
// (frontend) exactly, since app.js only displays a price —
// this file is what actually gets charged.
//
// Keys must exactly match the henna type and body area
// "value" attributes used in index.html.
// ══════════════════════════════════════════════════════════

const PRICE_TABLE = {
    local: { hands: 3000, feet: 3000, hands_feet: 5000, palms: 2000, shoulder_collarbone: 4000 },
    black: { hands: 4000, feet: 4000, hands_feet: 7000, palms: 2500, shoulder_collarbone: 5000 },
    mix: { hands: 4500, feet: 4500, hands_feet: 8000, palms: 3000, shoulder_collarbone: 5500 }
};

const BRIDAL_PRICE = 20000;

const HOME_SERVICE_BANDS = {
    within_5km: 1000,
    '5_15km': 2500,
    over_15km: 5000
};

module.exports = { PRICE_TABLE, BRIDAL_PRICE, HOME_SERVICE_BANDS };