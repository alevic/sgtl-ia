import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { config } from '../config.js';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        // Log unexpected errors
        console.error('🔥 Unexpected Error:', err);
    }

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(config.isProduction ? {} : { stack: err.stack }),
    });
};
