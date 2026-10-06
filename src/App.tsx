import { useEffect, useState } from 'react';
import { translator, messageText } from './i18n';
import type { Language } from './types';
import { checklistCsv } from './checklistExport';
import { downloadBytes } from './package';
import { FileCheck2, FolderOpen, LockKeyhole, ListChecks, Download, ChevronRight, CalendarDays } from 'lucide-react';
import { useWorkspace } from './useWorkspace';
import { DocumentPanel } from './DocumentPanel';
import { Checklist } from './Checklist';
import { isBlocking, statusesFor } from './domain';
export default function App() {
  const [language,setLanguage] = useState<Language>('en');
  const t = translator(language);
  useEffect(()=>{document.documentElement.lang=language;},[language]);
  const { data, documents, matches, messages, busy, processing, load, upload, remove, match, expiry, generate, generated } = useWorkspace();
  const statuses = data ? statusesFor(data.requirements, matches, documents, data.tender.submission_deadline) : [];
  const blockers = statuses.filter(s=>isBlocking(s.status));
  const ready = !!data && !busy && !blockers.length;
  return <><header className="topbar"><div className="brand"><span className="brand-icon"><FileCheck2 size={23}/></span>Tenderdesk<span className="brand-divider"/><span className="brand-caption">{t('builder')}</span></div><span className="private"><LockKeyhole size={14}/> {t('private')}</span><div className="language-switch" role="group" aria-label={t('language')}><button aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>EN</button><button aria-pressed={language==='bn'} onClick={()=>setLanguage('bn')}>বাংলা</button></div></header>
    <main className="workspace"><div className="page-heading"><div><div className="eyebrow">{t('workspace')}</div><h1>{t('heading')}</h1><p>{t('intro')}</p></div><label className="button secondary"><FolderOpen size={17}/>{data ? t('change') : t('load')}<input aria-label={t('load')} disabled={busy} type="file" accept=".json,application/json" onChange={e => { void load(e.target.files?.[0]); e.target.value = ''; }}/></label></div>
    <nav className="steps" aria-label={t('workflow')}>{[t('load'),t('uploadStep'),t('matchStep'),t('generateStep')].map((s,i)=><div className={i===(ready?3:documents.length?2:data?1:0)?'step active':'step'} key={s}><span>{i+1}</span>{s}{i<3&&<ChevronRight size={16}/>}</div>)}</nav>
    {messages.length>0&&<div className="notice error" role="alert">{messages.map((m,i)=><div key={i}>{m.detail && <strong>{m.detail}: </strong>}{messageText(language,m.code)}</div>)}</div>}
    {generated&&<div className="notice success" role="status">{t('generated')}</div>}
    {data&&<section className="tender-summary"><div><span className="eyebrow">{data.tender.tender_id}</span><h2>{data.tender.title}</h2><p>{data.tender.procuring_entity} · {data.tender.bidder}</p></div><div className="deadline"><CalendarDays size={18}/><div><small>{t('deadline')}</small><strong>{data.tender.submission_deadline}</strong></div></div></section>}
    <div className="workspace-grid">{data ? <Checklist language={language} data={data} documents={documents} matches={matches} busy={busy} match={match} expiry={expiry}/> : <section className="panel"><div className="panel-heading"><div><ListChecks size={20}/><h2>{t('checklist')}</h2></div><span className="counter">0</span></div><div className="empty-state"><span className="empty-icon"><ListChecks size={34}/></span><h2>{t('first')}</h2><p>{t('chooseHelp')}</p><label className="button primary"><FolderOpen size={17}/>{t('choose')}<input aria-label={t('choose')} type="file" accept=".json,application/json" disabled={busy} onChange={e=>void load(e.target.files?.[0])}/></label><small>{t('local')}</small></div></section>}
    <aside><DocumentPanel language={language} documents={documents} enabled={!!data} busy={busy} processing={processing} upload={upload} remove={remove}/><section className="package-card" aria-live="polite"><span className="eyebrow">{t('final')}</span><h2>{ready?t('ready'):t('ordered')}</h2>{data ? <><div className="progress-label"><strong>{statuses.filter(s=>s.status==='ok').length} / {data.requirements.length}</strong><span>{t('documentsReady')}</span></div><progress max={Math.max(data.requirements.length,1)} value={statuses.filter(s=>!isBlocking(s.status)).length}/>{blockers.length>0?<details className="blockers" open><summary>{blockers.length} {t('issues')}</summary><ul>{blockers.map(({requirement:r,status})=><li key={r.id}><strong>{language==='en'?r.title_en:r.title_bn}</strong><span>{t(status)}</span></li>)}</ul></details>:<p>{t('checked')}</p>}</>:<p>{t('packageHelp')}</p>}<button className="button primary full" disabled={!ready} onClick={()=>void generate()}><Download size={17}/>{processing==='package'?t('generating'):t('generate')}</button>{data&&<button className="button secondary full csv-button" disabled={busy} onClick={()=>downloadBytes(new TextEncoder().encode(checklistCsv(data,documents,matches,language)),`${data.tender.tender_id}_Checklist.csv`,'text/csv;charset=utf-8')}>{t('exportCsv')}</button>}<small className="package-note">{t('onDevice')}</small></section></aside></div>
    <footer className="app-footer"><span><LockKeyhole size={14}/>{t('privacy')}</span><span>{t('product')}</span></footer></main></>;
}
