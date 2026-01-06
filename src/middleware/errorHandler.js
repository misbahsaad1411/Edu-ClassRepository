const errorHandler = (err, req, res, next) => {
    console.error(err);
    
    if (err.code === '23505') {
        return res.status(400).json({ error: 'Duplicate entry - resource already exists' });
    }
    
    if (err.code === '23503') {
        return res.status(400).json({ error: 'Invalid reference - related record not found' });
    }
    
    if (err.message === 'Invalid file type') {
        return res.status(400).json({ error: 'Invalid file type' });
    }
    
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error' 
    });
};

module.exports = errorHandler;
