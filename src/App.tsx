import { useEffect, useState } from 'react';
import { translator, messageText } from './i18n';
import type { Language } from './types';
import { checklistCsv } from './checklistExport';
import { downloadBytes } from './package';
import {
  FileCheck2,
  FolderOpen,
  LockKeyhole,
  Download,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Check,
  FileText,
  Building2,
  UserCheck,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useWorkspace } from './useWorkspace';
import { DocumentPanel } from './DocumentPanel';
import { Checklist } from './Checklist';
import { isBlocking, statusesFor } from './domain';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translator(language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const {
    data,
    documents,
    matches,
    messages,
    busy,
    processing,
    load,
    upload,
    remove,
    match,
    expiry,
    generate,
    generated
  } = useWorkspace();

  const statuses = data ? statusesFor(data.requirements, matches, documents, data.tender.submission_deadline) : [];
  const blockers = statuses.filter(s => isBlocking(s.status));
  const ready = !!data && !busy && !blockers.length;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-icon">
              <FileCheck2 size={22} />
            </span>
            <div className="brand-details">
              <span className="brand-name">TenderDesk</span>
              <span className="brand-caption">Tender Document Package Builder</span>
            </div>
          </div>

          <div className="topbar-right">
            <span className="private">
              <LockKeyhole size={14} /> {t('private')}
            </span>
            <div className="language-switch" role="group" aria-label={t('language')}>
              <button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>
                EN
              </button>
              <button aria-pressed={language === 'bn'} onClick={() => setLanguage('bn')}>
                বাংলা
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <div className="eyebrow">{t('workspace')}</div>
            <h1>{t('heading')}</h1>
            <p>{t('intro')}</p>
          </div>
          <label className="button secondary">
            <FolderOpen size={16} />
            {data ? t('change') : t('load')}
            <input
              aria-label={t('load')}
              disabled={busy}
              type="file"
              accept=".json,application/json"
              onChange={e => {
                void load(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <nav className="steps" aria-label={t('workflow')}>
          {[t('load'), t('uploadStep'), t('matchStep'), t('generateStep')].map((s, i) => (
            <div
              className={i === (ready ? 3 : documents.length ? 2 : data ? 1 : 0) ? 'step active' : 'step'}
              key={s}
            >
              <span>{i + 1}</span>
              {s}
              {i < 3 && <ChevronRight size={15} />}
            </div>
          ))}
        </nav>

        {messages.length > 0 && (
          <div className="notice error" role="alert">
            {messages.map((m, i) => (
              <div key={i}>
                {m.detail && <strong>{m.detail}: </strong>}
                {messageText(language, m.code)}
              </div>
            ))}
          </div>
        )}

        {generated && (
          <div className="notice success" role="status">
            <CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
            {t('generated')}
          </div>
        )}

        {data && (
          <section className="tender-summary">
            <div className="tender-summary-main">
              <div className="tender-meta-badges">
                <span className="tender-id-badge">
                  {data.tender.tender_id}
                </span>
                <span className="counter">
                  {data.requirements.length} {t('requirements')}
                </span>
              </div>
              <h2>{data.tender.title}</h2>
              <div className="tender-entities">
                <span>
                  <Building2 size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                  {data.tender.procuring_entity}
                </span>
                <span>·</span>
                <span>
                  <UserCheck size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                  <strong>{data.tender.bidder}</strong>
                </span>
              </div>
            </div>

            <div className="deadline">
              <CalendarDays size={18} />
              <div>
                <small>{t('deadline')}</small>
                <strong>{data.tender.submission_deadline}</strong>
              </div>
            </div>
          </section>
        )}

        {data ? (
          <div className="workspace-grid">
            <div>
              <Checklist
                language={language}
                data={data}
                documents={documents}
                matches={matches}
                busy={busy}
                match={match}
                expiry={expiry}
              />

              {ready && (
                <div className="ordered-docs-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3>{language === 'en' ? 'Documents to be included (in order)' : 'অন্তর্ভুক্ত নথিগুলো (ক্রমানুসারে)'}</h3>
                    <span className="counter" style={{ color: 'var(--status-ok-text)', background: 'var(--status-ok-bg)', borderColor: 'var(--status-ok-border)' }}>
                      <Check size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '2px' }} />
                      {language === 'en' ? 'Ready to generate' : 'প্যাকেজ প্রস্তুত'}
                    </span>
                  </div>
                  <div className="ordered-doc-row">
                    <span>
                      <FileCheck2 size={16} style={{ color: 'var(--color-brand-primary)' }} />
                      1. Cover Page (Auto-generated)
                    </span>
                    <span>{language === 'en' ? 'Generated' : 'তৈরি হবে'}</span>
                  </div>
                  {data.requirements
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .filter(r => matches[r.id]?.documentId)
                    .map((r, idx) => {
                      const doc = documents.find(d => d.id === matches[r.id].documentId);
                      return (
                        <div className="ordered-doc-row" key={r.id}>
                          <span>
                            <FileText size={16} />
                            {idx + 2}. {language === 'en' ? r.title_en : r.title_bn} ({doc?.name})
                          </span>
                          <span>{doc?.pages} {doc?.pages === 1 ? t('page') : t('pages')}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <aside>
              <DocumentPanel
                language={language}
                documents={documents}
                enabled={!!data}
                busy={busy}
                processing={processing}
                upload={upload}
                remove={remove}
              />

              <section className="package-card" aria-live="polite">
                <span className="eyebrow">{t('final')}</span>
                <h2>{ready ? t('ready') : t('ordered')}</h2>

                <div className="progress-label">
                  <strong>
                    {statuses.filter(s => s.status === 'ok').length} / {data.requirements.length}
                  </strong>
                  <span>{t('documentsReady')}</span>
                </div>

                <progress
                  max={Math.max(data.requirements.length, 1)}
                  value={statuses.filter(s => !isBlocking(s.status)).length}
                />

                {blockers.length > 0 ? (
                  <details className="blockers" open>
                    <summary>
                      {blockers.length} {t('issues')}
                    </summary>
                    <ul>
                      {blockers.map(({ requirement: r, status }) => (
                        <li key={r.id}>
                          <strong>{language === 'en' ? r.title_en : r.title_bn}</strong>
                          <span>{t(status)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <p>{t('checked')}</p>
                )}

                <button className="button primary full" disabled={!ready} onClick={() => void generate()}>
                  <Download size={16} />
                  {processing === 'package' ? t('generating') : t('generate')}
                </button>

                <button
                  type="button"
                  className="button secondary full csv-button"
                  disabled={busy}
                  onClick={() =>
                    downloadBytes(
                      new TextEncoder().encode(checklistCsv(data, documents, matches, language)),
                      `${data.tender.tender_id}_Checklist.csv`,
                      'text/csv;charset=utf-8'
                    )
                  }
                >
                  <FileSpreadsheet size={15} />
                  {t('exportCsv')}
                </button>

                <small className="package-note">
                  <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                  {t('onDevice')}
                </small>
              </section>
            </aside>
          </div>
        ) : (
          <section className="empty-hero-grid">
            <div className="hero-content">
              <span className="hero-eyebrow">
                <ShieldCheck size={14} /> {t('builder')}
              </span>
              <h2 className="hero-title">{t('first')}</h2>
              <p className="hero-desc">{t('chooseHelp')}</p>

              <div className="hero-actions">
                <label className="button primary">
                  <FolderOpen size={16} />
                  {t('choose')}
                  <input
                    aria-label={t('choose')}
                    type="file"
                    accept=".json,application/json"
                    disabled={busy}
                    onChange={e => {
                      void load(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              <div className="workflow-mini-cards">
                <div className="wf-mini-card">
                  <strong>1. {t('load')}</strong>
                  <span>Import requirements.json</span>
                </div>
                <div className="wf-mini-card">
                  <strong>2. {t('uploadStep')}</strong>
                  <span>Add your PDF documents</span>
                </div>
                <div className="wf-mini-card">
                  <strong>3. {t('matchStep')}</strong>
                  <span>We validate and match</span>
                </div>
                <div className="wf-mini-card">
                  <strong>4. {t('generateStep')}</strong>
                  <span>Download ready package</span>
                </div>
              </div>
            </div>

            <div className="hero-illustration-card">
              <div className="hero-illustration-header">
                <h3>Tender Package</h3>
                <span className="counter" style={{ color: 'var(--status-ok-text)', background: 'var(--status-ok-bg)', borderColor: 'var(--status-ok-border)' }}>
                  <Check size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '2px' }} /> Ready
                </span>
              </div>
              <div className="hero-doc-preview-list">
                <div className="hero-doc-item">
                  <span>📄 Form.pdf</span>
                  <Check size={15} />
                </div>
                <div className="hero-doc-item">
                  <span>📄 Technical.pdf</span>
                  <Check size={15} />
                </div>
                <div className="hero-doc-item">
                  <span>📄 Financial.pdf</span>
                  <Check size={15} />
                </div>
                <div className="hero-doc-item">
                  <span>📄 Others.pdf</span>
                  <Check size={15} />
                </div>
              </div>
              <label
                className="dropzone"
                style={{ margin: 0, padding: '16px', background: 'var(--color-bg-surface)' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (!busy) void load(e.dataTransfer.files?.[0]);
                }}
              >
                <FolderOpen size={24} />
                <strong>Drop requirements.json here</strong>
                <small>{t('local')}</small>
                <input
                  aria-label="Drop requirements.json"
                  type="file"
                  accept=".json,application/json"
                  disabled={busy}
                  style={{ display: 'none' }}
                  onChange={e => {
                    void load(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </section>
        )}

        <footer className="app-footer">
          <span>
            <LockKeyhole size={14} />
            {t('privacy')}
          </span>
          <span>{t('product')}</span>
        </footer>
      </main>
    </>
  );
}
