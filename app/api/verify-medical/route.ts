import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const REPUTABLE_MEDICAL_SOURCES = [
  'pubmed.ncbi.nlm.nih.gov',
  'mayoclinic.org',
  'who.int',
  'cdc.gov',
  'nih.gov',
  'bmj.com',
  'nejm.org',
  'thelancet.com',
  'medlineplus.gov',
  'uptodate.com',
];

export async function POST(request: NextRequest) {
  try {
    const { concept } = await request.json();

    if (!concept) {
      return NextResponse.json({ error: 'No concept provided' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `As a medical expert, verify the accuracy of this medical concept: "${concept}"

Provide:
1. Whether this is accurate medical information (true/false)
2. A brief 2-3 sentence summary of the concept
3. Any corrections or clarifications needed
4. 2-3 reputable medical sources that discuss this concept (use domains like: ${REPUTABLE_MEDICAL_SOURCES.join(', ')})

Return a JSON object:
{
  "verified": boolean,
  "summary": "explanation",
  "suggestion": "corrected version if needed, or null",
  "sources": [
    {
      "title": "Source title",
      "url": "full URL",
      "domain": "domain name"
    }
  ]
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

    const verification = JSON.parse(jsonText);

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error verifying medical concept:', error);
    return NextResponse.json(
      { error: 'Failed to verify concept' },
      { status: 500 }
    );
  }
}
