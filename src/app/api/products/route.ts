import { NextRequest, NextResponse } from 'next/server';
import { mockProducts } from '@/data/mock-products';
import { Product } from '@/types/product';
import { generateId, generateSku } from '@/lib/utils/helpers';
import { calculateCompletenessScore } from '@/lib/validation/product';
import * as wooService from '@/lib/woocommerce/service';

/**
 * In-memory product store for demo mode.
 * In production, this would be a database.
 */
let products: Product[] = [...mockProducts];

/** Get the product store (exported for use by other routes) */
export function getProductStore(): Product[] {
  return products;
}

/** Set the product store */
export function setProductStore(newProducts: Product[]): void {
  products = newProducts;
}

/** GET /api/products — List all products */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'lastUpdated';
    const order = searchParams.get('order') || 'desc';

    let filtered = [...products];

    // Search filter
    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    // Status filter
    if (status && status !== 'all') {
      filtered = filtered.filter(p => p.status === status);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sort as keyof Product];
      const bVal = b[sort as keyof Product];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return NextResponse.json({
      products: filtered,
      total: filtered.length,
      mode: wooService.isConnected() ? 'live' : 'demo',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/** POST /api/products — Create a new product */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newProduct: Product = {
      id: generateId(),
      name: body.name || 'Untitled Product',
      sku: body.sku || generateSku(body.name || 'Product'),
      description: body.description || '',
      shortDescription: body.shortDescription || '',
      price: body.price || 0,
      salePrice: body.salePrice,
      stock: body.stock ?? 0,
      category: body.category || 'Uncategorized',
      tags: body.tags || [],
      status: body.status || 'draft',
      attributes: body.attributes || [],
      seoTitle: body.seoTitle || '',
      seoDescription: body.seoDescription || '',
      completenessScore: 0,
      lastUpdated: new Date().toISOString(),
      source: body.source || 'manual',
    };

    // Calculate completeness score
    newProduct.completenessScore = calculateCompletenessScore(newProduct);

    products.push(newProduct);

    return NextResponse.json({ product: newProduct, success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
