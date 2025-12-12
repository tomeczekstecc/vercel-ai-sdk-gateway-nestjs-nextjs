import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UIMessage } from 'ai';
import { Response } from 'express';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post()
  chat(
    @Body() body: { message: UIMessage; id: string; model: string },
    @Res() res: Response,
  ) {
    this.chatService.chat(body.message, res, body.id, body.model);
  }

  @Get()
  async getChats() {
    return this.chatService.getChats();
  }

  @Get(':id/messages')
  async getMessagesByChatId(@Param('id') id: string) {
    return this.chatService.getChatMessagesByChatId(id);
  }

  @Get(':id')
  async getChatById(@Param('id') id: string) {
    return this.chatService.getChatById(id);
  }
}
