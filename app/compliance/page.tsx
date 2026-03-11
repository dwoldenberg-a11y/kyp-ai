'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Globe, DollarSign, Search } from 'lucide-react';
import { mockSuppliers, mockProducts } from '@/lib/mockData';
import Badge from '@/components/ui/Badge';

type Tab = 'ofac' | 'adcvd' | 'hts';

export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>('ofac');

  const allAdcvd = mockProducts.flatMap(p => [
    ...p.htsCode.adcvdCases.map(c => ({ ...c, product: p.name, hts: p.htsCode.code })),
    ...p.components.flatMap(comp =>
      comp.htsCode.adcvdCases.map(c => ({ ...c, product: `${p.name} → ${comp.name}`, hts: comp.htsCode.code }))
    ),
  ]);

  const allHts = [
    ...mockProducts.map(p => ({ code: p.htsCode.code, desc: p.htsCode.description, duty: p.htsCode.dutyRate, product: p.name, adcvd: p.htsCode.adcvdCases.length, countries: p.htsCode.importsByCountry })),
    ...mockProducts.flatMap(p => p.components.map(c => ({
      code: c.htsCode.code,
      desc: c.htsCode.description,
      duty: c.htsCode.dutyRate,
      product: `${p.name} → ${c.name}`,
      adcvd: c.htsCode.adcvdCases.length,
      countries: c.htsCode.importsByCountry,
    }))),
  ];

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100">Compliance Center</h2>
        <p className="text-sm text-slate-400 mt-0.5">OFAC sanctions, AD/CVD cases, and HTS classification monitoring</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-emerald-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider">OFAC Status</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{mockSuppliers.filter(s => s.ofacCheck.status === 'clear').length}/{mockSuppliers.length}</p>
          <p className="text-xs text-slate-500 mt-1">Suppliers clear</p>
        </div>
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider">AD/CVD Cases</p>
          </div>
          <p className="text-2xl font-bold text-orange-400">{allAdcvd.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active cases</p>
        </div>
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={16} className="text-blue-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider">HTS Codes</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{new Set(allHts.map(h => h.code)).size}</p>
          <p className="text-xs text-slate-500 mt-1">Unique classifications</p>
        </div>
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-yellow-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider">Duty Exposure</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400">$55,677</p>
          <p className="text-xs text-slate-500 mt-1">Current entries</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#253352]">
        {[
          { id: 'ofac' as Tab, label: 'OFAC & Sanctions', count: mockSuppliers.length },
          { id: 'adcvd' as Tab, label: 'AD/CVD Cases', count: allAdcvd.length },
          { id: 'hts' as Tab, label: 'HTS Classifications', count: allHts.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className="text-[10px] bg-[#253352] text-slate-400 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* OFAC Tab */}
      {tab === 'ofac' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            All suppliers are checked against OFAC SDN List, BIS Entity List, and UFLPA Entity List.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {mockSuppliers.map(sup => (
              <div key={sup.id} className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1C2844] border border-[#253352] flex items-center justify-center text-sm font-bold text-slate-300">
                    {sup.countryCode}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{sup.name}</h4>
                        <p className="text-xs text-slate-400">{sup.city}, {sup.country}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${sup.ofacCheck.status === 'clear' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sup.ofacCheck.status === 'clear' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          {sup.ofacCheck.status === 'clear' ? 'CLEAR' : 'FLAGGED'}
                        </div>
                        <button className="text-xs bg-[#1C2844] border border-[#253352] text-slate-300 px-2.5 py-1.5 rounded-lg hover:border-blue-500/30 transition-colors">
                          Re-run
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {[
                        { label: 'OFAC SDN List', status: sup.ofacCheck.status === 'clear' ? 'pass' as const : 'fail' as const },
                        { label: 'BIS Entity List', status: 'pass' as const },
                        { label: 'UFLPA List', status: 'pass' as const },
                      ].map(check => (
                        <div key={check.label} className="flex items-center gap-2 bg-[#1C2844] rounded-lg px-3 py-2">
                          {check.status === 'pass'
                            ? <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                            : <XCircle size={12} className="text-red-400 flex-shrink-0" />
                          }
                          <span className={`text-xs ${check.status === 'pass' ? 'text-slate-300' : 'text-red-300'}`}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Last checked: {sup.ofacCheck.checkedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AD/CVD Tab */}
      {tab === 'adcvd' && (
        <div className="space-y-4">
          {allAdcvd.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle size={32} className="text-emerald-400 mb-3" />
              <p className="text-sm font-semibold text-emerald-300">No active AD/CVD cases</p>
              <p className="text-xs text-slate-500 mt-1">All products and components are clear</p>
            </div>
          ) : (
            allAdcvd.map((c, i) => (
              <div key={i} className="bg-[#151E33] border border-orange-500/20 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} className="text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-orange-300">{c.caseNumber}</span>
                          <Badge label={c.type} variant="orange" />
                          <Badge label={c.status} variant={c.status === 'active' ? 'red' : 'gray'} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{c.product}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-orange-400">{c.rate}</p>
                        <p className="text-[10px] text-slate-500">AD/CVD Rate</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Country</p>
                        <p className="text-xs font-semibold text-slate-300">{c.country}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">HTS Code</p>
                        <p className="text-xs font-mono text-blue-300">{c.hts}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Effective Date</p>
                        <p className="text-xs text-slate-300">{c.effectiveDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* HTS Tab */}
      {tab === 'hts' && (
        <div className="bg-[#151E33] border border-[#253352] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#253352]">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">HTS Code</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Product / Component</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Duty Rate</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">AD/CVD</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Top Import Countries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#253352]">
              {allHts.map((h, i) => (
                <tr key={i} className="hover:bg-[#1C2844] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono font-semibold text-blue-300">{h.code}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate">{h.desc}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-300 max-w-[200px]">
                    <p className="truncate">{h.product}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-semibold ${h.duty === '0%' ? 'text-emerald-400' : 'text-yellow-400'}`}>{h.duty}</span>
                  </td>
                  <td className="px-4 py-4">
                    {h.adcvd > 0
                      ? <span className="text-xs text-orange-400 flex items-center gap-1"><AlertTriangle size={11} /> {h.adcvd} case(s)</span>
                      : <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> None</span>
                    }
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {h.countries.slice(0, 3).map(c => (
                        <span key={c.countryCode} className="text-[10px] bg-[#1C2844] border border-[#253352] text-slate-400 px-1.5 py-0.5 rounded">
                          {c.countryCode} {c.value}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
