// Handles all direct communication with Monnify's API.
// Real credentials come from Railway env vars — never hardcoded, never sent to the browser.

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com'; // switch to https://api.monnify.com when going live

// Step 1: exchange API Key + Secret Key for a short-lived access token (valid ~1 hour)
async function getMonnifyToken() {
    const credentials = Buffer.from(
        `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
    ).toString('base64');

    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (!data.requestSuccessful) {
        throw new Error('Failed to authenticate with Monnify: ' + JSON.stringify(data));
    }

    return data.responseBody.accessToken;
}

// Step 2: start a transaction — called right before showing the customer the payment popup.
// amount MUST come from calculateTotalPrice(), never from the browser.
async function initializeTransaction({ amount, customerName, customerEmail, paymentReference, paymentDescription }) {
    const token = await getMonnifyToken();

    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount,
            customerName,
            customerEmail,
            paymentReference,
            paymentDescription,
            currencyCode: 'NGN',
            contractCode: process.env.MONNIFY_CONTRACT_CODE,
            redirectUrl: process.env.MONNIFY_REDIRECT_URL // e.g. https://meenahs-henna-art.vercel.app/payment-complete
        })
    });

    const data = await response.json();

    if (!data.requestSuccessful) {
        throw new Error('Failed to initialize Monnify transaction: ' + JSON.stringify(data));
    }

    return data.responseBody; // contains checkoutUrl, transactionReference
}

// Step 3: NEVER trust the browser's "payment successful" message alone.
// Call this from your server to confirm the payment actually happened before marking a booking paid.
async function verifyTransaction(transactionReference) {
    const token = await getMonnifyToken();

    const response = await fetch(
        `${MONNIFY_BASE_URL}/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );

    const data = await response.json();

    if (!data.requestSuccessful) {
        throw new Error('Failed to verify Monnify transaction: ' + JSON.stringify(data));
    }

    return data.responseBody; // check .paymentStatus === 'PAID'
}

module.exports = { getMonnifyToken, initializeTransaction, verifyTransaction };