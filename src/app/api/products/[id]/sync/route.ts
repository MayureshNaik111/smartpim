import { NextRequest, NextResponse } from 'next/server';
import { getProductStore, setProductStore } from '../../route';
import * as wooService from '@/lib/woocommerce/service';

/**
 * POST /api/products/[id]/sync — Synchronize a single product with WooCommerce.
 * Falls back to Demo Mode when no credentials are configured.
 */
export async function POST(
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

    const product = products[index];

    // Demo Mode: no WooCommerce credentials configured
    if (!wooService.isConnected()) {
      return NextResponse.json({
        success: true,
        mode: 'demo',
        connected: false,
        message: `Demo sync: "${product.name}" validated and queued. Configure WooCommerce credentials for live sync.`,
        product,
      });
    }

    // Live Mode: push the product through the WooCommerce service layer
    const synced = await wooService.pushProduct(product);
    products[index] = synced;
    setProductStore(products);

    return NextResponse.json({
      success: true,
      mode: 'live',
      connected: true,
      message: `"${product.name}" synchronized with WooCommerce.`,
      product: synced,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Product synchronization failed',
      },
      { status: 500 }
    );
  }
}
