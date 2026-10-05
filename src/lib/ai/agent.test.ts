import { describe, it, expect } from 'vitest';
import { analyzeInput, generateDemoProduct } from './demo-mode';
import { runAgentPipeline } from './agent';

const TEST_INPUT =
  'Premium black wireless headphones with active noise cancellation, Bluetooth 5.3 and 40-hour battery life.';

describe('analyzeInput', () => {
  const analysis = analyzeInput(TEST_INPUT);

  it('detects present information from rough input', () => {
    expect(analysis.presentInformation).toContain('Color');
    expect(analysis.presentInformation).toContain('Product type (Electronics)');
    expect(analysis.presentInformation).toContain('Technical specifications');
  });

  it('identifies missing information', () => {
    expect(analysis.missingInformation).toContain('Brand');
    expect(analysis.missingInformation).toContain('Price');
    expect(analysis.missingInformation).toContain('SKU');
    expect(analysis.missingInformation).toContain('Product weight');
    expect(analysis.missingInformation).toContain('Warranty information');
  });

  it('does not report a brand when none was provided', () => {
    expect(analysis.presentInformation.some(p => p.startsWith('Brand'))).toBe(false);
  });

  it('infers category and color', () => {
    expect(analysis.inferredAttributes.category).toBe('Electronics');
    expect(analysis.inferredAttributes.color).toBe('Black');
  });
});

describe('generateDemoProduct', () => {
  const product = generateDemoProduct(TEST_INPUT);

  it('generates a title, description and short description', () => {
    expect(product.title.length).toBeGreaterThan(5);
    expect(product.description.length).toBeGreaterThan(100);
    expect(product.shortDescription.length).toBeGreaterThan(10);
  });

  it('generates category, tags and attributes', () => {
    expect(product.category).toBe('Electronics');
    expect(product.tags.length).toBeGreaterThanOrEqual(3);
    expect(product.attributes.map(a => a.name)).toEqual(
      expect.arrayContaining(['Color', 'Material', 'Brand'])
    );
    expect(product.attributes.find(a => a.name === 'Color')?.values).toEqual(['Black']);
  });

  it('generates SEO metadata within recommended lengths', () => {
    expect(product.seoTitle.length).toBeGreaterThan(10);
    expect(product.seoTitle.length).toBeLessThanOrEqual(60);
    expect(product.seoDescription.length).toBeGreaterThan(20);
    expect(product.seoDescription.length).toBeLessThanOrEqual(160);
  });

  it('suggests a price range and provides recommendations', () => {
    expect(product.suggestedPrice).toMatch(/\$/);
    expect(product.recommendations.length).toBeGreaterThan(0);
  });

  it('calculates a completeness score within 0-100', () => {
    expect(product.completenessScore).toBeGreaterThanOrEqual(0);
    expect(product.completenessScore).toBeLessThanOrEqual(100);
    expect(product.completenessScore).toBeGreaterThan(50);
  });

  it('is deterministic for the same input', () => {
    const again = generateDemoProduct(TEST_INPUT);
    expect(again.title).toBe(product.title);
    expect(again.completenessScore).toBe(product.completenessScore);
    expect(again.category).toBe(product.category);
  });
});

describe('runAgentPipeline', () => {
  it('runs all workflow steps and returns a validated product', async () => {
    const result = await runAgentPipeline({ productIdea: TEST_INPUT });

    expect(result.steps.map(s => s.step)).toEqual([
      'analyze',
      'structure',
      'generate',
      'validate',
      'score',
      'recommend',
    ]);
    expect(result.steps.every(s => s.status === 'completed')).toBe(true);
    expect(result.mode).toBe('demo');
    expect(result.validation.valid).toBe(true);
    expect(result.product.title.length).toBeGreaterThan(5);
    expect(result.product.recommendations.length).toBeGreaterThan(0);
    expect(result.analysis.missingInformation.length).toBeGreaterThan(0);
  });

  it('still returns a usable product when AI mode is requested but unavailable', async () => {
    const result = await runAgentPipeline({ productIdea: TEST_INPUT }, true);
    expect(result.product.title.length).toBeGreaterThan(5);
    expect(result.steps.every(s => s.status === 'completed')).toBe(true);
  });
});
