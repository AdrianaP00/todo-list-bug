import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { EditTaskDto } from './dto/edit-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { isUuid } from '../common/utils/uuid.util';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
    ) {}

    async listTasks(userId: string) {
        this.logger.log(`Listing tasks for user: ${userId}`);
        if (!userId || !isUuid(userId)) {
            this.logger.warn(`Invalid user ID format: ${userId}`);
            throw new BadRequestException('Invalid user ID format');
        }

        try {
            const tasks = await this.tasksRepository.find({
                where: { owner: { id: userId } },
                relations: ['owner'],
                order: { id: 'DESC' }, // Most recent first
            });

            return tasks;
        } catch (error) {
            this.logger.error(
                `Failed to list tasks for user ${userId}:`,
                error,
            );
            if (error instanceof QueryFailedError) {
                throw new BadRequestException('Invalid request parameters');
            }
            throw new InternalServerErrorException('Failed to retrieve tasks');
        }
    }

    async getTask(id: string, userId: string) {
        this.logger.log(`Getting task ${id} for user: ${userId}`);

        // Validate input parameters
        if (!id || !isUuid(id)) {
            this.logger.warn(`Invalid task ID format: ${id}`);
            throw new BadRequestException('Invalid task ID format');
        }

        if (!userId || !isUuid(userId)) {
            this.logger.warn(`Invalid user ID format: ${userId}`);
            throw new BadRequestException('Invalid user ID format');
        }

        try {
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
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error; // Re-throw known exceptions
            }

            this.logger.error(
                `Failed to get task ${id} for user ${userId}:`,
                error,
            );
            if (error instanceof QueryFailedError) {
                throw new BadRequestException('Invalid request parameters');
            }
            throw new InternalServerErrorException('Failed to retrieve task');
        }
    }

    async createTask(body: CreateTaskDto, userId: string) {
        this.logger.log(`Creating task for user: ${userId}`);

        // Validate user ID
        if (!userId || !isUuid(userId)) {
            this.logger.warn(`Invalid user ID format: ${userId}`);
            throw new BadRequestException('Invalid user ID format');
        }

        // Additional validation
        if (!body.title || body.title.trim().length === 0) {
            throw new BadRequestException('Task title cannot be empty');
        }

        if (body.title.length > 255) {
            throw new BadRequestException(
                'Task title too long (max 255 characters)',
            );
        }

        if (body.description && body.description.length > 10000) {
            throw new BadRequestException(
                'Task description too long (max 10000 characters)',
            );
        }

        try {
            const task = new Task();
            task.title = body.title.trim();
            task.description = body.description?.trim() || '';
            task.done = body.done || false;
            task.dueDate = body.dueDate?.trim() || '';
            task.owner = { id: userId } as any; // TypeORM will handle the relation

            const savedTask = await this.tasksRepository.save(task);
            this.logger.log(`Successfully created task ${savedTask.id}`);

            return savedTask;
        } catch (error) {
            this.logger.error(
                `Failed to create task for user ${userId}:`,
                error,
            );
            if (error instanceof QueryFailedError) {
                const dbError = error as any;
                if (dbError.code === '23503') {
                    throw new BadRequestException('User does not exist');
                }
                throw new BadRequestException('Invalid task data');
            }
            throw new InternalServerErrorException('Failed to create task');
        }
    }

    async editTask(body: EditTaskDto, userId: string) {
        this.logger.log(`Editing task ${body.id} for user: ${userId}`);

        // Validate IDs
        if (!body.id || !isUuid(body.id)) {
            throw new BadRequestException('Invalid task ID format');
        }

        if (!userId || !isUuid(userId)) {
            throw new BadRequestException('Invalid user ID format');
        }

        // First verify the task exists and belongs to the user
        await this.getTask(body.id, userId);

        // Validate updated data
        if (body.title !== undefined) {
            if (!body.title || body.title.trim().length === 0) {
                throw new BadRequestException('Task title cannot be empty');
            }
            if (body.title.length > 255) {
                throw new BadRequestException(
                    'Task title too long (max 255 characters)',
                );
            }
        }

        if (body.description !== undefined && body.description.length > 10000) {
            throw new BadRequestException(
                'Task description too long (max 10000 characters)',
            );
        }

        try {
            // Update only allowed fields to prevent mass assignment
            const updateData: Partial<Task> = {};
            if (body.title !== undefined) updateData.title = body.title.trim();
            if (body.description !== undefined)
                updateData.description = body.description.trim();
            if (body.done !== undefined) updateData.done = body.done;
            if (body.dueDate !== undefined)
                updateData.dueDate = body.dueDate.trim();

            // Check if there's anything to update
            if (Object.keys(updateData).length === 0) {
                throw new BadRequestException('No valid fields to update');
            }

            const result = await this.tasksRepository.update(
                body.id,
                updateData,
            );
            if (result.affected === 0) {
                this.logger.warn(`No task updated for ID ${body.id}`);
                throw new NotFoundException(
                    'Task not found or already deleted',
                );
            }

            const editedTask = await this.getTask(body.id, userId);
            this.logger.log(`Successfully edited task ${body.id}`);

            return editedTask;
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error; // Re-throw known exceptions
            }

            this.logger.error(
                `Failed to edit task ${body.id} for user ${userId}:`,
                error,
            );
            if (error instanceof QueryFailedError) {
                throw new BadRequestException('Invalid task data');
            }
            throw new InternalServerErrorException('Failed to update task');
        }
    }

    async deleteTask(id: string, userId: string) {
        this.logger.log(`Deleting task ${id} for user: ${userId}`);

        // Validate IDs
        if (!id || !isUuid(id)) {
            throw new BadRequestException('Invalid task ID format');
        }

        if (!userId || !isUuid(userId)) {
            throw new BadRequestException('Invalid user ID format');
        }

        try {
            // First verify the task exists and belongs to the user
            const task = await this.getTask(id, userId);

            await this.tasksRepository.remove(task);
            this.logger.log(`Successfully deleted task ${id}`);

            return {
                message: 'Task deleted successfully',
                deletedTaskId: id,
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error; // Re-throw known exceptions
            }

            this.logger.error(
                `Failed to delete task ${id} for user ${userId}:`,
                error,
            );
            if (error instanceof QueryFailedError) {
                throw new BadRequestException('Invalid request parameters');
            }
            throw new InternalServerErrorException('Failed to delete task');
        }
    }
}
