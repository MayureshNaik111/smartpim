import { AIGeneratedProduct, AIAnalysis } from '@/types/product';

/**
 * Demo mode AI generation: returns deterministic, realistic product data
 * based on keyword analysis of the input text.
 * Used when no AI API key is configured.
 */

/** Extract keywords from input text */
function extractKeywords(input: string): string[] {
  return input.toLowerCase().split(/[\s,;.]+/).filter(w => w.length > 2);
}

/** Infer category from keywords */
function inferCategory(keywords: string[]): string {
  const categoryMap: Record<string, string[]> = {
    'Electronics': ['headphones', 'bluetooth', 'wireless', 'speaker', 'camera', 'charger', 'usb', 'keyboard', 'mouse', 'monitor', 'laptop', 'phone', 'tablet', 'watch', 'earbuds', 'microphone', 'drone', 'smartwatch', 'gaming', 'led', 'lamp'],
    'Clothing': ['shirt', 'hoodie', 'jacket', 'pants', 'dress', 'cotton', 'polyester', 'sweater', 'coat', 'vest', 'jeans', 'shorts', 'skirt', 'blouse'],
    'Footwear': ['shoes', 'boots', 'sneakers', 'sandals', 'running', 'walking', 'athletic'],
    'Home & Office': ['desk', 'chair', 'lamp', 'shelf', 'organizer', 'furniture', 'ergonomic', 'office', 'pillow', 'blanket', 'mattress'],
    'Sports': ['yoga', 'fitness', 'gym', 'exercise', 'water bottle', 'mat', 'weights', 'resistance', 'bike', 'cycling'],
    'Beauty': ['skincare', 'cream', 'serum', 'moisturizer', 'shampoo', 'soap', 'lotion', 'perfume', 'makeup'],
    'Books': ['book', 'ebook', 'guide', 'manual', 'journal', 'notebook', 'planner'],
    'Accessories': ['bag', 'backpack', 'wallet', 'watch', 'sunglasses', 'belt', 'hat', 'scarf', 'gloves'],
  };

  for (const [category, catKeywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => catKeywords.some(ck => kw.includes(ck) || ck.includes(kw)))) {
      return category;
    }
  }
  return 'General';
}

/** Infer color from keywords */
function inferColor(keywords: string[]): string {
  const colors = ['black', 'white', 'blue', 'red', 'green', 'gray', 'silver', 'gold', 'navy', 'pink', 'purple', 'brown', 'beige', 'orange', 'teal'];
  for (const kw of keywords) {
    if (colors.includes(kw)) return kw.charAt(0).toUpperCase() + kw.slice(1);
  }
  return 'Black';
}

/** Infer material from keywords */
function inferMaterial(keywords: string[]): string {
  const materials: Record<string, string> = {
    'cotton': 'Cotton', 'polyester': 'Polyester', 'leather': 'Leather', 'metal': 'Metal',
    'aluminum': 'Aluminum', 'plastic': 'Premium Plastic', 'steel': 'Stainless Steel',
    'wood': 'Wood', 'bamboo': 'Bamboo', 'silicone': 'Silicone', 'rubber': 'Rubber',
    'foam': 'Memory Foam', 'mesh': 'Mesh', 'titanium': 'Titanium', 'ceramic': 'Ceramic',
    'glass': 'Glass', 'carbon': 'Carbon Fiber', 'nylon': 'Nylon',
  };
  for (const kw of keywords) {
    if (materials[kw]) return materials[kw];
  }
  return 'Premium Materials';
}

