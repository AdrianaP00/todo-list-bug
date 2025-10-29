import { Controller, Get } from '@nestjs/common';
import { IsPublic } from './auth/is-public.decorator';

@Controller()
export class AppController {
    constructor() {}

    @IsPublic()
    @Get()
    health() {
        return { success: true, message: 'API is running' };
    }
}
