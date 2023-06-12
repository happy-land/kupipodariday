import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { RequestUser } from 'src/utils/types';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Get('last')
  getLast() {
    return this.wishesService.getLast();
  }

  @Get('top')
  getTop() {
    return this.wishesService.getTop();
  }

  @UseGuards(JwtGuard)
  @Post()
  create(@Req() req: RequestUser, @Body() createWishDto: CreateWishDto) {
    return this.wishesService.create(req.user, createWishDto);
  }

  @Get(':id')
  getById(@Param('id') id: number) {
    return this.wishesService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateWishDto: UpdateWishDto,
    @Req() req: RequestUser,
  ) {
    return this.wishesService.update(id, updateWishDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.wishesService.remove(id);
  }

  @Post(':id/copy')
  copyWish(@Param('id') id: number, @Req() req: RequestUser) {
    return this.wishesService.copyWish(req.user, id);
  }
}
