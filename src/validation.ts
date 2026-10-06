import { isDate, sortRequirements } from './domain';
import type { Requirement, RequirementsFile, Tender } from './types';
export class InputError extends Error { constructor(public code: 'invalid_json' | 'invalid_schema', public field = '') { super(code); } }
function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('invalid_schema', field);
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new InputError('invalid_schema', field);
  return value.trim();
}
export function parseRequirements(raw: string): RequirementsFile {
  let parsed: unknown;
  try { parsed = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { throw new InputError('invalid_json'); }
  const root = record(parsed, 'root'); const input = record(root.tender, 'tender');
  const tender: Tender = {
    tender_id: text(input.tender_id, 'tender_id'), title: text(input.title, 'title'),
    procuring_entity: text(input.procuring_entity, 'procuring_entity'), bidder: text(input.bidder, 'bidder'),
    submission_deadline: text(input.submission_deadline, 'submission_deadline'),
  };
  if (!isDate(tender.submission_deadline)) throw new InputError('invalid_schema', 'submission_deadline (YYYY-MM-DD)');
  if (!Array.isArray(root.requirements)) throw new InputError('invalid_schema', 'requirements');
  const ids = new Set<string>();
  const requirements = root.requirements.map((value: unknown, index): Requirement => {
    const r = record(value, `requirements[${index}]`); const id = text(r.id, `requirements[${index}].id`);
    if (ids.has(id)) throw new InputError('invalid_schema', `duplicate id: ${id}`); ids.add(id);
    if (typeof r.order !== 'number' || !Number.isSafeInteger(r.order) || r.order < 1) throw new InputError('invalid_schema', `${id}.order`);
    if (typeof r.mandatory !== 'boolean' || typeof r.has_expiry !== 'boolean') throw new InputError('invalid_schema', `${id}.mandatory / has_expiry`);
    return { id, order: r.order, title_en: text(r.title_en, `${id}.title_en`), title_bn: text(r.title_bn, `${id}.title_bn`), mandatory: r.mandatory, has_expiry: r.has_expiry };
  });
  return { tender, requirements: sortRequirements(requirements) };
}
