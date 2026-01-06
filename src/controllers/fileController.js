const pool = require('../config/database');
const { FILE_STATUS } = require('../config/constants');

exports.getCourseFiles = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        
        const result = await pool.query(
            `SELECT f.id, f.file_name, f.file_size, f.created_at, u.name as uploader_name 
             FROM files f 
             JOIN users u ON f.uploaded_by = u.id 
             WHERE f.course_id = $1 AND f.status = $2
             ORDER BY f.created_at DESC`,
            [courseId, FILE_STATUS.APPROVED]
        );
        
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getPendingFiles = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT f.id, f.file_name, f.file_size, f.created_at, u.name as uploader_name, 
                    c.code as course_code, c.title as course_title
             FROM files f 
             JOIN users u ON f.uploaded_by = u.id 
             JOIN courses c ON f.course_id = c.id 
             WHERE f.status = $1
             ORDER BY f.created_at DESC`,
            [FILE_STATUS.PENDING]
        );
        
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required' });
        }
        
        const status = req.user.role === 'admin' ? FILE_STATUS.APPROVED : FILE_STATUS.PENDING;
        
        await pool.query(
            `INSERT INTO files (course_id, file_name, file_path, file_size, uploaded_by, status) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [courseId, req.file.originalname, req.file.filename, req.file.size, req.user.id, status]
        );
        
        const message = status === FILE_STATUS.APPROVED 
            ? 'File uploaded successfully' 
            : 'File uploaded, pending admin approval';
        
        res.status(201).json({ message });
    } catch (err) {
        next(err);
    }
};

exports.approveFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `UPDATE files SET status = $1 WHERE id = $2 RETURNING id`, 
            [FILE_STATUS.APPROVED, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        res.json({ message: 'File approved successfully' });
    } catch (err) {
        next(err);
    }
};

exports.renameFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newName } = req.body;
        
        if (!newName || newName.trim() === '') {
            return res.status(400).json({ error: 'File name is required' });
        }
        
        const result = await pool.query(
            'UPDATE files SET file_name = $1 WHERE id = $2 RETURNING id',
            [newName.trim(), id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        res.json({ message: 'File renamed successfully' });
    } catch (err) {
        next(err);
    }
};

exports.deleteFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const fileResult = await pool.query(
            'SELECT uploaded_by FROM files WHERE id = $1', 
            [id]
        );
        
        if (fileResult.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        if (fileResult.rows[0].uploaded_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this file' });
        }
        
        await pool.query('DELETE FROM files WHERE id = $1', [id]);
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        next(err);
    }
};

exports.rejectFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM files WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        res.json({ message: 'File rejected successfully' });
    } catch (err) {
        next(err);
    }
};
