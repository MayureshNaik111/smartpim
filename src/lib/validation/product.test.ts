import { describe, it, expect } from 'vitest';
import { calculateCompletenessScore, validateProduct } from './product';
import { mockProducts } from '@/data/mock-products';

describe('calculateCompletenessScore', () => {
  it('returns 0 for an empty product', () => {
    expect(calculateCompletenessScore({})).toBe(0);
  });

  it('returns 100 for a fully populated product', () => {
    expect(
      calculateCompletenessScore({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A sufficiently long product description for scoring purposes.',
        shortDescription: 'Short description',
        price: 10,
        stock: 5,
        category: 'Electronics',
        tags: ['tag'],
        attributes: [{ name: 'Color', values: ['Black'] }],
        seoTitle: 'SEO title for test product',
        seoDescription: 'SEO description that is definitely longer than 20 characters.',
      })
    ).toBe(100);
  });

  it('deducts weight for missing SEO fields', () => {
    const score = calculateCompletenessScore({
      name: 'Test Product',
      sku: 'TEST-001',
      description: 'A sufficiently long product description for scoring purposes.',
      shortDescription: 'Short description',
      price: 10,
      stock: 5,
      category: 'Electronics',
      tags: ['tag'],
      attributes: [{ name: 'Color', values: ['Black'] }],
      seoTitle: '',
      seoDescription: '',
    });
    expect(score).toBe(85); // 100 - 8 (seoTitle) - 7 (seoDescription)
  });

  it('returns a value between 0 and 100 for every mock product', () => {
    for (const product of mockProducts) {
      const score = calculateCompletenessScore(product);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe('validateProduct', () => {
  const complete = {
    name: 'Wireless Headphones',
    sku: 'WH-001',
    description: 'A very complete product description with plenty of useful detail for shoppers.',
    shortDescription: 'Complete product',
    price: 99.99,
    stock: 10,
    category: 'Electronics',
    tags: ['headphones'],
    attributes: [{ name: 'Color', values: ['Black'] }],
    seoTitle: 'Wireless Headphones - Great Sound',
    seoDescription: 'Buy wireless headphones with great sound quality, long battery life and comfort.',
  };

  it('marks a complete product as valid', () => {
    const result = validateProduct(complete);
    expect(result.valid).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('reports missing required fields', () => {
    const result = validateProduct({ name: '', description: '', price: 0 });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('Product name is required');
    expect(result.missingFields).toContain('Product description is required');
    expect(result.missingFields).toContain('Valid price is required');
  });

  it('warns about over-long SEO title', () => {
    const result = validateProduct({ ...complete, seoTitle: 'x'.repeat(61) });
    expect(result.warnings.some(w => w.includes('SEO title exceeds 60 characters'))).toBe(true);
  });

  it('recommends tags and SKU when absent', () => {
    const result = validateProduct({ ...complete, tags: [], sku: '' });
    expect(result.recommendations.some(r => r.includes('tags'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('SKU'))).toBe(true);
  });
});
