import { useState } from 'react';
import { ListChecks, Check, AlertCircle, Minus, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { translator } from './i18n';
import type { Language } from './types';
import { isBlocking, statusesFor } from './domain';
import type { Matches, RequirementsFile, UploadedDocument } from './types';

interface Props {
  language: Language;
  data: RequirementsFile;
  documents: UploadedDocument[];
  matches: Matches;
  busy: boolean;
  match: (r: string, d: string) => void;
  expiry: (r: string, v: string) => void;
}

export function Checklist({ language, data, documents, matches, busy, match, expiry }: Props) {
  const t = translator(language);
  const [filter, setFilter] = useState<'all' | 'missing' | 'expired'>('all');
  const statuses = statusesFor(data.requirements, matches, documents, data.tender.submission_deadline);

  const missingCount = statuses.filter(s => s.status === 'missing').length;
  const expiredCount = statuses.filter(s => s.status === 'expired' || s.status === 'expiry_needed').length;
  const blockers = statuses.filter(s => isBlocking(s.status));

  const visibleStatuses = filter === 'all'
    ? statuses
    : filter === 'missing'
      ? statuses.filter(s => s.status === 'missing')
      : statuses.filter(s => s.status === 'expired' || s.status === 'expiry_needed');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <ListChecks size={18} />
          <h2>{t('checklist')}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="filter-pills" role="group" aria-label="Filter requirements">
            <button
              type="button"
              className={'filter-pill ' + (filter === 'all' ? 'active' : '')}
              onClick={() => setFilter('all')}
            >
              All ({statuses.length})
            </button>
            <button
              type="button"
              className={'filter-pill ' + (filter === 'missing' ? 'active' : '')}
              onClick={() => setFilter('missing')}
            >
              Missing ({missingCount})
            </button>
            <button
              type="button"
              className={'filter-pill ' + (filter === 'expired' ? 'active' : '')}
              onClick={() => setFilter('expired')}
            >
              Expired ({expiredCount})
            </button>
          </div>
          <span className="counter">{data.requirements.length} {t('requirements')}</span>
        </div>
      </div>

      <div className="checklist-hint">
        <span>{t('hint')}</span>
      </div>

      <div className="requirements-list">
        {visibleStatuses.map(({ requirement: r, status }, i) => (
          <div className="requirement" data-testid={`requirement-${r.id}`} key={r.id}>
            <span className="row-number">{String(i + 1).padStart(2, '0')}</span>

            <div className="requirement-main">
              <div className="requirement-top">
                <h3>{language === 'en' ? r.title_en : r.title_bn}</h3>
                <span className="muted">
                  {r.mandatory ? t('required') : t('optional')}
                  {r.has_expiry ? ' · ' + t('expiryCheck') : ''}
                </span>
              </div>
            </div>

            <div>
              <div className="match-controls">
                <select
                  aria-label={`${t('fileFor')} ${language === 'en' ? r.title_en : r.title_bn}`}
                  value={matches[r.id]?.documentId ?? ''}
                  disabled={busy}
                  onChange={e => match(r.id, e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  {documents.map(d => {
                    const assigned = Object.entries(matches).find(([id, m]) => id !== r.id && m.documentId === d.id)?.[0];
                    const duplicateUsed = Object.entries(matches).some(
                      ([id, m]) => id !== r.id && m.documentId !== d.id && documents.find(doc => doc.id === m.documentId)?.hash === d.hash
                    );
                    return (
                      <option key={d.id} value={d.id} disabled={duplicateUsed}>
                        {d.name} · {d.pages} {t(d.pages === 1 ? 'page' : 'pages')}
                        {assigned ? ' (' + t('move') + ')' : ''}
                        {duplicateUsed ? ' (' + t('duplicateUsed') + ')' : ''}
                      </option>
                    );
                  })}
                </select>
                {matches[r.id] && (
                  <button
                    type="button"
                    className="icon-button"
                    title={t('undo')}
                    aria-label={`${t('undo')} ${language === 'en' ? r.title_en : r.title_bn}`}
                    disabled={busy}
                    onClick={() => match(r.id, '')}
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {r.has_expiry && matches[r.id] && (
                <label className="expiry-input">
                  {t('expiry')}
                  <input
                    type="date"
                    aria-label={`${t('expiryFor')} ${language === 'en' ? r.title_en : r.title_bn}`}
                    value={matches[r.id].expiry}
                    disabled={busy}
                    onChange={e => expiry(r.id, e.target.value)}
                  />
                  <small>{t('validAfter')} {data.tender.submission_deadline}</small>
                </label>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={'badge ' + status}>
                {status === 'ok' ? (
                  <Check size={12} />
                ) : status === 'missing' || status === 'expired' ? (
                  <X size={12} />
                ) : status === 'not_provided' ? (
                  <Minus size={12} />
                ) : (
                  <AlertCircle size={12} />
                )}{' '}
                {t(status)}
              </span>
            </div>
          </div>
        ))}

        {!visibleStatuses.length && (
          <p className="checklist-hint" style={{ padding: '24px', textAlign: 'center' }}>
            {t('noRequirements')}
          </p>
        )}
      </div>

      {blockers.length > 0 && (
        <div className="blocker-alert-banner">
          <AlertTriangle size={16} />
          <div>
            <strong>
              {blockers.length} {t('issues')} {language === 'en' ? 'must be resolved before generating the package' : 'সমাধান করতে হবে'}
            </strong>
            <ul>
              {missingCount > 0 && (
                <li>
                  {missingCount} {language === 'en' ? 'mandatory document is missing' : 'আবশ্যিক নথি অনুপস্থিত'}
                </li>
              )}
              {expiredCount > 0 && (
                <li>
                  {expiredCount} {language === 'en' ? 'document has expired or requires expiry date' : 'নথির মেয়াদ শেষ বা মেয়াদ প্রয়োজন'}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
