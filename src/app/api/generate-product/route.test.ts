import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generate } from './route';
import { POST as validate } from '@/app/api/validate-product/route';

const TEST_INPUT =
  'Premium black wireless headphones with active noise cancellation, Bluetooth 5.3 and 40-hour battery life.';

function jsonPost(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/generate-product', () => {
  it('runs the full agent pipeline on rough input', async () => {
    const res = await generate(jsonPost('/api/generate-product', { productIdea: TEST_INPUT }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.mode).toBe('demo');
    expect(data.steps).toHaveLength(6);
    expect(data.steps.every((s: { status: string }) => s.status === 'completed')).toBe(true);

    // Structured product data
    expect(data.product.title).toBeTruthy();
    expect(data.product.description.length).toBeGreaterThan(100);
    expect(data.product.category).toBe('Electronics');
    expect(data.product.tags.length).toBeGreaterThan(2);
    expect(data.product.attributes.length).toBeGreaterThan(0);
    expect(data.product.seoTitle).toBeTruthy();
    expect(data.product.seoDescription).toBeTruthy();
    expect(data.product.completenessScore).toBeGreaterThan(0);
    expect(data.product.completenessScore).toBeLessThanOrEqual(100);

    // Analysis, recommendations and validation
    expect(data.analysis.missingInformation.length).toBeGreaterThan(0);
    expect(data.product.recommendations.length).toBeGreaterThan(0);
    expect(data.validation.valid).toBe(true);
    expect(data.validation.score).toBeGreaterThan(0);
  });

  it('rejects an empty product idea', async () => {
    const res = await generate(jsonPost('/api/generate-product', { productIdea: '   ' }));
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON', async () => {
    const res = await generate(jsonPost('/api/generate-product', 'not-json'));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/validate-product', () => {
  it('validates a complete product payload', async () => {
    const res = await validate(jsonPost('/api/validate-product', {
      name: 'Wireless Headphones',
      description: 'A very complete product description with plenty of useful detail for shoppers.',
      shortDescription: 'Complete product',
      price: 99.99,
      stock: 10,
      category: 'Electronics',
      tags: ['headphones'],
      attributes: [{ name: 'Color', values: ['Black'] }],
      seoTitle: 'Wireless Headphones - Great Sound',
      seoDescription: 'Buy wireless headphones with great sound quality, long battery life and comfort.',
    }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.valid).toBe(true);
    expect(data.missingFields).toEqual([]);
  });

  it('reports missing required fields', async () => {
    const res = await validate(jsonPost('/api/validate-product', { name: '', price: -1 }));
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.missingFields.length).toBeGreaterThan(0);
  });
});
