'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, CheckCircle, AlertTriangle, ChevronRight,
  Eye, Download, X, Wand2, Loader2, Search
} from 'lucide-react';
import { mockImports, mockProducts, mockSuppliers } from '@/lib/mockData';
import Badge from '@/components/ui/Badge';

type UploadStage = 'upload' | 'extracting' | 'review' | 'complete';

interface ExtractedData {
  type: string;
  fields: Record<string, string>;
  suggestions: {
    type: 'import' | 'product' | 'supplier';
    label: string;
    id: string;
    isNew: boolean;
  }[];
}

const allDocs = [
  ...mockImports.flatMap(i => i.documents.map(d => ({ ...d, parent: i.entryNumber, parentType: 'Import' as const }))),
  ...mockProducts.flatMap(p => p.documents.map(d => ({ ...d, parent: p.name, parentType: 'Product' as const }))),
  ...mockSuppliers.flatMap(s => s.documents.map(d => ({ ...d, parent: s.name, parentType: 'Supplier' as const }))),
];

const docTypeColors: Record<string, string> = {
  BOL: 'bg-blue-500/20 text-blue-300',
  ISF: 'bg-purple-500/20 text-purple-300',
  ENTRY_FORM: 'bg-yellow-500/20 text-yellow-300',
  COMMERCIAL_INVOICE: 'bg-green-500/20 text-green-300',
  CERT_OF_ORIGIN: 'bg-emerald-500/20 text-emerald-300',
  MTR: 'bg-orange-500/20 text-orange-300',
  QUALITY_REPORT: 'bg-cyan-500/20 text-cyan-300',
  TECHNICAL_DOC: 'bg-slate-500/20 text-slate-300',
  INSPECTION: 'bg-indigo-500/20 text-indigo-300',
  OTHER: 'bg-slate-500/20 text-slate-300',
};

// Simulated OCR extraction results
const mockExtractions: Record<string, ExtractedData> = {
  'BOL': {
    type: 'BOL',
    fields: {
      'BOL Number': 'MAEU324891888',
      'Shipper': 'Monterrey Assembly Solutions SA de CV',
      'Consignee': 'TechVault Industries LLC',
      'Port of Loading': 'Puerto de Veracruz, MX',
      'Port of Discharge': 'Port of Miami, US',
      'Vessel': 'MSC OSCAR',
      'Voyage': 'VY2412-01',
      'Commodity': 'Industrial Control PCB Assembly',
      'Packages': '50 Pallets / 1,200 CTNs',
      'Gross Weight': '4,800 KG',
    },
    suggestions: [
      { type: 'import', label: 'Create new Import Entry', id: 'new', isNew: true },
      { type: 'supplier', label: 'Use existing: Monterrey Assembly Solutions', id: 'sup-004', isNew: false },
    ],
  },
  'COMMERCIAL_INVOICE': {
    type: 'COMMERCIAL_INVOICE',
    fields: {
      'Invoice Number': 'CI-2024-11-004822',
      'Invoice Date': '2024-12-10',
      'Seller': 'Monterrey Assembly Solutions SA de CV',
      'Buyer': 'TechVault Industries LLC',
      'Terms': 'FOB Veracruz',
      'Currency': 'USD',
      'HTS Code': '8537.10.9170',
      'Description': 'Industrial Control PCB Assembly, Type Rev B',
      'Quantity': '1,000 units',
      'Unit Price': '$512.00',
      'Total Value': '$512,000.00',
      'Country of Origin': 'Mexico',
    },
    suggestions: [
      { type: 'import', label: 'Create new Import Entry', id: 'new', isNew: true },
      { type: 'product', label: 'Use existing: Industrial Control PCB Assembly', id: 'prod-001', isNew: false },
    ],
  },
  'CERT_OF_ORIGIN': {
    type: 'CERT_OF_ORIGIN',
    fields: {
      'Certificate Number': 'USMCA-MX-2024-004822',
      'Exporter': 'Monterrey Assembly Solutions SA de CV',
      'Producer': 'Monterrey Assembly Solutions SA de CV',
      'Importer': 'TechVault Industries LLC',
      'Country of Origin': 'Mexico',
      'Goods Description': 'Industrial Control PCB Assembly',
      'HTS Code': '8537.10.9170',
      'Preferential Criterion': 'B — Regional Value Content (RVC) ≥ 60%',
      'Certification Date': '2024-12-08',
      'Certifier': 'Maria Gutierrez, Director of Trade Compliance',
    },
    suggestions: [
      { type: 'product', label: 'Update existing: Industrial Control PCB Assembly', id: 'prod-001', isNew: false },
    ],
  },
};

