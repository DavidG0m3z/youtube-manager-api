import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {

    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>
    ){}

    async findByEmail(email: string): Promise<User | null> {
        return this.repository.findOne({
            where: { email, isActive: true },
        });
    }

    async findById(id: number): Promise<User | null> {
        return this.repository.findOne({
            where: { id, isActive: true },
        });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.repository.create(userData);
        return this.repository.save(user);
    }

    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.repository.count({
            where: { email }
        });
        return count > 0;
    }

    async update(id: number, userData: Partial<User>): Promise<void> {
        await this.repository.update(id, userData);
    }
}