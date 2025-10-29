import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async create(body: CreateUserDto) {
        // Check if user already exists
        const existingUser = await this.usersRepository.findOneBy({
            email: body.email,
        });

        if (existingUser) {
            this.logger.warn(
                `Attempt to create user with existing email: ${body.email}`,
            );
            throw new ConflictException('User already exists');
        }

        const user = new User();
        user.email = body.email;
        user.pass = await bcrypt.hash(body.password, 10);
        user.fullname = body.fullname;

        await this.usersRepository.save(user);

        // Don't return the hashed password
        const { pass, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async findOne(email: string) {
        const user = await this.usersRepository.findOneBy({
            email,
        });

        return user;
    }
}
