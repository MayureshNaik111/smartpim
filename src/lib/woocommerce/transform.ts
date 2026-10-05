import { Product, WooCommerceProduct } from '@/types/product';
import { generateId } from '@/lib/utils/helpers';

/**
 * Transform local Product to WooCommerce product format
 */
export function toWooCommerceProduct(product: Product): WooCommerceProduct {
  return {
    name: product.name,
    status: product.status === 'active' ? 'publish' : 'draft',
    description: product.description,
    short_description: product.shortDescription,
    sku: product.sku,
    price: product.price.toString(),
    regular_price: product.price.toString(),
    sale_price: product.salePrice?.toString() || '',
    stock_quantity: product.stock,
    stock_status: product.stock > 0 ? 'instock' : 'outofstock',
    categories: [{ name: product.category }],
    tags: product.tags.map(tag => ({ name: tag })),
    attributes: product.attributes.map(attr => ({
      name: attr.name,
      options: attr.values,
      visible: true,
      variation: false,
    })),
    meta_data: [
      { key: '_seo_title', value: product.seoTitle },
      { key: '_seo_description', value: product.seoDescription },
      { key: '_completeness_score', value: product.completenessScore.toString() },
    ],
  };
}

/**
 * Transform WooCommerce product to local Product format
 */
export function fromWooCommerceProduct(wc: WooCommerceProduct): Product {
  const seoTitle = wc.meta_data?.find(m => m.key === '_seo_title')?.value || '';
  const seoDesc = wc.meta_data?.find(m => m.key === '_seo_description')?.value || '';
  const score = parseInt(wc.meta_data?.find(m => m.key === '_completeness_score')?.value || '0', 10);

  return {
    id: generateId(),
    name: wc.name,
    sku: wc.sku,
    description: wc.description,
    shortDescription: wc.short_description,
    price: parseFloat(wc.price) || 0,
    stock: wc.stock_quantity ?? 0,
    category: wc.categories?.[0]?.name || 'Uncategorized',
    tags: wc.tags?.map(t => t.name) || [],
    status: wc.status === 'publish' ? 'active' : 'draft',
    attributes: wc.attributes?.map(a => ({
      name: a.name,
      values: a.options,
    })) || [],
    seoTitle,
    seoDescription: seoDesc,
    completenessScore: score || 50,
    lastUpdated: new Date().toISOString(),
    source: 'woocommerce',
    wooCommerceId: wc.id,
  };
}
