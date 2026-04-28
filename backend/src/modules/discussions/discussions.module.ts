import { Module } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { DiscussionsController } from './discussions.controller';

@Module({ providers: [DiscussionsService], controllers: [DiscussionsController] })
export class DiscussionsModule {}
