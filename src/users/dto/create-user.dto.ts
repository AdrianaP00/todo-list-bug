import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    fullname: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
