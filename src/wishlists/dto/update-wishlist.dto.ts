import { PartialType } from '@nestjs/mapped-types';
import { CreateWishlistDto } from './create-wishlist.dto';
import { IsArray, IsString, IsUrl } from 'class-validator';

export class UpdateWishlistDto extends PartialType(CreateWishlistDto) {
  @IsString()
  name: string;

  @IsString()
  @IsUrl()
  image: string;

  @IsString()
  description: string;

  @IsArray()
  itemsId: number[];
}
