import { Product } from '@/types/product';
import * as client from './client';
import { toWooCommerceProduct, fromWooCommerceProduct } from './transform';

/**
 * WooCommerce Service Layer
 *
 * Business logic layer that abstracts WooCommerce operations.
 * Handles both live and demo mode transparently.
 */

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

/** Check if WooCommerce is connected */
export function isConnected(): boolean {
  return client.isConfigured();
}

/** Get all products from WooCommerce */
export async function fetchProducts(): Promise<Product[]> {
  if (!client.isConfigured()) {
    throw new Error('WooCommerce is not configured');
  }

  const wcProducts = await client.getProducts();
  return wcProducts.map(fromWooCommerceProduct);
}

/** Push a single product to WooCommerce */
export async function pushProduct(product: Product): Promise<Product> {
  if (!client.isConfigured()) {
    throw new Error('WooCommerce is not configured');
  }

  const wcProduct = toWooCommerceProduct(product);

  if (product.wooCommerceId) {
    const updated = await client.updateProduct(product.wooCommerceId, wcProduct);
    return fromWooCommerceProduct(updated);
  } else {
    const created = await client.createProduct(wcProduct);
    return { ...product, wooCommerceId: created.id };
  }
}

/** Sync multiple products to WooCommerce */
export async function syncProducts(products: Product[]): Promise<SyncResult> {
  if (!client.isConfigured()) {
    throw new Error('WooCommerce is not configured');
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      await pushProduct(product);
      synced++;
    } catch (error) {
      failed++;
      errors.push(`Failed to sync "${product.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: failed === 0,
    synced,
    failed,
    errors,
  };
}

/** Delete a product from WooCommerce */
export async function removeProduct(wooCommerceId: number): Promise<void> {
  if (!client.isConfigured()) {
    throw new Error('WooCommerce is not configured');
  }

  await client.deleteProduct(wooCommerceId);
}
