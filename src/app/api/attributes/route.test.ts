import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, setAttributeStore } from './route';
import { PUT, DELETE } from './[id]/route';
import { mockAttributes } from '@/data/mock-products';

function jsonPost(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function jsonPut(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const idParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  setAttributeStore([...mockAttributes]);
});

describe('GET /api/attributes', () => {
  it('returns the seeded attribute definitions', async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.total).toBe(mockAttributes.length);
    expect(data.attributes.map((a: { name: string }) => a.name)).toContain('Color');
  });
});

describe('POST /api/attributes', () => {
  it('creates an attribute with a slug and de-duplicated values', async () => {
    const res = await POST(jsonPost('/api/attributes', {
      name: 'Weight',
      values: ['250g', '500g', '250g'],
    }));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.attribute.slug).toBe('weight');
    expect(data.attribute.values).toEqual(['250g', '500g']);
  });

  it('rejects an empty name', async () => {
    const res = await POST(jsonPost('/api/attributes', { name: '   ' }));
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate attribute name', async () => {
    const res = await POST(jsonPost('/api/attributes', { name: 'color' }));
    expect(res.status).toBe(409);
  });
});

describe('/api/attributes/[id]', () => {
  it('updates values', async () => {
    const res = await PUT(
      jsonPut('/api/attributes/attr_001', { values: ['Black', 'Teal'] }),
      idParams('attr_001')
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.attribute.values).toEqual(['Black', 'Teal']);
  });

  it('returns 404 for an unknown attribute', async () => {
    const res = await PUT(jsonPut('/api/attributes/nope', { values: [] }), idParams('nope'));
    expect(res.status).toBe(404);
  });

  it('deletes an attribute', async () => {
    const res = await DELETE(
      new NextRequest('http://localhost:3000/api/attributes/attr_002', { method: 'DELETE' }),
      idParams('attr_002')
    );
    expect(res.status).toBe(200);
    const after = await (await GET()).json();
    expect(after.total).toBe(mockAttributes.length - 1);
  });
});
