import { degrees, PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { isBlocking, sortRequirements, statusesFor } from './domain';
import type { Matches, RequirementsFile, UploadedDocument } from './types';

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []; let line = '';
  for (const word of text.replace(/[\r\n\t]+/g,' ').split(/\s+/)) {
    if (line && font.widthOfTextAtSize(line+' '+word,size)>maxWidth) { lines.push(line); line=''; }
    for (const char of (line?' ':'')+word) {
      if (font.widthOfTextAtSize(line+char,size)>maxWidth && line) { lines.push(line); line=''; }
      line+=char;
    }
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}
export function localDate(now: Date): string { return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }

// Grow the page in its displayed downward direction. Original content and
// annotations keep their coordinates; even rotated and offset pages stay intact.
export function addSafeFooter(page: PDFPage, text: string, font: PDFFont) {
  const crop = page.getCropBox(); const media = page.getMediaBox();
  const x=Math.max(crop.x,media.x), y=Math.max(crop.y,media.y);
  const w=Math.min(crop.x+crop.width,media.x+media.width)-x;
  const h=Math.min(crop.y+crop.height,media.y+media.height)-y;
  if (w<=0 || h<=0) throw new Error('generation_error');
  const rotation=((page.getRotation().angle%360)+360)%360;
  const visualWidth=rotation%180===0?w:h;
  const padding=Math.min(20,visualWidth/10);
  const lines=wrapText(text,font,9,visualWidth-padding*2);
  const strip=Math.max(40,lines.length*12+20);
  let bx=x,by=y,bw=w,bh=h,fx=x,fy=y,fw=w,fh=strip;
  if(rotation===0){by=y-strip;bh=h+strip;fy=by;}
  else if(rotation===90){bw=w+strip;fx=x+w;fw=strip;fh=h;}
  else if(rotation===180){bh=h+strip;fy=y+h;}
  else if(rotation===270){bx=x-strip;bw=w+strip;fx=bx;fw=strip;fh=h;}
  else throw new Error('generation_error');
  page.setMediaBox(bx,by,bw,bh); page.setCropBox(bx,by,bw,bh);
  page.setTrimBox(bx,by,bw,bh); page.setBleedBox(bx,by,bw,bh); page.setArtBox(bx,by,bw,bh);
  page.drawRectangle({x:fx,y:fy,width:fw,height:fh,color:rgb(1,1,1)});
  for(let i=0;i<lines.length;i++) {
    const u=padding,v=strip-17-i*12;
    const position=rotation===0?{x:bx+u,y:by+v}:rotation===90?{x:bx+bw-v,y:by+u}:rotation===180?{x:bx+bw-u,y:by+bh-v}:{x:bx+v,y:by+bh-u};
    page.drawText(lines[i],{...position,font,size:9,rotate:degrees(rotation),color:rgb(.27,.34,.30)});
  }
}

export async function buildPackage(data: RequirementsFile, documents: UploadedDocument[], matches: Matches, now=new Date()): Promise<Uint8Array<ArrayBuffer>> {
  if (statusesFor(data.requirements,matches,documents,data.tender.submission_deadline).some(s=>isBlocking(s.status))) throw new Error('blocked');
  const included=sortRequirements(data.requirements).flatMap(r=>{
    const doc=documents.find(d=>d.id===matches[r.id]?.documentId);
    return doc?[{requirement:r,document:doc}]:[];
  });
  const used=new Set<string>();
  for(const item of included){if(used.has(item.document.hash))throw new Error('duplicate_match');used.add(item.document.hash);}
  const pdf=await PDFDocument.create();
  pdf.setTitle(`${data.tender.tender_id} Tender Package`);pdf.setAuthor(data.tender.bidder);pdf.setCreator('Tenderdesk');pdf.setCreationDate(now);
  const font=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const fields=[['Tender ID',data.tender.tender_id],['Tender title',data.tender.title],['Procuring entity',data.tender.procuring_entity],['Bidder',data.tender.bidder],['Submission deadline',data.tender.submission_deadline],['Package created',localDate(now)]];
  const coverLines:{text:string;bold:boolean;size:number;gap:number}[]=[];
  try {
    for(const [label,value] of fields) {
      coverLines.push({text:label.toUpperCase(),bold:true,size:9,gap:16});
      for(const line of wrapText(value,font,12,499))coverLines.push({text:line,bold:false,size:12,gap:18});
      coverLines.push({text:'',bold:false,size:10,gap:12});
    }
    coverLines.push({text:'INCLUDED DOCUMENTS',bold:true,size:10,gap:25});
    included.forEach(({requirement:r},i)=>{
      for(const line of wrapText(`${i+1}. ${r.title_en}`,font,11,499))coverLines.push({text:line,bold:false,size:11,gap:18});
    });
    if(!included.length)coverLines.push({text:'No documents required.',bold:false,size:11,gap:18});
    font.widthOfTextAtSize(data.tender.tender_id,9);
  } catch { throw new Error('pdf_text_error'); }
  const height=Math.max(802,160+coverLines.reduce((n,l)=>n+l.gap,0));
  const cover=pdf.addPage([595.28,height]);
  cover.drawRectangle({x:0,y:height-12,width:595.28,height:12,color:rgb(.09,.30,.23)});
  cover.drawText('TENDER DOCUMENT PACKAGE',{x:48,y:height-67,size:21,font:bold,color:rgb(.09,.30,.23)});
  let cursor=height-108;
  for(const line of coverLines){if(line.text)cover.drawText(line.text,{x:48,y:cursor,size:line.size,font:line.bold?bold:font,color:rgb(.18,.24,.20)});cursor-=line.gap;}
  for(const {document} of included) {
    const source=await PDFDocument.load(await document.file.arrayBuffer());
    // Flatten AcroForm widgets into their visible page content before copying.
    if(source.getForm().getFields().length)source.getForm().flatten();
    const pages=await pdf.copyPages(source,source.getPageIndices());
    pages.forEach(p=>pdf.addPage(p));
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  const total=pdf.getPageCount();
  pdf.getPages().forEach((page,i)=>addSafeFooter(page,`${data.tender.tender_id} | Page ${i+1} of ${total}`,font));
  return new Uint8Array(await pdf.save());
}
export function downloadBytes(bytes: Uint8Array<ArrayBuffer>, name: string, type='application/pdf') {
  const url=URL.createObjectURL(new Blob([bytes],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60_000);
}
