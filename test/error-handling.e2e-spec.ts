import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';

describe('Error Handling (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
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
    });

    afterEach(async () => {
        await app.close();
    });

    describe('/tasks (GET)', () => {
        it('should return 401 when no token is provided', () => {
            return request(app.getHttpServer())
                .get('/tasks')
                .expect(401)
                .expect((res) => {
                    expect(res.body).toMatchObject({
                        statusCode: 401,
                        error: expect.any(String),
                        message: expect.any(String),
                        timestamp: expect.any(String),
                        path: '/tasks',
                        method: 'GET',
                    });
                });
        });

        it('should return 401 when invalid token is provided', () => {
            return request(app.getHttpServer())
                .get('/tasks')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 401 when malformed authorization header', () => {
            return request(app.getHttpServer())
                .get('/tasks')
                .set('Authorization', 'InvalidFormat token')
                .expect(401);
        });
    });

    describe('/tasks/:id (GET)', () => {
        it('should return 400 for invalid UUID format', () => {
            return request(app.getHttpServer())
                .get('/tasks/invalid-uuid')
                .set('Authorization', 'Bearer valid-token')
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('UUID');
                });
        });
    });

    describe('/tasks/create (POST)', () => {
        it('should return 400 for missing title', () => {
            return request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    description: 'Test description',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('title');
                });
        });

        it('should return 400 for empty title', () => {
            return request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    title: '',
                    description: 'Test description',
                })
                .expect(400);
        });

        it('should return 400 for title too long', () => {
            const longTitle = 'a'.repeat(256);
            return request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    title: longTitle,
                    description: 'Test description',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('255 characters');
                });
        });

        it('should return 400 for description too long', () => {
            const longDescription = 'a'.repeat(10001);
            return request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    title: 'Valid title',
                    description: longDescription,
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('10000 characters');
                });
        });

        it('should return 400 for invalid date format', () => {
            return request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    title: 'Valid title',
                    dueDate: 'invalid-date',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('valid ISO 8601');
                });
        });

        it('should return 400 for non-whitelisted properties', () => {
            return request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    title: 'Valid title',
                    description: 'Valid description',
                    maliciousField: 'should be rejected',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('whitelisted');
                });
        });

        it('should return 400 for potential XSS content', () => {
            return request(app.getHttpServer())
                .post('/tasks/create')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    title: '<script>alert("xss")</script>',
                    description: 'Test description',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('malicious content');
                });
        });
    });

    describe('/tasks/edit (POST)', () => {
        it('should return 400 for invalid task ID format', () => {
            return request(app.getHttpServer())
                .post('/tasks/edit')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    id: 'invalid-uuid',
                    title: 'Updated title',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('valid UUID');
                });
        });

        it('should return 400 for no fields to update', () => {
            return request(app.getHttpServer())
                .post('/tasks/edit')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    id: '550e8400-e29b-41d4-a716-446655440000',
                })
                .expect(400);
        });
    });

    describe('Global Error Handling', () => {
        it('should handle unexpected errors gracefully', () => {
            return request(app.getHttpServer())
                .get('/non-existent-endpoint')
                .expect(404)
                .expect((res) => {
                    expect(res.body).toHaveProperty('statusCode');
                    expect(res.body).toHaveProperty('timestamp');
                    expect(res.body).toHaveProperty('path');
                    expect(res.body).toHaveProperty('method');
                });
        });
    });
});
