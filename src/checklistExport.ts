import { statusesFor } from './domain';
import { translator } from './i18n';
import type { Language, Matches, RequirementsFile, UploadedDocument } from './types';
function cell(value:string):string {
  const safe=/^[\s]*[=+@-]/.test(value)?"'"+value:value;
  return '"'+safe.replaceAll('"','""')+'"';
}
export function checklistCsv(data:RequirementsFile,documents:UploadedDocument[],matches:Matches,language:Language):string {
  const t=translator(language);
  const rows=[['Document','Filename','Pages','Expiry date','Status'],...statusesFor(data.requirements,matches,documents,data.tender.submission_deadline).map(({requirement:r,status})=>{
    const match=matches[r.id];const doc=documents.find(d=>d.id===match?.documentId);
    return [language==='en'?r.title_en:r.title_bn,doc?.name??'',doc?String(doc.pages):'',r.has_expiry&&doc?match?.expiry??'':'',t(status)];
  })];
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
