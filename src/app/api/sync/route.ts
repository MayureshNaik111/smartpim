import { NextResponse } from 'next/server';
import { getProductStore } from '../products/route';
import * as wooService from '@/lib/woocommerce/service';

/** POST /api/sync — Sync products with WooCommerce */
export async function POST() {
  try {
    const isConnected = wooService.isConnected();
    const products = getProductStore();

    if (!isConnected) {
      // Demo mode: simulate a sync, reporting issues found in the real catalog
      const totalProducts = products.length;
      const issues = products.flatMap(p => {
        if (p.status === 'draft') {
          return [`Product "${p.name}" — draft status, skipped`];
        }
        if (!p.seoTitle || !p.seoDescription) {
          return [`Product "${p.name}" — incomplete SEO data`];
        }
        return [];
      });
      const failed = issues.length;
      const successful = totalProducts - failed;

      return NextResponse.json({
        success: true,
        mode: 'demo',
        connected: false,
        lastSync: new Date().toISOString(),
        productsSynced: totalProducts,
        successful,
        failed,
        errors: issues,
        message: 'Demo sync completed. Configure WooCommerce credentials for live sync.',
      });
    }

    // Live mode: actually sync with WooCommerce
    const result = await wooService.syncProducts(products);

    return NextResponse.json({
      success: result.success,
      mode: 'live',
      connected: true,
      lastSync: new Date().toISOString(),
      productsSynced: result.synced + result.failed,
      successful: result.synced,
      failed: result.failed,
      errors: result.errors,
      message: result.success
        ? 'All products synchronized successfully.'
        : `Sync completed with ${result.failed} error(s).`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Synchronization failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
