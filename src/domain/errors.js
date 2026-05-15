class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Datos inválidos') {
        super(message, 400);
    }
}

module.exports = { AppError, NotFoundError, ValidationError };
