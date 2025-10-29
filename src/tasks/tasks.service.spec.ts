import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EditTaskDto } from './dto/edit-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';

describe('TasksService', () => {
    let service: TasksService;
    let tasksRepository: Repository<Task>;
    let mockQueryBuilder: Partial<SelectQueryBuilder<Task>>;

    beforeEach(async () => {
        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                {
                    provide: getRepositoryToken(Task),
                    useValue: {
                        find: jest.fn(),
                        createQueryBuilder: jest
                            .fn()
                            .mockReturnValue(mockQueryBuilder),
                        save: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
        tasksRepository = module.get<Repository<Task>>(
            getRepositoryToken(Task),
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('listTasks', () => {
        it('should return an array of tasks for the given user', async () => {
            const userId = 'user1';
            const tasks = [
                { id: '1', title: 'Task 1', owner: { id: userId } },
                { id: '2', title: 'Task 2', owner: { id: userId } },
            ];

            jest.spyOn(tasksRepository, 'find').mockResolvedValue(tasks as any);

            const result = await service.listTasks(userId);

            expect(tasksRepository.find).toHaveBeenCalledWith({
                where: { owner: { id: userId } },
                relations: ['owner'],
            });
            expect(result).toEqual(tasks);
        });

        it('should return an empty array if no tasks are found for the given user', async () => {
            const userId = 'user1';
            const tasks = [];

            jest.spyOn(tasksRepository, 'find').mockResolvedValue(tasks as any);

            const result = await service.listTasks(userId);

            expect(tasksRepository.find).toHaveBeenCalledWith({
                where: { owner: { id: userId } },
                relations: ['owner'],
            });
            expect(result).toEqual(tasks);
        });
    });

    describe('getTask', () => {
        it('should return a task if it belongs to the user', async () => {
            const taskId = 'task1';
            const userId = 'user1';
            const mockTask = {
                id: taskId,
                title: 'Test Task',
                owner: { id: userId },
            };

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockTask);

            const result = await service.getTask(taskId, userId);

            expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith(
                'task',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'task.owner',
                'owner',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'task.id = :id',
                { id: taskId },
            );
            expect(result).toEqual(mockTask);
        });

        it('should throw ForbiddenException if task belongs to another user', async () => {
            const taskId = 'task1';
            const userId = 'user1';
            const otherUserId = 'user2';
            const mockTask = {
                id: taskId,
                title: 'Test Task',
                owner: { id: otherUserId },
            };

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockTask);

            await expect(service.getTask(taskId, userId)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw NotFoundException if task does not exist', async () => {
            const taskId = 'nonexistent';
            const userId = 'user1';

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(null);

            await expect(service.getTask(taskId, userId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('createTask', () => {
        it('should create a task successfully', async () => {
            const userId = 'user1';
            const createTaskDto: CreateTaskDto = {
                title: 'New Task',
                description: 'Task description',
                done: false,
                dueDate: '2024-12-31',
            };
            const savedTask = {
                id: 'task1',
                ...createTaskDto,
                owner: { id: userId },
            };

            jest.spyOn(tasksRepository, 'save').mockResolvedValue(
                savedTask as any,
            );

            const result = await service.createTask(createTaskDto, userId);

            expect(tasksRepository.save).toHaveBeenCalled();
            expect(result).toEqual(savedTask);
        });
    });

    describe('editTask', () => {
        it('should successfully edit a task owned by the user', async () => {
            const userId = 'user1';
            const taskId = 'task1';
            const editTaskDto: EditTaskDto = {
                id: taskId,
                title: 'Updated Task',
                description: 'Updated description',
            };
            const existingTask = {
                id: taskId,
                title: 'Original Task',
                description: 'Original description',
                done: false,
                dueDate: '',
                owner: { id: userId },
            };
            const updatedTask = {
                ...existingTask,
                ...editTaskDto,
            };

            // Mock getTask to return the existing task (ownership check)
            mockQueryBuilder.getOne = jest
                .fn()
                .mockResolvedValueOnce(existingTask) // First call for ownership check
                .mockResolvedValueOnce(updatedTask); // Second call for returning updated task

            jest.spyOn(tasksRepository, 'update').mockResolvedValue(
                undefined as any,
            );

            const result = await service.editTask(editTaskDto, userId);

            expect(tasksRepository.update).toHaveBeenCalledWith(taskId, {
                title: editTaskDto.title,
                description: editTaskDto.description,
            });
            expect(result).toEqual(updatedTask);
        });

        it('should prevent editing a task owned by another user', async () => {
            const userId = 'user1';
            const otherUserId = 'user2';
            const taskId = 'task1';
            const editTaskDto: EditTaskDto = {
                id: taskId,
                title: 'Updated Task',
            };
            const existingTask = {
                id: taskId,
                title: 'Original Task',
                owner: { id: otherUserId }, // Task belongs to another user
            };

            // Mock getTask to return a task owned by another user
            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);

            await expect(service.editTask(editTaskDto, userId)).rejects.toThrow(
                ForbiddenException,
            );

            // Ensure update was never called
            expect(tasksRepository.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when trying to edit non-existent task', async () => {
            const userId = 'user1';
            const taskId = 'nonexistent';
            const editTaskDto: EditTaskDto = {
                id: taskId,
                title: 'Updated Task',
            };

            // Mock getTask to return null (task doesn't exist)
            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(null);

            await expect(service.editTask(editTaskDto, userId)).rejects.toThrow(
                NotFoundException,
            );

            // Ensure update was never called
            expect(tasksRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteTask', () => {
        it('should successfully delete a task owned by the user', async () => {
            const userId = 'user1';
            const taskId = 'task1';
            const existingTask = {
                id: taskId,
                title: 'Task to delete',
                owner: { id: userId },
            };

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);
            jest.spyOn(tasksRepository, 'remove').mockResolvedValue(
                existingTask as any,
            );

            const result = await service.deleteTask(taskId, userId);

            expect(tasksRepository.remove).toHaveBeenCalledWith(existingTask);
            expect(result).toEqual({ message: 'Task deleted successfully' });
        });

        it('should prevent deleting a task owned by another user', async () => {
            const userId = 'user1';
            const otherUserId = 'user2';
            const taskId = 'task1';
            const existingTask = {
                id: taskId,
                title: 'Task to delete',
                owner: { id: otherUserId }, // Task belongs to another user
            };

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);

            await expect(service.deleteTask(taskId, userId)).rejects.toThrow(
                ForbiddenException,
            );

            // Ensure remove was never called
            expect(tasksRepository.remove).not.toHaveBeenCalled();
        });
    });
});
