import { WooCommerceProduct } from '@/types/product';

/**
 * WooCommerce REST API v3 Client
 *
 * Handles HTTP communication with the WooCommerce REST API.
 * All credentials are server-side only (used in API routes).
 */

interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

function getConfig(): WooCommerceConfig | null {
  const url = process.env.WOOCOMMERCE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!url || !consumerKey || !consumerSecret) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ''),
    consumerKey,
    consumerSecret,
  };
}

/** Check if WooCommerce is configured */
export function isConfigured(): boolean {
  return getConfig() !== null;
}

/** Build authorization header */
function getAuthHeader(config: WooCommerceConfig): string {
  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

/** Make an authenticated request to WooCommerce API */
async function wcFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();
  if (!config) {
    throw new Error('WooCommerce is not configured');
  }

  const url = `${config.url}/wp-json/wc/v3${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(config),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WooCommerce API error (${response.status}): ${error}`);
  }

  return response.json();
}

/** List all products */
export async function getProducts(page: number = 1, perPage: number = 100): Promise<WooCommerceProduct[]> {
  return wcFetch<WooCommerceProduct[]>(`/products?page=${page}&per_page=${perPage}`);
}

/** Get a single product */
export async function getProduct(id: number): Promise<WooCommerceProduct> {
  return wcFetch<WooCommerceProduct>(`/products/${id}`);
}

/** Create a new product */
export async function createProduct(product: WooCommerceProduct): Promise<WooCommerceProduct> {
  return wcFetch<WooCommerceProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

/** Update an existing product */
export async function updateProduct(id: number, product: Partial<WooCommerceProduct>): Promise<WooCommerceProduct> {
  return wcFetch<WooCommerceProduct>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

/** Delete a product */
export async function deleteProduct(id: number): Promise<WooCommerceProduct> {
  return wcFetch<WooCommerceProduct>(`/products/${id}?force=true`, {
    method: 'DELETE',
  });
}
