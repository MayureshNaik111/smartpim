import { describe, it, expect } from 'vitest';
import { toWooCommerceProduct, fromWooCommerceProduct } from './transform';
import { mockProducts } from '@/data/mock-products';

describe('toWooCommerceProduct', () => {
  const wc = toWooCommerceProduct(mockProducts[0]);

  it('maps core fields', () => {
    expect(wc.name).toBe(mockProducts[0].name);
    expect(wc.sku).toBe(mockProducts[0].sku);
    expect(wc.short_description).toBe(mockProducts[0].shortDescription);
    expect(wc.regular_price).toBe(mockProducts[0].price.toString());
    expect(wc.categories[0].name).toBe(mockProducts[0].category);
    expect(wc.tags.map(t => t.name)).toEqual(mockProducts[0].tags);
  });

  it('maps status, stock and attributes', () => {
    expect(wc.status).toBe('publish');
    expect(wc.stock_quantity).toBe(mockProducts[0].stock);
    expect(wc.stock_status).toBe('instock');
    expect(wc.attributes.map(a => a.name)).toEqual(
      mockProducts[0].attributes.map(a => a.name)
    );
    expect(wc.attributes[0].options).toEqual(mockProducts[0].attributes[0].values);
  });

  it('stores SEO and score in meta data', () => {
    expect(wc.meta_data?.find(m => m.key === '_seo_title')?.value).toBe(mockProducts[0].seoTitle);
    expect(wc.meta_data?.find(m => m.key === '_completeness_score')?.value).toBe(
      mockProducts[0].completenessScore.toString()
    );
  });

  it('maps draft status to the WooCommerce draft status', () => {
    const draft = toWooCommerceProduct(mockProducts[10]); // Yoga Mat Premium (draft)
    expect(draft.status).toBe('draft');
  });
});

describe('fromWooCommerceProduct', () => {
  const product = fromWooCommerceProduct(toWooCommerceProduct(mockProducts[0]));

  it('maps back to the local product shape', () => {
    expect(product.name).toBe(mockProducts[0].name);
    expect(product.sku).toBe(mockProducts[0].sku);
    expect(product.price).toBe(mockProducts[0].price);
    expect(product.category).toBe(mockProducts[0].category);
    expect(product.tags).toEqual(mockProducts[0].tags);
    expect(product.source).toBe('woocommerce');
    expect(product.status).toBe('active');
  });

  it('preserves attributes and SEO metadata', () => {
    expect(product.attributes).toEqual(mockProducts[0].attributes);
    expect(product.seoTitle).toBe(mockProducts[0].seoTitle);
    expect(product.seoDescription).toBe(mockProducts[0].seoDescription);
    expect(product.completenessScore).toBe(mockProducts[0].completenessScore);
  });

  it('handles sparse WooCommerce payloads without throwing', () => {
    const sparse = fromWooCommerceProduct({
      id: 99,
      name: 'Sparse',
      status: 'draft',
      description: '',
      short_description: '',
      sku: 'SP-1',
      price: '',
      regular_price: '',
      stock_quantity: null,
      stock_status: 'outofstock',
      categories: [],
      tags: [],
      attributes: [],
    });
    expect(sparse.price).toBe(0);
    expect(sparse.stock).toBe(0);
    expect(sparse.category).toBe('Uncategorized');
    expect(sparse.tags).toEqual([]);
    expect(sparse.status).toBe('draft');
  });
});
