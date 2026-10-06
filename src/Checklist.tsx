import { ListChecks, Check, AlertCircle, Minus, RotateCcw } from 'lucide-react';
import { translator } from './i18n';
import type { Language } from './types';
import { statusesFor } from './domain';
import type { Matches, RequirementsFile, UploadedDocument } from './types';
interface Props { language: Language; data: RequirementsFile; documents: UploadedDocument[]; matches: Matches; busy: boolean; match: (r: string,d: string) => void; expiry: (r: string,v: string) => void }
export function Checklist({ language, data, documents, matches, busy, match, expiry }: Props) {
  const t = translator(language);
  const statuses = statusesFor(data.requirements, matches, documents, data.tender.submission_deadline);
  return <section className="panel"><div className="panel-heading"><div><ListChecks size={20}/><h2>{t('checklist')}</h2></div><span className="counter">{data.requirements.length} {t('requirements')}</span></div><div className="checklist-hint">{t('hint')}</div>
    {statuses.map(({ requirement:r, status },i) => <div className="requirement" data-testid={`requirement-${r.id}`} key={r.id}><span className="row-number">{String(i+1).padStart(2,'0')}</span><div className="requirement-main"><div className="requirement-top"><div><h3>{language==='en'?r.title_en:r.title_bn}</h3><span className="muted">{r.mandatory?t('required'):t('optional')}{r.has_expiry?' · '+t('expiryCheck'):''}</span></div><span className={'badge '+status}>{status==='ok'?<Check size={13}/>:status==='not_provided'?<Minus size={13}/>:<AlertCircle size={13}/>} {t(status)}</span></div>
    <div className="match-controls"><select aria-label={`${t('fileFor')} ${language==='en'?r.title_en:r.title_bn}`} value={matches[r.id]?.documentId ?? ''} disabled={busy} onChange={e=>match(r.id,e.target.value)}><option value="">{t('select')}</option>{documents.map(d=>{
      const assigned = Object.entries(matches).find(([id,m])=>id!==r.id&&m.documentId===d.id)?.[0];
      const duplicateUsed = Object.entries(matches).some(([id,m])=>id!==r.id&&m.documentId!==d.id&&documents.find(doc=>doc.id===m.documentId)?.hash===d.hash);
      return <option key={d.id} value={d.id} disabled={duplicateUsed}>{d.name} · {d.pages} {t(d.pages===1?'page':'pages')}{assigned?' ('+t('move')+')':''}{duplicateUsed?' ('+t('duplicateUsed')+')':''}</option>;
    })}</select>{matches[r.id]&&<button className="icon-button" title={t('undo')} aria-label={`${t('undo')} ${language==='en'?r.title_en:r.title_bn}`} disabled={busy} onClick={()=>match(r.id,'')}><RotateCcw size={16}/></button>}</div>
    {r.has_expiry&&matches[r.id]&&<label className="expiry-input">{t('expiry')}<input type="date" aria-label={`${t('expiryFor')} ${language==='en'?r.title_en:r.title_bn}`} value={matches[r.id].expiry} disabled={busy} onChange={e=>expiry(r.id,e.target.value)}/><small>{t('validAfter')} {data.tender.submission_deadline}</small></label>}</div></div>)}
    {!statuses.length&&<p className="checklist-hint">{t('noRequirements')}</p>}
  </section>;
}
