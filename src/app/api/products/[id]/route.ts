import { NextRequest, NextResponse } from 'next/server';
import { getProductStore, setProductStore } from '../route';
import { calculateCompletenessScore } from '@/lib/validation/product';

/** GET /api/products/[id] — Get a single product */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const products = getProductStore();
    const product = products.find(p => p.id === id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/** PUT /api/products/[id] — Update a product */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const products = getProductStore();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = {
      ...products[index],
      ...body,
      id, // Prevent ID change
      lastUpdated: new Date().toISOString(),
    };

    // Recalculate completeness score
    updatedProduct.completenessScore = calculateCompletenessScore(updatedProduct);

    products[index] = updatedProduct;
    setProductStore(products);

    return NextResponse.json({ product: updatedProduct, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}

/** DELETE /api/products/[id] — Delete a product */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const products = getProductStore();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const deleted = products.splice(index, 1)[0];
    setProductStore(products);

    return NextResponse.json({ product: deleted, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}
