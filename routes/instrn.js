// importing express
const express = require('express');

// create a router : just like a mini server
const router = express.Router();

// importing booking model
const Booking = require('../models/bookings.js');

// importing admin auth middleware — protects routes that expose customer data
const verifyAdminToken = require('../middleware/auth.js');

// the real price list — used here only to reject henna/area combinations that don't exist
const { PRICE_TABLE, HOME_SERVICE_BANDS } = require('../config/pricing.js');
// ROUTE 1 -- SAVES NEW BOOKING
// POST/bookings
// used by index.html when customer submits bookings form
router.post('/', async (req, res) => {
    try {
        // Only ever keep the (hennaType, bodyArea) pairs we actually recognise —
        // this is what the price is calculated from, so it must stay clean.
        const selections = Array.isArray(req.body.selections)
            ? req.body.selections
                .filter(s => s && typeof s.hennaType === 'string' && typeof s.bodyArea === 'string')
                .map(s => ({ hennaType: s.hennaType.trim(), bodyArea: s.bodyArea.trim() }))
                .filter(s => PRICE_TABLE[s.hennaType] && PRICE_TABLE[s.hennaType][s.bodyArea] != null)
            : [];

        const bridal = req.body.bridal === true || req.body.bridal === 'true';

        if (selections.length === 0 && !bridal) {
            return res.status(400).json({
                message: '❌Please choose at least one henna type and body area'
            });
        }

        const location = req.body.location === 'home' ? 'home' : 'studio';
        const distanceBand = location === 'home' && HOME_SERVICE_BANDS[req.body.distanceBand] != null
            ? req.body.distanceBand
            : undefined;

        if (location === 'home' && !distanceBand) {
            return res.status(400).json({
                message: '❌Please tell us how far you are from the studio'
            });
        }

        const newBooking = new Booking({
            name: String(req.body.name || '').trim().slice(0, 100),
            phone: String(req.body.phone || '').trim().slice(0, 20),
            email: String(req.body.email || '').trim().slice(0, 255),
            date: req.body.date,
            time: req.body.time,
            // pairs of henna type + body area — the only thing pricing reads
            selections: selections,
            bridal: bridal,
            location: location,
            homeAddress: location === 'home' ? String(req.body.homeAddress || '').trim().slice(0, 300) : undefined,
            distanceBand: distanceBand,
            payment: req.body.payment === 'deposit' ? 'deposit' : 'after',
            notes: String(req.body.notes || '').trim().slice(0, 1000),
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: new Date()
        });

        // saving it to mnongodb
        const saved = await newBooking.save();

        //send back a success response
        res.status(201).json({
            message: '✅Booking saved successfully!',
            booking: saved
        });
    } catch (error) {
        res.status(500).json({
            message: '❌Failed to save booking',
            error: error.message
        });
    }
});

// ROUTE 2 -- Get all bookings
// GET/bookings
// used by admin.html to fetch all bookings
// protected; requires a valid admin token , since it exposes customer data
router.get('/', verifyAdminToken, async (req, res) => {
    try {
        // fetch all bookings from mongodb
        //sort (-1)so new bookings show first
        const bookings = await Booking.find().sort({ createdAt: -1 });

        // send back to admin
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({
            message: '❌Failed to fetch bookings',
            error: error.message
        });
    }
});


//ROUTE 3
// PATCH/bookings/:id
// used by admin.html when confiming bookings or rejecting
// protected: onnly a logged in admin can change a booikng status or delete a booking

router.patch('/:id', verifyAdminToken, async (req, res) => {
    try {
        const updated = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }// return the updated booking
        );
        res.status(200).json({
            message: '✅Booking status updated!',
            booking: updated
        });
    } catch (error) {
        res.status(500).json({
            message: '❌Failed to update booking',
            error: error.message
        });
    }
});

//ROUTE 4
// DELETE/bookings/:id
// used by admin.html when deleting bookings
// protected: only a logged in admin can delete a booking
router.delete('/:id', verifyAdminToken, async (req, res) => {
    try {
        const deleted = await Booking.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                message: '❌Booking not found',
                error: 'No booking with that ID'
            });
        }
        res.status(200).json({
            message: '✅Booking deleted successfully!',
            booking: deleted
        });
    } catch (error) {
        res.status(500).json({
            message: '❌Failed to delete booking',
            error: error.message
        });
    }
});
// exporting router so server.js can use it
module.exports = router;