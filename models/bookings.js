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
        type: [String],
        required: true
    },
    bodyArea: {
        type: [String],
        required: true
    },
    location: {
        type: String,
        required: true
    },
    homeAddress: {
        type: String,
        required: false // only needed for home service
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
    createdAt: {
        type: Date,
        default: Date.now
    }

});
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;