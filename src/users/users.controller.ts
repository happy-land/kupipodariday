import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  NotFoundException,
  Req,
  UseGuards,
  Header,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestUser } from 'src/utils/types';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get('me')
  getUser(@Req() req: RequestUser) {
    return req.user;
  }

  @Get('me/wishes')
  @Header('Content-Type', 'application/json')
  async getMyWishes(@Req() req: RequestUser) {
    return await this.usersService.getMyWishes(req.user.id);
  }

  @Get(':username')
  async findUser(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`Пользователь ${username} не найден`);
    }
    delete user.password;
    delete user.email;
    return user;
  }

  @Patch('me')
  async update(@Req() req: RequestUser, @Body() updateUserDto: UpdateUserDto) {
    console.log(updateUserDto, ' < THIS IS USER');
    return this.usersService.update(req.user.id, updateUserDto);
  }
}
