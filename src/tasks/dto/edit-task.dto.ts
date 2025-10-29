import {
    IsString,
    IsBoolean,
    IsUUID,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    MinLength,
    IsDateString,
} from 'class-validator';

export class EditTaskDto {
    @IsUUID('4', { message: 'ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Task ID cannot be empty' })
    id!: string;

    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    @IsNotEmpty({ message: 'Title cannot be empty' })
    @MinLength(1, { message: 'Title must be at least 1 character long' })
    @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
    title?: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(10000, { message: 'Description cannot exceed 10000 characters' })
    description?: string;

    @IsOptional()
    @IsBoolean({ message: 'Done must be a boolean value' })
    done?: boolean;

    @IsOptional()
    @IsString({ message: 'Due date must be a string' })
    @IsDateString(
        { strict: false },
        { message: 'Due date must be a valid ISO 8601 date string' },
    )
    dueDate?: string;
}
