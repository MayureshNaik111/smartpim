import { Product, DashboardStats } from '@/types/product';

/** Generate a unique product ID */
export function generateId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/** Generate a SKU from product name */
export function generateSku(name: string): string {
  const parts = name.split(' ').slice(0, 3).map(w => w.substring(0, 3).toUpperCase());
  const num = Math.floor(Math.random() * 900) + 100;
  return `${parts.join('-')}-${num}`;
}

/** Format a price for display */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/** Format a date for display */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/** Format a date to "Today, 2:14 PM" style */
export function formatSyncDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return isToday ? `Today, ${time}` : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

/** Compute dashboard statistics from products */
export function computeDashboardStats(products: Product[]): DashboardStats {
  return {
    totalProducts: products.length,
    completeProducts: products.filter(p => p.completenessScore >= 80).length,
    needsAttention: products.filter(p => p.status === 'needs_attention' || p.completenessScore < 60).length,
    aiOptimized: products.filter(p => p.source === 'ai_generated').length,
  };
}

/** Get status badge color classes */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'draft': return 'bg-slate-50 text-slate-700 border-slate-200';
    case 'needs_attention': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'out_of_stock': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

/** Get status display label */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'draft': return 'Draft';
    case 'needs_attention': return 'Needs Attention';
    case 'out_of_stock': return 'Out of Stock';
    default: return status;
  }
}

/** Get completeness score color */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

/** Get completeness score bar color */
export function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Check if WooCommerce is configured */
export function isWooCommerceConfigured(): boolean {
  return !!(
    process.env.WOOCOMMERCE_URL &&
    process.env.WOOCOMMERCE_CONSUMER_KEY &&
    process.env.WOOCOMMERCE_CONSUMER_SECRET
  );
}

/** Check if AI is configured */
export function isAIConfigured(): boolean {
  return !!process.env.AI_API_KEY;
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/** Format number with commas */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/** Delay helper for simulating async operations */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
