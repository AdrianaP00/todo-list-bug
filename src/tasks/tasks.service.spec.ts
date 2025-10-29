import { Test, TestingModule } from '@nestjs/testing';import { Test, TestingModule } from '@nestjs/testing';

import { TasksService } from './tasks.service';import { TasksService } from './tasks.service';

import { getRepositoryToken } from '@nestjs/typeorm';import { getRepositoryToken } from '@nestjs/typeorm';

import { Task } from '../entities/task.entity';import { Task } from '../entities/task.entity';

import { Repository, SelectQueryBuilder } from 'typeorm';import { Repository, SelectQueryBuilder } from 'typeorm';

import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

import { EditTaskDto } from './dto/edit-task.dto';import { EditTaskDto } from './dto/edit-task.dto';

import { CreateTaskDto } from './dto/create-task.dto';import { CreateTaskDto } from './dto/create-task.dto';



describe('TasksService', () => {describe('TasksService', () => {

    let service: TasksService;    let service: TasksService;

    let tasksRepository: Repository<Task>;    let tasksRepository: Repository<Task>;

    let mockQueryBuilder: Partial<SelectQueryBuilder<Task>>;    let mockQueryBuilder: Partial<SelectQueryBuilder<Task>>;



    // Valid UUIDs for testing    beforeEach(async () => {

    const validUserId = '550e8400-e29b-41d4-a716-446655440000';        mockQueryBuilder = {

    const validTaskId = '550e8400-e29b-41d4-a716-446655440001';            leftJoinAndSelect: jest.fn().mockReturnThis(),

    const otherUserId = '550e8400-e29b-41d4-a716-446655440002';            where: jest.fn().mockReturnThis(),

    const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';            getOne: jest.fn(),

        };

    beforeEach(async () => {

        mockQueryBuilder = {        const module: TestingModule = await Test.createTestingModule({

            leftJoinAndSelect: jest.fn().mockReturnThis(),            providers: [

            where: jest.fn().mockReturnThis(),                TasksService,

            getOne: jest.fn(),                {

        };                    provide: getRepositoryToken(Task),

                    useValue: {

        const module: TestingModule = await Test.createTestingModule({                        find: jest.fn(),

            providers: [                        createQueryBuilder: jest

                TasksService,                            .fn()

                {                            .mockReturnValue(mockQueryBuilder),

                    provide: getRepositoryToken(Task),                        save: jest.fn(),

                    useValue: {                        update: jest.fn(),

                        find: jest.fn(),                        remove: jest.fn(),

                        createQueryBuilder: jest                    },

                            .fn()                },

                            .mockReturnValue(mockQueryBuilder),            ],

                        save: jest.fn(),        }).compile();

                        update: jest.fn().mockResolvedValue({ affected: 1 }),

                        remove: jest.fn(),        service = module.get<TasksService>(TasksService);

                    },        tasksRepository = module.get<Repository<Task>>(

                },            getRepositoryToken(Task),

            ],        );

        }).compile();    });



        service = module.get<TasksService>(TasksService);    it('should be defined', () => {

        tasksRepository = module.get<Repository<Task>>(        expect(service).toBeDefined();

            getRepositoryToken(Task),    });

        );

    });    describe('listTasks', () => {

        it('should return an array of tasks for the given user', async () => {

    it('should be defined', () => {            const userId = '550e8400-e29b-41d4-a716-446655440000';

        expect(service).toBeDefined();            const mockTasks = [

    });                {

                    id: '550e8400-e29b-41d4-a716-446655440001',

    describe('listTasks', () => {                    title: 'Task 1',

        it('should return an array of tasks for the given user', async () => {                    description: 'Description 1',

            const mockTasks = [                    done: false,

                {                    dueDate: '',

                    id: validTaskId,                    owner: { id: userId },

                    title: 'Task 1',                },

                    description: 'Description 1',                {

                    done: false,                    id: '550e8400-e29b-41d4-a716-446655440002',

                    dueDate: '',                    title: 'Task 2',

                    owner: { id: validUserId },                    description: 'Description 2',

                },                    done: true,

            ] as Task[];                    dueDate: '',

                    owner: { id: userId },

            jest.spyOn(tasksRepository, 'find').mockResolvedValue(mockTasks);                },

            ];

            const result = await service.listTasks(validUserId);

            jest.spyOn(tasksRepository, 'find').mockResolvedValue(mockTasks);

            expect(tasksRepository.find).toHaveBeenCalledWith({

                where: { owner: { id: validUserId } },            const result = await service.listTasks(userId);

                relations: ['owner'],

                order: { id: 'DESC' },        it('should return an empty array if no tasks are found for the given user', async () => {

            });            const userId = '550e8400-e29b-41d4-a716-446655440000';

            expect(result).toEqual(mockTasks);            const tasks = [];

        });

            jest.spyOn(tasksRepository, 'find').mockResolvedValue(tasks as any);

        it('should return an empty array if no tasks are found for the given user', async () => {

            const tasks: Task[] = [];            const result = await service.listTasks(userId);



            jest.spyOn(tasksRepository, 'find').mockResolvedValue(tasks);            expect(tasksRepository.find).toHaveBeenCalledWith({

                where: { owner: { id: userId } },

            const result = await service.listTasks(validUserId);                relations: ['owner'],

                order: { id: 'DESC' },

            expect(result).toEqual(tasks);            });

        });            expect(result).toEqual(tasks);

        });

        it('should throw BadRequestException for invalid user ID format', async () => {    });

            await expect(service.listTasks('invalid-id')).rejects.toThrow(

                BadRequestException,    describe('getTask', () => {

            );        it('should return a task if it belongs to the user', async () => {

        });            const taskId = '550e8400-e29b-41d4-a716-446655440001';

    });            const userId = '550e8400-e29b-41d4-a716-446655440000';

            const mockTask = {

    describe('getTask', () => {                id: taskId,

        it('should return a task if it belongs to the user', async () => {                title: 'Test Task',

            const mockTask = {                owner: { id: userId },

                id: validTaskId,            };

                title: 'Test Task',

                owner: { id: validUserId },            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockTask);

            } as Task;

            const result = await service.getTask(taskId, userId);

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockTask);

            expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith(

            const result = await service.getTask(validTaskId, validUserId);                'task',

            );

            expect(result).toEqual(mockTask);            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(

        });                'task.owner',

                'owner',

        it('should throw BadRequestException for invalid task ID format', async () => {            );

            await expect(service.getTask('invalid-id', validUserId)).rejects.toThrow(            expect(mockQueryBuilder.where).toHaveBeenCalledWith(

                BadRequestException,                'task.id = :id',

            );                { id: taskId },

        });            );

            expect(result).toEqual(mockTask);

        it('should throw BadRequestException for invalid user ID format', async () => {        });

            await expect(service.getTask(validTaskId, 'invalid-id')).rejects.toThrow(

                BadRequestException,        it('should throw ForbiddenException if task belongs to another user', async () => {

            );            const taskId = 'task1';

        });            const userId = 'user1';

            const otherUserId = 'user2';

        it('should throw ForbiddenException if task belongs to another user', async () => {            const mockTask = {

            const mockTask = {                id: taskId,

                id: validTaskId,                title: 'Test Task',

                title: 'Test Task',                owner: { id: otherUserId },

                owner: { id: otherUserId },            };

            } as Task;

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockTask);

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockTask);

            await expect(service.getTask(taskId, userId)).rejects.toThrow(

            await expect(service.getTask(validTaskId, validUserId)).rejects.toThrow(                ForbiddenException,

                ForbiddenException,            );

            );        });

        });

        it('should throw NotFoundException if task does not exist', async () => {

        it('should throw NotFoundException if task does not exist', async () => {            const taskId = 'nonexistent';

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(null);            const userId = 'user1';



            await expect(service.getTask(nonExistentId, validUserId)).rejects.toThrow(            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(null);

                NotFoundException,

            );            await expect(service.getTask(taskId, userId)).rejects.toThrow(

        });                NotFoundException,

    });            );

        });

    describe('createTask', () => {    });

        it('should create a task successfully', async () => {

            const createTaskDto: CreateTaskDto = {    describe('createTask', () => {

                title: 'New Task',        it('should create a task successfully', async () => {

                description: 'Task description',            const userId = 'user1';

                done: false,            const createTaskDto: CreateTaskDto = {

                dueDate: '2024-12-31T00:00:00.000Z',                title: 'New Task',

            };                description: 'Task description',

            const savedTask = {                done: false,

                id: validTaskId,                dueDate: '2024-12-31',

                ...createTaskDto,            };

                owner: { id: validUserId },            const savedTask = {

            } as Task;                id: 'task1',

                ...createTaskDto,

            jest.spyOn(tasksRepository, 'save').mockResolvedValue(savedTask);                owner: { id: userId },

            };

            const result = await service.createTask(createTaskDto, validUserId);

            jest.spyOn(tasksRepository, 'save').mockResolvedValue(

            expect(result).toEqual(savedTask);                savedTask as any,

        });            );



        it('should throw BadRequestException for invalid user ID format', async () => {            const result = await service.createTask(createTaskDto, userId);

            const createTaskDto: CreateTaskDto = {

                title: 'New Task',            expect(tasksRepository.save).toHaveBeenCalled();

            };            expect(result).toEqual(savedTask);

        });

            await expect(service.createTask(createTaskDto, 'invalid-id')).rejects.toThrow(    });

                BadRequestException,

            );    describe('editTask', () => {

        });        it('should successfully edit a task owned by the user', async () => {

            const userId = 'user1';

        it('should throw BadRequestException for empty title', async () => {            const taskId = 'task1';

            const createTaskDto: CreateTaskDto = {            const editTaskDto: EditTaskDto = {

                title: '',                id: taskId,

            };                title: 'Updated Task',

                description: 'Updated description',

            await expect(service.createTask(createTaskDto, validUserId)).rejects.toThrow(            };

                BadRequestException,            const existingTask = {

            );                id: taskId,

        });                title: 'Original Task',

                description: 'Original description',

        it('should throw BadRequestException for title too long', async () => {                done: false,

            const createTaskDto: CreateTaskDto = {                dueDate: '',

                title: 'a'.repeat(256),                owner: { id: userId },

            };            };

            const updatedTask = {

            await expect(service.createTask(createTaskDto, validUserId)).rejects.toThrow(                ...existingTask,

                BadRequestException,                ...editTaskDto,

            );            };

        });

    });            // Mock getTask to return the existing task (ownership check)

            mockQueryBuilder.getOne = jest

    describe('editTask', () => {                .fn()

        it('should successfully edit a task owned by the user', async () => {                .mockResolvedValueOnce(existingTask) // First call for ownership check

            const editTaskDto: EditTaskDto = {                .mockResolvedValueOnce(updatedTask); // Second call for returning updated task

                id: validTaskId,

                title: 'Updated Task',            jest.spyOn(tasksRepository, 'update').mockResolvedValue(

                description: 'Updated description',                undefined as any,

            };            );

            const existingTask = {

                id: validTaskId,            const result = await service.editTask(editTaskDto, userId);

                title: 'Original Task',

                description: 'Original description',            expect(tasksRepository.update).toHaveBeenCalledWith(taskId, {

                done: false,                title: editTaskDto.title,

                dueDate: '',                description: editTaskDto.description,

                owner: { id: validUserId },            });

            } as Task;            expect(result).toEqual(updatedTask);

            const updatedTask = {        });

                ...existingTask,

                title: editTaskDto.title,        it('should prevent editing a task owned by another user', async () => {

                description: editTaskDto.description,            const userId = 'user1';

            } as Task;            const otherUserId = 'user2';

            const taskId = 'task1';

            // Mock getTask calls - first for ownership check, second for final result            const editTaskDto: EditTaskDto = {

            mockQueryBuilder.getOne = jest                id: taskId,

                .fn()                title: 'Updated Task',

                .mockResolvedValueOnce(existingTask)            };

                .mockResolvedValueOnce(updatedTask);            const existingTask = {

                id: taskId,

            const result = await service.editTask(editTaskDto, validUserId);                title: 'Original Task',

                owner: { id: otherUserId }, // Task belongs to another user

            expect(tasksRepository.update).toHaveBeenCalledWith(validTaskId, {            };

                title: editTaskDto.title?.trim(),

                description: editTaskDto.description?.trim(),            // Mock getTask to return a task owned by another user

            });            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);

            expect(result).toEqual(updatedTask);

        });            await expect(service.editTask(editTaskDto, userId)).rejects.toThrow(

                ForbiddenException,

        it('should throw BadRequestException for invalid task ID format', async () => {            );

            const editTaskDto: EditTaskDto = {

                id: 'invalid-id',            // Ensure update was never called

                title: 'Updated Task',            expect(tasksRepository.update).not.toHaveBeenCalled();

            };        });



            await expect(service.editTask(editTaskDto, validUserId)).rejects.toThrow(        it('should throw NotFoundException when trying to edit non-existent task', async () => {

                BadRequestException,            const userId = 'user1';

            );            const taskId = 'nonexistent';

        });            const editTaskDto: EditTaskDto = {

                id: taskId,

        it('should throw BadRequestException for invalid user ID format', async () => {                title: 'Updated Task',

            const editTaskDto: EditTaskDto = {            };

                id: validTaskId,

                title: 'Updated Task',            // Mock getTask to return null (task doesn't exist)

            };            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(null);



            await expect(service.editTask(editTaskDto, 'invalid-id')).rejects.toThrow(            await expect(service.editTask(editTaskDto, userId)).rejects.toThrow(

                BadRequestException,                NotFoundException,

            );            );

        });

            // Ensure update was never called

        it('should prevent editing a task owned by another user', async () => {            expect(tasksRepository.update).not.toHaveBeenCalled();

            const editTaskDto: EditTaskDto = {        });

                id: validTaskId,    });

                title: 'Updated Task',

            };    describe('deleteTask', () => {

            const existingTask = {        it('should successfully delete a task owned by the user', async () => {

                id: validTaskId,            const userId = 'user1';

                title: 'Original Task',            const taskId = 'task1';

                owner: { id: otherUserId },            const existingTask = {

            } as Task;                id: taskId,

                title: 'Task to delete',

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);                owner: { id: userId },

            };

            await expect(service.editTask(editTaskDto, validUserId)).rejects.toThrow(

                ForbiddenException,            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);

            );            jest.spyOn(tasksRepository, 'remove').mockResolvedValue(

        });                existingTask as any,

    });            );



    describe('deleteTask', () => {            const result = await service.deleteTask(taskId, userId);

        it('should successfully delete a task owned by the user', async () => {

            const existingTask = {            expect(tasksRepository.remove).toHaveBeenCalledWith(existingTask);

                id: validTaskId,            expect(result).toEqual({ message: 'Task deleted successfully' });

                title: 'Task to delete',        });

                owner: { id: validUserId },

            } as Task;        it('should prevent deleting a task owned by another user', async () => {

            const userId = 'user1';

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);            const otherUserId = 'user2';

            const taskId = 'task1';

            const result = await service.deleteTask(validTaskId, validUserId);            const existingTask = {

                id: taskId,

            expect(tasksRepository.remove).toHaveBeenCalledWith(existingTask);                title: 'Task to delete',

            expect(result).toEqual({                owner: { id: otherUserId }, // Task belongs to another user

                message: 'Task deleted successfully',            };

                deletedTaskId: validTaskId,

            });            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);

        });

            await expect(service.deleteTask(taskId, userId)).rejects.toThrow(

        it('should throw BadRequestException for invalid task ID format', async () => {                ForbiddenException,

            await expect(service.deleteTask('invalid-id', validUserId)).rejects.toThrow(            );

                BadRequestException,

            );            // Ensure remove was never called

        });            expect(tasksRepository.remove).not.toHaveBeenCalled();

        });

        it('should throw BadRequestException for invalid user ID format', async () => {    });

            await expect(service.deleteTask(validTaskId, 'invalid-id')).rejects.toThrow(});

                BadRequestException,
            );
        });

        it('should prevent deleting a task owned by another user', async () => {
            const existingTask = {
                id: validTaskId,
                title: 'Task to delete',
                owner: { id: otherUserId },
            } as Task;

            mockQueryBuilder.getOne = jest.fn().mockResolvedValue(existingTask);

            await expect(service.deleteTask(validTaskId, validUserId)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});
