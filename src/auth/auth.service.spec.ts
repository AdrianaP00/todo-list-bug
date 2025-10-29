import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
        jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

        await expect(
            service.signIn('test@example.com', 'password'),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
        const hashedWrongPassword = await bcrypt.hash('wrongpassword', 10);
        jest.spyOn(usersService, 'findOne').mockResolvedValue({
            id: '1',
            email: 'test@example.com',
            pass: hashedWrongPassword,
            fullname: 'Test User',
            tasks: [],
        });

        await expect(
            service.signIn('test@example.com', 'password'),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access token if credentials are valid', async () => {
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: '1',
            email: 'test@example.com',
            pass: hashedPassword,
            fullname: 'Test User',
            tasks: [],
        };
        const token = 'mockToken';

        jest.spyOn(usersService, 'findOne').mockResolvedValue(user);
        jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

        const result = await service.signIn('test@example.com', password);

        expect(result).toEqual({
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                fullname: user.fullname,
            },
        });
    });
});
