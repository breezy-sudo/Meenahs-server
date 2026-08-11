const express = require('express');
const router = express.Router();
const Booking = require('../models/bookings.js');
const { calculateTotalPrice } = require('../utils/pricing');
const { initializeTransaction, verifyTransaction } = require('../services/monnify');

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
            customerEmail: req.body.email || 'noemail@meenahshennaart.com', // Monnify requires an email; collect one on the form if you want real receipts
            paymentReference,
            paymentDescription: `Meenahs Henna Art booking — ${selectionSummary}`
        });

        booking.amountDue = amount;
        booking.paymentReference = paymentReference;
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
        const { transactionReference } = req.body;

        if (!transactionReference) {
            return res.status(400).json({ message: 'transactionReference required' });
        }

        const result = await verifyTransaction(transactionReference);

        if (result.paymentStatus !== 'PAID') {
            return res.status(402).json({ message: 'Payment not completed', status: result.paymentStatus });
        }

        const booking = await Booking.findOneAndUpdate(
            { paymentReference: transactionReference },
            { paymentStatus: 'paid' },
            { new: true }
        );

        res.json({ message: 'Payment confirmed', booking });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ message: 'Could not verify payment' });
    }
});

module.exports = router;