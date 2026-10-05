import { NextRequest, NextResponse } from 'next/server';
import { validateProduct } from '@/lib/validation/product';

/** POST /api/validate-product — Validate product data */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = validateProduct(body);

    return NextResponse.json({
      ...result,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
