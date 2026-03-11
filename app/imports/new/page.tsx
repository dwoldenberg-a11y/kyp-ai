'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft, Upload, FileText, Loader2, CheckCircle, AlertTriangle,
  Edit3, Plus, Trash2, ChevronRight, Package, Users, X,
  ZoomIn, RotateCw
} from 'lucide-react';
import { mockProducts, mockSuppliers } from '@/lib/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'processing' | 'review' | 'match' | 'confirm';

interface ExtractedProduct {
  id: string;
  name: string;
  htsCode: string;
  quantity: number;
  unit: string;
  value: number;
  currency: string;
  countryOfOrigin: string;
  dutyRate: string;
  supplierName: string;
  // matching
  matchedProductId?: string;
  matchAction: 'use_existing' | 'create_new' | 'update_existing';
  matchedSupplierId?: string;
  supplierAction: 'use_existing' | 'create_new';
}

interface ExtractedImport {
  entryNumber: string;
  entryType: string;
  importerOfRecord: string;
  portOfEntry: string;
  portCode: string;
  entryDate: string;
  bolNumber: string;
  vesselName: string;
  voyageNumber: string;
  products: ExtractedProduct[];
  confidence: number; // 0-100
}

// ─── OCR simulation data ──────────────────────────────────────────────────────

const MOCK_EXTRACTED: ExtractedImport = {
  entryNumber: 'LAX-2024-9102847-1',
  entryType: 'Type 01 - Formal Consumption Entry',
  importerOfRecord: 'TechVault Industries LLC',
  portOfEntry: 'Port of Long Beach',
  portCode: 'LGB',
  entryDate: '2025-01-15',
  bolNumber: 'COSU621942340',
  vesselName: 'EVER GIVEN II',
  voyageNumber: 'VY2501-04',
  confidence: 91,
  products: [
    {
      id: 'ep-1',
      name: 'Industrial Control PCB Assembly',
      htsCode: '8537.10.9170',
      quantity: 750,
      unit: 'units',
      value: 363750,
      currency: 'USD',
      countryOfOrigin: 'Mexico',
      dutyRate: '0%',
      supplierName: 'Monterrey Assembly Solutions SA de CV',
      matchAction: 'use_existing',
      matchedProductId: 'prod-001',
      supplierAction: 'use_existing',
      matchedSupplierId: 'sup-004',
    },
    {
      id: 'ep-2',
      name: 'Precision Steel Enclosure Kit',
      htsCode: '7326.90.8688',
      quantity: 500,
      unit: 'sets',
      value: 45000,
      currency: 'USD',
      countryOfOrigin: 'China',
      dutyRate: '3.9%',
      supplierName: 'Baosteel Shanghai Co., Ltd.',
      matchAction: 'create_new',
      supplierAction: 'use_existing',
      matchedSupplierId: 'sup-001',
    },
  ],
};

// OCR processing stages
const STAGES = [
  { label: 'Reading document...', duration: 800 },
  { label: 'Analyzing page structure...', duration: 700 },
  { label: 'Extracting entry header data...', duration: 900 },
  { label: 'Parsing product line items...', duration: 1000 },
  { label: 'Extracting HTS codes & duty rates...', duration: 800 },
  { label: 'Identifying suppliers & countries of origin...', duration: 700 },
  { label: 'Matching against existing records...', duration: 600 },
  { label: 'Finalizing extraction...', duration: 400 },
];

