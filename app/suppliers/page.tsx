'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, ArrowRight, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { mockSuppliers } from '@/lib/mockData';
import Badge, { statusVariant, riskVariant } from '@/components/ui/Badge';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');

  const filtered = mockSuppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Supplier Registry</h2>
          <p className="text-sm text-slate-400 mt-0.5">OFAC checks, capability assessment, and risk scoring</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} />
          Add Supplier
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Suppliers</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{mockSuppliers.length}</p>
        </div>
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">OFAC Clear</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{mockSuppliers.filter(s => s.ofacCheck.status === 'clear').length}</p>
        </div>
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">High Risk</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{mockSuppliers.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length}</p>
        </div>
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Score</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {Math.round(mockSuppliers.reduce((s, sup) => s + sup.score, 0) / mockSuppliers.length)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          type="text"
          placeholder="Search suppliers by name, country, or city..."
          className="w-full bg-[var(--c-surface)] border border-[var(--c-border)] text-slate-300 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
        />
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map(sup => (
          <Link key={sup.id} href={`/suppliers/${sup.id}`} className="block">
            <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5 card-hover group">
              <div className="flex items-start gap-4">
                {/* Country Badge */}
                <div className="w-12 h-12 rounded-xl bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-base font-bold text-slate-300 flex-shrink-0">
                  {sup.countryCode}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-200">{sup.name}</h3>
                        <Badge label={sup.status} variant={statusVariant(sup.status)} />
                        <Badge label={sup.riskLevel} variant={riskVariant(sup.riskLevel)} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{sup.city}, {sup.country}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Score */}
                      <div className="text-center">
                        <span className={`text-2xl font-bold ${sup.score >= 85 ? 'text-emerald-400' : sup.score >= 70 ? 'text-yellow-400' : sup.score >= 50 ? 'text-orange-400' : 'text-red-400'}`}>
                          {sup.score}
                        </span>
                        <p className="text-[10px] text-slate-500">/100 Score</p>
                      </div>
                      <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>

                  {/* OFAC & checks summary */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`flex items-center gap-1.5 text-xs ${sup.ofacCheck.status === 'clear' ? 'text-emerald-400' : 'text-red-400'}`}>
                      <Shield size={12} />
                      OFAC: {sup.ofacCheck.status === 'clear' ? 'Clear' : 'FLAGGED'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CheckCircle size={12} />
                      {sup.checks.filter(c => c.status === 'pass').length}/{sup.checks.length} checks pass
                    </div>
                    {sup.checks.some(c => c.status === 'fail') && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertTriangle size={12} />
                        {sup.checks.filter(c => c.status === 'fail').length} failed check(s)
                      </div>
                    )}
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {sup.capabilities.slice(0, 4).map(cap => (
                      <span key={cap.tag} className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        cap.verified
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-[var(--c-raised)] border-[var(--c-border)] text-slate-500'
                      }`}>
                        {cap.verified ? '✓ ' : ''}{cap.tag}
                      </span>
                    ))}
                    {sup.capabilities.length > 4 && (
                      <span className="text-[10px] text-slate-500 px-2 py-0.5">+{sup.capabilities.length - 4} more</span>
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
