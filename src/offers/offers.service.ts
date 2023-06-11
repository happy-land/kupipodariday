import { ConflictException, Injectable } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { WishesService } from 'src/wishes/wishes.service';
import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    private wishesService: WishesService,
  ) {}

  async create(user: User, createOfferDto: CreateOfferDto) {
    const wish = await this.wishesService.findOne({
      where: { id: createOfferDto.itemId },
      relations: {
        offers: true,
        owner: true,
      },
    });

    const totalCost = await this.calculateTotalCost(wish.id);
    wish.raised = totalCost;

    this.checkConstraints(wish, createOfferDto.amount);

    if (wish.owner.id === user.id) {
      throw new ConflictException(
        'Нельзя вносить деньги на собственные подарки',
      );
    }

    const offer = this.offersRepository.create({
      ...createOfferDto,
      user: user,
      item: wish,
    });

    if (!offer.hidden) {
      delete offer.user;
      return this.offersRepository.save(offer);
    }

    delete offer.user.email;
    delete offer.user.password;
    delete offer.item.owner.email;
    delete offer.item.owner.password;

    return this.offersRepository.save(offer);
  }

  async calculateTotalCost(id: number) {
    const query = {
      where: { id: id },
      relations: {
        offers: true,
      },
    };
    const wish = await this.wishesService.findOne(query);

    const amountsArr = wish.offers.map((offer) => offer.amount);
    const totalCost = amountsArr.reduce((prev, current) => {
      return prev + current;
    }, 0);

    return totalCost;
  }

  checkConstraints(wish: Wish, amount: number) {
    if (wish.price < wish.raised + amount) {
      throw new ConflictException('Сумма должна быть меньше стоимости подарка');
    }
  }

  async findAll() {
    const query: FindManyOptions<Offer> = {
      relations: {
        item: { offers: true, owner: true },
        user: {
          offers: { item: true },
          wishes: { offers: true, owner: true },
          wishlists: true,
        },
      },
    };

    return await this.offersRepository.find(query);
  }

  async findOne(id: number) {
    const query: FindOneOptions<Offer> = {
      where: { id: id },
      relations: {
        item: { offers: true, owner: true },
        user: { offers: true, wishes: true, wishlists: true },
      },
    };

    return await this.offersRepository.findOne(query);
  }
}
