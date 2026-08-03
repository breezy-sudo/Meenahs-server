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
        const usernameMatches = username === process.env.ADMIN_USERNAME;
        console.log('[admin login] username match:', usernameMatches);

        if (!usernameMatches) {
            return res.status(401).json({ message: 'Incorrect username or password' });
        }

        // Sanity-check the hash itself is actually present and looks like a real bcrypt hash
        const hash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
        console.log('[admin login] hash present:', !!hash, '| length:', hash ? hash.length : 0, '| starts with $2:', hash ? hash.startsWith('$2') : false);

        // Password check — compares against the bcrypt HASH stored in env vars,
        // never a plain-text password.
        const passwordMatches = await bcrypt.compare(password, hash || '');
        console.log('[admin login] password match:', passwordMatches);

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
        console.error('[admin login] unexpected error:', error);
        res.status(500).json({ message: 'Login failed, try again' });
    }
});

module.exports = router;