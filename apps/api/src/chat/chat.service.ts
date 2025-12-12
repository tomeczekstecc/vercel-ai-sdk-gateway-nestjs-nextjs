import { Inject, Injectable } from '@nestjs/common';
import {
  convertToModelMessages,
  UIMessage,
  ModelMessage,
  streamText,
} from 'ai';
import { Response } from 'express';
import { ToolsService } from './tools.service';
import { DATABASE_CONNECTION, schema } from 'src/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { desc, eq } from 'drizzle-orm';

@Injectable()
export class ChatService {
  constructor(
    private readonly toolsSercise: ToolsService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase<typeof schema>,
  ) {}

  chat(messages: UIMessage[], model: string, response: Response) {
    const modelMessages: ModelMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      ...convertToModelMessages(messages),
    ];
    const result = streamText({
      model,
      messages: modelMessages,
      tools: this.toolsSercise.getAllTools(),
    });
    result.pipeUIMessageStreamToResponse(response);
  }

  private getSystemPrompt() {
    return 'Jesteś asystentem, który odpowiada na pytania i używa narzędzia (tools)';
  }

  async getChatById(id: string) {
    return await this.database.query.chats.findFirst({
      where: eq(schema.chats.id, id),
    });
  }

  async getChatMessagesByChatId(id: string) {
    const messages = await this.database.query.messages.findMany({
      where: eq(schema.messages.chatId, id),
      orderBy: [schema.messages.createdAt],
    });
    return messages.map((m) => m.content);
  }

  async getChats() {
    const chats = await this.database.query.chats.findMany({
      orderBy: [schema.chats.updatedAt],
      with: {
        messages: {
          orderBy: [desc(schema.messages.createdAt)],
          limit: 1,
        },
      },
    });
    return chats.map((chat) => {
      let snippet = 'Brak wiadomości';
      if (chat.messages.length) {
        const message = chat.messages[0].content as UIMessage;
        const textPart = message.parts.find((p) => p.type === 'text');
        if (textPart && 'text' in textPart) {
          snippet = textPart?.text.substring(0, 60);
          if (textPart?.text.length > 60) snippet += '...';
        }
      }

      return {
        id: chat.id,
        updatedAt: chat.updatedAt,
        snippet,
      };
    });
  }
}
