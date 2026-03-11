'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  FileText,
  Map,
  GitBranch,
  Shield,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Imports',
    href: '/imports',
    icon: Truck,
    badge: '2',
  },
  {
    label: 'Products',
    href: '/products',
    icon: Package,
    badge: '2',
  },
  {
    label: 'Suppliers',
    href: '/suppliers',
    icon: Users,
    badge: '1 ⚠',
  },
  {
    label: 'Supply Chain Map',
    href: '/map',
    icon: Map,
  },
  {
    label: 'Product Genealogy',
    href: '/genealogy',
    icon: GitBranch,
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    label: 'Compliance',
    href: '/compliance',
    icon: Shield,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-[var(--c-nav)] border-r border-[var(--c-border)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--c-border)]">
        {/* VLX Logo Mark */}
        <div className="relative w-8 h-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
            <rect width="32" height="32" rx="8" fill="#1E6FFF" fillOpacity="0.15" />
            <path d="M6 8L12 24L16 14L20 24L26 8" stroke="#1E6FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="14" r="2" fill="#FF6B2C"/>
          </svg>
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-wider">VLX</span>
          <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-widest uppercase">Product Passport</span>
        </div>
      </div>

      {/* KYPiT Badge */}
      <div className="mx-4 mt-3 mb-1">
        <div className="flex items-center gap-2 bg-[var(--c-raised)] border border-[var(--c-border)] rounded-lg px-3 py-2">
          <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center">
            <span className="text-[9px] font-bold text-orange-400">K</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-orange-400 tracking-wider">KYPiT</span>
            <span className="text-[9px] text-slate-500 block">Validation Active</span>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 status-pulse" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-2 mb-2">Navigation</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 group transition-all
                ${isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[var(--c-raised)]'
                }
              `}
            >
              <item.icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.badge.includes('⚠') ? 'bg-red-500/20 text-red-400' : 'bg-[#253352] text-slate-400'}`}>
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight size={12} className="text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--c-border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
            T
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">TechVault Industries</p>
            <p className="text-[10px] text-slate-500">Importer of Record</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
