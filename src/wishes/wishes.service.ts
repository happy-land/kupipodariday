import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
  ) {}

  create(user: User, createWishDto: CreateWishDto) {
    const newWish = this.wishesRepository.create({
      ...createWishDto,
      owner: user,
    });
    return this.wishesRepository.save(newWish);
  }

  async getLast() {
    const wishes = await this.wishesRepository.find({
      relations: {
        owner: true,
        offers: {
          item: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      take: 40,
    });

    // wishes.forEach();

    // TODO: дописать метод

    return wishes;
  }

  async getTop() {
    const wishes = await this.wishesRepository.find({
      relations: {
        owner: true,
        offers: {
          item: true,
        },
      },
      order: {
        copied: 'DESC',
      },
      take: 10,
    });

    const copiedWishes = wishes.filter((wish) => {
      if (wish.copied === 0) {
        return;
      }
      return wish;
    });

    // copiedWishes.forEach((wish) => {
    //   const amounts = wish.offers.map((offer) => Number(offer.amount));

    //   wish.raised = amounts.reduce(function (acc, val) {
    //     return acc + val;
    //   }, 0);

    //   delete wish.owner.password;
    //   delete wish.owner.email;
    // });

    return copiedWishes;
  }

  async getById(id: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id: id },
      relations: {
        owner: true,
        offers: {
          item: true,
          user: { offers: true, wishes: true, wishlists: true },
        },
      },
    });

    if (!wish) {
      throw new NotFoundException();
    }

    delete wish.owner.password;
    delete wish.owner.email;
    return wish;
  }

  findAll(query: FindManyOptions<Wish>) {
    return this.wishesRepository.find(query);
  }

  findOne(id: number) {
    return `This action returns a #${id} wish`;
  }

  async update(id: number, updateWishDto: UpdateWishDto, userId: number) {
    const wish = await this.wishesRepository.findOne({
      where: [{ id: id }],
      relations: {
        owner: true,
      },
    });

    if (userId !== wish.owner.id) {
      throw new ForbiddenException('Нельзя редактировать подарки других');
    }

    if (wish.raised !== 0 && wish.price != undefined) {
      throw new ConflictException(
        'Обновление запрещено, поскольку идёт сбор средств',
      );
    }

    return this.wishesRepository.update(id, updateWishDto);
  }

  async remove(id: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id: id },
      relations: {
        owner: true,
        offers: {
          item: true,
          user: { offers: true, wishes: true, wishlists: true },
        },
      },
    });

    if (!wish) {
      throw new NotFoundException();
    }

    await this.wishesRepository.delete({ id });

    delete wish.owner.password;
    delete wish.owner.email;

    return wish;
  }

  async copyWish(user: User, id: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id: id },
      relations: {
        owner: true,
      },
    });
    if (!wish) {
      throw new NotFoundException();
    }

    const wishToCopy = await this.create(user, {
      name: wish.name,
      link: wish.link,
      image: wish.image,
      price: wish.price,
      description: wish.description,
    });

    wishToCopy.copied = wish.copied + 1;
    await this.update(wishToCopy.id, wishToCopy, wishToCopy.owner.id);

    return {};
  }
}
