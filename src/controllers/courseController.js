const pool = require('../config/database');

exports.getAllCourses = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, code, title, department, instructor FROM courses ORDER BY department, code'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, code, title, department, instructor FROM courses WHERE id = $1', 
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.createCourse = async (req, res, next) => {
    try {
        const { code, title, department, instructor } = req.body;
        
        if (!code || !title || !department) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = await pool.query(
            `INSERT INTO courses (code, title, department, instructor) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [code, title, department, instructor || 'TBA']
        );
        
        res.status(201).json({ id: result.rows[0].id, message: 'Course created successfully' });
    } catch (err) {
        next(err);
    }
};

exports.updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, title, department, instructor } = req.body;
        
        const result = await pool.query(
            `UPDATE courses SET code = $1, title = $2, department = $3, instructor = $4 
             WHERE id = $5 RETURNING id`,
            [code, title, department, instructor || 'TBA', id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json({ message: 'Course updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        next(err);
    }
};
