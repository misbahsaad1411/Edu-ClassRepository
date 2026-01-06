// TEMPORARY: Direct admin creation route for password compatibility troubleshooting
exports.createAdminDirect = async (req, res) => {
    try {
        const email = 'misbahsaad01@gmail.com';
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO users (student_id, name, email, password, department, role, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
            ['ADM-003', 'Misbah Saad', email, hash, 'Admin', 'admin', true]
        );
        res.json({ message: 'Admin created', email, hash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
//
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../config/database');
const { 
    JWT_SECRET, 
    VALID_EMAIL_DOMAIN, 
    EMAIL_USER, 
    EMAIL_PASS,
    ADMIN_EMAILS 
} = require('../config/constants');
const { validatePassword } = require('../utils/validation');

// 1. Configure Email Transporter (Use Environment Variables for Production!)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', // Defaults to Gmail if not set
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

exports.register = async (req, res, next) => {
    try {
        const { name, student_id, email, password, department, gender, semester } = req.body;
        
        // Basic Validation
        if (!name || !student_id || !email || !password || !department) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const normalizedEmail = email.toLowerCase();
        
        // --- STEP A: CHECK FOR ADMIN ---
        const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);
        
        // --- STEP B: DOMAIN VALIDATION (Bypass for Admins) ---
        if (!isAdminEmail && !normalizedEmail.endsWith(VALID_EMAIL_DOMAIN)) {
            return res.status(400).json({ error: `Only ${VALID_EMAIL_DOMAIN} emails allowed` });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // --- STEP C: CREATE USER ---
        const hash = await bcrypt.hash(password, 10);
        const role = isAdminEmail ? 'admin' : 'student';
        // Directly set is_verified to true and skip email verification
        const result = await pool.query(
            `INSERT INTO users (student_id, name, email, password, department, gender, semester, is_verified, verification_token, role) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [student_id, name, normalizedEmail, hash, department, gender || null, semester || null, true, null, role]
        );
        res.json({ message: 'Registration successful! You can now log in.' });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
        next(err);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        
        // --- STEP G: VERIFY JWT TOKEN ---
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(400).send('<h1>Link expired or invalid. Please register again.</h1>');
        }

        // --- STEP H: ACTIVATE USER ---
        // We use the ID from the decoded token to find and update the user
        await pool.query(
            'UPDATE users SET is_verified = TRUE WHERE id = $1',
            [decoded.id]
        );
        
        // Notify Admins of success
        // (Optional: You can copy the admin alert code from above here if you want alerts on SUCCESS too)

        res.redirect('/index.html?verified=true');
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    // ... (Keep your existing login logic, but ensure you use the is_verified check)
    // The previous implementation I provided for login is compatible here.
    try {
        const { email, password, userType } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email/Pass required' });

        // Debug: Log admin emails and login attempt
        console.log('ADMIN_EMAILS:', ADMIN_EMAILS);
        console.log('Login attempt:', email);
        console.log('Received password:', password);

        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        // If not found, try admin emails
        if (result.rows.length === 0 && ADMIN_EMAILS.includes(email.toLowerCase())) {
            result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        }
        if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });

        const user = result.rows[0];

        // Debug: Log password hash from DB
        console.log('DB password hash:', user.password);

        const validPass = await bcrypt.compare(password, user.password);
        // Debug: Log result of bcrypt.compare
        console.log('Password match:', validPass);
        if (!validPass) return res.status(401).json({ error: 'Invalid password' });

        // Admin Role Enforcement
        const isAdminEmail = ADMIN_EMAILS.includes(user.email);
        const finalRole = isAdminEmail ? 'admin' : user.role;

        if (userType === 'admin' && finalRole !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Not an Admin' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: finalRole }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { 
                id: user.student_id, 
                name: user.name, 
                email: user.email, 
                role: finalRole,
                department: user.department 
            }
        });

    } catch (err) {
        next(err);
    }
};