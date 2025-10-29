import {
    IsString,
    IsBoolean,
    IsUUID,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';

export class EditTaskDto {
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    done?: boolean;

    @IsOptional()
    @IsString()
    dueDate?: string;
}
