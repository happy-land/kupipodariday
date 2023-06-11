import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private hashService: HashService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, username } = createUserDto;

    console.log(createUserDto, ' < createUserDto');

    const existUser = await this.usersRepository.find({
      where: [{ email: email }, { username: username }],
    });

    if (existUser.length !== 0) {
      throw new ConflictException(
        'Пользователь с таким email или username уже зарегистрирован',
      );
    }

    const hash = await this.hashService.hash(createUserDto.password);
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hash,
    });

    return this.usersRepository.save(newUser);
  }

  async findOne(query: FindOneOptions<User>): Promise<User> {
    return this.usersRepository.findOne(query);
  }

  async findByUsername(username: string) {
    return await this.usersRepository.findOne({ where: { username } });
  }

  async findAll() {
    return await this.usersRepository.find();
    // return `This action returns all users!`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.usersRepository.update({ id }, updateUserDto);
  }

  async getMyWishes(id: number) {
    const user = await this.findOne({
      where: { id: id },
      relations: {
        wishes: {
          owner: true,
          offers: {
            item: { owner: true, offers: true },
            user: { wishes: true, offers: true, wishlists: true },
          },
        },
      },
    });

    const userWishes = user.wishes.filter((wish) => {
      const sum = wish.offers.map((offer) => Number(offer.amount));
      wish.raised = sum.reduce(function (acc, val) {
        return acc + val;
      }, 0);
      wish.price = Number(wish.price);
      return wish;
    });

    // console.log(userWishes, '<<< userWishes');

    return userWishes;
  }
}
