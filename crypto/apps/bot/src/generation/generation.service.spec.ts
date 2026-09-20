import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GenerationService } from './generation.service';

const mockCreate = jest.fn();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
);

describe('GenerationService', () => {
  let service: GenerationService;

  const configValues: Record<string, string> = {
    openaiApiKey: 'test-key',
    openaiModel: 'gpt-4o-mini',
    promptTemplate: 'system prompt',
  };

  beforeEach(async () => {
    mockCreate.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GenerationService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: (key: string) => configValues[key] },
        },
      ],
    }).compile();

    service = moduleRef.get(GenerationService);
  });

  it('returns trimmed text from a successful OpenAI response', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: '  Готовий допис  ' } }] });

    await expect(service.generatePost()).resolves.toBe('Готовий допис');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed attempt and succeeds', async () => {
    mockCreate
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockResolvedValueOnce({ choices: [{ message: { content: 'ОК' } }] });

    await expect(service.generatePost()).resolves.toBe('ОК');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  }, 10000);

  it('throws the last error after exhausting all retry attempts', async () => {
    mockCreate.mockRejectedValue(new Error('down'));

    await expect(service.generatePost()).rejects.toThrow('down');
    expect(mockCreate).toHaveBeenCalledTimes(3);
  }, 10000);

  it('throws when OpenAI returns an empty response', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '   ' } }] });

    await expect(service.generatePost()).rejects.toThrow('порожню відповідь');
  }, 10000);
});
