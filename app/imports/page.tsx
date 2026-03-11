'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Truck, Plus, Search, Filter, ArrowRight, MapPin, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import { mockImports } from '@/lib/mockData';
import Badge, { statusVariant } from '@/components/ui/Badge';

export default function ImportsPage() {
  const [search, setSearch] = useState('');

  const filtered = mockImports.filter(imp =>
    imp.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
    imp.importerOfRecord.toLowerCase().includes(search.toLowerCase()) ||
    imp.bolNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalDuties = mockImports.reduce((sum, i) => sum + i.totalDuties, 0);
  const totalValue = mockImports.reduce((sum, i) => sum + i.totalValue, 0);

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Import Entries</h2>
          <p className="text-sm text-slate-400 mt-0.5">CBP formal entries — duties, tariffs, and BOL tracking</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} />
          New Import
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Entries</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{mockImports.length}</p>
          <p className="text-xs text-slate-500 mt-1">All time</p>
        </div>
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Duties Paid</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">${totalDuties.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Across all entries</p>
        </div>
        <div className="bg-[#151E33] border border-[#253352] rounded-xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Import Value</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">${totalValue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">CIF declared value</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            type="text"
            placeholder="Search by entry number, importer, or BOL..."
            className="w-full bg-[#151E33] border border-[#253352] text-slate-300 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
          />
        </div>
        <button className="flex items-center gap-2 bg-[#151E33] border border-[#253352] text-slate-300 text-sm px-4 py-2.5 rounded-lg hover:border-blue-500/30 transition-colors">
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* Imports Table */}
      <div className="bg-[#151E33] border border-[#253352] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#253352]">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Entry Number</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Port</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Entry Date</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Products</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">COO</th>
              <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Value</th>
              <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Duties</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#253352]">
            {filtered.map(imp => (
              <tr key={imp.id} className="hover:bg-[#1C2844] transition-colors group">
                <td className="px-5 py-4">
                  <div>
                    <span className="text-sm font-mono font-semibold text-blue-300">{imp.entryNumber}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{imp.entryType}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-300">
                    <MapPin size={12} className="text-slate-500" />
                    <span>{imp.portOfEntry}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">{imp.entryDate}</td>
                <td className="px-4 py-4">
                  <span className="text-sm text-slate-300">{imp.products.length}</span>
                  <p className="text-xs text-slate-500">{imp.products.map(p => p.productName).join(', ').substring(0, 30)}...</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {imp.countriesOfOrigin.map(c => (
                      <span key={c} className="text-xs bg-[#1C2844] border border-[#253352] text-slate-300 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-semibold text-slate-200">${imp.totalValue.toLocaleString()}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  {imp.totalDuties > 0
                    ? <span className="text-sm font-semibold text-yellow-400">${imp.totalDuties.toLocaleString()}</span>
                    : <span className="text-sm text-emerald-400">$0 (Free)</span>
                  }
                </td>
                <td className="px-4 py-4">
                  <Badge
                    label={imp.status.charAt(0).toUpperCase() + imp.status.slice(1)}
                    variant={statusVariant(imp.status)}
                    pulse={imp.status === 'flagged'}
                  />
                </td>
                <td className="px-4 py-4">
                  <Link href={`/imports/${imp.id}`} className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#253352] hover:bg-blue-600 text-slate-400 hover:text-white transition-colors">
                    <ArrowRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><FileText size={12} /> BOL = Bill of Lading</div>
        <div className="flex items-center gap-1.5"><DollarSign size={12} /> Duties include all CBP-collected fees</div>
        <div className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-orange-400" /> Flagged entries require CBP or compliance review</div>
      </div>

    </div>
  );
}
