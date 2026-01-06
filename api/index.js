const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('../src/middleware/errorHandler');

const authRoutes = require('../src/routes/authRoutes');
const courseRoutes = require('../src/routes/courseRoutes');
const enrollmentRoutes = require('../src/routes/enrollmentRoutes');
const fileRoutes = require('../src/routes/fileRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/files', fileRoutes);

// Test endpoint to check DATABASE_URL visibility
app.get('/api/test-db-url', (req, res) => {
    res.send(process.env.DATABASE_URL || 'No DATABASE_URL found');
});

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
