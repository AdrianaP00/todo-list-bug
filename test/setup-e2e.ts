// Setup for e2e tests
// Disable rate limiting and other features that could interfere with tests

// Override environment variables for testing
process.env['NODE_ENV'] = 'test';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '1000000'; // Very high limit for tests
process.env['RATE_LIMIT_WINDOW_MS'] = '1'; // Very short window
process.env['MAX_LOGIN_ATTEMPTS'] = '1000000'; // Very high limit for tests
process.env['LOGIN_WINDOW_MS'] = '1'; // Very short window

// Set test timeouts
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
    // Any global setup needed
});

afterAll(async () => {
    // Any global cleanup needed
});
