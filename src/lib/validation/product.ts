import { Product, ValidationResult } from '@/types/product';

/** Field weights for completeness score calculation */
const FIELD_WEIGHTS: Record<string, number> = {
  name: 15,
  sku: 5,
  description: 15,
  shortDescription: 10,
  price: 10,
  stock: 5,
  category: 10,
  tags: 5,
  attributes: 10,
  seoTitle: 8,
  seoDescription: 7,
};

/** Calculate product completeness score (0–100) */
export function calculateCompletenessScore(product: Partial<Product>): number {
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    totalWeight += weight;
    const value = product[field as keyof Product];

    if (field === 'name' && typeof value === 'string' && value.trim().length > 0) {
      earnedWeight += weight;
    } else if (field === 'sku' && typeof value === 'string' && value.trim().length > 0) {
      earnedWeight += weight;
    } else if (field === 'description' && typeof value === 'string' && value.trim().length >= 20) {
      earnedWeight += weight;
    } else if (field === 'shortDescription' && typeof value === 'string' && value.trim().length >= 10) {
      earnedWeight += weight;
    } else if (field === 'price' && typeof value === 'number' && value > 0) {
      earnedWeight += weight;
    } else if (field === 'stock' && typeof value === 'number' && value >= 0) {
      earnedWeight += weight;
    } else if (field === 'category' && typeof value === 'string' && value.trim().length > 0) {
      earnedWeight += weight;
    } else if (field === 'tags' && Array.isArray(value) && value.length > 0) {
      earnedWeight += weight;
    } else if (field === 'attributes' && Array.isArray(value) && value.length > 0) {
      earnedWeight += weight;
    } else if (field === 'seoTitle' && typeof value === 'string' && value.trim().length >= 10) {
      earnedWeight += weight;
    } else if (field === 'seoDescription' && typeof value === 'string' && value.trim().length >= 20) {
      earnedWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

/** Validate a product and return validation result */
export function validateProduct(product: Partial<Product>): ValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Required field checks
  if (!product.name || product.name.trim().length === 0) {
    missingFields.push('Product name is required');
  } else if (product.name.length < 5) {
    warnings.push('Product name is very short — consider making it more descriptive');
  }

  if (!product.description || product.description.trim().length === 0) {
    missingFields.push('Product description is required');
  } else if (product.description.length < 50) {
    warnings.push('Product description is short — aim for at least 100 characters for better SEO');
  }

  if (!product.shortDescription || product.shortDescription.trim().length === 0) {
    missingFields.push('Short description is required');
  }

  if (!product.category || product.category.trim().length === 0) {
    missingFields.push('Category is required');
  }

  if (product.price === undefined || product.price === null || product.price <= 0) {
    missingFields.push('Valid price is required');
  }

  if (product.stock === undefined || product.stock === null || product.stock < 0) {
    warnings.push('Stock quantity is not set');
  }

  // Attribute checks
  if (!product.attributes || product.attributes.length === 0) {
    warnings.push('No attributes defined — add color, size, or material for better product discovery');
  }

  // SEO checks
  if (!product.seoTitle || product.seoTitle.trim().length === 0) {
    recommendations.push('Add an SEO title to improve search engine visibility');
  } else if (product.seoTitle.length > 60) {
    warnings.push('SEO title exceeds 60 characters — may be truncated in search results');
  }

  if (!product.seoDescription || product.seoDescription.trim().length === 0) {
    recommendations.push('Add an SEO description to improve click-through rates');
  } else if (product.seoDescription.length > 160) {
    warnings.push('SEO description exceeds 160 characters — may be truncated in search results');
  } else if (product.seoDescription.length < 50) {
    recommendations.push('Consider expanding SEO description to 120-160 characters for best results');
  }

  // Tags
  if (!product.tags || product.tags.length === 0) {
    recommendations.push('Add tags to improve product discoverability');
  }

  // SKU
  if (!product.sku || product.sku.trim().length === 0) {
    recommendations.push('Add a SKU for inventory management');
  }

  const score = calculateCompletenessScore(product);
  const valid = missingFields.length === 0;

  return {
    valid,
    score,
    missingFields,
    warnings,
    recommendations,
  };
}
