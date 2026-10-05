import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, setProductStore } from './route';
import { GET as GET_BY_ID, PUT, DELETE } from './[id]/route';
import { mockProducts } from '@/data/mock-products';

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

function req(path: string, init?: NextRequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, init);
}

function post(path: string, body: unknown): NextRequest {
  return req(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const idParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  setProductStore([...mockProducts]);
});

describe('GET /api/products', () => {
  it('lists the full catalog in demo mode', async () => {
    const res = await GET(req('/api/products'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.total).toBe(mockProducts.length);
    expect(data.mode).toBe('demo');
    expect(data.products[0].name).toBeTruthy();
  });

  it('filters by search text', async () => {
    const res = await GET(req('/api/products?search=headphones'));
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
    expect(
      data.products.every((p: { name: string }) => p.name.toLowerCase().includes('headphone'))
    ).toBe(true);
  });

  it('filters by category and status', async () => {
    const byCategory = await (await GET(req('/api/products?category=Electronics'))).json();
    expect(byCategory.total).toBeGreaterThan(0);
    expect(
      byCategory.products.every((p: { category: string }) => p.category === 'Electronics')
    ).toBe(true);

    const byStatus = await (await GET(req('/api/products?status=draft'))).json();
    expect(byStatus.products.every((p: { status: string }) => p.status === 'draft')).toBe(true);
  });
});

describe('POST /api/products', () => {
  it('creates a product and calculates its completeness score', async () => {
    const res = await POST(post('/api/products', {
      name: 'Test Lamp',
      description: 'A lovely test lamp with a very descriptive product description.',
      shortDescription: 'Test lamp',
      price: 25,
      stock: 4,
      category: 'Home & Office',
      tags: ['lamp'],
    }));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.product.id).toBeTruthy();
    expect(data.product.completenessScore).toBeGreaterThan(0);
    expect(data.product.completenessScore).toBeLessThanOrEqual(100);
  });

  it('rejects malformed JSON payloads with 400', async () => {
    const res = await POST(post('/api/products', 'not-json'));
    expect(res.status).toBe(400);
  });
});

describe('/api/products/[id]', () => {
  it('returns a single product', async () => {
    const res = await GET_BY_ID(req('/api/products/prod_001'), idParams('prod_001'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.product.sku).toBe('WH-ANC-001');
  });

  it('returns 404 for an unknown product', async () => {
    const res = await GET_BY_ID(req('/api/products/nope'), idParams('nope'));
    expect(res.status).toBe(404);
  });

  it('updates a product and recalculates its score', async () => {
    const res = await PUT(
      new NextRequest('http://localhost:3000/api/products/prod_012', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoTitle: 'Stainless Steel Water Bottle | HydroCore',
          seoDescription: 'HydroCore insulated stainless steel water bottle keeps drinks cold for 24 hours.',
        }),
      }),
      idParams('prod_012')
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.product.seoTitle).toContain('HydroCore');
    // Score recalculated after SEO fields were added
    expect(data.product.completenessScore).toBe(100);
  });

  it('deletes a product', async () => {
    const res = await DELETE(req('/api/products/prod_002', { method: 'DELETE' }), idParams('prod_002'));
    expect(res.status).toBe(200);
    const after = await (await GET(req('/api/products'))).json();
    expect(after.total).toBe(mockProducts.length - 1);
  });
});
