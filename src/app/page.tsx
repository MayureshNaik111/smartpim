'use client';

import { useEffect, useState } from 'react';
import { Package, CheckCircle, AlertTriangle, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types/product';
import { formatPrice, formatDate, getStatusColor, getStatusLabel, getScoreColor, getScoreBarColor, formatNumber } from '@/lib/utils/helpers';

interface DashboardData {
  products: Product[];
  total: number;
  mode: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const products = data?.products || [];
  const stats = {
    total: products.length,
    complete: products.filter(p => p.completenessScore >= 80).length,
    needsAttention: products.filter(p => p.status === 'needs_attention' || p.completenessScore < 60).length,
    aiOptimized: products.filter(p => p.source === 'ai_generated').length,
  };

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 8);

  const statCards = [
    { label: 'Total Products', value: formatNumber(stats.total), icon: Package, color: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-100' },
    { label: 'Complete Products', value: formatNumber(stats.complete), icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', borderColor: 'border-emerald-100' },
    { label: 'Needs Attention', value: formatNumber(stats.needsAttention), icon: AlertTriangle, color: 'bg-amber-50 text-amber-600', borderColor: 'border-amber-100' },
    { label: 'AI Optimized', value: formatNumber(stats.aiOptimized), icon: Sparkles, color: 'bg-violet-50 text-violet-600', borderColor: 'border-violet-100' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-white rounded-xl border ${stat.borderColor} p-5 flex items-start justify-between`}
            >
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/ai-generator"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-5 flex items-center justify-between group hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Product Agent</h3>
            </div>
            <p className="text-blue-100 text-sm mt-1">Transform rough product ideas into WooCommerce-ready data</p>
          </div>
          <ArrowRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/sync"
          className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between group hover:border-blue-200 hover:bg-blue-50/30 transition-all"
        >
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Synchronization</h3>
            </div>
            <p className="text-slate-500 text-sm mt-1">Sync your product catalog with WooCommerce</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 opacity-60 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Products</h2>
          <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Product</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">SKU</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Category</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Price</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Stock</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Completeness</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((product) => (
                <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/products/${product.id}`} className="text-sm font-medium text-slate-900 hover:text-blue-600">
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500 font-mono">{product.sku}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{product.category}</td>
                  <td className="px-5 py-3 text-sm text-slate-900 font-medium text-right">{formatPrice(product.price)}</td>
                  <td className="px-5 py-3 text-sm text-slate-500 text-right">{product.stock}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreBarColor(product.completenessScore)}`}
                          style={{ width: `${product.completenessScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getScoreColor(product.completenessScore)}`}>
                        {product.completenessScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                      {getStatusLabel(product.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">{formatDate(product.lastUpdated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
