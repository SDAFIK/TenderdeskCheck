import { chromium, expect } from '@playwright/test';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { writeFile } from 'node:fs/promises';
const source=await PDFDocument.create();const font=await source.embedFont(StandardFonts.Helvetica);
for(const rotation of [0,90,180,270]){
 const p=source.addPage([500,650]);p.setCropBox(30,40,420,550);p.setRotation(degrees(rotation));
 p.drawRectangle({x:30,y:40,width:420,height:550,color:rgb(.92,.96,1)});
 p.drawText(`Rotation ${rotation}`,{x:70,y:300,font,size:22});
 for(const [x,y,c] of [[32,42,rgb(1,0,0)],[402,42,rgb(0,1,0)],[32,552,rgb(0,0,1)],[402,552,rgb(1,0,1)]])p.drawRectangle({x,y,width:45,height:35,color:c});
 p.drawText('BOTTOM EDGE - KEEP VISIBLE',{x:80,y:43,font,size:11});
}
const bytes=await source.save();await writeFile('tmp/geometry-source.pdf',bytes);
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
console.log('Chromium version:',browser.version());
const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/');
const data={tender:{tender_id:'GEOMETRY',title:'Page geometry check',procuring_entity:'QA',bidder:'QA',submission_deadline:'2026-10-20'},requirements:[{id:'__proto__',order:1,title_en:'Rotated pages',title_bn:'ঘোরানো পৃষ্ঠা',mandatory:true,has_expiry:false}]};
await page.getByLabel('Load tender',{exact:true}).setInputFiles({name:'requirements.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
await page.getByLabel('Upload PDFs',{exact:true}).setInputFiles({name:'geometry.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
await expect(page.getByLabel('Upload PDFs',{exact:true})).toBeEnabled();
const select=page.locator('.requirement select');await select.selectOption(await select.locator('option').nth(1).getAttribute('value'));
const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Generate package',exact:true}).click();await (await pending).saveAs('tmp/geometry-package.pdf');
await browser.close();
console.log('Geometry package created through Chromium UI.');
