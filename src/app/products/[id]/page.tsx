'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, RefreshCw, Tag, Info, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types/product';
import { formatPrice, getStatusColor, getStatusLabel, getScoreColor, getScoreBarColor } from '@/lib/utils/helpers';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(isEditMode);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.product) {
          setProduct(data.product);
          setFormData(data.product);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        setFormData(data.product);
        setEditing(false);
        setMessage({ type: 'success', text: 'Product updated successfully.' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save product.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.product) {
          setProduct(data.product);
          setFormData(data.product);
        }
        setMessage({ type: 'success', text: data.message || 'Product synchronized successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to synchronize product.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to synchronize product.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-white rounded-lg w-48" />
        <div className="h-96 bg-white rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Product not found</p>
        <Link href="/products" className="text-blue-600 text-sm mt-2 inline-block">← Back to Products</Link>
      </div>
    );
  }

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
            <p className="text-sm text-slate-400">{product.sku}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setFormData(product); }}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <FileText className="w-4 h-4" />
                Edit Product
              </button>
              <Link
                href={`/ai-generator?optimize=${product.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                <Sparkles className="w-4 h-4" />
                Optimize with AI
              </Link>
              <button
                onClick={handleSync}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Sync to WooCommerce
              </button>
            </>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Main Info */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Info className="w-4 h-4 text-slate-400" />
              Product Information
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Product Name</label>
                {editing ? (
                  <input value={formData.name || ''} onChange={e => updateField('name', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="text-sm text-slate-900">{product.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>
                {editing ? (
                  <input value={formData.sku || ''} onChange={e => updateField('sku', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="text-sm text-slate-900 font-mono">{product.sku}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              {editing ? (
                <textarea value={formData.description || ''} onChange={e => updateField('description', e.target.value)}
                  rows={4} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Short Description</label>
              {editing ? (
                <textarea value={formData.shortDescription || ''} onChange={e => updateField('shortDescription', e.target.value)}
                  rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-sm text-slate-700">{product.shortDescription}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                {editing ? (
                  <input type="number" step="0.01" value={formData.price || 0} onChange={e => updateField('price', parseFloat(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="text-sm text-slate-900 font-medium">{formatPrice(product.price)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Stock</label>
                {editing ? (
                  <input type="number" value={formData.stock ?? 0} onChange={e => updateField('stock', parseInt(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="text-sm text-slate-900">{product.stock}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                {editing ? (
                  <input value={formData.category || ''} onChange={e => updateField('category', e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="text-sm text-slate-900">{product.category}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Tag className="w-4 h-4 text-slate-400" />
              Attributes
            </div>
            <div className="grid grid-cols-2 gap-4">
              {product.attributes.map((attr) => (
                <div key={attr.name}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{attr.name}</label>
                  <div className="flex flex-wrap gap-1">
                    {attr.values.map(v => (
                      <span key={v} className="px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-100">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              SEO
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">SEO Title</label>
              {editing ? (
                <input value={formData.seoTitle || ''} onChange={e => updateField('seoTitle', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-sm text-slate-900">{product.seoTitle || <span className="text-slate-400 italic">Not set</span>}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">SEO Description</label>
              {editing ? (
                <textarea value={formData.seoDescription || ''} onChange={e => updateField('seoDescription', e.target.value)}
                  rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-sm text-slate-700">{product.seoDescription || <span className="text-slate-400 italic">Not set</span>}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-slate-700">Status</h3>
            {editing ? (
              <select value={formData.status || 'draft'} onChange={e => updateField('status', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                {getStatusLabel(product.status)}
              </span>
            )}
          </div>

          {/* Completeness Score */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-slate-700">Completeness Score</h3>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(product.completenessScore)}`}>
                {product.completenessScore}
              </div>
              <div className="text-sm text-slate-400 mt-1">out of 100</div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(product.completenessScore)}`}
                  style={{ width: `${product.completenessScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <h3 className="text-sm font-medium text-slate-700">Source</h3>
            <p className="text-sm text-slate-500 capitalize">{product.source.replace('_', ' ')}</p>
            <h3 className="text-sm font-medium text-slate-700 mt-3">Last Updated</h3>
            <p className="text-sm text-slate-500">{new Date(product.lastUpdated).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
