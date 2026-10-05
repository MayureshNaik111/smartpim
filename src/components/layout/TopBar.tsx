'use client';

import { usePathname } from 'next/navigation';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/ai-generator': 'AI Product Agent',
  '/attributes': 'Product Attributes',
  '/sync': 'Synchronization',
};

export default function TopBar() {
  const pathname = usePathname();
  const [isDemo, setIsDemo] = useState(true);
  const [query, setQuery] = useState('');

  // Determine page title
  const basePathname = '/' + (pathname.split('/')[1] || '');
  const title = pageTitles[basePathname] || 'SmartPIM';

  useEffect(() => {
    // Check if WooCommerce is connected by checking the products API
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setIsDemo(data.mode === 'demo'))
      .catch(() => setIsDemo(true));
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            const q = query.trim();
            // Full navigation so the catalog always picks up the query,
            // even when the user is already on /products.
            window.location.assign(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        {/* Connection status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          isDemo
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {isDemo ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              Demo Mode
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" />
              WooCommerce Connected
            </>
          )}
        </div>
      </div>
    </header>
  );
}
