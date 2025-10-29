import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseInterceptors,
    ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { EditTaskDto } from './dto/edit-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ValidationInterceptor } from '../common/interceptors/validation.interceptor';
import { CurrentUser, UserFromToken } from '../auth/current-user.decorator';

@Controller('tasks')
@UseInterceptors(ValidationInterceptor)
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get('')
    async listTasks(@CurrentUser() user: UserFromToken) {
        return this.tasksService.listTasks(user.id);
    }

    @Get('/:id')
    async getTask(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: UserFromToken,
    ) {
        return this.tasksService.getTask(id, user.id);
    }

    @Post('/create')
    async createTask(
        @Body() body: CreateTaskDto,
        @CurrentUser() user: UserFromToken,
    ) {
        return this.tasksService.createTask(body, user.id);
    }

    @Post('/edit')
    async editTask(
        @Body() body: EditTaskDto,
        @CurrentUser() user: UserFromToken,
    ) {
        return this.tasksService.editTask(body, user.id);
    }

    @Delete('/:id')
    async deleteTask(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: UserFromToken,
    ) {
        return this.tasksService.deleteTask(id, user.id);
    }
}
