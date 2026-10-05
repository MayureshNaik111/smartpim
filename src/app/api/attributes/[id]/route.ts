import { NextRequest, NextResponse } from 'next/server';
import { getAttributeStore, setAttributeStore } from '../route';
import { AttributeDefinition } from '@/types/product';

/** PUT /api/attributes/[id] — Update an attribute definition */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const attributes = getAttributeStore();
    const index = attributes.findIndex(a => a.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    const updated: AttributeDefinition = { ...attributes[index] };

    if (typeof body.name === 'string' && body.name.trim()) {
      updated.name = body.name.trim();
    }

    if (Array.isArray(body.values)) {
      const values: string[] = (body.values as unknown[])
        .map(v => String(v).trim())
        .filter(Boolean);
      updated.values = [...new Set(values)];
    }

    attributes[index] = updated;
    setAttributeStore(attributes);

    return NextResponse.json({ attribute: updated, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update attribute' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}

/** DELETE /api/attributes/[id] — Delete an attribute definition */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attributes = getAttributeStore();
    const index = attributes.findIndex(a => a.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    const deleted = attributes.splice(index, 1)[0];
    setAttributeStore(attributes);

    return NextResponse.json({ attribute: deleted, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete attribute' },
      { status: 500 }
    );
  }
}
