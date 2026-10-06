import { it, expect } from 'vitest';
import { sha256 } from './hashing';
it('same bytes with different names hash identically', async () => expect(await sha256(new File(['identical'], 'a.pdf'))).toBe(await sha256(new File(['identical'], 'b.pdf'))));
it('same name with different bytes does not hash identically', async () => expect(await sha256(new File(['first'], 'a.pdf'))).not.toBe(await sha256(new File(['second'], 'a.pdf'))));
