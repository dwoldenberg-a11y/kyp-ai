'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, ArrowRight, AlertTriangle } from 'lucide-react';
import { mockProducts } from '@/lib/mockData';
import Badge, { statusVariant, riskVariant } from '@/components/ui/Badge';
import { ScoreRingInline } from '@/components/ui/ScoreRing';

export default function ProductsPage() {
  const [search, setSearch] = useState('');

  const filtered = mockProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.htsCode.code.includes(search) ||
    p.skus.some(s => s.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Product Registry</h2>
          <p className="text-sm text-slate-400 mt-0.5">Product passports with traceability scoring, HTS codes, and genealogy</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} />
          New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          type="text"
          placeholder="Search by product name, HTS code, or SKU..."
          className="w-full bg-[#151E33] border border-[#253352] text-slate-300 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
        />
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map(product => (
          <Link key={product.id} href={`/products/${product.id}`} className="block">
            <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5 card-hover group">
              <div className="flex items-start gap-5">

                {/* Score Ring */}
                <div className="flex-shrink-0">
                  <ScoreRingInline score={product.score.overall} size={72} strokeWidth={6} />
                  <p className="text-[10px] text-slate-500 text-center mt-1">Overall Score</p>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-200">{product.name}</h3>
                        <Badge
                          label={product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                          variant={statusVariant(product.status)}
                          pulse={product.status === 'flagged'}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">{product.description}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* HTS Code */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">HTS</span>
                    <span className="text-xs font-mono font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      {product.htsCode.code}
                    </span>
                    <span className="text-xs text-slate-400">{product.htsCode.description.substring(0, 50)}...</span>
                    <span className={`text-xs font-semibold ml-auto ${product.htsCode.dutyRate === '0%' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      Duty: {product.htsCode.dutyRate}
                    </span>
                  </div>

                  {/* AD/CVD warning */}
                  {product.htsCode.adcvdCases.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
                      <AlertTriangle size={12} />
                      AD/CVD case active: {product.htsCode.adcvdCases[0].caseNumber} ({product.htsCode.adcvdCases[0].type} from {product.htsCode.adcvdCases[0].country}) — Rate: {product.htsCode.adcvdCases[0].rate}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Components</p>
                      <p className="text-sm font-semibold text-slate-300 mt-0.5">{product.components.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Processes</p>
                      <p className="text-sm font-semibold text-slate-300 mt-0.5">{product.processes.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">SKUs</p>
                      <p className="text-sm font-semibold text-slate-300 mt-0.5">{product.skus.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Final Assembly</p>
                      <p className="text-sm font-semibold text-slate-300 mt-0.5">{product.finalAssemblyCountry}</p>
                    </div>
                  </div>

                  {/* Sub-scores */}
                  <div className="flex items-center gap-4 mt-4">
                    {[
                      { label: 'Origin', value: product.score.originVerification },
                      { label: 'Supplier', value: product.score.supplierReliability },
                      { label: 'Docs', value: product.score.processDocumentation },
                      { label: 'Compliance', value: product.score.complianceScore },
                      { label: 'Authentic', value: product.score.authenticity },
                    ].map(s => (
                      <div key={s.label} className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-slate-500">{s.label}</span>
                          <span className={`text-[10px] font-semibold ${s.value >= 80 ? 'text-emerald-400' : s.value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {s.value}%
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-[#1C2844] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.value >= 80 ? 'bg-emerald-500' : s.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${s.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SKU badges */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">SKUs:</span>
                    {product.skus.slice(0, 4).map(sku => (
                      <span key={sku.sku} className="text-[10px] font-mono bg-[#1C2844] border border-[#253352] text-slate-400 px-2 py-0.5 rounded">
                        {sku.sku} ×{sku.quantity}
                      </span>
                    ))}
                    {product.skus.length > 4 && (
                      <span className="text-[10px] text-slate-500">+{product.skus.length - 4} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
