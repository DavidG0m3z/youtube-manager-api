import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import youtubeConfig from './config/youtube.config';
import { VideosModule } from './modules/videos/videos.module'; 
<<<<<<< HEAD
import { AuthModule } from './modules/auth/auth.module';


=======
import { DownloaderModule } from './modules/downloader/downloader.module'; 
>>>>>>> 158c4c6131cb8b895c54d312ce25056a116d1160

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, youtubeConfig],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('app.nodeEnv') === 'development',
        logging: configService.get<string>('app.nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    VideosModule,
<<<<<<< HEAD
    AuthModule,
=======
    DownloaderModule,
>>>>>>> 158c4c6131cb8b895c54d312ce25056a116d1160
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
