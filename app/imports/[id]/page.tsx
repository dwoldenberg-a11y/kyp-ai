'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Truck, FileText, Package, MapPin, DollarSign,
  AlertTriangle, CheckCircle, Download, Eye, GitBranch, Map
} from 'lucide-react';
import { mockImports, mockProducts } from '@/lib/mockData';
import Badge, { statusVariant } from '@/components/ui/Badge';
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

export default function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const imp = mockImports.find(i => i.id === id);

  if (!imp) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Import entry not found.</p>
      </div>
    );
  }

  const linkedProducts = imp.products.map(p =>
    mockProducts.find(mp => mp.id === p.productId)
  ).filter(Boolean);

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/imports" className="w-8 h-8 rounded-lg bg-[#151E33] border border-[#253352] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-mono text-blue-300">{imp.entryNumber}</h2>
              <Badge
                label={imp.status.charAt(0).toUpperCase() + imp.status.slice(1)}
                variant={statusVariant(imp.status)}
                pulse={imp.status === 'flagged'}
                size="md"
              />
            </div>
            <p className="text-sm text-slate-400 mt-1">{imp.entryType} · {imp.importerOfRecord}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/map?import=${imp.id}`} className="flex items-center gap-2 bg-[#1C2844] border border-[#253352] text-slate-300 text-sm px-3 py-2 rounded-lg hover:border-blue-500/30 transition-colors">
            <Map size={14} />
            Supply Chain Map
          </Link>
          <Link href={`/genealogy?import=${imp.id}`} className="flex items-center gap-2 bg-[#1C2844] border border-[#253352] text-slate-300 text-sm px-3 py-2 rounded-lg hover:border-blue-500/30 transition-colors">
            <GitBranch size={14} />
            Product Genealogy
          </Link>
        </div>
      </div>

      {imp.status === 'flagged' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{imp.notes}</p>
        </div>
      )}

      {/* Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Port of Entry', value: imp.portOfEntry, sub: `Code: ${imp.portCode}` },
          { label: 'Entry Date', value: imp.entryDate, sub: imp.releaseDate ? `Released: ${imp.releaseDate}` : 'Pending release' },
          { label: 'Vessel / Voyage', value: imp.vesselName || '—', sub: imp.voyageNumber || '—' },
          { label: 'BOL Number', value: imp.bolNumber, sub: `${imp.products.length} product line(s)` },
        ].map(item => (
          <div key={item.label} className="bg-[#151E33] border border-[#253352] rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{item.label}</p>
            <p className="text-sm font-semibold text-slate-200 mt-1 font-mono">{item.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-slate-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Declared Value</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">${imp.totalValue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{imp.currency}</p>
        </div>
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-yellow-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Duties</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400">${imp.totalDuties.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Includes tariffs & fees</p>
        </div>
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-slate-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Countries of Origin</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {imp.countriesOfOrigin.map(c => (
              <span key={c} className="text-sm font-semibold text-slate-200 bg-[#1C2844] border border-[#253352] px-2 py-0.5 rounded">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Product Lines */}
        <div className="bg-[#151E33] border border-[#253352] rounded-xl">
          <div className="flex items-center gap-3 p-5 border-b border-[#253352]">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Package size={16} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Product Lines</h3>
              <p className="text-xs text-slate-400">{imp.products.length} product(s) on this entry</p>
            </div>
          </div>
          <div className="divide-y divide-[#253352]">
            {imp.products.map((p, i) => {
              const fullProduct = linkedProducts.find(lp => lp?.id === p.productId);
              return (
                <div key={i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/products/${p.productId}`} className="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors">
                          {p.productName}
                        </Link>
                        {fullProduct && (
                          <ScoreRingInline score={fullProduct.score.overall} size={36} strokeWidth={4} />
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">HTS: {p.htsCode}</p>
                      <div className="grid grid-cols-2 gap-x-4 mt-2">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Quantity</p>
                          <p className="text-xs font-semibold text-slate-300">{p.quantity.toLocaleString()} {p.unit}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Value</p>
                          <p className="text-xs font-semibold text-slate-300">${p.value.toLocaleString()}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] text-slate-500 uppercase">COO</p>
                          <p className="text-xs font-semibold text-slate-300">{p.countryOfOrigin} ({p.countryOfOriginCode})</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] text-slate-500 uppercase">Duty Rate</p>
                          <p className={`text-xs font-semibold ${p.dutyRate === '0%' ? 'text-emerald-400' : 'text-yellow-400'}`}>{p.dutyRate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">Duties Paid</p>
                      <p className={`text-lg font-bold ${p.dutyPaid === 0 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        ${p.dutyPaid.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-[#151E33] border border-[#253352] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#253352]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Entry Documents</h3>
                <p className="text-xs text-slate-400">{imp.documents.length} document(s) attached</p>
              </div>
            </div>
            <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              + Upload
            </button>
          </div>
          <div className="p-4 space-y-2">
            {imp.documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-[#1C2844] rounded-lg group hover:bg-[#253352] transition-colors">
                <div className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${docTypeColors[doc.type] || docTypeColors.OTHER}`}>
                  {doc.type.replace('_', ' ')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-500">{doc.uploadedAt} · {doc.size}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-6 h-6 rounded bg-[#151E33] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                    <Eye size={11} />
                  </button>
                  <button className="w-6 h-6 rounded bg-[#151E33] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                    <Download size={11} />
                  </button>
                </div>
              </div>
            ))}
            {imp.documents.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-8">No documents attached yet</p>
            )}
          </div>

          {/* Required docs checklist */}
          <div className="px-4 pb-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Required Documents</p>
            <div className="space-y-1.5">
              {[
                { label: 'Bill of Lading (BOL)', type: 'BOL' },
                { label: 'Importer Security Filing (ISF)', type: 'ISF' },
                { label: 'CBP Entry Form 7501', type: 'ENTRY_FORM' },
                { label: 'Commercial Invoice', type: 'COMMERCIAL_INVOICE' },
                { label: 'Certificate of Origin', type: 'CERT_OF_ORIGIN' },
              ].map(req => {
                const hasDoc = imp.documents.some(d => d.type === req.type);
                return (
                  <div key={req.type} className="flex items-center gap-2">
                    {hasDoc
                      ? <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                      : <div className="w-3 h-3 rounded-full border border-slate-500 flex-shrink-0" />
                    }
                    <span className={`text-xs ${hasDoc ? 'text-slate-300' : 'text-slate-500'}`}>{req.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Supply Chain Route */}
      <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <MapPin size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Supply Chain Route</h3>
            <p className="text-xs text-slate-400">Origin → transit → port of entry</p>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {imp.coordinates.map((coord, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 ${i === imp.coordinates.length - 1 ? 'bg-blue-500 border-blue-400' : 'bg-[#253352] border-[#4A5568]'}`} />
                <div className="mt-2 bg-[#1C2844] border border-[#253352] rounded-lg px-3 py-2 text-center min-w-[120px]">
                  <p className="text-xs font-semibold text-slate-200">{coord.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{coord.country} ({coord.countryCode})</p>
                </div>
              </div>
              {i < imp.coordinates.length - 1 && (
                <div className="flex items-center gap-1 mb-8">
                  <div className="w-8 h-px bg-[#253352]" />
                  <span className="text-slate-500">→</span>
                  <div className="w-8 h-px bg-[#253352]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