/** Generate a product title from the input */
function generateTitle(input: string, keywords: string[]): string {
  // Extract the most important nouns and adjectives
  const important = keywords.filter(kw =>
    !['with', 'and', 'the', 'for', 'has', 'its', 'our', 'new', 'this', 'that', 'from'].includes(kw)
  ).slice(0, 6);

  if (important.length >= 3) {
    return important.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  // Fallback: use the first sentence or first 60 chars
  const firstSentence = input.split(/[.!?]/)[0].trim();
  return firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence;
}

/** Analyze the input text (Step 1) */
export function analyzeInput(input: string): AIAnalysis {
  const keywords = extractKeywords(input);
  const presentInformation: string[] = [];
  const missingInformation: string[] = [];
  const ambiguousInformation: string[] = [];
  const inferredAttributes: Record<string, string> = {};

  // Check what's present
  const colorWords = ['black', 'white', 'blue', 'red', 'green', 'gray', 'silver', 'gold', 'navy', 'pink'];
  if (keywords.some(kw => colorWords.includes(kw))) {
    presentInformation.push('Color');
    inferredAttributes['color'] = inferColor(keywords);
  } else {
    missingInformation.push('Color');
  }

  const sizeWords = ['small', 'medium', 'large', 'xl', 'xxl', 'xs', 'compact', 'mini', 'full-size'];
  if (keywords.some(kw => sizeWords.some(sw => kw.includes(sw)))) {
    presentInformation.push('Size');
  } else {
    missingInformation.push('Size');
  }

  // Check for price mentions
  if (/\$[\d,.]+|\d+\s*(dollars|usd)/i.test(input)) {
    presentInformation.push('Price indication');
  } else {
    missingInformation.push('Price');
  }

  // Check for technical specs (e.g. "40 hour", "40-hour", "5000 mah", "65 watt")
  if (/\d+[\s-]?(hour|hrs?|mah|watt|watts|gb|tb|mm|cm|inch|inches|kg|lb|oz|ml)\b/i.test(input)) {
    presentInformation.push('Technical specifications');
  }

  // Product type
  const category = inferCategory(keywords);
  if (category !== 'General') {
    presentInformation.push(`Product type (${category})`);
  } else {
    ambiguousInformation.push('Product category is unclear');
  }

  // Brand — only treat as present when the input explicitly names one
  const brandMatch = input.match(/\b(?:brand(?:\s*name)?|by)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9&'-]{1,20})/i);
  if (brandMatch) {
    presentInformation.push(`Brand (${brandMatch[1]})`);
    inferredAttributes['brand'] = brandMatch[1];
  } else {
    missingInformation.push('Brand');
  }

  // Always missing for a rough input
  if (!missingInformation.includes('Price')) missingInformation.push('Exact price');
  missingInformation.push('SKU');
  missingInformation.push('Stock quantity');
  if (!input.toLowerCase().includes('weight')) missingInformation.push('Product weight');
  if (!input.toLowerCase().includes('warranty')) missingInformation.push('Warranty information');

  inferredAttributes['material'] = inferMaterial(keywords);
  inferredAttributes['category'] = category;

  return {
    presentInformation,
    missingInformation: [...new Set(missingInformation)],
    ambiguousInformation,
    inferredAttributes,
  };
}

/** Generate a complete product from rough input (Demo Mode) */
export function generateDemoProduct(
  input: string,
  targetAudience?: string,
  category?: string,
  tone?: string
): AIGeneratedProduct {
  const keywords = extractKeywords(input);
  const analysis = analyzeInput(input);
  const inferredCategory = category || analysis.inferredAttributes['category'] || inferCategory(keywords);
  const color = inferColor(keywords);
  const material = analysis.inferredAttributes['material'] || 'Premium Materials';
  const title = generateTitle(input, keywords);

  const audienceNote = targetAudience ? ` Perfect for ${targetAudience}.` : '';
  const tonePrefix = tone === 'luxury' ? 'Introducing the exquisite ' :
    tone === 'casual' ? 'Check out the awesome ' :
    tone === 'technical' ? 'Engineered for excellence, the ' :
    'Discover the ';

  const description = `${tonePrefix}${title}. ${input.charAt(0).toUpperCase() + input.slice(1)}${input.endsWith('.') ? '' : '.'} Crafted with attention to detail and designed to deliver exceptional quality. Features premium ${material.toLowerCase()} construction for durability and style.${audienceNote} Whether you're a professional or enthusiast, this product offers the perfect combination of performance and value.`;

  const shortDescription = `${title} — ${input.substring(0, Math.min(input.length, 100))}${input.length > 100 ? '...' : ''}`;

  const tags = keywords
    .filter(kw => kw.length > 3 && !['with', 'that', 'this', 'from', 'have', 'been'].includes(kw))
    .slice(0, 6);

  // Generate a realistic suggested price
  const priceMap: Record<string, string> = {
    'Electronics': '$49.99 – $299.99',
    'Clothing': '$29.99 – $99.99',
    'Footwear': '$59.99 – $199.99',
    'Home & Office': '$39.99 – $499.99',
    'Sports': '$19.99 – $149.99',
    'Beauty': '$14.99 – $79.99',
    'Books': '$9.99 – $39.99',
    'Accessories': '$19.99 – $149.99',
    'General': '$29.99 – $199.99',
  };

  const seoTitle = `${title} | Premium ${inferredCategory} | SmartPIM Store`;
  const seoDescription = `Shop ${title}. ${shortDescription.substring(0, 120)}. Free shipping on qualifying orders. Best quality guaranteed.`;

  const missingInformation = analysis.missingInformation.filter(m => !['SKU', 'Stock quantity'].includes(m));
  const recommendations: string[] = [];

  if (!input.toLowerCase().includes('weight')) {
    recommendations.push('Add product weight to improve shipping calculations.');
  }
  if (!input.toLowerCase().includes('warranty')) {
    recommendations.push('Consider adding warranty information to increase buyer confidence.');
  }
  if (tags.length < 4) {
    recommendations.push('Add more product tags to improve search discoverability.');
  }
  if (description.length < 200) {
    recommendations.push('Expand the product description for better SEO ranking.');
  }
  recommendations.push('Add high-quality product images for better conversion rates.');

  // Calculate score
  let score = 60; // Base score
  if (title.length > 5) score += 10;
  if (description.length > 100) score += 10;
  if (tags.length > 2) score += 5;
  if (color !== 'Black') score += 3; // Specific color was provided
  if (targetAudience) score += 4;
  if (category) score += 3;
  score = Math.min(score, 95);

  return {
    title,
    description,
    shortDescription,
    category: inferredCategory,
    tags,
    attributes: [
      { name: 'Color', values: [color] },
      { name: 'Material', values: [material] },
      { name: 'Brand', values: ['To be specified'] },
    ],
    suggestedPrice: priceMap[inferredCategory] || priceMap['General'],
    seoTitle: seoTitle.length > 60 ? seoTitle.substring(0, 57) + '...' : seoTitle,
    seoDescription: seoDescription.length > 160 ? seoDescription.substring(0, 157) + '...' : seoDescription,
    missingInformation,
    recommendations,
    completenessScore: score,
  };
}
