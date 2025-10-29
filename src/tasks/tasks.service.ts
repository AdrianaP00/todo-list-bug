import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository } from 'typeorm';
import { EditTaskDto } from './dto/edit-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
    ) {}

    async listTasks(userId: string) {
        this.logger.log(`Listing tasks for user: ${userId}`);
        const tasks = await this.tasksRepository.find({
            where: { owner: { id: userId } },
            relations: ['owner'],
        });

        return tasks;
    }

    async getTask(id: string, userId: string) {
        this.logger.log(`Getting task ${id} for user: ${userId}`);

        // Fixed SQL injection vulnerability by using parameterized query
        const task = await this.tasksRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.owner', 'owner')
            .where('task.id = :id', { id })
            .getOne();

        if (!task) {
            this.logger.warn(`Task ${id} not found`);
            throw new NotFoundException('Task not found');
        }

        // Check if the task belongs to the requesting user
        if (task.owner.id !== userId) {
            this.logger.warn(
                `User ${userId} attempted to access task ${id} owned by ${task.owner.id}`,
            );
            throw new ForbiddenException(
                'You do not have permission to access this task',
            );
        }

        return task;
    }

    async createTask(body: CreateTaskDto, userId: string) {
        this.logger.log(`Creating task for user: ${userId}`);

        const task = new Task();
        task.title = body.title;
        task.description = body.description || '';
        task.done = body.done || false;
        task.dueDate = body.dueDate || '';
        task.owner = { id: userId } as any; // TypeORM will handle the relation

        const savedTask = await this.tasksRepository.save(task);
        this.logger.log(`Successfully created task ${savedTask.id}`);

        return savedTask;
    }

    async editTask(body: EditTaskDto, userId: string) {
        this.logger.log(`Editing task ${body.id} for user: ${userId}`);

        // First verify the task exists and belongs to the user
        await this.getTask(body.id, userId);

        // Update only allowed fields to prevent mass assignment
        const updateData: Partial<Task> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined)
            updateData.description = body.description;
        if (body.done !== undefined) updateData.done = body.done;
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;

        await this.tasksRepository.update(body.id, updateData);

        const editedTask = await this.getTask(body.id, userId);
        this.logger.log(`Successfully edited task ${body.id}`);

        return editedTask;
    }

    async deleteTask(id: string, userId: string) {
        this.logger.log(`Deleting task ${id} for user: ${userId}`);

        // First verify the task exists and belongs to the user
        const task = await this.getTask(id, userId);

        await this.tasksRepository.remove(task);
        this.logger.log(`Successfully deleted task ${id}`);

        return { message: 'Task deleted successfully' };
    }
}
