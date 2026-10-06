import { describe, expect, it } from 'vitest';
import { assign, duplicateHashes, getRequirementStatus, isBlocking, isDate, removeDocument, sortRequirements } from './domain';
import type { Requirement, UploadedDocument } from './types';
const r: Requirement = { id: 'arbitrary', order: 2, title_en: 'Certificate', title_bn: 'সনদ', mandatory: true, has_expiry: true };
const docs = [{ id: 'a', hash: 'same' }, { id: 'b', hash: 'same' }, { id: 'c', hash: 'other' }] as UploadedDocument[];
describe('status engine', () => {
  it.each([
    [true, false, true, '', 'missing'], [false, false, true, '', 'not_provided'],
    [true, true, true, '', 'expiry_needed'], [true, true, true, '2026-10-19', 'expired'],
    [true, true, true, '2026-10-20', 'ok'], [true, true, true, '2026-10-21', 'ok'],
    [true, true, false, '', 'ok'], [false, true, true, '2026-10-19', 'expired'],
    [false, true, true, '', 'expiry_needed'], [true, true, true, '2026-02-30', 'expiry_needed'],
  ] as const)('%s %s %s %s -> %s', (mandatory, matched, has_expiry, expiry, expected) => {
    expect(getRequirementStatus({ ...r, mandatory, has_expiry }, matched, expiry, '2026-10-20')).toBe(expected);
  });
  it('blocks only three statuses', () => {
    expect(['missing','expiry_needed','expired','not_provided','ok'].map(s => isBlocking(s as Parameters<typeof isBlocking>[0]))).toEqual([true,true,true,false,false]);
  });
  it('validates leap years and real calendar dates', () => {
    expect(isDate('2024-02-29')).toBe(true); expect(isDate('2026-02-29')).toBe(false);
    expect(isDate('1900-02-29')).toBe(false); expect(isDate('2000-02-29')).toBe(true);
    expect(isDate('2026-1-01')).toBe(false); expect(isDate('0000-01-01')).toBe(false);
  });
});
describe('matching', () => {
  it('moves the same file atomically', () => expect(assign({ x: { documentId: 'a', expiry: '2027-01-01' } }, docs, 'y', 'a')).toEqual({ y: { documentId: 'a', expiry: '' } }));
  it('replaces a file and clears stale expiry', () => expect(assign({ x: { documentId: 'a', expiry: '2027-01-01' } }, docs, 'x', 'c')).toEqual({ x: { documentId: 'c', expiry: '' } }));
  it('prevents duplicate bytes at different requirements', () => expect(() => assign({ x: { documentId: 'a', expiry: '' } }, docs, 'y', 'b')).toThrow('duplicate_match'));
  it('allows duplicate replacement on same requirement', () => expect(assign({ x: { documentId: 'a', expiry: '' } }, docs, 'x', 'b').x.documentId).toBe('b'));
  it('undoes assignments', () => expect(assign({ x: { documentId: 'a', expiry: '' } }, docs, 'x', '')).toEqual({}));
  it('removes dangling matches', () => expect(removeDocument({ x: { documentId: 'a', expiry: '' } }, 'a')).toEqual({}));
  it('rejects nonexistent files', () => expect(() => assign({}, docs, 'x', 'z')).toThrow('unknown_file'));
  it('handles IDs that resemble JavaScript prototype names',()=>{
    const matches=assign({},docs,'__proto__','a');expect(matches['__proto__'].documentId).toBe('a');
    expect(Object.keys(matches)).toEqual(['__proto__']);expect(matches['toString']).toBeUndefined();
    expect(removeDocument(matches,'a')['__proto__']).toBeUndefined();
  });
  it('marks duplicates by hash', () => expect([...duplicateHashes(docs)]).toEqual(['same']));
});
it('sorts numerically without mutating input, ties remain stable', () => {
  const list = [{ ...r, order: 10 }, { ...r, order: 2 }, { ...r, order: 1 }];
  expect(sortRequirements(list).map(i => i.order)).toEqual([1,2,10]); expect(list[0].order).toBe(10);
});
