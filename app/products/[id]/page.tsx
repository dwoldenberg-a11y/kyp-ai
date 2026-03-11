'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Package, GitBranch, Map, FileText, Shield,
  AlertTriangle, CheckCircle, Download, Eye, Plus, Tag,
  Globe, Factory, ChevronDown, ChevronRight
} from 'lucide-react';
import { mockProducts, mockInspections } from '@/lib/mockData';
import Badge, { statusVariant, riskVariant } from '@/components/ui/Badge';
import { ScoreRingInline } from '@/components/ui/ScoreRing';

const docTypeColors: Record<string, string> = {
  BOL: 'bg-blue-500/20 text-blue-300',
  ISF: 'bg-purple-500/20 text-purple-300',
  ENTRY_FORM: 'bg-yellow-500/20 text-yellow-300',
  COMMERCIAL_INVOICE: 'bg-green-500/20 text-green-300',
  CERT_OF_ORIGIN: 'bg-emerald-500/20 text-emerald-300',
  MTR: 'bg-orange-500/20 text-orange-300',
  QUALITY_REPORT: 'bg-cyan-500/20 text-cyan-300',
  TECHNICAL_DOC: 'bg-slate-500/20 text-slate-300',
  INSPECTION: 'bg-indigo-500/20 text-indigo-300',
  OTHER: 'bg-slate-500/20 text-slate-300',
};

