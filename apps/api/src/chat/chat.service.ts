import { Injectable } from '@nestjs/common';
import {
  convertToModelMessages,
  UIMessage,
  ModelMessage,
  streamText,
} from 'ai';
import { Response } from 'express';

@Injectable()
export class ChatService {
  chat(messages: UIMessage[], model: string, response: Response) {
    const modelMessages: ModelMessage[] = [...convertToModelMessages(messages)];
    const result = streamText({
      model,
      messages: modelMessages,
    });
    result.pipeUIMessageStreamToResponse(response);
  }
}
