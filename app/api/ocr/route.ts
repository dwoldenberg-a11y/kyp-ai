import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

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

// ─── Extraction prompt ────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a trade compliance specialist expert in CBP import documentation.
Analyze this document and extract ALL information you can find.

First identify the document type:
- CBP Form 7501 (Entry Summary)
- Commercial Invoice
- Bill of Lading / Sea Waybill
- ISF (Importer Security Filing)
- Packing List
- Certificate of Origin
- Full Entry Packet (multiple documents combined)
- Other (describe)

Then extract these fields (use empty string "" if not found, never fabricate data):
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
      "name": "full product description",
      "htsCode": "####.##.####",
      "quantity": 0,
      "unit": "units",
      "value": 0,
      "currency": "USD",
      "countryOfOrigin": "Country Name",
      "dutyRate": "0%",
      "supplierName": "Full Supplier Name"
    }
  ],
  "confidence": 0,
  "notes": "any caveats about extraction quality"
}

Confidence scoring (0-100):
- 90-100: Clear, sharp document — all key fields extracted with high certainty
- 70-89: Mostly readable — some fields uncertain or partially legible
- 50-69: Partially readable — multiple fields unclear or missing
- Below 50: Very low quality — significant information missing or unreadable

Return ONLY the raw JSON object. No markdown code fences, no explanation.`;

// ─── Upscale image using canvas ───────────────────────────────────────────────

async function upscaleImageBase64(base64: string, mimeType: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas, loadImage } = require('canvas') as {
      createCanvas: (w: number, h: number) => {
        getContext: (t: '2d') => CanvasRenderingContext2D;
        toBuffer: (fmt: string) => Buffer;
      };
      loadImage: (src: Buffer) => Promise<{ width: number; height: number }>;
    };
    const buf = Buffer.from(base64, 'base64');
    const img = await loadImage(buf);
    const canvas = createCanvas(img.width * 2, img.height * 2);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img as unknown as CanvasImageSource, 0, 0, img.width * 2, img.height * 2);
    return canvas.toBuffer('image/png').toString('base64');
  } catch {
    return base64; // fallback: return original
  }
}

// ─── Render PDF pages to images via pdfjs + canvas ───────────────────────────

async function pdfToImages(buffer: Buffer): Promise<{ data: string; mimeType: string }[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas } = require('canvas') as {
      createCanvas: (w: number, h: number) => {
        getContext: (t: string) => unknown;
        toBuffer: (fmt: string) => Buffer;
      };
    };
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdfDoc = await loadingTask.promise;
    const numPages = Math.min(pdfDoc.numPages, 4);
    const images: { data: string; mimeType: string }[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // ~150 DPI
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
      await page.render({ canvasContext: ctx, viewport, canvas: canvas as unknown as HTMLCanvasElement }).promise;
      images.push({ data: (canvas.toBuffer('image/png') as Buffer).toString('base64'), mimeType: 'image/png' });
    }
    return images;
  } catch (err) {
    console.error('[OCR] pdfToImages failed:', err);
    return [];
  }
}

// ─── Call Claude with a PDF document block ────────────────────────────────────

async function extractFromPDF(
  client: Anthropic,
  pdfBase64: string,
): Promise<{ result: Partial<ExtractedImport>; confidence: number }> {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
        } as unknown as Anthropic.TextBlockParam, // SDK types lag feature releases
        { type: 'text', text: EXTRACTION_PROMPT },
      ],
    }],
  });
  return parseResponse(response);
}

// ─── Call Claude with image blocks ────────────────────────────────────────────

async function extractFromImages(
  client: Anthropic,
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
    messages: [{
      role: 'user',
      content: [...imageBlocks, { type: 'text', text: EXTRACTION_PROMPT }],
    }],
  });
  return parseResponse(response);
}

function parseResponse(response: Anthropic.Message): { result: Partial<ExtractedImport>; confidence: number } {
  const text = response.content.find(b => b.type === 'text')?.text ?? '{}';
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return { result: parsed, confidence: Number(parsed.confidence) || 50 };
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return { result: parsed, confidence: Number(parsed.confidence) || 50 };
      } catch { /* ignore */ }
    }
    console.error('[OCR] Failed to parse Claude response:', text.slice(0, 300));
    return { result: {}, confidence: 20 };
  }
}

// ─── POST /api/ocr ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.' },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey });

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

    // ── First extraction attempt ──────────────────────────────────────────────
    let result: Partial<ExtractedImport>;
    let confidence: number;
    let upscaled = false;

    if (mimeType === 'application/pdf') {
      // Claude handles PDFs natively — no canvas needed for first pass
      const pdfBase64 = buffer.toString('base64');
      ({ result, confidence } = await extractFromPDF(client, pdfBase64));

      // ── Retry with rendered images if low confidence ──────────────────────
      if (confidence < 75) {
        console.log(`[OCR] Low confidence (${confidence}%) — rendering PDF to images and retrying`);
        const images = await pdfToImages(buffer);
        if (images.length > 0) {
          const retry = await extractFromImages(client, images);
          if (retry.confidence > confidence) {
            result = retry.result;
            confidence = retry.confidence;
            upscaled = true;
          }
        }
      }
    } else if (mimeType.startsWith('image/')) {
      const images = [{ data: buffer.toString('base64'), mimeType }];
      ({ result, confidence } = await extractFromImages(client, images));

      // ── Retry with upscaled image if low confidence ───────────────────────
      if (confidence < 75) {
        console.log(`[OCR] Low confidence (${confidence}%) — upscaling image and retrying`);
        const upscaledData = await upscaleImageBase64(buffer.toString('base64'), mimeType);
        const retry = await extractFromImages(client, [{ data: upscaledData, mimeType: 'image/png' }]);
        if (retry.confidence > confidence) {
          result = retry.result;
          confidence = retry.confidence;
          upscaled = true;
        }
      }
    } else {
      return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 415 });
    }

    // ── Normalise products ────────────────────────────────────────────────────
    const rawProducts = (result!.products ?? []) as Partial<ExtractedProduct>[];
    const products: ExtractedProduct[] = rawProducts.map((p, i) => ({
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
    }));

    const extracted: ExtractedImport = {
      entryNumber: result!.entryNumber || '',
      entryType: result!.entryType || docType.replace(/_/g, ' '),
      importerOfRecord: result!.importerOfRecord || '',
      portOfEntry: result!.portOfEntry || '',
      portCode: result!.portCode || '',
      entryDate: result!.entryDate || '',
      bolNumber: result!.bolNumber || '',
      vesselName: result!.vesselName || '',
      voyageNumber: result!.voyageNumber || '',
      products,
      confidence,
      documentType: result!.documentType || 'Unknown',
    };

    return NextResponse.json({ extracted, upscaled });
  } catch (err) {
    console.error('[OCR] Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
