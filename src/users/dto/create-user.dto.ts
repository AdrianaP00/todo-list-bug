import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class CreateUserDto {
    @IsString({ message: 'Full name must be a string' })
    @IsNotEmpty({ message: 'Full name cannot be empty' })
    @MinLength(2, { message: 'Full name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
    fullname!: string;

    @IsEmail({}, { message: 'El email debe ser válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @MaxLength(100, {
        message: 'La contraseña no puede superar 100 caracteres',
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        {
            message:
                'La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial',
        },
    )
    password!: string;
}
