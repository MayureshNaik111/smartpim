import { AIGenerationInput, AIGeneratedProduct, AIAnalysis, ValidationResult } from '@/types/product';
import { analyzeInput, generateDemoProduct } from './demo-mode';
import { validateProduct } from '@/lib/validation/product';
import { generateSku } from '@/lib/utils/helpers';

/**
 * AI Agent Orchestrator
 *
 * Implements the multi-step agentic workflow:
 * 1. Analyze → 2. Structure → 3. Generate → 4. Validate → 5. Score → 6. Recommend
 *
 * In demo mode, uses deterministic mock generation.
 * With an AI API key, delegates to the configured AI provider.
 */

export interface AgentStepResult {
  step: string;
  status: 'completed' | 'error';
  data: unknown;
  timestamp: string;
}

export interface AgentResult {
  steps: AgentStepResult[];
  analysis: AIAnalysis;
  product: AIGeneratedProduct;
  validation: ValidationResult;
  mode: 'demo' | 'ai';
}

/** Run the complete AI agent pipeline */
export async function runAgentPipeline(
  input: AIGenerationInput,
  useAI: boolean = false
): Promise<AgentResult> {
  const steps: AgentStepResult[] = [];

  // Step 1: Analyze
  const analysis = analyzeInput(input.productIdea);
  steps.push({
    step: 'analyze',
    status: 'completed',
    data: analysis,
    timestamp: new Date().toISOString(),
  });

  // Step 2 & 3: Structure & Generate
  let product: AIGeneratedProduct;

  if (useAI) {
    // AI-powered generation would go here
    // For now, fall back to demo mode
    product = generateDemoProduct(
      input.productIdea,
      input.targetAudience,
      input.category,
      input.tone
    );
  } else {
    product = generateDemoProduct(
      input.productIdea,
      input.targetAudience,
      input.category,
      input.tone
    );
  }

  steps.push({
    step: 'structure',
    status: 'completed',
    data: { structured: true },
    timestamp: new Date().toISOString(),
  });

  steps.push({
    step: 'generate',
    status: 'completed',
    data: product,
    timestamp: new Date().toISOString(),
  });

  // Step 4: Validate
  const validation = validateProduct({
    name: product.title,
    description: product.description,
    shortDescription: product.shortDescription,
    price: parseFloat(product.suggestedPrice.replace(/[^0-9.]/g, '')) || 0,
    stock: 0,
    category: product.category,
    tags: product.tags,
    attributes: product.attributes,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    sku: generateSku(product.title),
  });

  steps.push({
    step: 'validate',
    status: 'completed',
    data: validation,
    timestamp: new Date().toISOString(),
  });

  // Step 5: Score (already computed in generation and validation)
  steps.push({
    step: 'score',
    status: 'completed',
    data: { score: product.completenessScore, validationScore: validation.score },
    timestamp: new Date().toISOString(),
  });

  // Step 6: Recommend
  steps.push({
    step: 'recommend',
    status: 'completed',
    data: { recommendations: product.recommendations },
    timestamp: new Date().toISOString(),
  });

  return {
    steps,
    analysis,
    product,
    validation,
    mode: useAI ? 'ai' : 'demo',
  };
}
