import { NextRequest, NextResponse } from 'next/server';
import { mockAttributes } from '@/data/mock-products';
import { AttributeDefinition } from '@/types/product';

/**
 * In-memory attribute definition store for demo mode.
 * In production, this would be a database.
 */
let attributes: AttributeDefinition[] = [...mockAttributes];

/** Get the attribute store (exported for use by other routes) */
export function getAttributeStore(): AttributeDefinition[] {
  return attributes;
}

/** Set the attribute store */
export function setAttributeStore(newAttributes: AttributeDefinition[]): void {
  attributes = newAttributes;
}

/** Convert a name to a URL-friendly slug */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** GET /api/attributes — List all attribute definitions */
export async function GET() {
  try {
    return NextResponse.json({
      attributes,
      total: attributes.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch attributes' },
      { status: 500 }
    );
  }
}

/** POST /api/attributes — Create a new attribute definition */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Attribute name is required' }, { status: 400 });
    }

    if (attributes.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json(
        { error: `Attribute "${name}" already exists` },
        { status: 409 }
      );
    }

    const values: string[] = Array.isArray(body.values)
      ? (body.values as unknown[]).map(v => String(v).trim()).filter(Boolean)
      : [];

    const newAttribute: AttributeDefinition = {
      id: `attr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      slug: slugify(name),
      values: [...new Set(values)],
    };

    attributes.push(newAttribute);

    return NextResponse.json({ attribute: newAttribute, success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create attribute' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
