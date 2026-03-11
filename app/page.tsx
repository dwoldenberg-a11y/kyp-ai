'use client';

import Link from 'next/link';
import {
  Truck, Package, Users, AlertTriangle, Shield, DollarSign,
  TrendingUp, FileText, ArrowRight, MapPin, CheckCircle, Clock
} from 'lucide-react';
import { mockImports, mockProducts, mockSuppliers, mockDashboardStats } from '@/lib/mockData';
import { StatCard } from '@/components/ui/Card';
import { ScoreRingInline } from '@/components/ui/ScoreRing';
import Badge, { statusVariant } from '@/components/ui/Badge';

export default function Dashboard() {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6 fade-in">

      {/* KYPiT Alert Banner */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={16} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-300">KYPiT Validation Alert</p>
          <p className="text-xs text-orange-400/70 mt-0.5">
            3 items require attention: REACH compliance gap on Entry LAX-2024-7219034-8 · Supplier &ldquo;Hanoi Textile Group&rdquo; flagged · Steel AD/CVD exposure on prod-001
          </p>
        </div>
        <Link href="/compliance" className="flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors flex-shrink-0">
          Review <ArrowRight size={12} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Imports"
          value={stats.totalImports}
          sub="Active CBP entries"
          icon={<Truck size={18} />}
          color="blue"
        />
        <StatCard
          label="Products"
          value={stats.totalProducts}
          sub="Across all entries"
          icon={<Package size={18} />}
          color="blue"
        />
        <StatCard
          label="Suppliers"
          value={stats.totalSuppliers}
          sub="1 flagged for review"
          icon={<Users size={18} />}
          color="orange"
        />
        <StatCard
          label="Flagged Items"
          value={stats.flaggedItems}
          sub="Need attention"
          icon={<AlertTriangle size={18} />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Avg. Traceability"
          value={`${stats.avgTraceabilityScore}%`}
          sub="Across all products"
          icon={<TrendingUp size={18} />}
          color="green"
        />
        <StatCard
          label="Total Duties Paid"
          value={`$${stats.totalDutiesPaid.toLocaleString()}`}
          sub="Current entries"
          icon={<DollarSign size={18} />}
          color="yellow"
        />
        <StatCard
          label="OFAC Flags"
          value={stats.ofacFlags}
          sub="All suppliers clear"
          icon={<Shield size={18} />}
          color="green"
        />
        <StatCard
          label="AD/CVD Exposure"
          value={`${stats.adcvdExposure} item`}
          sub="Review required"
          icon={<AlertTriangle size={18} />}
          color="orange"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Imports */}
        <div className="bg-[#151E33] border border-[#253352] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#253352]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Truck size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Recent Imports</h3>
                <p className="text-xs text-slate-400">CBP entry numbers</p>
              </div>
            </div>
            <Link href="/imports" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[#253352]">
            {mockImports.map((imp) => (
              <Link key={imp.id} href={`/imports/${imp.id}`} className="flex items-center gap-4 p-4 hover:bg-[#1C2844] transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-blue-300">{imp.entryNumber}</span>
                    <Badge
                      label={imp.status.charAt(0).toUpperCase() + imp.status.slice(1)}
                      variant={statusVariant(imp.status)}
                      pulse={imp.status === 'flagged'}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{imp.portOfEntry} · {imp.entryDate}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{imp.products.length} product{imp.products.length > 1 ? 's' : ''}</span>
                    <span className="text-xs text-slate-500">BOL: {imp.bolNumber}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-200">${imp.totalValue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Duties: ${imp.totalDuties.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <MapPin size={10} />
                    {imp.countriesOfOrigin.join(', ')}
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Products with Scores */}
        <div className="bg-[#151E33] border border-[#253352] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#253352]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Package size={16} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Product Passport Scores</h3>
                <p className="text-xs text-slate-400">Traceability & authenticity ratings</p>
              </div>
            </div>
            <Link href="/products" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[#253352]">
            {mockProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="flex items-center gap-4 p-4 hover:bg-[#1C2844] transition-colors group">
                <ScoreRingInline score={product.score.overall} size={52} strokeWidth={5} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200 truncate">{product.name}</span>
                    <Badge
                      label={product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      variant={statusVariant(product.status)}
                      pulse={product.status === 'flagged'}
                    />
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">HTS {product.htsCode.code}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{product.components.length} components</span>
                    <span className="text-xs text-slate-500">{product.processes.length} processes</span>
                    <span className="text-xs text-slate-500">{product.skus.length} SKUs</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Supplier Risk Overview */}
        <div className="bg-[#151E33] border border-[#253352] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#253352]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Supplier Risk</h3>
                <p className="text-xs text-slate-400">OFAC, compliance & capability</p>
              </div>
            </div>
            <Link href="/suppliers" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[#253352]">
            {mockSuppliers.map((sup) => (
              <Link key={sup.id} href={`/suppliers/${sup.id}`} className="flex items-center gap-4 p-4 hover:bg-[#1C2844] transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-[#1C2844] border border-[#253352] flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                  {sup.countryCode}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{sup.name}</span>
                  </div>
                  <p className="text-xs text-slate-400">{sup.city}, {sup.country}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {sup.ofacCheck.status === 'clear'
                      ? <span className="text-[10px] flex items-center gap-1 text-emerald-400"><CheckCircle size={10} /> OFAC Clear</span>
                      : <span className="text-[10px] flex items-center gap-1 text-red-400"><AlertTriangle size={10} /> OFAC Flag</span>
                    }
                    <span className="text-[10px] text-slate-500">·</span>
                    <span className="text-[10px] text-slate-400">{sup.capabilities.length} capabilities</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-lg font-bold ${sup.score >= 85 ? 'text-emerald-400' : sup.score >= 70 ? 'text-yellow-400' : sup.score >= 50 ? 'text-orange-400' : 'text-red-400'}`}>
                    {sup.score}
                  </span>
                  <p className="text-[10px] text-slate-500">/ 100</p>
                </div>
                <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-[#151E33] border border-[#253352] rounded-xl">
          <div className="flex items-center gap-3 p-5 border-b border-[#253352]">
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Clock size={16} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
              <p className="text-xs text-slate-400">System events and KYPiT validations</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[
              { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', msg: 'REACH compliance gap flagged on Hanoi Textile Group', time: '2h ago' },
              { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', msg: 'Entry LAX-2024-7219034-8 released by CBP — flagged for review', time: '6h ago' },
              { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10', msg: 'OFAC check completed — 4 suppliers, all clear', time: '1d ago' },
              { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', msg: 'VLX Inspection vlx-004 completed — Score: 91/100', time: '1d ago' },
              { icon: Package, color: 'text-orange-400', bg: 'bg-orange-500/10', msg: 'Product Passport updated: Industrial Control PCB Assembly', time: '2d ago' },
              { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', msg: 'Entry MIA-2024-8834721-3 verified — USMCA duty-free confirmed', time: '3d ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <item.icon size={12} className={item.color} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-300">{item.msg}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
