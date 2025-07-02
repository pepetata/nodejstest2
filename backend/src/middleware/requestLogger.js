const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
    
    // Log request body for POST/PUT/PATCH (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const logBody = { ...req.body };
        if (logBody.password) logBody.password = '[REDACTED]';
        console.log('Request body:', JSON.stringify(logBody));
    }

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        
        // Log response for non-200 status codes
        if (res.statusCode >= 400) {
            console.log('Response:', JSON.stringify(data));
        }
        
        return originalJson.call(this, data);
    };

    next();
};

module.exports = requestLogger;
