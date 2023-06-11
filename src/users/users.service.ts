import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { HashService } from 'src/hash/hash.service';
import { FindUsersDto } from './dto/find-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private hashService: HashService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, username } = createUserDto;

    const user = await this.usersRepository.find({
      where: [{ username: username }, { email: email }],
    });

    if (user.length !== 0) {
      throw new ConflictException('Пользователь уже зарегистрирован');
    }

    const hash = await this.hashService.hash(createUserDto.password);
    const createdUser = this.usersRepository.create({
      ...createUserDto,
      password: hash,
    });

    return this.usersRepository.save(createdUser);
  }

  async findUser(findUserDto: FindUsersDto) {
    const user = await this.findMany(findUserDto.query);
    return user;
  }

  async findOne(query: FindOneOptions<User>): Promise<User> {
    return this.usersRepository.findOne(query);
  }

  async findMany(query: string) {
    return this.usersRepository.find({
      where: [{ username: query }, { email: query }],
    });
  }

  async findByUsername(username: string) {
    return await this.usersRepository.findOne({ where: { username } });
  }

  async findAll() {
    return await this.usersRepository.find();
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.usersRepository.update({ id }, updateUserDto);
  }

  async getMyWishes(id: number) {
    const query = {
      where: { id: id },
      relations: {
        wishes: {
          offers: {
            user: { wishes: true, wishlists: true, offers: true },
            item: { owner: true, offers: true },
          },
          owner: true,
        },
      },
    };
    const user = await this.findOne(query);

    const userWishes = user.wishes.filter((wish) => {
      const amountArr = wish.offers.map((offer) => offer.amount);
      wish.raised = amountArr.reduce((prev, current) => {
        return prev + current;
      }, 0);
      return wish;
    });

    return userWishes;
  }
}
