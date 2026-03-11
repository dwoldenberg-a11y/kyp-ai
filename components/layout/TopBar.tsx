'use client';

import { Bell, Search, Plus, Sun, Moon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-provider';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Import Dashboard', subtitle: 'Overview of all imports, products, and compliance status' },
  '/imports': { title: 'Imports', subtitle: 'CBP entry management, duties, and BOL tracking' },
  '/imports/new': { title: 'New Import', subtitle: 'Create an import entry from an entry packet or manually' },
  '/products': { title: 'Products', subtitle: 'Product registry with HTS codes and traceability scoring' },
  '/suppliers': { title: 'Suppliers', subtitle: 'Supplier registry with OFAC checks and risk scoring' },
  '/map': { title: 'Supply Chain Map', subtitle: 'Global visualization of product origin and routing' },
  '/genealogy': { title: 'Product Genealogy', subtitle: 'Process maps and component traceability' },
  '/documents': { title: 'Documents', subtitle: 'Upload and manage import documents with OCR extraction' },
  '/compliance': { title: 'Compliance Center', subtitle: 'OFAC, AD/CVD, HTS, and regulatory monitoring' },
};

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // match longest prefix
  const pageKey = Object.keys(pageTitles)
    .filter(k => pathname === k || (k !== '/' && pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0] || '/';
  const page = pageTitles[pageKey];

  return (
    <header className="h-16 bg-[var(--c-nav)] border-b border-[var(--c-border)] flex items-center justify-between px-6 sticky top-0 z-10 transition-colors">
      <div>
        <h1 className="text-sm font-semibold text-slate-200">{page.title}</h1>
        <p className="text-xs text-slate-500">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search entries, products..."
            className="bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 text-xs rounded-lg pl-8 pr-4 py-2 w-52 focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
          />
        </div>

        {/* New Import */}
        <button
          onClick={() => router.push('/imports/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} />
          New Import
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-8 h-8 rounded-lg bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
