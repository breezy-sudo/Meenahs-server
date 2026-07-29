const jwt = require('jsonwebtoken');

// Protects a route so only a logged-in admin (valid token) can access it.
// On the request, req.admin will contain the decoded token payload.
function verifyAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = verifyAdminToken;