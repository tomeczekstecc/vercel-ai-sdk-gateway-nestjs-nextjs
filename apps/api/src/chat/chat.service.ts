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

  async chat(
    message: UIMessage,
    response: Response,
    chatId: string,
    model: string,
  ) {
    let chat = await this.database.query.chats.findFirst({
      where: eq(schema.chats.id, chatId),
      with: {
        messages: {
          orderBy: [schema.messages.createdAt],
        },
      },
    });

    if (!chat) {
      const [newChat] = await this.database
        .insert(schema.chats)
        .values({
          id: chatId,
        })
        .returning();
      chat = { ...newChat, messages: [] };
    }

    const storedMessagesAsc = chat.messages.map((m) => m.content as UIMessage);
    const updatedAt = new Date();
    await this.database.insert(schema.messages).values({
      chatId: chat.id,
      content: message,
      createdAt: updatedAt,
    });

    await this.database
      .update(schema.chats)
      .set({
        updatedAt,
      })
      .where(eq(schema.chats.id, chat.id));

    const uiMessages = [...storedMessagesAsc, message];
    const originalCount = uiMessages.length;

    const modelMessages: ModelMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      ...convertToModelMessages(uiMessages),
    ];

    const result = streamText({
      model,
      messages: modelMessages,
      tools: this.toolsSercise.getAllTools(),
    });
    result.pipeUIMessageStreamToResponse(response, {
      originalMessages: uiMessages,
      onFinish: async ({ messages }) => {
        const newMessages = messages.slice(originalCount);
        if (newMessages.length === 0) return;
        const baseTime = Date.now();

        await this.database.insert(schema.messages).values(
          newMessages.map((msg, idx) => ({
            chatId: chat.id,
            content: msg,
            createdAt: new Date(baseTime + idx),
          })),
        );
        await this.database
          .update(schema.chats)
          .set({
            updatedAt: new Date(baseTime + newMessages.length - 1),
          })
          .where(eq(schema.chats.id, chat.id));
      },
    });
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
