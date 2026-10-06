import type { Matches, Requirement, Status, UploadedDocument } from './types';

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}
export function getRequirementStatus(requirement: Requirement, matched: boolean, expiry: string, deadline: string): Status {
  if (!matched) return requirement.mandatory ? 'missing' : 'not_provided';
  if (!requirement.has_expiry) return 'ok';
  if (!isDate(expiry)) return 'expiry_needed';
  return expiry < deadline ? 'expired' : 'ok';
}
export const isBlocking = (status: Status) => status === 'missing' || status === 'expiry_needed' || status === 'expired';
export const sortRequirements = (requirements: Requirement[]) => [...requirements].sort((a, b) => a.order - b.order);
export function statusesFor(requirements: Requirement[], matches: Matches, documents: UploadedDocument[], deadline: string) {
  const ids = new Set(documents.map(d => d.id));
  return requirements.map(requirement => ({ requirement, status: getRequirementStatus(requirement, ids.has(matches[requirement.id]?.documentId), matches[requirement.id]?.expiry ?? '', deadline) }));
}
export function assign(matches: Matches, documents: UploadedDocument[], requirementId: string, documentId: string): Matches {
  const next = Object.assign(Object.create(null), matches) as Matches;
  if (!documentId) { delete next[requirementId]; return next; }
  const document = documents.find(d => d.id === documentId);
  if (!document) throw new Error('unknown_file');
  for (const [id, match] of Object.entries(matches)) {
    if (id !== requirementId && match.documentId !== documentId && documents.find(d => d.id === match.documentId)?.hash === document.hash) throw new Error('duplicate_match');
  }
  for (const [id, match] of Object.entries(next)) if (match.documentId === documentId) delete next[id];
  next[requirementId] = { documentId, expiry: matches[requirementId]?.documentId === documentId ? matches[requirementId].expiry : '' };
  return next;
}
export function removeDocument(matches: Matches, documentId: string): Matches {
  return Object.assign(Object.create(null), Object.fromEntries(Object.entries(matches).filter(([, match]) => match.documentId !== documentId))) as Matches;
}
export function duplicateHashes(documents: UploadedDocument[]): Set<string> {
  const counts = new Map<string, number>();
  documents.forEach(d => counts.set(d.hash, (counts.get(d.hash) ?? 0) + 1));
  return new Set([...counts].filter(([, count]) => count > 1).map(([hash]) => hash));
}
