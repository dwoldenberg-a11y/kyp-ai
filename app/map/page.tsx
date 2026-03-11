'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Map, Package, Truck, ChevronRight, MapPin } from 'lucide-react';
import { mockImports, mockProducts } from '@/lib/mockData';
import Badge, { statusVariant } from '@/components/ui/Badge';
import { ScoreRingInline } from '@/components/ui/ScoreRing';

// Dynamic import to avoid SSR issues with Leaflet
const SupplyChainMap = dynamic(() => import('@/components/map/SupplyChainMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[#0B1120] rounded-xl" style={{ height: '500px' }}>
      <div className="text-center">
        <Map size={32} className="text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Loading map...</p>
      </div>
    </div>
  ),
});

type ViewMode = 'imports' | 'products';

export default function MapPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('imports');
  const [selectedImport, setSelectedImport] = useState<string | null>(mockImports[0]?.id || null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(mockProducts[0]?.id || null);

  const selectedImp = mockImports.find(i => i.id === selectedImport);
  const selectedProd = mockProducts.find(p => p.id === selectedProduct);

  // Build routes for current selection
  const routes = viewMode === 'imports'
    ? selectedImp ? [selectedImp.coordinates] : []
    : selectedProd
      ? [[
          ...selectedProd.components.map(c => c.coordinates),
          ...selectedProd.processes.map(p => p.coordinates),
          selectedProd.finalAssemblyCoordinates,
        ]]
      : [];

  return (
    <div className="space-y-6 fade-in">

      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Supply Chain Map</h2>
          <p className="text-sm text-slate-400 mt-0.5">Global visualization of product origin and routing</p>
        </div>
        <div className="flex items-center gap-1 bg-[#151E33] border border-[#253352] rounded-lg p-1">
          <button
            onClick={() => setViewMode('imports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'imports' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck size={14} /> Imports
          </button>
          <button
            onClick={() => setViewMode('products')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'products' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package size={14} /> Products
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Selector Panel */}
        <div className="lg:col-span-1">
          <div className="bg-[#151E33] border border-[#253352] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#253352]">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {viewMode === 'imports' ? 'Select Import' : 'Select Product'}
              </p>
            </div>
            <div className="divide-y divide-[#253352]">
              {viewMode === 'imports'
                ? mockImports.map(imp => (
                    <button
                      key={imp.id}
                      onClick={() => setSelectedImport(imp.id)}
                      className={`w-full text-left p-4 hover:bg-[#1C2844] transition-colors ${selectedImport === imp.id ? 'bg-blue-600/10 border-l-2 border-blue-500' : ''}`}
                    >
                      <p className="text-xs font-mono font-semibold text-blue-300">{imp.entryNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{imp.portOfEntry}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={10} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500">{imp.countriesOfOrigin.join(', ')}</span>
                      </div>
                    </button>
                  ))
                : mockProducts.map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod.id)}
                      className={`w-full text-left p-4 hover:bg-[#1C2844] transition-colors ${selectedProduct === prod.id ? 'bg-blue-600/10 border-l-2 border-blue-500' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <ScoreRingInline score={prod.score.overall} size={32} strokeWidth={3} />
                        <div>
                          <p className="text-xs font-medium text-slate-200 line-clamp-1">{prod.name}</p>
                          <p className="text-[10px] text-slate-500">{prod.finalAssemblyCountry}</p>
                        </div>
                      </div>
                    </button>
                  ))
              }
            </div>
          </div>

          {/* Route Legend */}
          {viewMode === 'imports' && selectedImp && (
            <div className="mt-4 bg-[#151E33] border border-[#253352] rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Route</p>
              <div className="space-y-2">
                {selectedImp.coordinates.map((coord, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${i === selectedImp.coordinates.length - 1 ? 'bg-blue-500 border-blue-400' : 'bg-[#253352] border-[#4A5568]'}`} />
                    <div>
                      <p className="text-xs text-slate-300">{coord.label}</p>
                      <p className="text-[10px] text-slate-500">{coord.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-[#151E33] border border-[#253352] rounded-xl overflow-hidden">
            <Suspense fallback={
              <div className="flex items-center justify-center bg-[#0B1120]" style={{ height: '500px' }}>
                <p className="text-slate-400">Loading map...</p>
              </div>
            }>
              <SupplyChainMap routes={routes} height="500px" />
            </Suspense>
          </div>

          {/* Selected item details */}
          {viewMode === 'imports' && selectedImp && (
            <div className="mt-4 bg-[#151E33] border border-[#253352] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-semibold text-blue-300">{selectedImp.entryNumber}</p>
                  <p className="text-xs text-slate-400">{selectedImp.portOfEntry} · {selectedImp.entryDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={selectedImp.status} variant={statusVariant(selectedImp.status)} />
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-200">${selectedImp.totalValue.toLocaleString()}</p>
                    <p className="text-xs text-yellow-400">Duties: ${selectedImp.totalDuties.toLocaleString()}</p>
                  </div>
                  <Link href={`/imports/${selectedImp.id}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    View Entry <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span>BOL: {selectedImp.bolNumber}</span>
                <span>·</span>
                <span>Vessel: {selectedImp.vesselName}</span>
                <span>·</span>
                <span>{selectedImp.products.length} product(s)</span>
              </div>
            </div>
          )}

          {viewMode === 'products' && selectedProd && (
            <div className="mt-4 bg-[#151E33] border border-[#253352] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ScoreRingInline score={selectedProd.score.overall} size={48} strokeWidth={5} />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{selectedProd.name}</p>
                    <p className="text-xs text-slate-400">{selectedProd.components.length} components · {selectedProd.processes.length} processes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={selectedProd.status} variant={statusVariant(selectedProd.status)} />
                  <Link href={`/products/${selectedProd.id}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    View Product <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
