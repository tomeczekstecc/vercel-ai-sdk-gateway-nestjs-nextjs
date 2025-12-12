import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ToolsService } from './tools.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ToolsService],
})
export class ChatModule {}
