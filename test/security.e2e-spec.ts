import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';

describe('Security Tests (e2e)', () => {
    let app: INestApplication;
    let validToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                disableErrorMessages: false,
                validateCustomDecorators: true,
                stopAtFirstError: false,
            }),
        );

        app.useGlobalFilters(new GlobalExceptionFilter());

        await app.init();

        // Create a test user and get a valid token
        const testUser = {
            fullname: 'Security Test User',
            email: 'security@test.com',
            password: 'SecureP@ss123!',
        };

        const createUserResponse = await request(app.getHttpServer())
            .post('/users/create')
            .send(testUser);

        expect(createUserResponse.status).toBe(201);
        // Store user ID for potential future use
        // _validUserId = createUserResponse.body.id;

        // Login to get token
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: testUser.email,
                pass: testUser.password,
            });

        expect(loginResponse.status).toBe(200);
        validToken = loginResponse.body.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Password Security', () => {
        it('should enforce strong password requirements', async () => {
            const weakPasswords = [
                'weak',
                '12345678',
                'password',
                'Password',
                'Password123',
                'Pass@123',
            ];

            for (const password of weakPasswords) {
                const response = await request(app.getHttpServer())
                    .post('/users/create')
                    .send({
                        fullname: 'Test User',
                        email: `test${Math.random()}@example.com`,
                        password,
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toContain(
                    'Password must contain',
                );
            }
        });

        it('should accept strong passwords', async () => {
            const strongPassword = 'StrongP@ssw0rd123!';
            const response = await request(app.getHttpServer())
                .post('/users/create')
                .send({
                    fullname: 'Strong Password User',
                    email: `strong${Math.random()}@example.com`,
                    password: strongPassword,
                });

            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            expect(response.body.pass).toBeUndefined(); // Password should not be returned
        });

        it('should prevent password in response', async () => {
            const response = await request(app.getHttpServer())
                .post('/users/create')
                .send({
                    fullname: 'No Password Response User',
                    email: `nopass${Math.random()}@example.com`,
                    password: 'ValidP@ssw0rd123!',
                });

            expect(response.status).toBe(201);
            expect(response.body.pass).toBeUndefined();
            expect(response.body.password).toBeUndefined();
        });
    });

    describe('Input Validation Security', () => {
        it('should prevent XSS in task title', async () => {
            const maliciousTitle = '<script>alert("XSS")</script>';

            const response = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    title: maliciousTitle,
                    description: 'Test description',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('malicious content');
        });

        it('should prevent XSS in task description', async () => {
            const maliciousDescription =
                'Test <script>alert("XSS")</script> description';

            const response = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    title: 'Valid title',
                    description: maliciousDescription,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('malicious content');
        });

        it('should prevent JavaScript URLs', async () => {
            const maliciousContent = 'javascript:alert("XSS")';

            const response = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    title: maliciousContent,
                    description: 'Test description',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('malicious content');
        });

        it('should prevent event handlers', async () => {
            const maliciousContent = 'Test onload=alert("XSS") content';

            const response = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    title: 'Valid title',
                    description: maliciousContent,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('malicious content');
        });
    });

    describe('Rate Limiting Security', () => {
        it('should rate limit login attempts', async () => {
            const loginAttempts = [];

            // Make 6 failed login attempts quickly
            for (let i = 0; i < 6; i++) {
                loginAttempts.push(
                    request(app.getHttpServer()).post('/auth/login').send({
                        email: 'nonexistent@test.com',
                        pass: 'wrongpassword',
                    }),
                );
            }

            const responses = await Promise.all(loginAttempts);

            // Some should succeed (first few attempts)
            // Track failed authentication attempts
            // const _successful = responses.filter((r) => r.status === 401);

            // But at least one should be rate limited
            const rateLimited = responses.filter((r) => r.status === 429);

            expect(rateLimited.length).toBeGreaterThan(0);
        });

        it('should rate limit user creation attempts', async () => {
            const createAttempts = [];

            // Make 4 user creation attempts quickly
            for (let i = 0; i < 4; i++) {
                createAttempts.push(
                    request(app.getHttpServer())
                        .post('/users/create')
                        .send({
                            fullname: `Rate Limit User ${i}`,
                            email: `ratelimit${i}${Math.random()}@test.com`,
                            password: 'ValidP@ssw0rd123!',
                        }),
                );
            }

            const responses = await Promise.all(createAttempts);

            // At least one should be rate limited
            const rateLimited = responses.filter((r) => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
        });
    });

    describe('Data Validation Security', () => {
        it('should reject extremely long input', async () => {
            const longTitle = 'a'.repeat(300);

            const response = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    title: longTitle,
                    description: 'Test description',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('255 characters');
        });

        it('should reject invalid UUID formats', async () => {
            const invalidUuid = 'not-a-uuid';

            const response = await request(app.getHttpServer())
                .get(`/tasks/${invalidUuid}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('UUID');
        });

        it('should reject non-whitelisted properties', async () => {
            const response = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    title: 'Valid title',
                    description: 'Valid description',
                    maliciousField: 'Should be rejected',
                    anotherBadField: 'Also rejected',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('whitelisted');
        });
    });

    describe('Authorization Security', () => {
        it('should prevent access to other users tasks', async () => {
            // Create a task with the valid user
            const createResponse = await request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    title: 'Private task',
                    description: 'This should not be accessible by others',
                });

            expect(createResponse.status).toBe(201);
            const taskId = createResponse.body.id;

            // Create another user
            const otherUser = {
                fullname: 'Other User',
                email: `other${Math.random()}@test.com`,
                password: 'OtherP@ssw0rd123!',
            };

            await request(app.getHttpServer())
                .post('/users/create')
                .send(otherUser);

            // Login as other user
            const otherLoginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: otherUser.email,
                    pass: otherUser.password,
                });

            const otherToken = otherLoginResponse.body.access_token;

            // Try to access the first user's task
            const accessResponse = await request(app.getHttpServer())
                .get(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(accessResponse.status).toBe(403);
            expect(accessResponse.body.message).toContain('permission');

            // Try to edit the first user's task
            const editResponse = await request(app.getHttpServer())
                .post('/tasks/edit')
                .set('Authorization', `Bearer ${otherToken}`)
                .send({
                    id: taskId,
                    title: 'Hacked title',
                });

            expect(editResponse.status).toBe(403);
            expect(editResponse.body.message).toContain('permission');

            // Try to delete the first user's task
            const deleteResponse = await request(app.getHttpServer())
                .delete(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(deleteResponse.status).toBe(403);
        });
    });

    describe('Token Security', () => {
        it('should reject malformed tokens', async () => {
            const malformedTokens = [
                'Bearer invalid',
                'Bearer ',
                'InvalidFormat token',
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
                '',
            ];

            for (const token of malformedTokens) {
                const response = await request(app.getHttpServer())
                    .get('/tasks')
                    .set('Authorization', token);

                expect(response.status).toBe(401);
            }
        });

        it('should handle missing authorization header', async () => {
            const response = await request(app.getHttpServer()).get('/tasks');

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('token');
        });
    });

    describe('Error Information Disclosure', () => {
        it('should not reveal sensitive information in errors', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    pass: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.message).not.toContain('password');
            expect(response.body.message).not.toContain('user not found');
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should not reveal database errors to users', async () => {
            // Attempt to create user with same email (should cause DB constraint error)
            const duplicateResponse = await request(app.getHttpServer())
                .post('/users/create')
                .send({
                    fullname: 'Duplicate User',
                    email: 'security@test.com', // Same as initial user
                    password: 'ValidP@ssw0rd123!',
                });

            expect(duplicateResponse.status).toBe(409);
            expect(duplicateResponse.body.message).toBe('User already exists');
            expect(duplicateResponse.body.message).not.toContain('UNIQUE');
            expect(duplicateResponse.body.message).not.toContain('constraint');
        });
    });
});
