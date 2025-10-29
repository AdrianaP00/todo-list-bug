import {
    IsString,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    MinLength,
    IsDateString,
} from 'class-validator';

export class CreateTaskDto {
    @IsString({ message: 'Title must be a string' })
    @IsNotEmpty({ message: 'Title cannot be empty' })
    @MinLength(1, { message: 'Title must be at least 1 character long' })
    @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
    title: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(10000, { message: 'Description cannot exceed 10000 characters' })
    description?: string;

    @IsOptional()
    @IsBoolean({ message: 'Done must be a boolean value' })
    done?: boolean = false;

    @IsOptional()
    @IsString({ message: 'Due date must be a string' })
    @IsDateString(
        { strict: false },
        { message: 'Due date must be a valid ISO 8601 date string' },
    )
    dueDate?: string;
}
