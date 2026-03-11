import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

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
  matchAction: 'use_existing' | 'create_new';
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
  confidence: number;
  documentType: string;
}

// ─── Upscale image via canvas (2× bilinear) ───────────────────────────────────

async function upscaleBase64Image(base64: string, mimeType: string): Promise<string> {
  // Server-side: use sharp if available, otherwise return as-is
  try {
    // dynamic require so the build doesn't fail if sharp isn't installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp');
    const buf = Buffer.from(base64, 'base64');
    const metadata = await sharp(buf).metadata();
    const w = (metadata.width ?? 800) * 2;
    const h = (metadata.height ?? 1000) * 2;
    const upscaled = await sharp(buf).resize(w, h, { kernel: 'lanczos3' }).toBuffer();
    return upscaled.toString('base64');
  } catch {
    // sharp not available — return original, Claude will do its best
    return base64;
  }
}

// ─── Convert PDF to images (first N pages) ────────────────────────────────────

async function pdfToBase64Images(buffer: Buffer): Promise<{ data: string; mimeType: string }[]> {
  try {
    // Dynamically require canvas so TypeScript doesn't complain if types not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas } = require('canvas') as { createCanvas: (w: number, h: number) => {
      getContext: (t: string) => unknown;
      toDataURL: (fmt: string) => string;
    }};

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdfDoc = await loadingTask.promise;
    const numPages = Math.min(pdfDoc.numPages, 4); // max 4 pages
    const images: { data: string; mimeType: string }[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale ≈ 150 DPI
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
      await page.render({ canvasContext: ctx, viewport, canvas: canvas as unknown as HTMLCanvasElement }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      images.push({ data: base64, mimeType: 'image/png' });
    }

    return images;
  } catch (err) {
    console.error('[OCR] PDF render failed:', err);
    return [];
  }
}

// ─── Extract with Claude Vision ───────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a trade compliance specialist expert in CBP import documentation.
Analyze this document image and extract ALL information you can find.

First identify the document type:
- CBP Form 7501 (Entry Summary)
- Commercial Invoice
- Bill of Lading / Sea Waybill
- ISF (Importer Security Filing)
- Packing List
- Certificate of Origin
- Full Entry Packet (multiple documents combined)
- Other (describe)

Then extract these fields (use empty string "" if not found, never fabricate):
{
  "documentType": "...",
  "entryNumber": "...",
  "entryType": "...",
  "importerOfRecord": "...",
  "portOfEntry": "...",
  "portCode": "...",
  "entryDate": "YYYY-MM-DD",
  "bolNumber": "...",
  "vesselName": "...",
  "voyageNumber": "...",
  "products": [
    {
      "name": "...",
      "htsCode": "...",
      "quantity": 0,
      "unit": "units",
      "value": 0,
      "currency": "USD",
      "countryOfOrigin": "...",
      "dutyRate": "...",
      "supplierName": "..."
    }
  ],
  "confidence": 0,
  "notes": "..."
}

For confidence (0-100):
- 90-100: Sharp, readable document, all key fields extracted
- 70-89: Mostly readable, some fields unclear
- 50-69: Partially readable, many fields uncertain
- Below 50: Very low quality, difficult to read

Return ONLY the JSON object, no markdown, no explanation.`;

async function extractWithClaude(
  images: { data: string; mimeType: string }[],
): Promise<{ result: Partial<ExtractedImport>; confidence: number }> {
  const imageBlocks: Anthropic.ImageBlockParam[] = images.map(img => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mimeType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
      data: img.data,
    },
  }));

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const text = response.content.find(b => b.type === 'text')?.text ?? '{}';
  try {
    const parsed = JSON.parse(text.trim());
    return { result: parsed, confidence: parsed.confidence ?? 50 };
  } catch {
    // Try to extract JSON from response if wrapped in markdown
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return { result: parsed, confidence: parsed.confidence ?? 50 };
      } catch {
        // ignore
      }
    }
    return { result: {}, confidence: 20 };
  }
}

// ─── POST /api/ocr ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = (formData.get('docType') as string) || 'ENTRY_PACKET';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/pdf';

    // ── Build image list ──────────────────────────────────────────────────────
    let images: { data: string; mimeType: string }[] = [];

    if (mimeType === 'application/pdf') {
      images = await pdfToBase64Images(buffer);
      if (images.length === 0) {
        // PDF render failed — treat as opaque binary, still try
        return NextResponse.json({
          error: 'Could not render PDF pages. Please ensure pdfjs-dist and canvas are installed.',
        }, { status: 422 });
      }
    } else if (mimeType.startsWith('image/')) {
      images = [{ data: buffer.toString('base64'), mimeType }];
    } else {
      return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 415 });
    }

    // ── First extraction attempt ──────────────────────────────────────────────
    let { result, confidence } = await extractWithClaude(images);

    // ── Upscale & retry if confidence is low ──────────────────────────────────
    let upscaled = false;
    if (confidence < 75 && images.length > 0) {
      console.log(`[OCR] Low confidence (${confidence}%) — upscaling and retrying`);
      const upscaledImages = await Promise.all(
        images.map(async img => ({
          data: await upscaleBase64Image(img.data, img.mimeType),
          mimeType: img.mimeType,
        }))
      );
      const retry = await extractWithClaude(upscaledImages);
      if (retry.confidence > confidence) {
        result = retry.result;
        confidence = retry.confidence;
        upscaled = true;
      }
    }

    // ── Normalise products ────────────────────────────────────────────────────
    const products: ExtractedProduct[] = ((result.products as ExtractedProduct[]) || []).map(
      (p, i) => ({
        id: `ep-${Date.now()}-${i}`,
        name: p.name || '',
        htsCode: p.htsCode || '',
        quantity: Number(p.quantity) || 0,
        unit: p.unit || 'units',
        value: Number(p.value) || 0,
        currency: p.currency || 'USD',
        countryOfOrigin: p.countryOfOrigin || '',
        dutyRate: p.dutyRate || '',
        supplierName: p.supplierName || '',
        matchAction: 'create_new',
        supplierAction: 'create_new',
      })
    );

    const extracted: ExtractedImport = {
      entryNumber: result.entryNumber || '',
      entryType: result.entryType || docType.replace(/_/g, ' '),
      importerOfRecord: result.importerOfRecord || '',
      portOfEntry: result.portOfEntry || '',
      portCode: result.portCode || '',
      entryDate: result.entryDate || '',
      bolNumber: result.bolNumber || '',
      vesselName: result.vesselName || '',
      voyageNumber: result.voyageNumber || '',
      products,
      confidence,
      documentType: result.documentType || 'Unknown',
    };

    return NextResponse.json({ extracted, upscaled });
  } catch (err) {
    console.error('[OCR] Error:', err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}
