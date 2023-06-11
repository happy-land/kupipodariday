import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsString()
  @MinLength(2, {
    message: 'Имя пользователя не может быть короче 2-х символов',
  })
  @MaxLength(30, {
    message: 'Имя пользователя не может быть длиннее 30 символов',
  })
  username: string;

  @IsString()
  @IsOptional()
  avatar?: 'https://i.pravatar.cc/150?img=3';

  @IsString()
  @MinLength(2, {
    message: 'Описание профиля не может быть короче 2-х символов',
  })
  @MaxLength(200, {
    message: 'Описание профиля не может быть длиннее 200 символов',
  })
  @IsOptional()
  about?: string;
}
