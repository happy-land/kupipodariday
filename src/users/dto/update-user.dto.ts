import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(2, {
    message: 'Имя пользователя не может быть короче 2-х символов',
  })
  @MaxLength(30, {
    message: 'Имя пользователя не может быть длиннее 30 символов',
  })
  @IsOptional()
  username: string;

  @IsString()
  @MinLength(2, {
    message: 'Описание профиля не может быть короче 2-х символов',
  })
  @MaxLength(200, {
    message: 'Описание профиля не может быть длиннее 200 символов',
  })
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password: string;
}
