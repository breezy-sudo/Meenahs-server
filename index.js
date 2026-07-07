const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 7000;
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:7000',
    'https://meenahs-henna-art.vercel.app',
    'https://www.meenahs-henna-art.vercel.app',
    'https://meenahs-server-production.up.railway.app'
];

// Trust proxy for railway deployment
app.set('trust proxy', 1);

// security middleware
app.use(helmet()); //secure HTTP headers
app.use(hpp()); // prevent HTTPparameters pollution

// rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// body parser and data sanitization
app.use(express.json());
app.use(mongoSanitize()); // sanitize data to prevent NoSQL injection and also remove $ and . from user unput
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Meenahshennaart')
    .then(() => console.log('✅MongoDB connected successfully!'))
    .catch(() => console.log('❌MongoDB connection error:', err));

// routes
const bookingRoutes = require('./routes/instrn.js');
app.use('/bookings', bookingRoutes);
app.get('/', (req, res) => {
    res.send('🌸 Meenahs Henna Art Server is running!');
});
app.listen(7000, () => {
    console.log('🚀Server is running on http://localhost:7000');
})

// start server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`🚀Server is running on http://localhost:${PORT}`);
})