'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Tags,
  RefreshCw,
  Settings,
  Boxes,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/ai-generator', label: 'AI Product Agent', icon: Sparkles },
  { href: '/attributes', label: 'Attributes', icon: Tags },
  { href: '/sync', label: 'Synchronization', icon: RefreshCw },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-slate-900">SmartPIM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
              {item.href === '/ai-generator' && (
                <span className="ml-auto text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom settings */}
      <div className="p-3 border-t border-slate-200">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
