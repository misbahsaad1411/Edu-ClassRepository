//
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET, // Ensure this is set in your .env file
    JWT_EXPIRY: '24h',
    VALID_EMAIL_DOMAIN: '@eastdelta.edu.bd',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    
    // [NEW] Hardcoded Super Admins
    ADMIN_EMAILS: [
        'nazmussakai@gmail.com',
        'misbahsaad01@gmail.com'
    ],
    
    MIN_PASSWORD_LENGTH: 6,
    FILE_STATUS: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' },
    USER_ROLE: { STUDENT: 'student', ADMIN: 'admin' }
};