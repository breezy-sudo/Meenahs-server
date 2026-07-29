// importing express
const express = require('express');

// create a router : just like a mini server
const router = express.Router();

// importing booking model
const Booking = require('../models/bookings.js');

// importing admin auth middleware — protects routes that expose customer data
const verifyAdminToken = require('../middleware/auth.js');
// ROUTE 1 -- SAVES NEW BOOKING
// POST/bookings
// used by index.html when customer submits bookings form
router.post('/', async (req, res) => {
    try {
        const newBooking = new Booking({
            name: req.body.name,
            phone: req.body.phone,
            date: req.body.date,
            time: req.body.time,
            hennaType: req.body.hennaType,
            bodyArea: req.body.bodyArea,
            location: req.body.location,
            homeAddress: req.body.homeAddress,
            payment: req.body.payment,
            notes: req.body.notes,
            status: 'pending',
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