type TabId = 'overview' | 'components' | 'genealogy' | 'documents' | 'skus' | 'hts';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = mockProducts.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Product not found.</p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'components', label: 'Components', count: product.components.length },
    { id: 'genealogy', label: 'Product Genealogy', count: product.processes.length },
    { id: 'hts', label: 'HTS & Trade' },
    { id: 'documents', label: 'Documents', count: product.documents.length },
    { id: 'skus', label: 'SKU Batches', count: product.skus.length },
  ];

  const linkedInspections = product.vlxInspectionIds.map(id => mockInspections.find(i => i.id === id)).filter(Boolean);

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products" className="w-8 h-8 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-100">{product.name}</h2>
              <Badge
                label={product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                variant={statusVariant(product.status)}
                pulse={product.status === 'flagged'}
                size="md"
              />
            </div>
            <p className="text-sm text-slate-400 mt-1">{product.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/map?product=${product.id}`} className="flex items-center gap-2 bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 text-sm px-3 py-2 rounded-lg hover:border-blue-500/30 transition-colors">
            <Map size={14} /> Map
          </Link>
          <Link href={`/genealogy?product=${product.id}`} className="flex items-center gap-2 bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 text-sm px-3 py-2 rounded-lg hover:border-blue-500/30 transition-colors">
            <GitBranch size={14} /> Genealogy
          </Link>
        </div>
      </div>

      {/* Score Panel */}
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-6">
        <div className="flex items-center gap-8">
          {/* Main score */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <ScoreRingInline score={product.score.overall} size={100} strokeWidth={8} />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passport Score</span>
          </div>

          {/* Sub scores */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Origin Verification', value: product.score.originVerification, icon: Globe },
              { label: 'Supplier Reliability', value: product.score.supplierReliability, icon: Factory },
              { label: 'Process Documentation', value: product.score.processDocumentation, icon: FileText },
              { label: 'Compliance Score', value: product.score.complianceScore, icon: Shield },
              { label: 'Authenticity', value: product.score.authenticity, icon: CheckCircle },
            ].map(s => (
              <div key={s.label} className="bg-[var(--c-raised)] rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <s.icon size={12} className="text-slate-500" />
                  <span className="text-[10px] text-slate-400">{s.label}</span>
                </div>
                <div className="flex items-end gap-1">
                  <span className={`text-xl font-bold ${s.value >= 80 ? 'text-emerald-400' : s.value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {s.value}
                  </span>
                  <span className="text-xs text-slate-500 mb-0.5">/100</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-[#253352] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.value >= 80 ? 'bg-emerald-500' : s.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score details */}
        <div className="mt-4 pt-4 border-t border-[var(--c-border)]">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">KYPiT Analysis</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {product.score.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${detail.includes('gap') || detail.includes('non-') ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                <p className="text-xs text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--c-border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-[10px] bg-[#253352] text-slate-400 px-1.5 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Facts */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Product Details</h3>
            <dl className="space-y-3">
              {[
                { label: 'Final Assembly', value: `${product.finalAssemblyCountry} (${product.finalAssemblyCountryCode})` },
                { label: 'HTS Code', value: product.htsCode.code, mono: true },
                { label: 'Duty Rate', value: product.htsCode.dutyRate },
                { label: 'Total SKUs', value: `${product.skus.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} units across ${product.skus.length} SKUs` },
                { label: 'VLX Inspections', value: `${product.vlxInspectionIds.length} inspection(s) linked` },
                { label: 'Last Updated', value: product.updatedAt },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start gap-4">
                  <dt className="text-xs text-slate-500 flex-shrink-0">{item.label}</dt>
                  <dd className={`text-xs text-right ${item.mono ? 'font-mono text-blue-300' : 'text-slate-300'}`}>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* VLX Inspections */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">VLX Inspections</h3>
              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Assign Inspection
              </button>
            </div>
            <div className="space-y-3">
              {linkedInspections.map(insp => insp && (
                <div key={insp.id} className="bg-[var(--c-raised)] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-slate-200">{insp.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{insp.inspectorName} · {insp.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {insp.score && (
                        <span className={`text-sm font-bold ${insp.score >= 85 ? 'text-emerald-400' : insp.score >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
                          {insp.score}/100
                        </span>
                      )}
                      <Badge label={insp.status} variant={insp.status === 'completed' ? 'green' : 'yellow'} />
                    </div>
                  </div>
                  {insp.findings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {insp.findings.slice(0, 2).map((f, i) => (
                        <p key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                          <span className="text-slate-600 mt-0.5">•</span> {f}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {linkedInspections.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No inspections assigned yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'components' && (
        <div className="space-y-4">
          {product.components.map(comp => (
            <div key={comp.id} className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedComp(expandedComp === comp.id ? null : comp.id)}
                className="w-full flex items-center gap-4 p-5 hover:bg-[var(--c-raised)] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                  {comp.countryCode}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{comp.name}</span>
                    <Badge label={comp.type.replace('_', ' ')} variant="gray" />
                    <Badge label={comp.riskLevel} variant={riskVariant(comp.riskLevel)} />
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-slate-400">{comp.supplierName}</span>
                    <span className="text-xs font-mono text-slate-500">HTS: {comp.htsCode.code}</span>
                    <span className="text-xs text-slate-500">{comp.quantity.toLocaleString()} {comp.unit}</span>
                  </div>
                </div>
                {comp.htsCode.adcvdCases.length > 0 && (
                  <div className="flex items-center gap-1 text-orange-400 text-xs flex-shrink-0">
                    <AlertTriangle size={12} />
                    AD/CVD
                  </div>
                )}
                {expandedComp === comp.id ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
              </button>

              {expandedComp === comp.id && (
                <div className="border-t border-[var(--c-border)] p-5 space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Supplier', value: comp.supplierName },
                      { label: 'Country of Origin', value: `${comp.country} (${comp.countryCode})` },
                      { label: 'HTS Code', value: comp.htsCode.code, mono: true },
                      { label: 'Duty Rate', value: comp.htsCode.dutyRate },
                    ].map(item => (
                      <div key={item.label} className="bg-[var(--c-raised)] rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                        <p className={`text-sm font-semibold mt-1 ${item.mono ? 'font-mono text-blue-300' : 'text-slate-200'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {comp.htsCode.adcvdCases.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <p className="text-xs font-semibold text-orange-300 mb-2">AD/CVD Cases</p>
                      {comp.htsCode.adcvdCases.map(adc => (
                        <div key={adc.caseNumber} className="flex items-center gap-4 text-xs">
                          <span className="text-orange-400 font-mono">{adc.caseNumber}</span>
                          <Badge label={adc.type} variant="orange" />
                          <span className="text-slate-300">{adc.country} — Rate: <strong className="text-orange-300">{adc.rate}</strong></span>
                          <span className="text-slate-500">Effective: {adc.effectiveDate}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Imports by country */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">Top Import Countries for this HTS</p>
                    <div className="flex flex-wrap gap-2">
                      {comp.htsCode.importsByCountry.map(ic => (
                        <div key={ic.countryCode} className="flex items-center gap-2 bg-[var(--c-raised)] border border-[var(--c-border)] rounded-lg px-3 py-1.5">
                          <span className="text-xs font-semibold text-slate-300">{ic.country}</span>
                          <span className="text-xs text-slate-500">{ic.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  {comp.documents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">Supporting Documents</p>
                      <div className="space-y-2">
                        {comp.documents.map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-[var(--c-raised)] rounded-lg">
                            <div className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${docTypeColors[doc.type] || docTypeColors.OTHER}`}>
                              {doc.type.replace('_', ' ')}
                            </div>
                            <span className="text-xs text-slate-300 flex-1">{doc.name}</span>
                            <span className="text-[10px] text-slate-500">{doc.size}</span>
                            <button className="w-6 h-6 rounded bg-[var(--c-surface)] flex items-center justify-center text-slate-400 hover:text-blue-400">
                              <Eye size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'genealogy' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <GitBranch size={12} />
            <span>Process sequence — ordered from first operation to final assembly</span>
          </div>
          {product.processes.map((proc, idx) => {
            const insp = proc.vlxInspectionId ? mockInspections.find(i => i.id === proc.vlxInspectionId) : null;
            return (
              <div key={proc.id} className="flex items-start gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center flex-shrink-0 mt-4">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    proc.status === 'verified' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : proc.status === 'flagged' ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < product.processes.length - 1 && (
                    <div className="w-px h-full min-h-8 bg-[#253352] mt-1" />
                  )}
                </div>

                {/* Process card */}
                <div className="flex-1 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-200">{proc.name}</h4>
                        <Badge label={proc.type} variant="blue" />
                        <Badge label={proc.status} variant={statusVariant(proc.status)} />
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-400">{proc.supplierName}</span>
                        <span className="text-xs text-slate-500">{proc.country} ({proc.countryCode})</span>
                        <span className="text-xs text-slate-500">{proc.startDate} → {proc.endDate || 'ongoing'}</span>
                      </div>
                      {proc.notes && (
                        <p className="text-xs text-slate-400 mt-2 bg-[var(--c-raised)] rounded px-3 py-2">{proc.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="flex items-center gap-1.5 text-xs bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 px-2.5 py-1.5 rounded-lg hover:border-blue-500/30 transition-colors">
                        <FileText size={12} /> Attach Doc
                      </button>
                    </div>
                  </div>

                  {/* VLX Inspection */}
                  {insp && (
                    <div className="mt-3 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-blue-400">VLX</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-300">{insp.title}</p>
                        <p className="text-[10px] text-slate-500">{insp.inspectorName} · {insp.date}</p>
                      </div>
                      {insp.score && (
                        <span className={`text-sm font-bold ${insp.score >= 85 ? 'text-emerald-400' : insp.score >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
                          {insp.score}/100
                        </span>
                      )}
                    </div>
                  )}

                  {/* Documents */}
                  {proc.documents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {proc.documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-1.5 text-[10px] bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-400 px-2 py-1 rounded">
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

          {/* Final Assembly */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center flex-shrink-0 mt-4">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 bg-blue-500/10 flex items-center justify-center">
                <CheckCircle size={14} className="text-blue-400" />
              </div>
            </div>
            <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-4">
              <h4 className="text-sm font-semibold text-blue-300">Final Assembly Complete</h4>
              <p className="text-xs text-slate-400 mt-1">{product.finalAssemblyCountry} — Ready for export</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hts' && (
        <div className="space-y-4">
          {/* Product HTS */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Finished Product Classification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">HTS Code</p>
                <p className="text-lg font-mono font-bold text-blue-300 mt-1">{product.htsCode.code}</p>
                <p className="text-xs text-slate-400 mt-1">{product.htsCode.description}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">MFN Duty Rate</p>
                <p className={`text-lg font-bold mt-1 ${product.htsCode.dutyRate === '0%' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {product.htsCode.dutyRate}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Major Importing Countries</p>
              <div className="space-y-2">
                {product.htsCode.importsByCountry.map(ic => (
                  <div key={ic.countryCode} className="flex items-center gap-3">
                    <span className="w-8 text-xs font-semibold text-slate-300 text-center bg-[var(--c-raised)] py-0.5 rounded">{ic.countryCode}</span>
                    <span className="text-xs text-slate-400 flex-1">{ic.country}</span>
                    <span className="text-xs font-semibold text-slate-300">{ic.value}/yr</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Component HTS codes */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Component HTS Classifications</h3>
            <div className="space-y-4">
              {product.components.map(comp => (
                <div key={comp.id} className="border border-[var(--c-border)] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{comp.name}</p>
                      <p className="text-xs font-mono text-blue-300 mt-0.5">{comp.htsCode.code}</p>
                      <p className="text-xs text-slate-400">{comp.htsCode.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">Duty</p>
                      <p className={`text-sm font-bold ${comp.htsCode.dutyRate === '0%' ? 'text-emerald-400' : 'text-yellow-400'}`}>{comp.htsCode.dutyRate}</p>
                    </div>
                  </div>
                  {comp.htsCode.adcvdCases.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-400">
                      <AlertTriangle size={12} />
                      {comp.htsCode.adcvdCases.map(c => `${c.type} Case ${c.caseNumber} (${c.country}): ${c.rate}`).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[var(--c-border)]">
            <h3 className="text-sm font-semibold text-slate-200">Product Documents</h3>
            <button className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={12} /> Upload Document
            </button>
          </div>
          <div className="p-4 space-y-2">
            {product.documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-[var(--c-raised)] rounded-lg group hover:bg-[#253352] transition-colors">
                <div className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${docTypeColors[doc.type] || docTypeColors.OTHER}`}>
                  {doc.type.replace('_', ' ')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-500">{doc.uploadedAt} · {doc.size}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-6 h-6 rounded bg-[var(--c-surface)] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                    <Eye size={11} />
                  </button>
                  <button className="w-6 h-6 rounded bg-[var(--c-surface)] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                    <Download size={11} />
                  </button>
                </div>
              </div>
            ))}
            {product.documents.length === 0 && (
              <div className="text-center py-12">
                <FileText size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No documents attached</p>
                <p className="text-xs text-slate-500 mt-1">Upload invoices, certs of origin, inspection reports, and more</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'skus' && (
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[var(--c-border)]">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">SKU Batches</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {product.skus.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} total units across {product.skus.length} SKUs
              </p>
            </div>
            <button className="flex items-center gap-1.5 text-xs bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 px-3 py-1.5 rounded-lg hover:border-blue-500/30 transition-colors">
              <Plus size={12} /> Add SKU
            </button>
          </div>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--c-border)]">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">SKU</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">Description</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-border)]">
                {product.skus.map(sku => (
                  <tr key={sku.sku} className="hover:bg-[var(--c-raised)] transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-slate-500" />
                        <span className="text-sm font-mono text-blue-300">{sku.sku}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-400">{sku.description || '—'}</td>
                    <td className="py-3 text-right text-sm font-semibold text-slate-200">{sku.quantity.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
