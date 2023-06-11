import { IsArray, IsString } from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  name: string;

  @IsString()
  image: string;

  @IsArray()
  itemsId: number[];
}
