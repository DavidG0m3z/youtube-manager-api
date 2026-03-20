import { Role } from "../enums/role.enum";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ 
        type: "varchar", 
        length: 100 
    })
    email: string;

    @Column({ 
        name: 'password_hash', 
        type: 'varchar', 
        length: 255 
    })
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.USER,
    })
    role: Role;

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
    })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}