import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    done?: boolean = false;

    @IsOptional()
    @IsString()
    dueDate?: string;
}
