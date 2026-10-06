import { expect, it } from 'vitest';
import { parseRequirements } from './validation';
const tender = { tender_id: 'Unseen-ID', title: 'A', procuring_entity: 'B', bidder: 'C', submission_deadline: '2026-10-20' };
const req = { id: 'other', order: 1, title_en: 'Item', title_bn: 'নথি', mandatory: false, has_expiry: false };
it('loads unseen data and sorts', () => expect(parseRequirements(JSON.stringify({ tender, requirements: [{ ...req, id: 'z', order: 9 }, req] })).requirements[0].id).toBe('other'));
it('rejects malformed JSON', () => expect(() => parseRequirements('{')).toThrow('invalid_json'));
it.each([null, {}, { tender, requirements: [{ ...req, mandatory: 'false' }] }, { tender, requirements: [req, req] }, { tender: { ...tender, submission_deadline: '2026-02-30' }, requirements: [] }, { tender, requirements: [{ ...req, order: 0 }] }])('rejects invalid schema %j', input => expect(() => parseRequirements(JSON.stringify(input))).toThrow('invalid_schema'));
it('accepts BOM and empty list', () => expect(parseRequirements('\uFEFF' + JSON.stringify({ tender, requirements: [] })).requirements).toEqual([]));
