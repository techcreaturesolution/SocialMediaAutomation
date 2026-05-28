import axios from 'axios';
import OpenAI from 'openai';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { Language } from '../types';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German',
  pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ar: 'Arabic',
  ru: 'Russian', it: 'Italian', nl: 'Dutch', tr: 'Turkish', pl: 'Polish',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish', th: 'Thai',
  vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', tl: 'Filipino',
  bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', gu: 'Gujarati',
  kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu',
};

export class TranslationService {
  async translateText(text: string, targetLanguage: Language, sourceLanguage: Language = 'en'): Promise<string> {
    if (sourceLanguage === targetLanguage) return text;

    try {
      if (config.googleTranslateApiKey) {
        return await this.translateWithGoogle(text, targetLanguage, sourceLanguage);
      }
      return await this.translateWithAI(text, targetLanguage, sourceLanguage);
    } catch (error) {
      logger.error('Translation failed, falling back to AI:', error);
      return this.translateWithAI(text, targetLanguage, sourceLanguage);
    }
  }

  async translateContentForPlatforms(params: {
    text: string;
    hashtags: string[];
    targetLanguage: Language;
    sourceLanguage?: Language;
  }): Promise<{ text: string; hashtags: string[] }> {
    const source = params.sourceLanguage || 'en';
    if (source === params.targetLanguage) {
      return { text: params.text, hashtags: params.hashtags };
    }

    const translatedText = await this.translateText(params.text, params.targetLanguage, source);
    const translatedHashtags = await this.translateHashtags(params.hashtags, params.targetLanguage);

    return { text: translatedText, hashtags: translatedHashtags };
  }

  async detectLanguage(text: string): Promise<Language> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Detect the language of the given text. Return only the ISO 639-1 code.' },
          { role: 'user', content: text },
        ],
        max_tokens: 10,
      });

      const code = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'en';
      return code as Language;
    } catch (error) {
      logger.error('Language detection failed:', error);
      return 'en';
    }
  }

  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({ code, name }));
  }

  private async translateWithGoogle(text: string, target: string, source: string): Promise<string> {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      null,
      {
        params: {
          q: text,
          target,
          source,
          key: config.googleTranslateApiKey,
          format: 'text',
        },
      }
    );

    return response.data.data.translations[0].translatedText;
  }

  private async translateWithAI(text: string, target: Language, source: Language): Promise<string> {
    const targetName = LANGUAGE_NAMES[target] || target;
    const sourceName = LANGUAGE_NAMES[source] || source;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${sourceName} to ${targetName}. Maintain the tone, emojis, and formatting. Keep hashtags transliterated but relevant to the target language audience.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || text;
  }

  private async translateHashtags(hashtags: string[], targetLanguage: Language): Promise<string[]> {
    if (targetLanguage === 'en') return hashtags;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Translate or transliterate these hashtags to ${LANGUAGE_NAMES[targetLanguage] || targetLanguage}. Keep some popular English hashtags as-is if they're universally used. Return JSON: { "hashtags": ["#tag1", "#tag2"] }`,
          },
          { role: 'user', content: JSON.stringify(hashtags) },
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"hashtags":[]}');
      return parsed.hashtags || hashtags;
    } catch (error) {
      logger.error('Hashtag translation failed:', error);
      return hashtags;
    }
  }
}

export const translationService = new TranslationService();
