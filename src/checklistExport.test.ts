import { expect,it } from 'vitest';
import { checklistCsv } from './checklistExport';
it('exports missing documents, quotes commas, and neutralizes spreadsheet formulas',()=>{
  const csv=checklistCsv({tender:{tender_id:'T',title:'Title',procuring_entity:'E',bidder:'B',submission_deadline:'2026-10-20'},requirements:[{id:'x',order:1,title_en:'=SUM(1,2)',title_bn:'সনদ',mandatory:true,has_expiry:false}]},[],{},'en');
  expect(csv).toContain('"\'=SUM(1,2)"');expect(csv).toContain('"Missing"');expect(csv.startsWith('\uFEFF')).toBe(true);
});
