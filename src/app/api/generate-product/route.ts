import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/ai/agent';

/** POST /api/generate-product — Run AI agent pipeline */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.productIdea || body.productIdea.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product description is required' },
        { status: 400 }
      );
    }

    const useAI = !!process.env.AI_API_KEY;

    const result = await runAgentPipeline(
      {
        productIdea: body.productIdea,
        targetAudience: body.targetAudience,
        category: body.category,
        tone: body.tone,
      },
      useAI
    );

    return NextResponse.json({
      ...result,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI generation failed. Please try again.' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
