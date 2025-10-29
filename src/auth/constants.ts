export const jwtConstants = {
    secret:
        process.env['JWT_SECRET'] ||
        'please-change-me-for-production-use-minimum-32-characters',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '1h',
    issuer: 'todo-app',
    audience: 'todo-app-users',
};

export const securityConstants = {
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    passwordMinLength: parseInt(process.env['PASSWORD_MIN_LENGTH'] || '8'),
    maxLoginAttempts: parseInt(process.env['MAX_LOGIN_ATTEMPTS'] || '5'),
    loginWindowMs: parseInt(process.env['LOGIN_WINDOW_MS'] || '900000'), // 15 minutes
    rateLimitMax: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
    rateLimitWindowMs: parseInt(
        process.env['RATE_LIMIT_WINDOW_MS'] || '900000',
    ),
};

export const validationConstants = {
    maxTitleLength: parseInt(process.env['MAX_TITLE_LENGTH'] || '255'),
    maxDescriptionLength: parseInt(
        process.env['MAX_DESCRIPTION_LENGTH'] || '10000',
    ),
    maxFullnameLength: parseInt(process.env['MAX_FULLNAME_LENGTH'] || '100'),
    maxEmailLength: parseInt(process.env['MAX_EMAIL_LENGTH'] || '255'),
    passwordMinLength: parseInt(process.env['PASSWORD_MIN_LENGTH'] || '8'),
};
