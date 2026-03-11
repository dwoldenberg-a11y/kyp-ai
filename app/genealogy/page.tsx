'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GitBranch, ChevronRight, CheckCircle, AlertTriangle, Clock,
  FileText, MapPin, Package, Factory
} from 'lucide-react';
import { mockProducts, mockInspections } from '@/lib/mockData';
import Badge, { statusVariant } from '@/components/ui/Badge';

export default function GenealogyPage() {
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]?.id || '');
  const product = mockProducts.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Product Genealogy / Process Map</h2>
          <p className="text-sm text-slate-400 mt-0.5">Full traceability from raw materials through final assembly</p>
        </div>
        <div className="flex items-center gap-2">
          {mockProducts.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p.id)}
              className={`text-sm px-4 py-2 rounded-lg border transition-all ${
                selectedProduct === p.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-[var(--c-surface)] border-[var(--c-border)] text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.name.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {product && (
        <>
          {/* Product Header Card */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Package size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">{product.name}</h3>
                  <p className="text-xs text-slate-400">{product.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{product.score.overall}</p>
                  <p className="text-[10px] text-slate-500">Passport Score</p>
                </div>
                <Link href={`/products/${product.id}`} className="flex items-center gap-1.5 text-xs bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 px-3 py-2 rounded-lg hover:border-blue-500/30 transition-colors">
                  View Passport <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Genealogy Tree */}
          <div className="relative">
            {/* Components Layer */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-400">1</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raw Materials & Components</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ml-8">
                {product.components.map(comp => (
                  <div key={comp.id} className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                        {comp.countryCode}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200">{comp.name}</p>
                          <Badge label={comp.type.replace('_', ' ')} variant="gray" />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{comp.supplierName}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <MapPin size={10} />
                            {comp.country}
                          </div>
                          <span className="text-[10px] font-mono text-blue-300">HTS: {comp.htsCode.code}</span>
                          <span className="text-[10px] text-slate-500">{comp.quantity.toLocaleString()} {comp.unit}</span>
                        </div>
                        {comp.documents.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <FileText size={10} className="text-slate-500" />
                            <span className="text-[10px] text-slate-500">{comp.documents.length} doc(s) attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex items-center justify-center my-2">
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-[#253352]" />
                <div className="text-slate-500 text-lg">▼</div>
                <div className="w-px h-4 bg-[#253352]" />
              </div>
            </div>

            {/* Processes Layer */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-400">2</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manufacturing Processes</h4>
              </div>
              <div className="ml-8 space-y-3">
                {product.processes.map((proc, idx) => {
                  const insp = proc.vlxInspectionId ? mockInspections.find(i => i.id === proc.vlxInspectionId) : null;
                  return (
                    <div key={proc.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          proc.status === 'verified' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : proc.status === 'flagged' ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {idx + 1}
                        </div>
                        {idx < product.processes.length - 1 && (
                          <div className="w-px h-6 bg-[#253352] mt-1" />
                        )}
                      </div>
                      <div className="flex-1 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-4 mb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Factory size={14} className="text-slate-400" />
                              <h5 className="text-sm font-semibold text-slate-200">{proc.name}</h5>
                              <Badge label={proc.type} variant="blue" />
                              <Badge label={proc.status} variant={statusVariant(proc.status)} />
                            </div>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className="text-xs text-slate-400">{proc.supplierName}</span>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={10} />
                                {proc.country} ({proc.countryCode})
                              </div>
                              <span className="text-xs text-slate-500">{proc.startDate} → {proc.endDate || 'ongoing'}</span>
                            </div>
                            {proc.notes && (
                              <p className="text-xs text-slate-400 mt-2 bg-[var(--c-raised)] rounded px-3 py-1.5">{proc.notes}</p>
                            )}
                          </div>
                        </div>

                        {insp && (
                          <div className="mt-3 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <div className="w-7 h-7 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-bold text-blue-400">VLX</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-blue-300">{insp.title}</p>
                              <p className="text-[10px] text-slate-500">{insp.inspectorName} · {insp.date}</p>
                            </div>
                            {insp.score && (
                              <div className="text-center flex-shrink-0">
                                <span className={`text-sm font-bold ${insp.score >= 85 ? 'text-emerald-400' : insp.score >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                  {insp.score}
                                </span>
                                <p className="text-[9px] text-slate-500">/100</p>
                              </div>
                            )}
                          </div>
                        )}

                        {proc.documents.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            {proc.documents.map(doc => (
                              <div key={doc.id} className="flex items-center gap-1 text-[10px] bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-400 px-2 py-1 rounded">
                                <FileText size={10} />
                                {doc.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex items-center justify-center my-2">
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-[#253352]" />
                <div className="text-slate-500 text-lg">▼</div>
                <div className="w-px h-4 bg-[#253352]" />
              </div>
            </div>

            {/* Final Assembly */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <CheckCircle size={12} className="text-blue-400" />
                </div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Final Product</h4>
              </div>
              <div className="ml-8">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                      {product.finalAssemblyCountryCode}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-blue-300">{product.name} — Finished Goods</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Final assembly: {product.finalAssemblyCountry} · HTS: {product.htsCode.code}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {product.skus.map(sku => (
                          <span key={sku.sku} className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                            {sku.sku} ×{sku.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-3xl font-bold text-blue-400">{product.score.overall}</p>
                      <p className="text-xs text-slate-400">Passport Score</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
