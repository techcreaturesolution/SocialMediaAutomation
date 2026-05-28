import OpenAI from 'openai';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { ContentType, Language, Platform } from '../types';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const PLATFORM_LIMITS: Record<Platform, { maxChars: number; hashtagLimit: number }> = {
  twitter: { maxChars: 280, hashtagLimit: 5 },
  facebook: { maxChars: 63206, hashtagLimit: 10 },
  instagram: { maxChars: 2200, hashtagLimit: 30 },
  linkedin: { maxChars: 3000, hashtagLimit: 10 },
  youtube: { maxChars: 5000, hashtagLimit: 15 },
};

export class AIContentService {
  async generateTextContent(params: {
    topic: string;
    contentType: ContentType;
    platforms: Platform[];
    language: Language;
    tone: string;
    companyName: string;
    companyTagline: string;
  }): Promise<{
    mainText: string;
    hashtags: string[];
    platformVariants: Record<string, { text: string; hashtags: string[] }>;
    title: string;
  }> {
    const { topic, contentType, platforms, language, tone, companyName, companyTagline } = params;

    const systemPrompt = `You are an expert social media content creator specializing in technology content.
You create engaging, trending content for multiple social media platforms.
Company: ${companyName}${companyTagline ? ` - ${companyTagline}` : ''}
Language: ${language}
Tone: ${tone}
Content Type: ${contentType}

Rules:
- Create viral, engaging content about technology
- Include relevant emojis
- Make content platform-optimized
- Include call-to-action where appropriate
- Reference the company naturally
- Use trending tech vocabulary`;

    const userPrompt = `Create a ${contentType} post about: "${topic}"

Generate:
1. A catchy title (max 100 chars)
2. Main content text optimized for social media
3. 15-20 relevant trending hashtags
4. Platform-specific variants for: ${platforms.join(', ')}

For each platform variant, respect these limits:
${platforms.map((p) => `- ${p}: max ${PLATFORM_LIMITS[p].maxChars} chars, max ${PLATFORM_LIMITS[p].hashtagLimit} hashtags`).join('\n')}

Respond in JSON format:
{
  "title": "...",
  "mainText": "...",
  "hashtags": ["#tag1", "#tag2", ...],
  "platformVariants": {
    "platform_name": {
      "text": "optimized text for this platform",
      "hashtags": ["#relevant", "#hashtags"]
    }
  }
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);

      return {
        title: parsed.title || topic,
        mainText: parsed.mainText || '',
        hashtags: parsed.hashtags || [],
        platformVariants: parsed.platformVariants || {},
      };
    } catch (error) {
      logger.error('AI content generation failed:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  async generateTrendingTopics(category: string = 'technology'): Promise<Array<{
    title: string;
    description: string;
    trendScore: number;
    suggestedHashtags: string[];
  }>> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a tech trend analyst. Generate current trending technology topics for social media content.',
          },
          {
            role: 'user',
            content: `List 10 currently trending ${category} topics perfect for social media content.
Return JSON: { "topics": [{ "title": "...", "description": "...", "trendScore": 1-100, "suggestedHashtags": ["#..."] }] }`,
          },
        ],
        temperature: 0.9,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"topics":[]}');
      return parsed.topics || [];
    } catch (error) {
      logger.error('Trending topics generation failed:', error);
      throw new Error('Failed to generate trending topics');
    }
  }

  async generateHashtags(topic: string, platform: Platform, count: number = 15): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate trending, relevant hashtags for ${platform} posts about technology.`,
          },
          {
            role: 'user',
            content: `Generate ${count} trending hashtags for a ${platform} post about: "${topic}". Return JSON: { "hashtags": ["#tag1", "#tag2"] }`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"hashtags":[]}');
      return parsed.hashtags || [];
    } catch (error) {
      logger.error('Hashtag generation failed:', error);
      return [`#${topic.replace(/\s+/g, '')}`, '#tech', '#technology', '#trending'];
    }
  }

  async generateAdContent(params: {
    topic: string;
    objective: string;
    targetAudience: string;
    companyName: string;
    platforms: Platform[];
    language: Language;
  }): Promise<{
    headline: string;
    primaryText: string;
    description: string;
    callToAction: string;
    platformVariants: Record<string, { headline: string; text: string; cta: string }>;
  }> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert digital advertising copywriter. Create compelling ad content for ${params.companyName}. Language: ${params.language}.`,
          },
          {
            role: 'user',
            content: `Create ad content for:
Topic: ${params.topic}
Objective: ${params.objective}
Target Audience: ${params.targetAudience}
Platforms: ${params.platforms.join(', ')}

Return JSON:
{
  "headline": "...",
  "primaryText": "...",
  "description": "...",
  "callToAction": "...",
  "platformVariants": {
    "platform": { "headline": "...", "text": "...", "cta": "..." }
  }
}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        headline: parsed.headline || '',
        primaryText: parsed.primaryText || '',
        description: parsed.description || '',
        callToAction: parsed.callToAction || 'Learn More',
        platformVariants: parsed.platformVariants || {},
      };
    } catch (error) {
      logger.error('Ad content generation failed:', error);
      throw new Error('Failed to generate ad content');
    }
  }
}

export const aiContentService = new AIContentService();
