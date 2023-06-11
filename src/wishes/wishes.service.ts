import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
  ) {}

  create(user: User, createWishDto: CreateWishDto) {
    const wish = this.wishesRepository.create({
      ...createWishDto,
      owner: user,
    });
    return this.wishesRepository.save(wish);
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

    const modifiedWishes = this.modifyWishes(wishes);

    return modifiedWishes;
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

    const modifiedWishes = this.modifyWishes(copiedWishes);

    return modifiedWishes;
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

  findOne(query: FindOneOptions<Wish>) {
    return this.wishesRepository.findOne(query);
  }

  async update(id: number, updateWishDto: UpdateWishDto, userId: number) {
    const wish = await this.wishesRepository.findOne({
      where: [{ id: id }],
      relations: {
        owner: true,
        offers: true,
      },
    });

    if (userId !== wish.owner.id) {
      throw new ForbiddenException('Нельзя редактировать подарки других');
    }

    if (wish.raised !== 0 && wish.offers.length !== 0) {
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

  modifyWishes(wishes: Wish[]) {
    wishes.forEach((wish) => {
      const amountArr = wish.offers.map((offer) => offer.amount);

      wish.raised = amountArr.reduce((prev, current) => {
        return prev + current;
      }, 0);

      delete wish.owner.email;
      delete wish.owner.password;
    });
    return wishes;
  }
}
