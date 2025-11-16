import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { concept } = await request.json();

    if (!concept) {
      return NextResponse.json({ error: 'No concept provided' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Given this medical concept: "${concept}"

Provide an improved, medically accurate version of this concept. Make it:
- Precise and using proper medical terminology
- Clear and concise (2-5 words)
- Accurate based on current medical knowledge

Return a JSON object:
{
  "suggestion": "improved concept name"
}

Return ONLY the JSON object.`,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const result = JSON.parse(jsonText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error regenerating concept:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate concept' },
      { status: 500 }
    );
  }
}
