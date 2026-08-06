import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AICompletion {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly config: ConfigService) {}

  get activeProvider(): string {
    return this.config.get<string>('AI_PROVIDER', '');
  }

  async complete(prompt: string, opts?: any, provider?: string): Promise<AICompletion> {
    const p = provider || this.activeProvider;
    const key = this.config.get<string>(`${p.toUpperCase()}_API_KEY`, '');
    if (!key) {
      this.logger.warn(`API key untuk provider "${p}" belum diatur, fallback ke jawaban generik`);
      return {
        content: 'Maaf, belum bisa membalas otomatis. Tim kami akan segera menghubungi Anda.',
        inputTokens: 0,
        outputTokens: 0,
      };
    }
    if (p === 'openai') return this.openai(prompt, key);
    if (p === 'anthropic') return this.anthropic(prompt, key);
    if (p === 'gemini') return this.gemini(prompt, key);
    throw new Error(`Provider AI tidak dikenal: ${p}`);
  }

  private async openai(prompt: string, apiKey: string): Promise<AICompletion> {
    const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  }

  private async anthropic(prompt: string, apiKey: string): Promise<AICompletion> {
    const model = this.config.get<string>('ANTHROPIC_MODEL', 'claude-3-5-haiku-latest');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    return {
      content: data.content?.[0]?.text ?? '',
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
  }

  private async gemini(prompt: string, apiKey: string): Promise<AICompletion> {
    const model = this.config.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}