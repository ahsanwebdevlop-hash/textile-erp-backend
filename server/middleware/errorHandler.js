// server/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message;

  if (err.name === 'CastError') { statusCode = 404; message = 'Resource not found'; }
  if (err.code === 11000) { statusCode = 400; message = 'Duplicate field value entered'; }
  if (err.name === 'ValidationError') { 
    statusCode = 400; 
    message = Object.values(err.errors).map(val => val.message).join(', '); 
  }

  // Log all errors to console
  console.error(`[ERROR] ${req.method} ${req.path} - ${message}`);
  console.error(err.stack);

  res.status(statusCode).json({ 
    success: false, 
    message, 
    stack: process.env.NODE_ENV === 'production' ? null : err.stack 
  });
};