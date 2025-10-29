import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { IsPublic } from '../auth/is-public.decorator';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @IsPublic()
    @Post('/create')
    async create(@Body() body: CreateUserDto) {
        return this.usersService.create(body);
    }
}