export default function DocumentsPage() {
  const [stage, setStage] = useState<UploadStage>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('BOL');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [confirmedFields, setConfirmedFields] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
  });

  const handleExtract = () => {
    setStage('extracting');
    setTimeout(() => {
      const data = mockExtractions[selectedDocType] || mockExtractions['BOL'];
      setExtracted(data);
      setConfirmedFields(data.fields);
      setStage('review');
    }, 2000);
  };

  const handleConfirm = () => {
    setStage('complete');
  };

  const filteredDocs = allDocs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase()) ||
    d.parent.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100">Document Management</h2>
        <p className="text-sm text-slate-400 mt-0.5">Upload import documents with AI-powered OCR extraction</p>
      </div>

      {/* Upload Zone */}
      <div className="bg-[#151E33] border border-[#253352] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Wand2 size={16} className="text-blue-400" />
          AI Document Extraction
        </h3>

        {stage === 'upload' && (
          <div className="space-y-4">
            {/* Doc type selector */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Document Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'BOL', label: 'Bill of Lading' },
                  { value: 'COMMERCIAL_INVOICE', label: 'Commercial Invoice' },
                  { value: 'CERT_OF_ORIGIN', label: 'Certificate of Origin' },
                  { value: 'ISF', label: 'ISF Filing' },
                  { value: 'ENTRY_FORM', label: 'CBP Entry 7501' },
                  { value: 'MTR', label: 'Mill Test Report' },
                  { value: 'QUALITY_REPORT', label: 'Quality Report' },
                ].map(dt => (
                  <button
                    key={dt.value}
                    onClick={() => setSelectedDocType(dt.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      selectedDocType === dt.value
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                        : 'bg-[#1C2844] border-[#253352] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : uploadedFile
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-[#253352] hover:border-blue-500/40 hover:bg-blue-500/5'
              }`}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle size={24} className="text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-300">{uploadedFile.name}</p>
                    <p className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB · Ready for extraction</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setUploadedFile(null); }}
                    className="w-6 h-6 rounded-full bg-[#1C2844] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">
                    {isDragActive ? 'Drop your document here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG · Max 50MB</p>
                  <p className="text-xs text-slate-500 mt-1">Accepted: BOL, ISF, Entry Forms, Commercial Invoices, Certs of Origin, MTRs, Quality Reports</p>
                </div>
              )}
            </div>

            {uploadedFile && (
              <button
                onClick={handleExtract}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-3 rounded-lg transition-colors"
              >
                <Wand2 size={16} />
                Extract Data with AI OCR
              </button>
            )}

            {/* Demo button (no file needed) */}
            {!uploadedFile && (
              <button
                onClick={() => { setUploadedFile(new File(['demo'], 'demo_document.pdf')); handleExtract(); }}
                className="w-full flex items-center justify-center gap-2 bg-[#1C2844] border border-[#253352] hover:border-blue-500/30 text-slate-300 text-sm font-medium py-3 rounded-lg transition-colors"
              >
                <Wand2 size={16} className="text-blue-400" />
                Try Demo Extraction ({selectedDocType.replace('_', ' ')})
              </button>
            )}
          </div>
        )}

        {stage === 'extracting' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Loader2 size={24} className="text-blue-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">KYPiT OCR Extracting...</p>
              <p className="text-xs text-slate-400 mt-1">Analyzing document structure and extracting trade data</p>
            </div>
          </div>
        )}

        {stage === 'review' && extracted && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle size={16} />
              <span className="font-semibold">Extraction Complete</span>
              <span className="text-slate-400 text-xs">— Review and confirm data before creating records</span>
            </div>

            {/* Extracted fields */}
            <div className="bg-[#1C2844] rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Extracted Fields</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(confirmedFields).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">{key}</label>
                    <input
                      value={value}
                      onChange={e => setConfirmedFields(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full bg-[#151E33] border border-[#253352] text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {extracted.suggestions.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-300 mb-3">Smart Suggestions</p>
                <div className="space-y-2">
                  {extracted.suggestions.map((sug, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#1C2844] rounded-lg p-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${sug.isNew ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                        {sug.isNew
                          ? <span className="text-[9px] font-bold text-blue-400">NEW</span>
                          : <CheckCircle size={12} className="text-emerald-400" />
                        }
                      </div>
                      <p className="text-xs text-slate-300 flex-1">{sug.label}</p>
                      <input type="checkbox" defaultChecked className="accent-blue-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-3 rounded-lg transition-colors"
              >
                <CheckCircle size={16} />
                Confirm & Create Records
              </button>
              <button
                onClick={() => { setStage('upload'); setUploadedFile(null); setExtracted(null); }}
                className="px-4 py-3 bg-[#1C2844] border border-[#253352] text-slate-300 text-sm rounded-lg hover:border-red-500/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-emerald-300">Records Created Successfully</p>
              <p className="text-sm text-slate-400 mt-1">Document data has been extracted and records have been created</p>
            </div>
            <button
              onClick={() => { setStage('upload'); setUploadedFile(null); setExtracted(null); }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Upload another document →
            </button>
          </div>
        )}
      </div>

      {/* All Documents */}
      <div className="bg-[#151E33] border border-[#253352] rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-[#253352]">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">All Documents</h3>
            <p className="text-xs text-slate-400">{allDocs.length} documents across imports, products, and suppliers</p>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="bg-[#1C2844] border border-[#253352] text-slate-300 text-xs rounded-lg pl-8 pr-4 py-2 w-48 focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
            />
          </div>
        </div>
        <div className="divide-y divide-[#253352]">
          {filteredDocs.slice(0, 20).map(doc => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#1C2844] transition-colors group">
              <div className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${docTypeColors[doc.type] || docTypeColors.OTHER}`}>
                {doc.type.replace('_', ' ')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{doc.name}</p>
                <p className="text-[10px] text-slate-500">{doc.parentType}: {doc.parent} · {doc.uploadedAt} · {doc.size}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-7 h-7 rounded-lg bg-[#253352] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                  <Eye size={13} />
                </button>
                <button className="w-7 h-7 rounded-lg bg-[#253352] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                  <Download size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
