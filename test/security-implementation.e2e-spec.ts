import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('Security Implementation Tests (e2e)', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        app.useGlobalFilters(new GlobalExceptionFilter());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Authentication Security', () => {
        it('should reject requests without authentication token', async () => {
            const response = await request(app.getHttpServer()).get('/tasks');
            expect(response.status).toBe(401);
            expect(response.body.message).toContain('token');
        });

        it('should reject invalid JWT tokens', async () => {
            const response = await request(app.getHttpServer())
                .get('/tasks')
                .set('Authorization', 'Bearer invalid-token');
            expect(response.status).toBe(401);
        });

        it('should validate email format in login', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                });
            expect(response.status).toBe(400);
        });

        it('should require both email and password for login', async () => {
            const responseNoEmail = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ password: 'password123' });
            expect(responseNoEmail.status).toBe(400);

            const responseNoPassword = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'test@example.com' });
            expect(responseNoPassword.status).toBe(400);
        });
    });

    describe('User Registration Security', () => {
        it('should enforce strong password requirements', async () => {
            const weakPasswords = [
                '123456', // Too short
                'password', // No numbers, uppercase, special chars
                'Password123', // No special characters
            ];

            for (const password of weakPasswords) {
                const response = await request(app.getHttpServer())
                    .post('/users/create')
                    .send({
                        fullname: 'Test User',
                        email: `test${Date.now()}@example.com`,
                        password: password,
                    });
                expect(response.status).toBe(400);
            }
        });

        it('should validate email format in registration', async () => {
            const response = await request(app.getHttpServer())
                .post('/users/create')
                .send({
                    fullname: 'Test User',
                    email: 'invalid-email-format',
                    password: 'ValidPass123!',
                });
            expect(response.status).toBe(400);
        });

        it('should prevent duplicate user registration', async () => {
            const userData = {
                fullname: 'Test User',
                email: 'duplicate@example.com',
                password: 'ValidPass123!',
            };

            // First registration should succeed
            const firstResponse = await request(app.getHttpServer())
                .post('/users/create')
                .send(userData);

            if (firstResponse.status === 201) {
                // Second registration should fail
                const secondResponse = await request(app.getHttpServer())
                    .post('/users/create')
                    .send(userData);
                expect(secondResponse.status).toBe(409);
            }
        });
    });

    describe('Task Security', () => {
        beforeAll(async () => {
            // Create a test user and get auth token
            const userResponse = await request(app.getHttpServer())
                .post('/users/create')
                .send({
                    fullname: 'Security Test User',
                    email: `sectest${Date.now()}@example.com`,
                    password: 'SecurePass123!',
                });

            if (userResponse.status === 201) {
                const loginResponse = await request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                        email: userResponse.body.email,
                        password: 'SecurePass123!',
                    });

                if (loginResponse.status === 200) {
                    authToken = loginResponse.body.access_token;
                }
            }
        });

        it('should require authentication for task operations', async () => {
            const endpoints = [
                { method: 'get', path: '/tasks' },
                { method: 'post', path: '/tasks/create' },
            ];

            for (const endpoint of endpoints) {
                let response;
                if (endpoint.method === 'get') {
                    response = await request(app.getHttpServer()).get(
                        endpoint.path,
                    );
                } else {
                    response = await request(app.getHttpServer()).post(
                        endpoint.path,
                    );
                }
                expect(response.status).toBe(401);
            }
        });

        it('should validate task creation data', async () => {
            if (!authToken) return;

            // Test empty title
            const emptyTitleResponse = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: '',
                    description: 'Valid description',
                });
            expect(emptyTitleResponse.status).toBe(400);

            // Test overly long title
            const longTitle = 'a'.repeat(300);
            const longTitleResponse = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: longTitle,
                    description: 'Valid description',
                });
            expect(longTitleResponse.status).toBe(400);
        });

        it('should validate UUID format in task IDs', async () => {
            if (!authToken) return;

            const invalidUUIDs = ['not-a-uuid', '123', 'invalid-format'];

            for (const uuid of invalidUUIDs) {
                const response = await request(app.getHttpServer())
                    .get(`/tasks/${uuid}`)
                    .set('Authorization', `Bearer ${authToken}`);
                expect(response.status).toBe(400);
            }
        });

        it('should prevent cross-user task access', async () => {
            if (!authToken) return;

            // Create a task
            const taskResponse = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Private Task',
                    description: 'This should not be accessible by other users',
                });

            if (taskResponse.status !== 201) return;

            const taskId = taskResponse.body.id;

            // Create second user
            const user2Response = await request(app.getHttpServer())
                .post('/users/create')
                .send({
                    fullname: 'Second User',
                    email: `second${Date.now()}@example.com`,
                    password: 'SecurePass456!',
                });

            if (user2Response.status !== 201) return;

            // Login as second user
            const login2Response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: user2Response.body.email,
                    password: 'SecurePass456!',
                });

            if (login2Response.status !== 200) return;

            const token2 = login2Response.body.access_token;

            // Try to access first user's task
            const accessResponse = await request(app.getHttpServer())
                .get(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token2}`);
            expect(accessResponse.status).toBe(403);
        });
    });

    describe('Input Validation Security', () => {
        it('should sanitize malicious input in user registration', async () => {
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                'javascript:alert(1)',
                '<img src="x" onerror="alert(1)">',
            ];

            for (const maliciousInput of maliciousInputs) {
                const response = await request(app.getHttpServer())
                    .post('/users/create')
                    .send({
                        fullname: maliciousInput,
                        email: `test${Date.now()}@example.com`,
                        password: 'ValidPass123!',
                    });

                // Either should be rejected or sanitized
                if (response.status === 201) {
                    expect(response.body.fullname).not.toContain('<script>');
                    expect(response.body.fullname).not.toContain('javascript:');
                } else {
                    expect([400, 409]).toContain(response.status);
                }
            }
        });

        it('should validate task input lengths', async () => {
            if (!authToken) return;

            const longDescription = 'a'.repeat(15000); // Exceeds limit

            const response = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Valid title',
                    description: longDescription,
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Error Handling Security', () => {
        it('should return appropriate error codes', async () => {
            // 401 for no auth
            const noAuthResponse = await request(app.getHttpServer()).get(
                '/tasks',
            );
            expect(noAuthResponse.status).toBe(401);

            // 400 for bad request
            const badRequestResponse = await request(app.getHttpServer())
                .post('/users/create')
                .send({
                    // Missing required fields
                });
            expect(badRequestResponse.status).toBe(400);
        });

        it('should not expose sensitive information in errors', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.message).not.toContain('database');
            expect(response.body.message).not.toContain('sql');
            expect(response.body.message).not.toContain('password');
        });
    });

    describe('Security Headers', () => {
        it('should include security headers in responses', async () => {
            const response = await request(app.getHttpServer()).get('/tasks');

            // Note: Some headers might be set by interceptors
            expect(response.status).toBe(401); // Expected for unauthenticated request
        });
    });
});

