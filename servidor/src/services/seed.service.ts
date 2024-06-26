import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Card, User } from '../entities';
import { OffersService } from './offers.service';
import { Repository } from 'typeorm';
import { CardsService } from './cards.service';
import { initialData } from '../data/seed-data';
import { ChatService } from './chat.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly offersService: OffersService,
    private readonly cardsService: CardsService,
    private readonly chatsService: ChatService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    await this.deleteTables();
    const adminUser = await this.insertUsers();
    const card = await this.insertNewCards();
    await this.insertNewOffers(adminUser, card);
    return 'SEDD EXECUTED';
  }

  private async deleteTables() {
    await this.offersService.deleteAll();
    await this.cardsService.deleteAll();
    await this.chatsService.deleteAll();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];

    seedUsers.forEach((user) => {
      users.push(this.userRepository.create(user));
    });

    const dbUsers = await this.userRepository.save(seedUsers);

    return dbUsers[0];
  }

  private async insertNewCards() {
    await this.cardsService.deleteAll();
    const cards = initialData.cards;

    const insertPromises = [];

    cards.forEach((cards) => {
      insertPromises.push(this.cardsService.create(cards));
    });

    const results = await Promise.all(insertPromises);

    return results[0];
  }

  private async insertNewOffers(user: User, card: Card) {
    await this.offersService.deleteAll();
    const offers = initialData.offers;

    offers.forEach((offer) => {
      offer.cardId = card.id;
    });

    const insertPromises = [];

    offers.forEach((offer) => {
      insertPromises.push(this.offersService.create(offer, user));
    });

    await Promise.all(insertPromises);

    return true;
  }
}
