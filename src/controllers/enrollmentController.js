const pool = require('../config/database');

exports.getUserEnrollments = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.code, c.title, c.department, c.instructor 
             FROM courses c 
             JOIN enrollments e ON c.id = e.course_id 
             WHERE e.user_id = $1
             ORDER BY c.department, c.code`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.enrollCourse = async (req, res, next) => {
    try {
        const { courseId } = req.body;
        
        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required' });
        }
        
        await pool.query(
            'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)',
            [req.user.id, courseId]
        );
        
        res.status(201).json({ message: 'Enrolled successfully' });
    } catch (err) {
        next(err);
    }
};

exports.unenrollCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        
        const result = await pool.query(
            'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2 RETURNING user_id',
            [req.user.id, courseId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }
        
        res.json({ message: 'Unenrolled successfully' });
    } catch (err) {
        next(err);
    }
};
