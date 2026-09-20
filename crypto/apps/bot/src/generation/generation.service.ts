import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('openaiApiKey'),
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  async generatePost(): Promise<string> {
    const model = this.config.getOrThrow<string>('openaiModel');
    const promptTemplate = this.config.getOrThrow<string>('promptTemplate');

    return this.withRetry(async () => {
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: promptTemplate },
          { role: 'user', content: 'Згенеруй допис для сьогоднішньої публікації.' },
        ],
        temperature: 0.8,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('OpenAI повернув порожню відповідь');
      }
      return text;
    });
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = MAX_ATTEMPTS): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Спроба ${attempt}/${attempts} невдала: ${message}`);

        if (attempt < attempts) {
          const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}