const LOW_QUALITY_STAGES = [
  { label: 'Reading document...', duration: 600 },
  { label: 'Image quality below threshold — upscaling to 300 DPI...', duration: 1200 },
  { label: 'Re-analyzing with enhanced image...', duration: 900 },
  { label: 'Extracting entry header data...', duration: 700 },
  { label: 'Parsing product line items...', duration: 1000 },
  { label: 'Extracting HTS codes & duty rates...', duration: 800 },
  { label: 'Identifying suppliers...', duration: 600 },
  { label: 'Matching against existing records...', duration: 500 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: Step; steps: Step[] }) {
  const labels: Record<Step, string> = {
    upload: 'Upload', processing: 'Processing', review: 'Review Data',
    match: 'Match Records', confirm: 'Confirm'
  };
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            i < idx ? 'text-emerald-400' : i === idx ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-slate-500'
          }`}>
            {i < idx ? <CheckCircle size={13} /> : <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">{i+1}</span>}
            {labels[s]}
          </div>
          {i < steps.length - 1 && <ChevronRight size={14} className="text-slate-600 mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('ENTRY_PACKET');
  const [stageIdx, setStageIdx] = useState(0);
  const [stageLog, setStageLog] = useState<string[]>([]);
  const [simulateLowQuality, setSimulateLowQuality] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedImport | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.tiff'] },
    maxFiles: 1,
  });

  // ── Run OCR simulation ───────────────────────────────────────────────────
  const runOCR = async () => {
    setStep('processing');
    const stages = simulateLowQuality ? LOW_QUALITY_STAGES : STAGES;
    setStageLog([]);

    for (let i = 0; i < stages.length; i++) {
      setStageIdx(i);
      setStageLog(prev => [...prev, stages[i].label]);
      await new Promise(r => setTimeout(r, stages[i].duration));
    }

    setExtracted(MOCK_EXTRACTED);
    setStep('review');
  };

  // ── Field helpers ─────────────────────────────────────────────────────────
  const updateField = (field: keyof ExtractedImport, value: string) => {
    setExtracted(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateProduct = (pid: string, field: keyof ExtractedProduct, value: string | number) => {
    setExtracted(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map(p => p.id === pid ? { ...p, [field]: value } : p),
      };
    });
  };

  const removeProduct = (pid: string) => {
    setExtracted(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== pid) } : prev);
  };

  const addProduct = () => {
    const newProd: ExtractedProduct = {
      id: `ep-${Date.now()}`,
      name: '',
      htsCode: '',
      quantity: 0,
      unit: 'units',
      value: 0,
      currency: 'USD',
      countryOfOrigin: '',
      dutyRate: '',
      supplierName: '',
      matchAction: 'create_new',
      supplierAction: 'create_new',
    };
    setExtracted(prev => prev ? { ...prev, products: [...prev.products, newProd] } : prev);
    setEditMode(newProd.id);
  };

  const steps: Step[] = ['upload', 'processing', 'review', 'match', 'confirm'];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">

      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/imports" className="w-8 h-8 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <h2 className="text-lg font-bold text-slate-100">Create New Import</h2>
      </div>

      <StepIndicator current={step} steps={steps} />

      {/* ── STEP 1: UPLOAD ─────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Upload Entry Packet</h3>
            <p className="text-xs text-slate-400">Upload a PDF or image of your CBP entry packet — the system will automatically extract all import details using AI OCR.</p>
          </div>

          {/* Document type */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Document Type</label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: 'ENTRY_PACKET', l: 'Full Entry Packet (ISF + 7501 + CI)' },
                { v: 'ENTRY_7501', l: 'CBP Form 7501' },
                { v: 'COMMERCIAL_INVOICE', l: 'Commercial Invoice' },
                { v: 'BOL', l: 'Bill of Lading' },
              ].map(dt => (
                <button key={dt.v} onClick={() => setDocType(dt.v)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${docType === dt.v ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-[var(--c-raised)] border-[var(--c-border)] text-slate-400 hover:text-slate-200'}`}>
                  {dt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-blue-500 bg-blue-500/10' :
            file ? 'border-emerald-500/40 bg-emerald-500/5' :
            'border-[var(--c-border)] hover:border-blue-500/40 hover:bg-blue-500/5'
          }`}>
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <div className="w-10 h-12 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-emerald-300">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB · {file.type || 'PDF'}</p>
                  <p className="text-xs text-blue-400 mt-0.5">Ready for extraction</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="ml-auto w-7 h-7 rounded-full bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div>
                <Upload size={32} className="text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">{isDragActive ? 'Drop your document here' : 'Drag & drop or click to upload'}</p>
                <p className="text-xs text-slate-500 mt-1">PDF, TIFF, JPG, PNG · Max 100 MB</p>
                <p className="text-xs text-slate-500 mt-0.5">Accepted: Entry packets, Form 7501, Commercial Invoices, BOLs, Certs of Origin</p>
              </div>
            )}
          </div>

          {/* Low quality simulation toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input type="checkbox" checked={simulateLowQuality} onChange={e => setSimulateLowQuality(e.target.checked)} className="accent-blue-500 w-4 h-4" />
            <span className="text-xs text-slate-400">Simulate low-quality scan (test upscaling pipeline)</span>
          </label>

          <div className="flex gap-3">
            {file ? (
              <button onClick={runOCR}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-lg transition-colors">
                <ZoomIn size={16} /> Extract Data with AI OCR
              </button>
            ) : (
              <button onClick={() => { setFile(new File(['demo'], 'Entry_Packet_LAX2024.pdf', { type: 'application/pdf' })); setTimeout(runOCR, 100); }}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--c-raised)] border border-[var(--c-border)] hover:border-blue-500/30 text-slate-300 text-sm font-medium py-3 rounded-lg transition-colors">
                <FileText size={16} className="text-blue-400" /> Demo — Extract Sample Entry Packet
              </button>
            )}
            <button onClick={() => setStep('review')}
              className="px-5 py-3 bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 text-sm rounded-lg hover:border-blue-500/30 transition-colors">
              Skip — Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: PROCESSING ─────────────────────────────────────────────── */}
      {step === 'processing' && (
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-8">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Loader2 size={28} className="text-blue-400 animate-spin" />
              </div>
              {simulateLowQuality && stageIdx === 1 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <ZoomIn size={12} className="text-yellow-400" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-200">
                {simulateLowQuality ? LOW_QUALITY_STAGES[stageIdx]?.label : STAGES[stageIdx]?.label}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Stage {stageIdx + 1} of {simulateLowQuality ? LOW_QUALITY_STAGES.length : STAGES.length}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-1.5 bg-[var(--c-raised)] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${((stageIdx + 1) / (simulateLowQuality ? LOW_QUALITY_STAGES.length : STAGES.length)) * 100}%` }} />
            </div>
          </div>

          {/* Stage log */}
          <div className="bg-[var(--c-raised)] rounded-xl p-4 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto">
            {stageLog.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                {i < stageLog.length - 1
                  ? <CheckCircle size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  : <Loader2 size={11} className="text-blue-400 mt-0.5 flex-shrink-0 animate-spin" />
                }
                <span className={i < stageLog.length - 1 ? 'text-slate-400' : 'text-slate-200'}>{s}</span>
              </div>
            ))}
          </div>

          {simulateLowQuality && stageLog.some(s => s.includes('upscal')) && (
            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <RotateCw size={12} className="animate-spin" />
              Image resolution was too low — applying 300 DPI upscaling before re-analysis
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: REVIEW ─────────────────────────────────────────────────── */}
      {step === 'review' && extracted && (
        <div className="space-y-5">
          {/* Confidence banner */}
          <div className={`rounded-xl p-4 flex items-center gap-3 border ${
            extracted.confidence >= 85
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : extracted.confidence >= 65
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${extracted.confidence >= 85 ? 'text-emerald-300' : extracted.confidence >= 65 ? 'text-yellow-300' : 'text-red-300'}`}>
                OCR Confidence: {extracted.confidence}% — {extracted.confidence >= 85 ? 'High quality extraction' : extracted.confidence >= 65 ? 'Medium confidence — please review highlighted fields' : 'Low confidence — careful review required'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Review and correct any errors below before proceeding</p>
            </div>
            <span className={`text-2xl font-bold ${extracted.confidence >= 85 ? 'text-emerald-400' : extracted.confidence >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>
              {extracted.confidence}%
            </span>
          </div>

          {/* Entry header */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Entry Details</h3>
              <span className="text-xs text-blue-400 flex items-center gap-1"><Edit3 size={11} /> All fields editable</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: 'entryNumber' as const, l: 'CBP Entry Number' },
                { k: 'entryType' as const, l: 'Entry Type' },
                { k: 'importerOfRecord' as const, l: 'Importer of Record' },
                { k: 'portOfEntry' as const, l: 'Port of Entry' },
                { k: 'portCode' as const, l: 'Port Code' },
                { k: 'entryDate' as const, l: 'Entry Date' },
                { k: 'bolNumber' as const, l: 'Bill of Lading Number' },
                { k: 'vesselName' as const, l: 'Vessel Name' },
                { k: 'voyageNumber' as const, l: 'Voyage Number' },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">{l}</label>
                  <input
                    value={String(extracted[k] ?? '')}
                    onChange={e => updateField(k, e.target.value)}
                    className="w-full bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product lines */}
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--c-border)]">
              <h3 className="text-sm font-semibold text-slate-200">Product Lines ({extracted.products.length})</h3>
              <button onClick={addProduct}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <Plus size={13} /> Add Product Line
              </button>
            </div>
            <div className="divide-y divide-[var(--c-border)]">
              {extracted.products.map((prod) => (
                <div key={prod.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">{prod.name || '(unnamed)'}</span>
                      <span className="text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded">{prod.htsCode}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setEditMode(editMode === prod.id ? null : prod.id)}
                        className="w-6 h-6 rounded bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => removeProduct(prod.id)}
                        className="w-6 h-6 rounded bg-[var(--c-raised)] border border-[var(--c-border)] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {editMode === prod.id ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { k: 'name', l: 'Product Name', type: 'text' },
                        { k: 'htsCode', l: 'HTS Code', type: 'text' },
                        { k: 'quantity', l: 'Quantity', type: 'number' },
                        { k: 'unit', l: 'Unit', type: 'text' },
                        { k: 'value', l: 'Value (USD)', type: 'number' },
                        { k: 'countryOfOrigin', l: 'Country of Origin', type: 'text' },
                        { k: 'dutyRate', l: 'Duty Rate', type: 'text' },
                        { k: 'supplierName', l: 'Supplier Name', type: 'text' },
                      ].map(({ k, l, type }) => (
                        <div key={k}>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">{l}</label>
                          <input
                            type={type}
                            value={String(prod[k as keyof ExtractedProduct] ?? '')}
                            onChange={e => updateProduct(prod.id, k as keyof ExtractedProduct, type === 'number' ? Number(e.target.value) : e.target.value)}
                            className="w-full bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-slate-500">Qty:</span> <span className="text-slate-300">{prod.quantity.toLocaleString()} {prod.unit}</span></div>
                      <div><span className="text-slate-500">Value:</span> <span className="text-slate-300">${prod.value.toLocaleString()}</span></div>
                      <div><span className="text-slate-500">COO:</span> <span className="text-slate-300">{prod.countryOfOrigin}</span></div>
                      <div><span className="text-slate-500">Duty:</span> <span className={prod.dutyRate === '0%' ? 'text-emerald-400' : 'text-yellow-400'}>{prod.dutyRate}</span></div>
                      <div className="col-span-2"><span className="text-slate-500">Supplier:</span> <span className="text-slate-300">{prod.supplierName}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('match')}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-lg transition-colors">
              Continue to Product Matching <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: MATCH ─────────────────────────────────────────────────── */}
      {step === 'match' && extracted && (
        <div className="space-y-5">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-300">Smart Record Matching</p>
            <p className="text-xs text-slate-400 mt-0.5">The system found matches in your existing product and supplier registry. Choose how to handle each item.</p>
          </div>

          {extracted.products.map((prod) => {
            const existingProduct = mockProducts.find(p => p.id === prod.matchedProductId);
            const existingSupplier = mockSuppliers.find(s => s.id === prod.matchedSupplierId);
            const similarProducts = mockProducts.filter(p =>
              p.name.toLowerCase().includes(prod.name.toLowerCase().split(' ')[0]) ||
              p.htsCode.code === prod.htsCode
            );
            const similarSuppliers = mockSuppliers.filter(s =>
              s.name.toLowerCase().includes(prod.supplierName.toLowerCase().split(' ')[0]) ||
              s.name.toLowerCase() === prod.supplierName.toLowerCase()
            );

            return (
              <div key={prod.id} className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl overflow-hidden">
                <div className="bg-[var(--c-raised)] px-5 py-3 border-b border-[var(--c-border)]">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-blue-400" />
                    <span className="text-sm font-semibold text-slate-200">{prod.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{prod.htsCode}</span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Product matching */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Product Record</p>
                    <div className="space-y-2">
                      {existingProduct && (
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${prod.matchAction === 'use_existing' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--c-raised)] border-[var(--c-border)]'}`}>
                          <input type="radio" name={`prod-${prod.id}`} checked={prod.matchAction === 'use_existing'} onChange={() => updateProduct(prod.id, 'matchAction', 'use_existing')} className="mt-0.5 accent-emerald-500" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1"><CheckCircle size={11} /> Use existing: {existingProduct.name}</p>
                            <p className="text-[10px] text-slate-400">Score: {existingProduct.score.overall}/100 · {existingProduct.skus.length} SKUs · HTS {existingProduct.htsCode.code}</p>
                          </div>
                        </label>
                      )}
                      {similarProducts.filter(p => p.id !== prod.matchedProductId).map(sp => (
                        <label key={sp.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${prod.matchedProductId === sp.id && prod.matchAction === 'use_existing' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--c-raised)] border-[var(--c-border)]'}`}>
                          <input type="radio" name={`prod-${prod.id}`} onChange={() => { updateProduct(prod.id, 'matchedProductId', sp.id); updateProduct(prod.id, 'matchAction', 'use_existing'); }} className="mt-0.5 accent-emerald-500" />
                          <div>
                            <p className="text-xs font-medium text-slate-300">{sp.name}</p>
                            <p className="text-[10px] text-slate-500">Similar match — Score: {sp.score.overall}/100</p>
                          </div>
                        </label>
                      ))}
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${prod.matchAction === 'create_new' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[var(--c-raised)] border-[var(--c-border)]'}`}>
                        <input type="radio" name={`prod-${prod.id}`} checked={prod.matchAction === 'create_new'} onChange={() => updateProduct(prod.id, 'matchAction', 'create_new')} className="mt-0.5 accent-blue-500" />
                        <div>
                          <p className="text-xs font-semibold text-blue-300 flex items-center gap-1"><Plus size={11} /> Create new product</p>
                          <p className="text-[10px] text-slate-400">&ldquo;{prod.name}&rdquo; will be added to your product registry</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Supplier matching */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Users size={11} /> Supplier Record
                    </p>
                    <div className="space-y-2">
                      {existingSupplier && (
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${prod.supplierAction === 'use_existing' && prod.matchedSupplierId === existingSupplier.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--c-raised)] border-[var(--c-border)]'}`}>
                          <input type="radio" name={`sup-${prod.id}`} checked={prod.supplierAction === 'use_existing'} onChange={() => updateProduct(prod.id, 'supplierAction', 'use_existing')} className="mt-0.5 accent-emerald-500" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1"><CheckCircle size={11} /> Use existing: {existingSupplier.name}</p>
                            <p className="text-[10px] text-slate-400">Score: {existingSupplier.score}/100 · {existingSupplier.countryCode} · OFAC {existingSupplier.ofacCheck.status}</p>
                          </div>
                        </label>
                      )}
                      {similarSuppliers.filter(s => s.id !== prod.matchedSupplierId).map(ss => (
                        <label key={ss.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all bg-[var(--c-raised)] border-[var(--c-border)]`}>
                          <input type="radio" name={`sup-${prod.id}`} onChange={() => { updateProduct(prod.id, 'matchedSupplierId', ss.id); updateProduct(prod.id, 'supplierAction', 'use_existing'); }} className="mt-0.5 accent-emerald-500" />
                          <div>
                            <p className="text-xs font-medium text-slate-300">{ss.name}</p>
                            <p className="text-[10px] text-slate-500">Similar — Score {ss.score}/100</p>
                          </div>
                        </label>
                      ))}
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${prod.supplierAction === 'create_new' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[var(--c-raised)] border-[var(--c-border)]'}`}>
                        <input type="radio" name={`sup-${prod.id}`} checked={prod.supplierAction === 'create_new'} onChange={() => updateProduct(prod.id, 'supplierAction', 'create_new')} className="mt-0.5 accent-blue-500" />
                        <div>
                          <p className="text-xs font-semibold text-blue-300 flex items-center gap-1"><Plus size={11} /> Create new supplier</p>
                          <p className="text-[10px] text-slate-400">&ldquo;{prod.supplierName}&rdquo; will be added and OFAC-checked</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex gap-3">
            <button onClick={() => setStep('review')}
              className="px-5 py-3 bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 text-sm rounded-lg hover:border-blue-500/30 transition-colors">
              ← Back
            </button>
            <button onClick={() => setStep('confirm')}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-lg transition-colors">
              Review & Confirm <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: CONFIRM ───────────────────────────────────────────────── */}
      {step === 'confirm' && extracted && (
        <div className="space-y-5">
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Import Summary — Ready to Create</h3>

            {/* Entry */}
            <div className="bg-[var(--c-raised)] rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { l: 'Entry Number', v: extracted.entryNumber, mono: true },
                  { l: 'Port of Entry', v: extracted.portOfEntry },
                  { l: 'Entry Date', v: extracted.entryDate },
                  { l: 'BOL Number', v: extracted.bolNumber, mono: true },
                ].map(i => (
                  <div key={i.l}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{i.l}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${i.mono ? 'font-mono text-blue-300' : 'text-slate-200'}`}>{i.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Products summary */}
            <div className="space-y-2 mb-4">
              {extracted.products.map(p => {
                const ep = mockProducts.find(mp => mp.id === p.matchedProductId);
                const es = mockSuppliers.find(ms => ms.id === p.matchedSupplierId);
                return (
                  <div key={p.id} className="flex items-center gap-4 bg-[var(--c-raised)] rounded-lg p-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-200">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.quantity.toLocaleString()} {p.unit} · ${p.value.toLocaleString()} · {p.countryOfOrigin}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.matchAction === 'use_existing' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {p.matchAction === 'use_existing' ? `Using: ${ep?.name ?? 'existing'}` : 'Creating new product'}
                      </span>
                      <p className={`text-[10px] mt-0.5 ${p.supplierAction === 'use_existing' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        Supplier: {p.supplierAction === 'use_existing' ? es?.name ?? 'existing' : `New — ${p.supplierName}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* What will be created */}
            <div className="border border-[var(--c-border)] rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Records to be Created</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle size={12} className="text-blue-400" />
                  <span>1 Import entry — <span className="font-mono text-blue-300">{extracted.entryNumber}</span></span>
                </div>
                {extracted.products.filter(p => p.matchAction === 'create_new').map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-xs text-slate-300">
                    <Plus size={12} className="text-blue-400" />
                    <span>New product — <strong>{p.name}</strong> (HTS {p.htsCode})</span>
                  </div>
                ))}
                {extracted.products.filter(p => p.supplierAction === 'create_new').map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-xs text-slate-300">
                    <Plus size={12} className="text-orange-400" />
                    <span>New supplier — <strong>{p.supplierName}</strong> (OFAC check will be queued)</span>
                  </div>
                ))}
                {extracted.products.filter(p => p.matchAction === 'use_existing').map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-xs text-slate-300">
                    <AlertTriangle size={12} className="text-yellow-400" />
                    <span>Update existing product — <strong>{mockProducts.find(mp => mp.id === p.matchedProductId)?.name}</strong> (new import linked)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('match')}
              className="px-5 py-3 bg-[var(--c-raised)] border border-[var(--c-border)] text-slate-300 text-sm rounded-lg hover:border-blue-500/30 transition-colors">
              ← Back
            </button>
            <button onClick={() => router.push('/imports')}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3 rounded-lg transition-colors">
              <CheckCircle size={16} /> Create Import & All Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
