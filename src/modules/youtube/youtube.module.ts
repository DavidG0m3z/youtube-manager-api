import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { YoutubeService } from './youtube.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 15000,
            maxRedirects: 3,
        }),
    ],
    providers: [YoutubeService],
    exports: [YoutubeService],
})

export class YoutubeModule {}