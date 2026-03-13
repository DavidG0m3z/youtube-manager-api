import e from 'express';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'

@Entity('videos')
export class Video {

    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ name: 'youtube_id', type: 'varchar', length: 20 })
    youtubeId: string;

    @Column({ type: 'varchar', length: 500 })
    title: string;
    
    @Column({ type: 'text', nullable: true })
    description: string;
    
    @Column({ name: 'publication_date', type: 'datetime' })
    publicationDate: Date;
    
    @Column({ name: 'url_thumbnail', type: 'varchar', length: 500, nullable: true })
    urlThumbnail: string;
    
    @Column({ type: 'simple-json', nullable: true })
    tags: string[];
    
    @Column({ type: 'varchar', length: 20, nullable: true })
    duration: string;
    
    @Column({ type: 'varchar', length: 20, nullable: true })
    resolution: string;
    
    @Column({ type: 'varchar', length: 20, nullable: true })
    orientation: string;
    
    @Column({ type: 'varchar', length: 100, nullable: true })
    camera: string;
    
    @Column({ type: 'varchar', length: 100, nullable: true })
    headquarters: string;
    
    @Column({ type: 'int', nullable: true })
    fps: number;
    
    @Column({ type: 'varchar', length: 100, nullable: true })
    audiovisual: string;
    
    @Column({ name: 'color_profile', type: 'varchar', length: 100, nullable: true })
    colorProfile: string;
    
    @Column({ name: 'last_sync_at', type: 'datetime', nullable: true })
    lastSyncAt: Date;
    
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;
    
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}