const express = require('express');
const router = express.Router();
const Booking = require('../models/bookings.js');
const { calculateTotalPrice } = require('../utils/pricing');
const { initializeTransaction, verifyTransaction } = require('../services/monnify.js');

// This route is reachable by anyone with a payment reference, so only ever send
// back the few harmless fields the website needs — never phone, address or notes.
function safeBooking(booking) {
    return {
        _id: booking._id,
        date: booking.date,
        time: booking.time,
        amountDue: booking.amountDue,
        amountPaid: booking.amountPaid,
        paymentStatus: booking.paymentStatus,
        status: booking.status
    };
}

// ROUTE 1 -- Start checkout for an existing booking
// POST /payment/checkout/:bookingId
// Pulls the booking's OWN saved hennaType/bodyArea from the database and calculates
// the price from those — the amount can never be influenced by what the browser sends.
router.post('/checkout/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(409).json({ message: 'This booking has already been paid for' });
        }

        const amount = calculateTotalPrice({
            selections: booking.selections,
            bridal: booking.bridal,
            location: booking.location,
            distanceBand: booking.distanceBand
        });

        if (amount <= 0) {
            return res.status(400).json({ message: 'Price list not configured yet — check config/pricing.js' });
        }

        const paymentReference = `MEENAHS-${booking._id}-${Date.now()}`;

        const selectionSummary = (booking.selections || [])
            .map(s => `${s.hennaType} on ${s.bodyArea}`)
            .join(', ') || (booking.bridal ? 'Bridal package' : 'Henna session');

        const transaction = await initializeTransaction({
            amount,
            customerName: booking.name,
            // the email saved with the booking is preferred; the one posted here is a fallback
            customerEmail: booking.email || req.body.email || 'noemail@meenahshennaart.com',
            paymentReference,
            paymentDescription: `Meenahs Henna Art booking — ${selectionSummary}`
        });

        booking.amountDue = amount;
        booking.paymentReference = paymentReference;
        booking.transactionReference = transaction.transactionReference;
        await booking.save();

        res.json({
            amount,
            checkoutUrl: transaction.checkoutUrl,
            transactionReference: transaction.transactionReference
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ message: 'Could not start payment, try again' });
    }
});

// ROUTE 2 -- Confirm a payment actually went through
// POST /payment/verify
// Call this after Monnify's checkout redirects/completes — never trust the frontend's
// "success" callback alone, always re-check with Monnify directly from the server.
router.post('/verify', async (req, res) => {
    try {
        // The browser may hand us either reference, depending on how it came back
        // from the payment page — accept both and look the booking up either way.
        const reference = req.body.transactionReference || req.body.paymentReference;

        if (!reference) {
            return res.status(400).json({ message: 'A payment reference is required' });
        }

        const booking = await Booking.findOne({
            $or: [{ transactionReference: reference }, { paymentReference: reference }]
        });

        if (!booking) {
            return res.status(404).json({ message: 'We could not find that payment' });
        }

        // Already confirmed on an earlier visit — nothing more to do
        if (booking.paymentStatus === 'paid') {
            return res.json({ message: 'Payment confirmed', booking: safeBooking(booking) });
        }

        // Always verify against the provider using THEIR reference, never the browser's word
        const result = await verifyTransaction(booking.transactionReference || reference);

        if (result.paymentStatus !== 'PAID') {
            return res.status(402).json({ message: 'Payment not completed yet', status: result.paymentStatus });
        }

        // Guard against a short payment — only mark paid if the full amount landed
        if (Number(result.amountPaid) < Number(booking.amountDue)) {
            return res.status(402).json({ message: 'Payment amount was less than the booking total' });
        }

        booking.paymentStatus = 'paid';
        booking.amountPaid = Number(result.amountPaid) || booking.amountDue;
        booking.paidAt = new Date();
        booking.status = 'confirmed';
        await booking.save();

        res.json({ message: 'Payment confirmed', booking: safeBooking(booking) });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ message: 'Could not verify payment' });
    }
});

module.exports = router;