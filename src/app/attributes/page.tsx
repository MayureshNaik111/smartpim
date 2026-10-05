'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Tag, Trash2, Layers, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AttributeDefinition, Product } from '@/types/product';

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);

  // New attribute form
  const [newName, setNewName] = useState('');
  const [newValues, setNewValues] = useState('');
  const [saving, setSaving] = useState(false);

  // Inline "add value" state
  const [valueInput, setValueInput] = useState<Record<string, string>>({});

  const loadData = useCallback(() => {
    return Promise.all([fetch('/api/attributes'), fetch('/api/products')])
      .then(([attrRes, prodRes]) => Promise.all([attrRes.json(), prodRes.json()]))
      .then(([attrData, prodData]) => {
        setAttributes(attrData.attributes || []);
        setProducts(prodData.products || []);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Failed to load attributes.' });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (type: Message['type'], text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          values: newValues.split(',').map(v => v.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName('');
        setNewValues('');
        showMessage('success', `Attribute "${data.attribute.name}" created.`);
        await loadData();
      } else {
        showMessage('error', data.error || 'Failed to create attribute.');
      }
    } catch {
      showMessage('error', 'Failed to create attribute.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddValue = async (attr: AttributeDefinition) => {
    const value = (valueInput[attr.id] || '').trim();
    if (!value) return;
    try {
      const res = await fetch(`/api/attributes/${attr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [...attr.values, value] }),
      });
      const data = await res.json();
      if (data.success) {
        setValueInput(prev => ({ ...prev, [attr.id]: '' }));
        showMessage('success', `Added "${value}" to ${attr.name}.`);
        await loadData();
      } else {
        showMessage('error', data.error || 'Failed to update attribute.');
      }
    } catch {
      showMessage('error', 'Failed to update attribute.');
    }
  };

  const handleDelete = async (attr: AttributeDefinition) => {
    if (!confirm(`Delete attribute "${attr.name}"? Products keep their existing values.`)) return;
    try {
      const res = await fetch(`/api/attributes/${attr.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showMessage('success', `Attribute "${attr.name}" deleted.`);
        await loadData();
      } else {
        showMessage('error', data.error || 'Failed to delete attribute.');
      }
    } catch {
      showMessage('error', 'Failed to delete attribute.');
    }
  };

  /** How many products use this attribute */
  const usageCount = (attr: AttributeDefinition): number =>
    products.filter(p => p.attributes.some(a => a.name.toLowerCase() === attr.name.toLowerCase())).length;

  /** How many products use a specific value of this attribute */
  const valueUsage = (attr: AttributeDefinition, value: string): number =>
    products.filter(p =>
      p.attributes.some(a =>
        a.name.toLowerCase() === attr.name.toLowerCase() &&
        a.values.some(v => v.toLowerCase() === value.toLowerCase())
      )
    ).length;

  /** Total value usage across all products */
  const totalValuesUsed = products.reduce(
    (sum, p) => sum + p.attributes.reduce((s, a) => s + a.values.length, 0),
    0
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Attribute Definitions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{attributes.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
            <Tag className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Products Using Attributes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {products.filter(p => p.attributes.length > 0).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Values In Use</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalValuesUsed}</p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Create attribute */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Attribute name (e.g., Weight)"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-[2]">
            <input
              value={newValues}
              onChange={e => setNewValues(e.target.value)}
              placeholder="Values, comma separated (e.g., 250g, 500g, 1kg)"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Attribute
          </button>
        </div>
      </form>

      {/* Attribute cards */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading attributes...</div>
      ) : attributes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No attribute definitions yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {attributes.map(attr => (
            <div key={attr.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-slate-900">{attr.name}</h3>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {attr.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Used by {usageCount(attr)} of {products.length} products
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(attr)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete attribute"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {attr.values.map(v => (
                  <span
                    key={v}
                    title={`${valueUsage(attr, v)} product(s) use this value`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {v}
                    <span className="text-[10px] text-blue-400">{valueUsage(attr, v)}</span>
                  </span>
                ))}
                {attr.values.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No values yet</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  value={valueInput[attr.id] || ''}
                  onChange={e => setValueInput(prev => ({ ...prev, [attr.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddValue(attr); } }}
                  placeholder="Add a value..."
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddValue(attr)}
                  disabled={!(valueInput[attr.id] || '').trim()}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
