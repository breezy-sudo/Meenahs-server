//importing mongoose
const mongoose = require('mongoose');

// creating the booking schema or template
const bookingSchema = new mongoose.Schema({
    //customer personal details
    name: {
        type: String,  //must be text
        required: true //cannot be empty
    },
    phone: {
        type: String,
        required: true
    },
    // used for the payment receipt — optional for pay-on-the-day bookings
    email: {
        type: String,
        required: false
    },

    //appointment details
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    hennaType: {
        // kept for backward compatibility with old bookings saved before this change
        // no longer written to buy new bookings, safe to ignore forward
        type: [String],
        required: false
    },
    bodyArea: {
        type: [String],
        required: false
    },
    // each entry pairs one henna with one body area,
    // e.g {hennaType: 'black', bodyArea: 'hands'} == this is what pricing is calculated from
    selections: [{
        hennaType: { type: String, required: true },
        bodyArea: { type: String, required: true },
        _id: false
    }],
    bridal: {
        type: Boolean,
        default: false
    },
    location: {
        type: String,
        required: true
    },
    homeAddress: {
        type: String,
        required: false // only needed for home service
    },
    distanceBand: {
        type: String,
        required: false // only needed for home service: 'within_5km' | '5_15km' | 'over_15km'
    },
    payment: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        required: false //optional
    },

    //booking status -- starts as pending
    status: {
        type: String,
        default: 'pending'
    },

    // ── payment tracking (Monnify) ──
    amountDue: {
        type: Number,
        default: 0
    },
    paymentReference: {
        type: String,
        required: false
    },
    // the provider's own reference for the same payment — what we verify against
    transactionReference: {
        type: String,
        required: false
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    paidAt: {
        type: Date,
        required: false
    },
    paymentStatus: {
        type: String,
        default: 'unpaid' // 'unpaid' | 'paid'
    },


    createdAt: {
        type: Date,
        default: Date.now
    }

});
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;