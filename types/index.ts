// ─── Core Enums ───────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'active' | 'pending' | 'flagged' | 'verified' | 'rejected';
export type DocumentType =
  | 'BOL'
  | 'ISF'
  | 'ENTRY_FORM'
  | 'COMMERCIAL_INVOICE'
  | 'CERT_OF_ORIGIN'
  | 'MTR'
  | 'TECHNICAL_DOC'
  | 'QUALITY_REPORT'
  | 'INSPECTION'
  | 'OTHER';

// ─── Geographic ───────────────────────────────────────────────────────────────

export interface GeoCoordinate {
  lat: number;
  lng: number;
  label: string;
  country: string;
  countryCode: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  uploadedAt: string;
  size: string;
  ocrExtracted?: boolean;
  extractedData?: Record<string, string | number | boolean>;
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

export interface SupplierCapability {
  tag: string;
  verified: boolean;
}

export interface OFACCheck {
  checkedAt: string;
  status: 'clear' | 'match' | 'potential_match';
  details?: string;
}

export interface SupplierCheck {
  category: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  countryCode: string;
  country: string;
  city: string;
  coordinates: GeoCoordinate;
  status: Status;
  ofacCheck: OFACCheck;
  capabilities: SupplierCapability[];
  checks: SupplierCheck[];
  score: number; // 0-100
  riskLevel: RiskLevel;
  documents: Document[];
  vlxInspectionIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── HTS Codes ────────────────────────────────────────────────────────────────

export interface ADCVDCase {
  caseNumber: string;
  type: 'AD' | 'CVD';
  country: string;
  countryCode: string;
  rate: string;
  status: 'active' | 'revoked' | 'pending';
  effectiveDate: string;
}

export interface HTSCode {
  code: string;
  description: string;
  dutyRate: string;
  adcvdCases: ADCVDCase[];
  importsByCountry: { countryCode: string; country: string; value: string }[];
}

// ─── Process / Genealogy ──────────────────────────────────────────────────────

export interface Process {
  id: string;
  name: string;
  type: string;
  supplierId: string;
  supplierName: string;
  country: string;
  countryCode: string;
  coordinates: GeoCoordinate;
  startDate: string;
  endDate?: string;
  status: Status;
  order: number; // sequence in the genealogy
  documents: Document[];
  vlxInspectionId?: string;
  notes?: string;
}

// ─── Component / Substrate ────────────────────────────────────────────────────

export interface Component {
  id: string;
  name: string;
  type: 'substrate' | 'component' | 'raw_material' | 'assembly';
  htsCode: HTSCode;
  supplierId: string;
  supplierName: string;
  country: string;
  countryCode: string;
  coordinates: GeoCoordinate;
  quantity: number;
  unit: string;
  documents: Document[];
  processes: Process[];
  riskLevel: RiskLevel;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface SKUBatch {
  sku: string;
  quantity: number;
  description?: string;
}

export interface TraceabilityScore {
  overall: number;
  originVerification: number;
  supplierReliability: number;
  processDocumentation: number;
  complianceScore: number;
  authenticity: number;
  details: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  htsCode: HTSCode;
  skus: SKUBatch[];
  components: Component[];
  processes: Process[];
  finalAssemblyCountry: string;
  finalAssemblyCountryCode: string;
  finalAssemblyCoordinates: GeoCoordinate;
  supplierId?: string;
  score: TraceabilityScore;
  status: Status;
  documents: Document[];
  vlxInspectionIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Import Entry ─────────────────────────────────────────────────────────────

export interface ImportProduct {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  value: number;
  currency: string;
  countryOfOrigin: string;
  countryOfOriginCode: string;
  htsCode: string;
  dutyRate: string;
  dutyPaid: number;
}

export interface Import {
  id: string;
  entryNumber: string; // CBP Entry Number format: XXX-XXXXXXX-X
  entryType: string; // e.g., "Type 01 - Consumption"
  importerOfRecord: string;
  portOfEntry: string;
  portCode: string;
  entryDate: string;
  releaseDate?: string;
  status: Status;
  products: ImportProduct[];
  totalDuties: number;
  totalTariffs: number;
  totalValue: number;
  currency: string;
  bolNumber: string;
  vesselName?: string;
  voyageNumber?: string;
  countriesOfOrigin: string[];
  documents: Document[];
  coordinates: GeoCoordinate[]; // supply chain route
  notes?: string;
}

// ─── VLX Inspection ───────────────────────────────────────────────────────────

export interface VLXInspection {
  id: string;
  title: string;
  inspectorName: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  reportUrl?: string;
  score?: number;
  findings: string[];
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalImports: number;
  totalProducts: number;
  totalSuppliers: number;
  flaggedItems: number;
  avgTraceabilityScore: number;
  totalDutiesPaid: number;
  ofacFlags: number;
  adcvdExposure: number;
}
