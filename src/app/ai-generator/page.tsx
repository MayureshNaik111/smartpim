'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Search, FileText, CheckCircle, BarChart3, Lightbulb,
  ArrowRight, Loader2, Tag, ShoppingBag, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, ThumbsUp
} from 'lucide-react';
import { AIGeneratedProduct, AIAnalysis, ValidationResult } from '@/types/product';
import { getScoreColor, getScoreBarColor } from '@/lib/utils/helpers';

type AgentStep = {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
};

const initialSteps: AgentStep[] = [
  { id: 'analyze', name: 'Analyze', icon: Search, description: 'Analyzing product information...', status: 'pending' },
  { id: 'structure', name: 'Structure', icon: FileText, description: 'Structuring product data...', status: 'pending' },
  { id: 'generate', name: 'Generate', icon: Sparkles, description: 'Generating product content...', status: 'pending' },
  { id: 'validate', name: 'Validate', icon: CheckCircle, description: 'Validating product quality...', status: 'pending' },
  { id: 'score', name: 'Score', icon: BarChart3, description: 'Calculating completeness...', status: 'pending' },
  { id: 'recommend', name: 'Recommend', icon: Lightbulb, description: 'Generating recommendations...', status: 'pending' },
];

export default function AIGeneratorPage() {
  const router = useRouter();
  const [productIdea, setProductIdea] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [category, setCategory] = useState('');
  const [tone, setTone] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>(initialSteps);
  const [result, setResult] = useState<{
    product: AIGeneratedProduct;
    analysis: AIAnalysis;
    validation: ValidationResult;
    mode: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleGenerate = async () => {
    if (!productIdea.trim()) return;

    setProcessing(true);
    setError(null);
    setResult(null);
    setAdded(false);
    setSteps(initialSteps.map(s => ({ ...s, status: 'pending' })));

    // Simulate step-by-step progress
    const stepIds = ['analyze', 'structure', 'generate', 'validate', 'score', 'recommend'];
    for (let i = 0; i < stepIds.length; i++) {
      setSteps(prev => prev.map(s =>
        s.id === stepIds[i] ? { ...s, status: 'running' } : s
      ));
      await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
      setSteps(prev => prev.map(s =>
        s.id === stepIds[i] ? { ...s, status: 'completed' } : s
      ));
    }

    try {
      const res = await fetch('/api/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIdea, targetAudience, category, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult({
        product: data.product,
        analysis: data.analysis,
        validation: data.validation,
        mode: data.mode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed. Please try again.');
      setSteps(prev => prev.map(s =>
        s.status === 'running' ? { ...s, status: 'error' } : s
      ));
    } finally {
      setProcessing(false);
    }
  };

  const handleAddToCatalog = async () => {
    if (!result) return;
    setAdding(true);

    try {
      const priceMatch = result.product.suggestedPrice.match(/[\d.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.product.title,
          description: result.product.description,
          shortDescription: result.product.shortDescription,
          price,
          stock: 100,
          category: result.product.category,
          tags: result.product.tags,
          status: 'active',
          attributes: result.product.attributes,
          seoTitle: result.product.seoTitle,
          seoDescription: result.product.seoDescription,
          source: 'ai_generated',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdded(true);
      } else {
        setError(data.error || 'Failed to add product to catalog.');
      }
    } catch {
      setError('Failed to add product to catalog.');
    } finally {
      setAdding(false);
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    setAdded(false);
    handleGenerate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Product Agent
        </div>
        <h1 className="text-2xl font-bold text-slate-900">AI Product Agent</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Turn incomplete product information into validated, WooCommerce-ready product data.
        </p>
      </div>

      {/* Input Section */}
      {!result && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe your product
            </label>
            <textarea
              value={productIdea}
              onChange={(e) => setProductIdea(e.target.value)}
              placeholder="Premium black wireless headphones with active noise cancellation, Bluetooth 5.3, 40-hour battery life."
              rows={4}
              disabled={processing}
              className="w-full text-sm border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Optional Fields Toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Optional settings
          </button>

          {showOptions && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Target Audience</label>
                <input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., tech enthusiasts"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Electronics"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="luxury">Luxury</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={processing || !productIdea.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze & Optimize Product
              </>
            )}
          </button>
        </div>
      )}

      {/* Workflow Steps */}
      {(processing || result) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">AI Agent Workflow</h3>
          <div className="flex items-center gap-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium flex-1 ${
                    step.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    step.status === 'running' ? 'bg-blue-50 text-blue-700' :
                    step.status === 'error' ? 'bg-red-50 text-red-700' :
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {step.status === 'running' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : step.status === 'completed' ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                    {step.name}
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Mode badge */}
          {result.mode === 'demo' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              AI Demo Mode — Using deterministic product generation. Configure an AI API key for AI-powered generation.
            </div>
          )}

          {/* Generated Product */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{result.product.title}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(result.product.completenessScore)}`}>
                  {result.product.completenessScore}
                </span>
                <span className="text-sm text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Completeness bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getScoreBarColor(result.product.completenessScore)}`}
                style={{ width: `${result.product.completenessScore}%` }}
              />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Short Description</label>
                <p className="text-sm text-slate-700 mt-1">{result.product.shortDescription}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Category</label>
                <p className="text-sm text-slate-700 mt-1 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                  {result.product.category}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Full Description</label>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">{result.product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {result.product.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                      <Tag className="w-3 h-3 mr-1" />{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suggested Price</label>
                <p className="text-sm text-slate-900 font-medium mt-1">{result.product.suggestedPrice}</p>
              </div>
            </div>

            {/* Attributes */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attributes</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {result.product.attributes.map((attr) => (
                  <div key={attr.name} className="bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2">
                    <div className="text-xs text-blue-600 font-medium">{attr.name}</div>
                    <div className="text-sm text-slate-700">{attr.values.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEO */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">SEO</label>
              <div>
                <span className="text-xs text-slate-400">Title:</span>
                <p className="text-sm text-blue-700">{result.product.seoTitle}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Description:</span>
                <p className="text-sm text-slate-600">{result.product.seoDescription}</p>
              </div>
            </div>
          </div>

          {/* Input Analysis: present / missing / inferred */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              Input Analysis
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                  Detected Information
                </label>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {result.analysis.presentInformation.length === 0 ? (
                    <li className="text-slate-400">None detected</li>
                  ) : result.analysis.presentInformation.map((item, i) => (
                    <li key={i} className="text-slate-700 flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Missing Information
                </label>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {result.analysis.missingInformation.length === 0 ? (
                    <li className="text-slate-400">Nothing missing</li>
                  ) : result.analysis.missingInformation.map((item, i) => (
                    <li key={i} className="text-slate-700 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Inferred / Ambiguous
                </label>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {Object.entries(result.analysis.inferredAttributes).map(([key, value]) => (
                    <li key={key} className="text-slate-700">
                      <span className="font-medium capitalize">{key}:</span> {value}
                    </li>
                  ))}
                  {result.analysis.ambiguousInformation.map((item, i) => (
                    <li key={`amb-${i}`} className="text-amber-700 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Validation & Recommendations */}
          <div className="grid grid-cols-2 gap-4">
            {/* Validation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Validation Results
              </h4>
              <div className="space-y-2 text-sm">
                {result.validation.missingFields.length === 0 ? (
                  <p className="text-emerald-600 font-medium">✓ All required fields present</p>
                ) : (
                  result.validation.missingFields.map((f, i) => (
                    <p key={i} className="text-red-600">✗ {f}</p>
                  ))
                )}
                {result.validation.warnings.map((w, i) => (
                  <p key={i} className="text-amber-600">⚠ {w}</p>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Recommendations
              </h4>
              <div className="space-y-2 text-sm">
                {result.product.recommendations.map((rec, i) => (
                  <p key={i} className="text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    {rec}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {added ? (
                  <button
                    onClick={() => router.push('/products')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    View in Catalog
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCatalog}
                    disabled={adding}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {adding ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Adding...</>
                    ) : (
                      <><ThumbsUp className="w-4 h-4" />Approve & Add to Catalog</>
                    )}
                  </button>
                )}

                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>

              <button
                onClick={() => { setResult(null); setProductIdea(''); setAdded(false); }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Start Over
              </button>
            </div>
            {added && (
              <p className="text-sm text-emerald-600 mt-3 font-medium">
                ✓ Product added to catalog successfully!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
