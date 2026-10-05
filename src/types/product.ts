/** Core product attribute with name and value */
export interface ProductAttribute {
  name: string;
  values: string[];
}

/** Product status options */
export type ProductStatus = 'active' | 'draft' | 'needs_attention' | 'out_of_stock';

/** Product source — where the product originated */
export type ProductSource = 'manual' | 'ai_generated' | 'woocommerce' | 'import';

/** Main Product interface used throughout the application */
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  stock: number;
  category: string;
  tags: string[];
  status: ProductStatus;
  attributes: ProductAttribute[];
  seoTitle: string;
  seoDescription: string;
  completenessScore: number;
  lastUpdated: string;
  source: ProductSource;
  imageUrl?: string;
  wooCommerceId?: number;
}

/** Input for AI product generation */
export interface AIGenerationInput {
  productIdea: string;
  targetAudience?: string;
  category?: string;
  tone?: string;
}

/** AI-generated product output */
export interface AIGeneratedProduct {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  tags: string[];
  attributes: ProductAttribute[];
  suggestedPrice: string;
  seoTitle: string;
  seoDescription: string;
  missingInformation: string[];
  recommendations: string[];
  completenessScore: number;
}

/** AI analysis step result */
export interface AIAnalysis {
  presentInformation: string[];
  missingInformation: string[];
  ambiguousInformation: string[];
  inferredAttributes: Record<string, string>;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  score: number;
  missingFields: string[];
  warnings: string[];
  recommendations: string[];
}

/** Workflow step status */
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'error';

/** Individual workflow step */
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: WorkflowStepStatus;
  result?: unknown;
}

/** Sync status for WooCommerce */
export interface SyncStatus {
  connected: boolean;
  lastSync: string | null;
  productsSynced: number;
  successful: number;
  failed: number;
  mode: 'demo' | 'live';
}

/** Sync progress step */
export interface SyncProgressStep {
  label: string;
  status: WorkflowStepStatus;
}

/** Conflict between local and WooCommerce versions */
export interface ProductConflict {
  productId: string;
  localVersion: Partial<Product>;
  wooCommerceVersion: Partial<Product>;
  fields: string[];
}

/** Attribute definition for the attributes management page */
export interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  values: string[];
}

/** Dashboard statistics */
export interface DashboardStats {
  totalProducts: number;
  completeProducts: number;
  needsAttention: number;
  aiOptimized: number;
}

/** WooCommerce product format (subset of WC REST API fields) */
export interface WooCommerceProduct {
  id?: number;
  name: string;
  slug?: string;
  type?: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price?: string;
  stock_quantity: number | null;
  stock_status: string;
  categories: Array<{ id?: number; name: string; slug?: string }>;
  tags: Array<{ id?: number; name: string; slug?: string }>;
  attributes: Array<{
    id?: number;
    name: string;
    options: string[];
    visible: boolean;
    variation: boolean;
  }>;
  meta_data?: Array<{
    key: string;
    value: string;
  }>;
}
