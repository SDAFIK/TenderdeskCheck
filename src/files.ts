import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
GlobalWorkerOptions.workerSrc = workerUrl;
export const MAX_FILES = 30;
export const MAX_BYTES = 50_000_000;
export class FileError extends Error { constructor(public code: 'not_pdf' | 'bad_pdf' | 'locked_pdf' | 'file_limit' | 'size_limit') { super(code); } }
export function checkLimits(count: number, bytes: number) {
  if (count > MAX_FILES) throw new FileError('file_limit');
  if (bytes > MAX_BYTES) throw new FileError('size_limit');
}
export async function inspectPdf(file: File): Promise<number> {
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw new FileError('not_pdf');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder('latin1').decode(bytes.slice(0, 1024)).includes('%PDF-')) throw new FileError('not_pdf');
  // Test merge compatibility too: a tolerant viewer can open a file that cannot be packaged.
  try { await PDFDocument.load(bytes); }
  catch (e) { throw new FileError(e instanceof Error && /encrypt/i.test(e.message) ? 'locked_pdf' : 'bad_pdf'); }
  const task = getDocument({ data: bytes, useSystemFonts: true, stopAtErrors: true });
  try { const pdf = await task.promise; if (!pdf.numPages) throw new FileError('bad_pdf'); return pdf.numPages; }
  catch (e) { throw new FileError(e instanceof Error && /password/i.test(e.name) ? 'locked_pdf' : 'bad_pdf'); }
  finally { await task.destroy(); }
}
export function formatBytes(bytes: number) { return bytes < 1_000_000 ? `${Math.ceil(bytes / 1000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`; }
