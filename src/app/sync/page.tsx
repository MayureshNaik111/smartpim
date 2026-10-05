'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2,
  Package, ArrowRight, UploadCloud, Link2, ShieldCheck,
} from 'lucide-react';
import { Product } from '@/types/product';
import { formatSyncDate, formatNumber } from '@/lib/utils/helpers';

interface SyncResponse {
  success: boolean;
  mode: 'demo' | 'live';
  connected: boolean;
  lastSync: string | null;
  productsSynced: number;
  successful: number;
  failed: number;
  errors: string[];
  message: string;
  error?: string;
}

type StepStatus = 'pending' | 'running' | 'completed' | 'error';

const syncSteps = [
  { id: 'connect', label: 'Connect', icon: Link2, description: 'Checking WooCommerce connection' },
  { id: 'fetch', label: 'Fetch Catalog', icon: Package, description: 'Loading local products' },
  { id: 'map', label: 'Map Fields', icon: ShieldCheck, description: 'Transforming product data' },
  { id: 'push', label: 'Push', icon: UploadCloud, description: 'Synchronizing with WooCommerce' },
];

export default function SyncPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [steps, setSteps] = useState<StepStatus[]>(syncSteps.map(() => 'pending'));
  const [result, setResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setIsConnected(data.mode === 'live');
      })
      .catch(() => setError('Failed to load product catalog.'))
      .finally(() => {
        setLoading(false);
        try {
          setLastSync(localStorage.getItem('smartpim:lastSync'));
        } catch {
          // localStorage unavailable — non-fatal
        }
      });
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setResult(null);
    setSteps(syncSteps.map(() => 'pending'));

    try {
      for (let i = 0; i < syncSteps.length; i++) {
        setSteps(prev => prev.map((s, idx) => (idx === i ? 'running' : s)));
        await new Promise(r => setTimeout(r, 350 + Math.random() * 350));
        setSteps(prev => prev.map((s, idx) => (idx === i ? 'completed' : s)));
      }

      const res = await fetch('/api/sync', { method: 'POST' });
      const data: SyncResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Synchronization failed');
      }

      setResult(data);
      setLastSync(data.lastSync);
      try {
        localStorage.setItem('smartpim:lastSync', data.lastSync || '');
      } catch {
        // ignore storage failures
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synchronization failed.');
      setSteps(prev => prev.map(s => (s === 'running' ? 'error' : s)));
    } finally {
      setSyncing(false);
    }
  }, []);

  const readyProducts = products.filter(p => p.status === 'active').length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-3">
          <RefreshCw className="w-3.5 h-3.5" />
          WooCommerce Integration
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Synchronization</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Keep your SmartPIM catalog in sync with your WooCommerce store.
        </p>
      </div>

      {/* Connection status + summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 font-medium">Connection</p>
          <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'WooCommerce Connected' : 'Demo Mode'}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {isConnected
              ? 'Live REST API credentials detected.'
              : 'No WooCommerce credentials — sync is simulated.'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 font-medium">Catalog</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {loading ? '—' : formatNumber(products.length)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {loading ? 'Loading…' : `${readyProducts} active / ${products.length - readyProducts} inactive`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 font-medium">Last Synchronization</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 text-base pt-1">
            {formatSyncDate(lastSync)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Stored in this browser session</p>
        </div>
      </div>

      {/* Sync steps */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-700">Synchronization Workflow</h3>
          <button
            onClick={runSync}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Syncing...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />Run Synchronization</>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {syncSteps.map((step, i) => {
            const Icon = step.icon;
            const status = steps[i];
            return (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium flex-1 ${
                  status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                  status === 'running' ? 'bg-blue-50 text-blue-700' :
                  status === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  {status === 'running' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : status === 'completed' ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  {step.label}
                </div>
                {i < syncSteps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-medium text-slate-700">Synchronization Complete</h3>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
              result.mode === 'live'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {result.mode} mode
            </span>
          </div>

          <p className="text-sm text-slate-600">{result.message}</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-slate-900">{result.productsSynced}</p>
              <p className="text-xs text-slate-500 mt-0.5">Products Processed</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-emerald-700">{result.successful}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Successful</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-red-700">{result.failed}</p>
              <p className="text-xs text-red-600 mt-0.5">Failed / Skipped</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Issues
              </h4>
              <ul className="space-y-1.5">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Integration info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-medium text-slate-700 mb-3">WooCommerce Integration</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">REST endpoint</span>
              <span className="font-mono text-xs text-slate-700">/wp-json/wc/v3/products</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Authentication</span>
              <span className="text-slate-700">Consumer key / secret (Basic)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Credentials source</span>
              <span className="text-slate-700">Server-side env variables</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 leading-relaxed">
            Set <span className="font-mono text-slate-700">WOOCOMMERCE_URL</span>,{' '}
            <span className="font-mono text-slate-700">WOOCOMMERCE_CONSUMER_KEY</span> and{' '}
            <span className="font-mono text-slate-700">WOOCOMMERCE_CONSUMER_SECRET</span> to switch
            from Demo Mode to live synchronization. Without credentials everything runs in
            Demo Mode — no store required.
          </div>
        </div>
      </div>
    </div>
  );
}
