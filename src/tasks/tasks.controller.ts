import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { EditTaskDto } from './dto/edit-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get('')
    async listTasks(@Request() req) {
        return this.tasksService.listTasks(req.user.id);
    }

    @Get('/:id')
    async getTask(@Param('id') id: string, @Request() req) {
        return this.tasksService.getTask(id, req.user.id);
    }

    @Post('/create')
    async createTask(@Body() body: CreateTaskDto, @Request() req) {
        return this.tasksService.createTask(body, req.user.id);
    }

    @Post('/edit')
    async editTask(@Body() body: EditTaskDto, @Request() req) {
        return this.tasksService.editTask(body, req.user.id);
    }

    @Delete('/:id')
    async deleteTask(@Param('id') id: string, @Request() req) {
        return this.tasksService.deleteTask(id, req.user.id);
    }
}
