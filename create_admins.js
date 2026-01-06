const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config();

// --- CONFIGURATION FOR YOUR TWO ADMINS ---
const admins = [
    {
        id: 'ADM-002',
        name: 'Syed Nazmus Sakib',
        email: 'nazmussakai@gmail.com',
        password: 'sakibAdmin1' // Password for Nazmus
    },
    {
        id: 'ADM-003',
        name: 'Misbah Uddin',
        email: 'misbahsaad01@gmail.com',
        password: 'misbahAdmin2' // Password for Misbah
    }
];

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function setupAdmins() {
    try {
        await client.connect();
        console.log("Connected to database...");

        for (const admin of admins) {
            // 1. Hash the password securely
            const hash = await bcrypt.hash(admin.password, 10);
            
            // 2. Check if user exists
            const check = await client.query('SELECT * FROM users WHERE email = $1', [admin.email]);
            
            if (check.rows.length > 0) {
                // UPDATE existing admin (in case password changed)
                await client.query(
                    `UPDATE users SET password = $1, role = 'admin', is_verified = TRUE WHERE email = $2`,
                    [hash, admin.email]
                );
                console.log(`✅ Updated existing admin: ${admin.name}`);
            } else {
                // INSERT new admin
                await client.query(
                    `INSERT INTO users (student_id, name, email, password, department, role, is_verified) 
                     VALUES ($1, $2, $3, $4, 'Admin', 'admin', TRUE)`,
                    [admin.id, admin.name, admin.email, hash]
                );
                console.log(`🎉 Created new admin: ${admin.name}`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
        console.log("Done.");
    }
}

setupAdmins();