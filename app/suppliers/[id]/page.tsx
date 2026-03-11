'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Shield, CheckCircle, AlertTriangle, XCircle,
  Clock, FileText, Download, Eye, Plus, Wrench
} from 'lucide-react';
import { mockSuppliers, mockInspections } from '@/lib/mockData';
import Badge, { statusVariant, riskVariant } from '@/components/ui/Badge';
import { ScoreRingInline } from '@/components/ui/ScoreRing';

const checkStatusIcon = {
  pass: <CheckCircle size={14} className="text-emerald-400" />,
  fail: <XCircle size={14} className="text-red-400" />,
  warn: <AlertTriangle size={14} className="text-yellow-400" />,
  pending: <Clock size={14} className="text-slate-400" />,
};

const checkStatusBg = {
  pass: 'bg-emerald-500/10 border-emerald-500/20',
  fail: 'bg-red-500/10 border-red-500/20',
  warn: 'bg-yellow-500/10 border-yellow-500/20',
  pending: 'bg-slate-500/10 border-slate-500/20',
};

const docTypeColors: Record<string, string> = {
  MTR: 'bg-orange-500/20 text-orange-300',
  QUALITY_REPORT: 'bg-cyan-500/20 text-cyan-300',
  TECHNICAL_DOC: 'bg-slate-500/20 text-slate-300',
  INSPECTION: 'bg-indigo-500/20 text-indigo-300',
  OTHER: 'bg-slate-500/20 text-slate-300',
};

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supplier = mockSuppliers.find(s => s.id === id);

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Supplier not found.</p>
      </div>
    );
  }

  const linkedInspections = supplier.vlxInspectionIds.map(id => mockInspections.find(i => i.id === id)).filter(Boolean);
  const checksByCategory = supplier.checks.reduce((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, typeof supplier.checks>);

  const passCount = supplier.checks.filter(c => c.status === 'pass').length;
  const failCount = supplier.checks.filter(c => c.status === 'fail').length;
  const warnCount = supplier.checks.filter(c => c.status === 'warn').length;

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/suppliers" className="w-8 h-8 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-100">{supplier.name}</h2>
              <Badge label={supplier.status} variant={statusVariant(supplier.status)} size="md" />
              <Badge label={`${supplier.riskLevel} risk`} variant={riskVariant(supplier.riskLevel)} size="md" />
            </div>
            <p className="text-sm text-slate-400 mt-1">{supplier.city}, {supplier.country} ({supplier.countryCode})</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreRingInline score={supplier.score} size={72} strokeWidth={6} />
          <div>
            <p className="text-xs text-slate-500">Supplier Score</p>
            <p className="text-xs text-slate-400">Last updated {supplier.updatedAt}</p>
          </div>
        </div>
      </div>

      {/* OFAC Banner */}
      <div className={`rounded-xl p-4 flex items-center gap-3 border ${
        supplier.ofacCheck.status === 'clear'
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <Shield size={18} className={supplier.ofacCheck.status === 'clear' ? 'text-emerald-400' : 'text-red-400'} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${supplier.ofacCheck.status === 'clear' ? 'text-emerald-300' : 'text-red-300'}`}>
            OFAC Sanctions Check — {supplier.ofacCheck.status === 'clear' ? 'CLEAR' : 'FLAGGED'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Last checked: {supplier.ofacCheck.checkedAt}
            {supplier.ofacCheck.details && ` · ${supplier.ofacCheck.details}`}
          </p>
        </div>
        <button className="text-xs bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 px-3 py-1.5 rounded-lg hover:border-blue-500/30 transition-colors">
          Re-run Check
        </button>
      </div>

      {/* Check Summary Bar */}
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Compliance Summary</h3>
          <p className="text-xs text-slate-500">{passCount}/{supplier.checks.length} checks passing</p>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          <div className="bg-emerald-500 rounded-l-full" style={{ width: `${(passCount / supplier.checks.length) * 100}%` }} />
          <div className="bg-yellow-500" style={{ width: `${(warnCount / supplier.checks.length) * 100}%` }} />
          <div className="bg-red-500 rounded-r-full" style={{ width: `${(failCount / supplier.checks.length) * 100}%` }} />
        </div>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> {passCount} Passing
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500" /> {warnCount} Warnings
          </div>
          <div className="flex items-center gap-2 text-xs text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500" /> {failCount} Failed
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Checks by Category */}
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl">
          <div className="flex items-center gap-3 p-5 border-b border-[var(--c-border)]">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield size={16} className="text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Compliance Checks</h3>
          </div>
          <div className="p-4 space-y-5">
            {Object.entries(checksByCategory).map(([category, checks]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</p>
                <div className="space-y-2">
                  {checks.map((check, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${checkStatusBg[check.status]}`}>
                      <div className="mt-0.5 flex-shrink-0">{checkStatusIcon[check.status]}</div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-200">{check.label}</p>
                        {check.notes && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{check.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Capabilities */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--c-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Wrench size={16} className="text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">Capabilities</h3>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {supplier.capabilities.map(cap => (
                <div key={cap.tag} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
                  cap.verified
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-[var(--c-raised)] border-[var(--c-border)] text-slate-400'
                }`}>
                  {cap.verified ? <CheckCircle size={11} /> : <Clock size={11} />}
                  {cap.tag}
                  {!cap.verified && <span className="text-[10px] text-slate-500 ml-1">(unverified)</span>}
                </div>
              ))}
            </div>
          </div>

          {/* VLX Inspections */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--c-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-indigo-400">VLX</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-200">VLX Inspections</h3>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Assign
              </button>
            </div>
            <div className="p-4 space-y-3">
              {linkedInspections.map(insp => insp && (
                <div key={insp.id} className="bg-[var(--c-raised)] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{insp.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{insp.inspectorName} · {insp.date}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                      {insp.findings.map((f, i) => (
                        <p key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                          <span className="text-slate-600 mt-0.5">•</span> {f}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {linkedInspections.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No inspections assigned</p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--c-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
                  <FileText size={16} className="text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">Documents</h3>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">+ Upload</button>
            </div>
            <div className="p-4 space-y-2">
              {supplier.documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-[var(--c-raised)] rounded-lg group hover:bg-[#253352] transition-colors">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${docTypeColors[doc.type] || docTypeColors.OTHER}`}>
                    {doc.type.replace('_', ' ')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-500">{doc.uploadedAt} · {doc.size}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 rounded bg-[var(--c-surface)] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                      <Eye size={11} />
                    </button>
                    <button className="w-6 h-6 rounded bg-[var(--c-surface)] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                      <Download size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {supplier.documents.length === 0 && (
                <p className="text-center text-xs text-slate-500 py-4">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
