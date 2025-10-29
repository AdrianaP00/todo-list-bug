import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
    @IsEmail({}, { message: 'El email debe ser válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email!: string;

    @IsString({ message: 'La contraseña debe ser texto' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    pass!: string;
}
