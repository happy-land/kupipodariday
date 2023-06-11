import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { WishesService } from 'src/wishes/wishes.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    private wishesService: WishesService,
  ) {}

  async create(user: User, createWishlistDto: CreateWishlistDto) {
    const wishes = await this.wishesService.findAll({});

    const filteredWishes = createWishlistDto.itemsId.map((item) => {
      return wishes.find((wish) => wish.id === item);
    });

    const newWishList = this.wishlistRepository.create({
      ...createWishlistDto,
      owner: user,
      items: filteredWishes,
    });

    return this.wishlistRepository.save(newWishList);
  }

  async findAll() {
    const wishLists = await this.findMany({
      relations: ['owner', 'items'],
    });

    wishLists.forEach((wishList) => {
      delete wishList.owner.password;
      delete wishList.owner.email;
    });

    return wishLists;
  }

  findMany(query: FindManyOptions<Wishlist>) {
    return this.wishlistRepository.find(query);
  }

  async findOne(id: number) {
    const list = await this.wishlistRepository.findOne({
      where: { id: id },
      relations: {
        items: { offers: true },
        owner: true,
      },
    });

    delete list.owner.password;
    delete list.owner.email;

    return list;
  }

  async update(
    id: number,
    userId: number,
    updateWishlistDto: UpdateWishlistDto,
  ) {
    const list = await this.wishlistRepository.findOne({
      where: { id: id },
      relations: ['owner', 'items'],
    });

    if (list.owner.id !== userId) {
      throw new BadRequestException(
        'Нельзя редактировать коллекцию другого пользователя',
      );
    }

    await this.wishlistRepository.update(id, updateWishlistDto);
    const updatedList = await this.findOneByRelations(id);

    delete updatedList.owner.password;
    delete updatedList.owner.email;

    return updatedList;
  }

  async remove(id: number, userId: number) {
    const list = await this.findOneByRelations(id);

    if (!list) {
      throw new NotFoundException();
    }

    if (list.owner.id !== userId) {
      throw new ConflictException(
        'Нельзя удалить коллекцию другого пользователя',
      );
    }
    await this.wishlistRepository.delete({ id });

    return list;
  }

  findOneByRelations(id: number) {
    return this.wishlistRepository.findOne({
      where: { id: id },
      relations: ['owner', 'items'],
    });
  }
}
