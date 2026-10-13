import { translator } from './i18n';
import type { Language, UploadedDocument } from './types';
import { Files, UploadCloud, FileText, Trash2, LoaderCircle } from 'lucide-react';
import { formatBytes } from './files';
import { duplicateHashes } from './domain';

interface Props {
  language: Language;
  documents: UploadedDocument[];
  enabled: boolean;
  busy: boolean;
  processing: string;
  upload: (files: File[]) => Promise<void>;
  remove: (id: string) => void;
}

export function DocumentPanel({ language, documents, enabled, busy, processing, upload, remove }: Props) {
  const t = translator(language);
  const total = documents.reduce((n, d) => n + d.size, 0);
  const duplicates = duplicateHashes(documents);
  const maxBytes = 50_000_000;
  const pct = Math.min(100, Math.round((total / maxBytes) * 100));

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <Files size={18} />
          <h2>{t('documents')}</h2>
        </div>
        <span className="counter">{documents.length} / 30</span>
      </div>

      <label
        className={'upload-placeholder dropzone ' + (!enabled || busy ? 'disabled' : '')}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          if (enabled && !busy) void upload([...e.dataTransfer.files]);
        }}
      >
        {busy ? (
          <LoaderCircle className="spin" size={26} />
        ) : (
          <UploadCloud size={26} />
        )}
        <strong>
          {busy
            ? processing === 'package'
              ? t('generating')
              : t('processing')
            : enabled
              ? t('drop')
              : t('filesHere')}
        </strong>
        <input
          aria-label={t('upload')}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          disabled={!enabled || busy}
          onChange={e => {
            void upload([...(e.target.files ?? [])]);
            e.target.value = '';
          }}
        />
        <small>{busy ? (processing === 'package' ? t('onDevice') : processing) : t('limits')}</small>
      </label>

      {documents.length > 0 && (
        <>
          <div className="file-meter">
            <span>
              <strong>{formatBytes(total)}</strong> {t('ofLimit')} ({pct}%)
            </span>
            <span>
              <strong>{documents.reduce((n, d) => n + d.pages, 0)}</strong> {t('pages')}
            </span>
          </div>

          <div className="file-list">
            {documents.map(d => (
              <div className="file-row" key={d.id}>
                <FileText size={18} />
                <div className="file-info">
                  <strong title={d.name}>{d.name}</strong>
                  <small>
                    {d.pages} {d.pages === 1 ? t('page') : t('pages')} · {formatBytes(d.size)}
                  </small>
                  {duplicates.has(d.hash) && (
                    <span className="badge expiry_needed">{t('duplicate')}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${t('remove')} ${d.name}`}
                  title={`${t('remove')} ${d.name}`}
                  disabled={busy}
                  onClick={() => remove(d.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
