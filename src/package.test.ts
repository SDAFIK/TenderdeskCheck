import { expect, it } from 'vitest';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { addSafeFooter, buildPackage, localDate } from './package';
import type { RequirementsFile, UploadedDocument } from './types';
const data: RequirementsFile={tender:{tender_id:'UNSEEN-42',title:'Equipment',procuring_entity:'Entity',bidder:'Company',submission_deadline:'2026-10-20'},requirements:[{id:'b',order:2,title_en:'Second',title_bn:'দ্বিতীয়',mandatory:true,has_expiry:false},{id:'a',order:1,title_en:'First',title_bn:'প্রথম',mandatory:true,has_expiry:false},{id:'skip',order:3,title_en:'Optional',title_bn:'ঐচ্ছিক',mandatory:false,has_expiry:false}]};
async function document(id:string, sizes:number[][]):Promise<UploadedDocument>{
  const pdf=await PDFDocument.create();sizes.forEach(s=>pdf.addPage([s[0],s[1]]));
  const bytes=new Uint8Array(await pdf.save());const file=new File([bytes],id+'.pdf',{type:'application/pdf'});
  return {id,file,name:file.name,size:file.size,pages:sizes.length,hash:id};
}
it('adds cover, skips optional, orders all source pages by requirement order',async()=>{
  const docs=[await document('b',[[600,400],[610,410]]),await document('a',[[500,700]])];
  const result=await PDFDocument.load(await buildPackage(data,docs,{a:{documentId:'a',expiry:''},b:{documentId:'b',expiry:''}}));
  expect(result.getPageCount()).toBe(4);expect(result.getPages().map(p=>p.getWidth())).toEqual([595.28,500,600,610]);
  expect(result.getPage(1).getHeight()).toBe(740);
});
it('blocks missing requirements inside the generator too',async()=>expect(buildPackage(data,[],{})).rejects.toThrow('blocked'));
it('rejects content duplicated across matches at generation',async()=>{
  const a=await document('a',[[500,700]]);const b={...a,id:'b'};
  await expect(buildPackage(data,[a,b],{a:{documentId:'a',expiry:''},b:{documentId:'b',expiry:''}})).rejects.toThrow('duplicate_match');
});
it.each([0,90,180,270])('adds safe footer outside offset crop with rotation %i',async rotation=>{
  const pdf=await PDFDocument.create();const page=pdf.addPage([700,900]);page.setCropBox(30,40,600,800);page.setRotation(degrees(rotation));
  const font=await pdf.embedFont(StandardFonts.Helvetica);addSafeFooter(page,'Tender | Page 1 of 1',font);
  expect(page.getRotation().angle).toBe(rotation);
  expect(page.getSize()).toEqual(rotation%180===0?{width:600,height:840}:{width:640,height:800});
  expect(page.getCropBox()).toEqual(rotation===0?{x:30,y:0,width:600,height:840}:rotation===90?{x:30,y:40,width:640,height:800}:rotation===180?{x:30,y:40,width:600,height:840}:{x:-10,y:40,width:640,height:800});
});
it('long cover content grows one cover rather than clipping or adding unordered pages',async()=>{
  const more={...data,requirements:[],tender:{...data.tender,title:'A long title '.repeat(200)}};
  const result=await PDFDocument.load(await buildPackage(more,[],{}));expect(result.getPageCount()).toBe(1);expect(result.getPage(0).getHeight()).toBeGreaterThan(842);
});
it('formats the creation date from local calendar components',()=>expect(localDate(new Date(2026,9,6,23,59))).toBe('2026-10-06'));
