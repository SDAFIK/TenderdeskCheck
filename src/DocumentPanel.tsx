import { translator } from './i18n';
import type { Language } from './types';
import { Files, Upload, FileText, Trash2, LoaderCircle } from 'lucide-react';
import type { UploadedDocument } from './types';
import { formatBytes } from './files';
import { duplicateHashes } from './domain';
interface Props { language: Language; documents: UploadedDocument[]; enabled: boolean; busy: boolean; processing: string; upload: (files: File[]) => Promise<void>; remove: (id: string) => void }
export function DocumentPanel({ language, documents, enabled, busy, processing, upload, remove }: Props) {
  const t = translator(language);
  const total = documents.reduce((n,d) => n+d.size,0);
  const duplicates = duplicateHashes(documents);
  return <section className="panel"><div className="panel-heading"><div><Files size={20}/><h2>{t('documents')}</h2></div><span className="counter">{documents.length} / 30</span></div>
    <label className={'upload-placeholder dropzone '+(!enabled || busy ? 'disabled':'')} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); if(enabled&&!busy) void upload([...e.dataTransfer.files]);}}>
      {busy?<LoaderCircle className="spin" size={27}/>:<Upload size={27}/>}<strong>{busy?(processing==='package'?t('generating'):t('processing')):enabled?t('drop'):t('filesHere')}</strong>
      <input aria-label={t('upload')} type="file" accept=".pdf,application/pdf" multiple disabled={!enabled||busy} onChange={e=>{void upload([...e.target.files??[]]);e.target.value='';}}/>
      <small>{busy?(processing==='package'?t('onDevice'):processing):t('limits')}</small>
    </label>
    {documents.length>0&&<><div className="file-meter"><span>{formatBytes(total)} {t('ofLimit')}</span><span>{documents.reduce((n,d)=>n+d.pages,0)} {t('pages')}</span></div><div className="file-list">{documents.map(d=><div className="file-row" key={d.id}><FileText size={22}/><div className="file-info"><strong title={d.name}>{d.name}</strong><small>{d.pages} {d.pages===1?t('page'):t('pages')} · {formatBytes(d.size)}</small>{duplicates.has(d.hash)&&<span className="badge expiry_needed">{t('duplicate')}</span>}</div><button className="icon-button" aria-label={`${t('remove')} ${d.name}`} disabled={busy} onClick={()=>remove(d.id)}><Trash2 size={16}/></button></div>)}</div></>}
  </section>;
}
