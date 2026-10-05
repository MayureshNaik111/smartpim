'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, Edit, Eye, Filter } from 'lucide-react';
import { Product } from '@/types/product';
import { formatPrice, getStatusColor, getStatusLabel, getScoreColor, getScoreBarColor } from '@/lib/utils/helpers';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pick up a search query coming from the top bar (?search=...)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) {
      // Defer so the effect body itself performs no synchronous state update
      setTimeout(() => setSearch(q), 0);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    fetch(`/api/products?${params}`)
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, categoryFilter, statusFilter, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setRefreshKey(k => k + 1);
    } catch {
      alert('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="needs_attention">Needs Attention</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Add Product */}
          <Link
            href="/ai-generator"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No products found</p>
            <Link href="/ai-generator" className="text-blue-600 text-sm font-medium mt-2 inline-block hover:underline">
              Create your first product with AI →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">SKU</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Category</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Price</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Stock</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Completeness</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-medium shrink-0">
                          {product.name.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/products/${product.id}`} className="text-sm font-medium text-slate-900 hover:text-blue-600">
                            {product.name}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{product.shortDescription}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">{product.sku}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{product.category}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 font-medium text-right">{formatPrice(product.price)}</td>
                    <td className="px-5 py-3.5 text-sm text-right">
                      <span className={product.stock === 0 ? 'text-red-500 font-medium' : 'text-slate-500'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getScoreBarColor(product.completenessScore)}`}
                            style={{ width: `${product.completenessScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getScoreColor(product.completenessScore)}`}>
                          {product.completenessScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/products/${product.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/products/${product.id}?edit=true`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-slate-400 text-right">
        {products.length} product{products.length !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}
