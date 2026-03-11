'use client';

import { Bell, Search, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Import Dashboard', subtitle: 'Overview of all imports, products, and compliance status' },
  '/imports': { title: 'Imports', subtitle: 'CBP entry management, duties, and BOL tracking' },
  '/products': { title: 'Products', subtitle: 'Product registry with HTS codes and traceability scoring' },
  '/suppliers': { title: 'Suppliers', subtitle: 'Supplier registry with OFAC checks and risk scoring' },
  '/map': { title: 'Supply Chain Map', subtitle: 'Global visualization of product origin and routing' },
  '/genealogy': { title: 'Product Genealogy', subtitle: 'Process maps and component traceability' },
  '/documents': { title: 'Documents', subtitle: 'Upload and manage import documents with OCR extraction' },
  '/compliance': { title: 'Compliance Center', subtitle: 'OFAC, AD/CVD, HTS, and regulatory monitoring' },
};

export default function TopBar() {
  const pathname = usePathname();
  const page = pageTitles[pathname] || pageTitles['/'];

  return (
    <header className="h-16 bg-[#0F1729] border-b border-[#253352] flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold text-slate-200">{page.title}</h1>
        <p className="text-xs text-slate-500">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search entries, products..."
            className="bg-[#1C2844] border border-[#253352] text-slate-300 text-xs rounded-lg pl-8 pr-4 py-2 w-56 focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
          />
        </div>

        {/* New Import button */}
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
          <Plus size={14} />
          New Import
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg bg-[#1C2844] border border-[#253352] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
