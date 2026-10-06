import { useRef, useState } from 'react';
import { InputError, parseRequirements } from './validation';
import { checkLimits, FileError, inspectPdf } from './files';
import { sha256 } from './hashing';
import type { Matches, RequirementsFile, UploadedDocument } from './types';
import { assign, removeDocument } from './domain';
import { buildPackage, downloadBytes } from './package';
export interface Message { code: string; detail?: string }
export function useWorkspace() {
  const [data, setData] = useState<RequirementsFile | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [matches, setMatches] = useState<Matches>(()=>Object.create(null) as Matches);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState('');
  const lock = useRef(false);
  const [generated,setGenerated] = useState(false);
  async function load(file?: File) {
    if (!file || lock.current) return;
    lock.current = true; setBusy(true); setGenerated(false);
    try { const next = parseRequirements(await file.text()); setData(next); setDocuments([]); setMatches(Object.create(null) as Matches); setMessages([]); }
    catch (e) { setMessages([{ code: e instanceof InputError ? e.code : 'read_error', detail: e instanceof InputError ? e.field : file.name }]); }
    finally { lock.current = false; setBusy(false); }
  }
  async function upload(files: File[]) {
    if (!data || lock.current || !files.length) return;
    lock.current = true; setBusy(true); setMessages([]); setGenerated(false);
    const accepted = [...documents]; const errors: Message[] = [];
    try {
      for (const file of files) {
        setProcessing(file.name);
        try {
          checkLimits(accepted.length + 1, accepted.reduce((sum, d) => sum + d.size, 0) + file.size);
          const pages = await inspectPdf(file);
          const hash = await sha256(file);
          accepted.push({ id: crypto.randomUUID(), file, name: file.name, size: file.size, pages, hash });
          setDocuments([...accepted]);
        } catch (e) { errors.push({ code: e instanceof FileError ? e.code : 'read_error', detail: file.name }); }
      }
      setMessages(errors);
    } finally { lock.current = false; setBusy(false); setProcessing(''); }
  }
  function remove(id: string) { if (!lock.current) { setGenerated(false); setDocuments(list => list.filter(d => d.id !== id)); setMatches(current => removeDocument(current, id)); } }
  function match(requirementId: string, documentId: string) {
    if (lock.current || !data?.requirements.some(r => r.id === requirementId)) return;
    try { setMatches(assign(matches, documents, requirementId, documentId)); setMessages([]); setGenerated(false); }
    catch (e) { setMessages([{ code: e instanceof Error ? e.message : 'read_error' }]); }
  }
  function expiry(requirementId: string, value: string) {
    if (!lock.current) { setGenerated(false); setMatches(current => current[requirementId] ? Object.assign(Object.create(null),current,{ [requirementId]: { ...current[requirementId], expiry: value } }) as Matches : current); }
  }
  async function generate() {
    if (!data || lock.current) return;
    lock.current=true;setBusy(true);setProcessing('package');setMessages([]);setGenerated(false);
    try { const bytes=await buildPackage(data,documents,matches);downloadBytes(bytes,`${data.tender.tender_id}_Package.pdf`);setGenerated(true); }
    catch(e){setMessages([{code:e instanceof Error && ['blocked','duplicate_match','pdf_text_error'].includes(e.message)?e.message:'generation_error'}]);}
    finally{lock.current=false;setBusy(false);setProcessing('');}
  }
  return { data, documents, matches, messages, busy, processing, generated, load, upload, remove, match, expiry, generate };
}
