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

        // We insert 'null' for verification_token because we are using stateless JWTs
        const result = await pool.query(
            `INSERT INTO users (student_id, name, email, password, department, gender, semester, is_verified, verification_token, role) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [student_id, name, normalizedEmail, hash, department, gender || null, semester || null, false, null, role]
        );
        
        const userId = result.rows[0].id;

        // --- STEP D: GENERATE JWT TOKEN ---
        // This token is valid for 1 day and contains the User ID
        const emailToken = jwt.sign(
            { id: userId }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        // --- STEP E: SEND EMAIL (Spam-Proofing) ---
        const verificationLink = `http://localhost:3000/api/auth/verify/${emailToken}`;
        
        const mailOptions = {
            from: `"EDU ClassRepo" <${EMAIL_USER}>`,
            to: normalizedEmail,
            subject: 'Verify Your Account - EDU ClassRepo',
            // [CRITICAL] Plain text version acts as a spam filter fallback
            text: `Welcome, ${name}!\n\nPlease verify your account by clicking this link:\n${verificationLink}\n\nThis link expires in 24 hours.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Welcome to EDU ClassRepo</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Please verify your university account to access course materials.</p>
                    <div style="margin: 25px 0;">
                        <a href="${verificationLink}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Or paste this link into your browser:<br>
                    <a href="${verificationLink}" style="color: #3498db;">${verificationLink}</a></p>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);

        // --- STEP F: NOTIFY ADMINS ---
        // Send a separate email to admins (fire and forget)
        const adminAlert = {
            from: `"System Bot" <${EMAIL_USER}>`,
            to: ADMIN_EMAILS.join(','),
            subject: `New User Registration: ${name}`,
            text: `User: ${name}\nEmail: ${normalizedEmail}\nDept: ${department}\nStatus: Pending Verification`
        };
        transporter.sendMail(adminAlert).catch(err => console.error("Admin alert failed", err));
        
        res.json({ message: 'Registration successful! Check your email for the verification link.' });
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

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });

        const user = result.rows[0];

        // Ensure user is verified
        if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email first.' });

        const validPass = await bcrypt.compare(password, user.password);
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