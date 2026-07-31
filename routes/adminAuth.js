const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        // Username check — plain compare is fine, it isn't the secret.
        if (username !== process.env.ADMIN_USERNAME) {
            return res.status(401).json({ message: 'Incorrect username or password' });
        }

        // Password check — compares against the bcrypt HASH stored in env vars,
        // never a plain-text password.
        const passwordMatches = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Incorrect username or password' });
        }

        // Credentials good — issue a signed token valid for 12 hours.
        const token = jwt.sign(
            { username: process.env.ADMIN_USERNAME },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ token });
    } catch (error) {
        console.log('Login error:', error);
        res.status(500).json({ message: 'Login failed, try again' });
    }
});

module.exports = router;