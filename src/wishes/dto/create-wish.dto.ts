import {
  IsString,
  IsUrl,
  IsNumber,
  IsPositive,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateWishDto {
  @IsString()
  @MinLength(1, {
    message: 'Название подарка не может быть короче 1-ого символа',
  })
  @MaxLength(250, {
    message: 'Название подарка не может быть длиннее 250 символов',
  })
  name: string;

  @IsString()
  @IsUrl()
  link: string;

  @IsString()
  @IsUrl()
  image: string;

  @Min(1)
  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  description: string;
}
