import JSZip from 'jszip';
import { DAILY_HEALTH_ADVICES } from '../data/seedData';
import { DiseaseGuide, FaqItem, Hospital, Product, SiteSettings } from '../types';

export interface ExportBundleData {
  settings: SiteSettings;
  products: Product[];
  diseases: DiseaseGuide[];
  hospitals: Hospital[];
  faqs: FaqItem[];
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJsonForHtml(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function sanitizeExportData(
  data: ExportBundleData,
  options: { allowDataUri?: boolean } = {}
) {
  const allowDataUri = options.allowDataUri ?? true;
  const whatsapp = data.settings.whatsapp || data.settings.phonePrimary || '01754149749';
  const bkash = data.settings.bkash || '01711480987';
  const addresses = [
    ...(data.settings.address && data.settings.address.trim()
      ? [data.settings.address.trim()]
      : []),
    ...(data.settings.addresses || []).filter(
      (a) => a && a.trim() && a.trim() !== data.settings.address?.trim()
    ),
  ];

  // Strip any price, Drive, Firebase, or personal Gmail metadata completely
  return {
    companyName: data.settings.companyName || 'lifecircle.bd',
    tagline: data.settings.tagline || 'বিশ্বস্ত মেডিকেল যন্ত্রপাতি ও স্লিপ টেস্ট সেবা',
    whatsapp,
    bkash,
    hours: data.settings.hours || 'শনি - বৃহস্পতি: সকাল ৯টা - রাত ৯টা',
    aboutTitle: data.settings.aboutTitle || 'lifecircle.bd',
    aboutDescription: data.settings.aboutDescription || '',
    sleepLabNote: data.settings.sleepLabNote || '',
    addresses,
    products: data.products.map((p) => {
      const url = p.imageUrl || '';
      const isHttp = url.startsWith('https://') || url.startsWith('http://');
      const isData = url.startsWith('data:image/');
      return {
        id: p.id,
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        category: p.category,
        warranty: p.warranty || 'অফিসিয়াল ওয়ারেন্টি সহ',
        inStock: p.inStock,
        descriptionBn: p.descriptionBn,
        relatedDiseases: p.relatedDiseases || [],
        imageUrl: isHttp || (allowDataUri && isData) ? url : '',
      };
    }),
    diseases: data.diseases.map((d) => ({
      id: d.id,
      nameBn: d.nameBn,
      nameEn: d.nameEn,
      overviewBn: d.overviewBn,
      symptoms: d.symptoms,
      immediateActions: d.immediateActions,
      treatmentBn: d.treatmentBn,
    })),
    dailyAdvices: DAILY_HEALTH_ADVICES,
    hospitals: data.hospitals.map((h) => ({
      id: h.id,
      nameBn: h.nameBn,
      type: h.type,
      division: h.division,
      locationBn: h.locationBn,
      emergencyPhone: h.emergencyPhone,
    })),
    faqs: [...data.faqs]
      .sort((a, b) => a.order - b.order)
      .map((f) => ({
        id: f.id,
        questionBn: f.questionBn,
        answerBn: f.answerBn,
        category: f.category || 'সাধারণ',
      })),
  };
}

function getExportCss(): string {
  return `
#lifecircle-bd-wp-root,.lc-wrap{font-family:"Hind Siliguri","Plus Jakarta Sans",system-ui,-apple-system,sans-serif;color:#1D2B53;background:#f8fafc;margin:0;padding:0;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}
#lifecircle-bd-wp-root.lc-dark,.lc-wrap.lc-dark{background:#020617;color:#f1f5f9}
#lifecircle-bd-wp-root input,#lifecircle-bd-wp-root textarea,#lifecircle-bd-wp-root select,.lc-wrap input,.lc-wrap textarea,.lc-wrap select{-webkit-user-select:text!important;user-select:text!important}
.lc-container{max-width:1200px;margin:0 auto;padding:0 16px}
.lc-header{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.96);border-bottom:1px solid #e2e8f0;backdrop-filter:blur(6px)}
.lc-dark .lc-header{background:rgba(2,6,23,.96);border-color:#1e293b}
.lc-header-in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px;flex-wrap:wrap;padding:8px 0}
.lc-brand{font-weight:800;font-size:20px;color:#1D2B53;text-decoration:none;display:flex;align-items:center;gap:8px;cursor:pointer}
.lc-dark .lc-brand{color:#fff}
.lc-brand span{color:#2DA94F}
.lc-nav{display:flex;gap:14px;flex-wrap:wrap}
.lc-nav button{background:none;border:0;border-bottom:2px solid transparent;padding:6px 4px;font-size:14px;font-weight:600;color:#475569;cursor:pointer}
.lc-dark .lc-nav button{color:#cbd5e1}
.lc-nav button.active{color:#2D89C8;border-bottom-color:#2D89C8}
.lc-btn{background:#2D89C8;color:#fff;border:0;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.lc-btn-green{background:#2DA94F}
.lc-btn-outline{background:#fff;color:#1D2B53;border:1px solid #cbd5e1}
.lc-dark .lc-btn-outline{background:#0f172a;color:#e2e8f0;border-color:#334155}
.lc-bar{background:#f1f5f9;border-bottom:1px solid #e2e8f0;padding:10px 0}
.lc-dark .lc-bar{background:#0f172a;border-color:#1e293b}
.lc-search-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between}
.lc-input{padding:9px 12px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-size:13px;min-width:220px;flex:1}
.lc-dark .lc-input{background:#020617;color:#f8fafc;border-color:#334155}
.lc-hero{background:linear-gradient(125deg,#1D2B53,#2D89C8);color:#fff;border-radius:18px;padding:34px 28px;margin:24px 0}
.lc-hero h1{margin:0 0 10px;font-size:28px;line-height:1.25}
.lc-hero p{margin:0 0 18px;max-width:720px;color:#e0f2fe;font-size:15px;line-height:1.6}
.lc-sec{padding:26px 0}
.lc-title{font-size:22px;font-weight:800;margin:0 0 6px}
.lc-sub{font-size:14px;color:#475569;margin:0 0 18px}
.lc-dark .lc-sub{color:#94a3b8}
.lc-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.lc-pill{background:#fff;border:1px solid #cbd5e1;color:#334155;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
.lc-dark .lc-pill{background:#0f172a;border-color:#334155;color:#cbd5e1}
.lc-pill.active{background:#2D89C8;color:#fff;border-color:#2D89C8}
.lc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
.lc-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.lc-dark .lc-card{background:#0f172a;border-color:#1e293b}
.lc-img-box{aspect-ratio:4/3;background:linear-gradient(135deg,#e0f2fe,#dcfce7);display:flex;align-items:center;justify-content:center;color:#2D89C8;font-weight:700;font-size:14px;text-align:center;padding:12px;overflow:hidden}
.lc-img-box img{width:100%;height:100%;object-fit:cover;display:block}
.lc-card-body{padding:16px;flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:10px}
.lc-card h3{margin:0;font-size:16px;font-weight:700}
.lc-card p{margin:6px 0 0;font-size:13px;color:#475569;line-height:1.55}
.lc-dark .lc-card p{color:#cbd5e1}
.lc-faq-item{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:10px;overflow:hidden;transition:box-shadow .2s,border-color .2s}
.lc-dark .lc-faq-item{background:#0f172a;border-color:#1e293b}
.lc-faq-item.lc-hl{border-color:#2DA94F;box-shadow:0 0 0 3px rgba(45,169,79,.28)}
.lc-faq-q{width:100%;text-align:left;background:none;border:0;padding:14px 18px;font-size:14px;font-weight:700;color:inherit;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.lc-faq-a{padding:12px 18px 16px;border-top:1px solid #f1f5f9;font-size:13.5px;color:#334155;line-height:1.65;display:none}
.lc-dark .lc-faq-a{border-color:#1e293b;color:#cbd5e1}
.lc-faq-item.open .lc-faq-a{display:block}
.lc-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.65);display:none;align-items:center;justify-content:center;padding:16px;z-index:9999}
.lc-modal-bg.show{display:flex}
.lc-modal{background:#fff;color:#0f172a;border-radius:16px;max-width:430px;width:100%;padding:24px;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.lc-dark .lc-modal{background:#0f172a;color:#f8fafc;border:1px solid #334155}
.lc-x{position:absolute;top:12px;right:12px;background:none;border:0;font-size:20px;cursor:pointer;color:#64748b;line-height:1;padding:4px 8px}
.lc-footer{background:#fff;border-top:1px solid #e2e8f0;padding:28px 0;margin-top:32px;font-size:13px;color:#475569}
.lc-dark .lc-footer{background:#0f172a;border-color:#1e293b;color:#94a3b8}
`.replace(/\n+/g, '');
}

function getExportAppScript(payloadJson: string): string {
  // Compact minified-style JS engine with copy protection, zero AI, zero prices, zero Drive/API links
  const raw = `(function(){
var D=${payloadJson};
var root=document.getElementById("lifecircle-bd-wp-root")||document.body;
var state={tab:"products",cat:"all",q:"",disId:D.diseases[0]?D.diseases[0].id:"",dark:false,regDismissed:false,regShown:false};
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function waLink(msg){var p=String(D.whatsapp||"01754149749").replace(/[^\\d]/g,"");var i=p.indexOf("880")===0?p:p.indexOf("0")===0?"88"+p:"880"+p;return "https://wa.me/"+i+(msg?"?text="+encodeURIComponent(msg):"");}
function isEditable(el){if(!el)return false;var t=el.tagName;return t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||el.isContentEditable;}
document.addEventListener("contextmenu",function(e){if(!isEditable(e.target))e.preventDefault();});
document.addEventListener("copy",function(e){if(!isEditable(e.target))e.preventDefault();});
document.addEventListener("cut",function(e){if(!isEditable(e.target))e.preventDefault();});
document.addEventListener("keydown",function(e){var k=(e.key||"").toLowerCase();if(e.key==="F12"||(e.ctrlKey&&e.shiftKey&&(k==="i"||k==="j"||k==="c"))||(e.ctrlKey&&(k==="u"||k==="s"))||((e.ctrlKey||e.metaKey)&&k==="c"&&!isEditable(e.target))){e.preventDefault();}});
function render(){
var cats=[["all","সব যন্ত্রপাতি"],["bp","বিপি মেশিন"],["diabetes","ডায়াবেটিস"],["thermometer","থার্মোমিটার"],["oxygen","অক্সিজেন"],["bipap","বাইপ্যাপ"],["cpap","সি-প্যাপ"],["mask","এনপিভি মাস্ক"]];
var q=state.q.trim().toLowerCase();
var h='<div class="lc-wrap'+(state.dark?" lc-dark":"")+'">';
h+='<header class="lc-header"><div class="lc-container lc-header-in">';
h+='<div class="lc-brand" data-nav="products">'+esc(D.companyName.replace(".bd",""))+'<span>.bd</span></div>';
h+='<nav class="lc-nav">';
[["products","যন্ত্রপাতি"],["sleep","স্লিপ টেস্ট"],["diseases","রোগ ও স্বাস্থ্য"],["hospitals","হাসপাতাল"],["faq","FAQ"],["contact","যোগাযোগ"]].forEach(function(n){
h+='<button type="button" class="'+(state.tab===n[0]?"active":"")+'" data-nav="'+n[0]+'">'+n[1]+'</button>';
});
h+='</nav>';
h+='<div style="display:flex;gap:8px;align-items:center">';
h+='<button type="button" class="lc-btn lc-btn-outline" id="lc-theme-btn">'+(state.dark?"লাইট":"ডার্ক")+'</button>';
h+='<button type="button" class="lc-btn" id="lc-open-reg">রেজিস্টার</button>';
h+='</div></div></header>';
h+='<div class="lc-bar"><div class="lc-container lc-search-row">';
h+='<input class="lc-input" id="lc-search" type="search" value="'+esc(state.q)+'" placeholder="যন্ত্রপাতি, রোগের নাম বা হাসপাতাল খুঁজুন..."/>';
h+='<a class="lc-btn lc-btn-green" target="_blank" rel="noopener" href="'+waLink("আসসালামু আলাইকুম lifecircle.bd, আমার তথ্য জানতে চাই।")+'">WhatsApp: '+esc(D.whatsapp)+'</a>';
h+='</div></div>';
h+='<main class="lc-container">';
h+='<section class="lc-hero"><h1>'+esc(D.companyName)+' — '+esc(D.tagline)+'</h1><p>বিপি মেশিন, ডায়াবেটিস মিটার, ডিজিটাল ও অ্যানালগ থার্মোমিটার, অক্সিজেন কনসেন্ট্রেটর, বাইপ্যাপ, সি-প্যাপ, সিঙ্গেল এনপিভি মাস্ক এবং হোম স্লিপ টেস্ট সেবা।</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="lc-btn lc-btn-green" data-nav="sleep">স্লিপ টেস্ট</button><button type="button" class="lc-btn lc-btn-outline" data-nav="diseases">রোগ ও ডায়াবেটিস গাইড</button></div></section>';
if(state.tab==="products"){
h+='<section class="lc-sec"><h2 class="lc-title">প্রয়োজনীয় মেডিকেল যন্ত্রপাতি</h2><p class="lc-sub">কোনো মূল্য প্রদর্শিত হয় না; বিস্তারিত পরামর্শের জন্য WhatsApp ('+esc(D.whatsapp)+') এ যোগাযোগ করুন।</p>';
h+='<div class="lc-pills">';
cats.forEach(function(c){h+='<button type="button" class="lc-pill'+(state.cat===c[0]?" active":"")+'" data-cat="'+c[0]+'">'+c[1]+'</button>';});
h+='</div><div class="lc-grid">';
D.products.filter(function(p){
if(state.cat!=="all"&&p.category!==state.cat)return false;
if(!q)return true;
return (p.nameBn+" "+p.nameEn+" "+p.descriptionBn+" "+(p.relatedDiseases||[]).join(" ")).toLowerCase().indexOf(q)!==-1;
}).forEach(function(p){
h+='<article class="lc-card"><div class="lc-img-box">'+(p.imageUrl?'<img src="'+esc(p.imageUrl)+'" alt="'+esc(p.nameBn)+'"/>':'<span>'+esc(p.nameBn)+'</span>')+'</div>';
h+='<div class="lc-card-body"><div><h3>'+esc(p.nameBn)+'</h3><p>'+esc(p.descriptionBn)+'</p></div>';
h+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #e2e8f0"><span style="font-size:12px;font-weight:600;color:#2DA94F">'+esc(p.warranty)+'</span>';
h+='<a class="lc-btn" target="_blank" rel="noopener" href="'+waLink("আমি "+p.nameBn+" সম্পর্কে জানতে চাই।")+'">জানতে চান</a></div></div></article>';
});
h+='</div></section>';
}else if(state.tab==="sleep"){
h+='<section class="lc-sec"><div class="lc-card" style="padding:24px"><h2 class="lc-title">হোম ও ক্লিনিক স্লিপ টেস্ট (Sleep Study)</h2><p class="lc-sub">'+esc(D.sleepLabNote)+'</p>';
h+='<div class="lc-grid"><div class="lc-card" style="padding:16px"><h3>হোম স্লিপ টেস্ট (HSAT)</h3><p>বাসায় গিয়ে টেকনিশিয়ান যন্ত্র সেট করে দেবেন। ২৪ ঘণ্টায় রিপোর্ট।</p></div>';
h+='<div class="lc-card" style="padding:16px"><h3>ক্লিনিক পলিসমনোগ্রাফি (PSG)</h3><p>পূর্ণাঙ্গ EEG, ECG, SpO2 এবং CPAP/BiPAP টাইট্রেশন সহ স্লিপ স্টাডি।</p></div></div>';
h+='<div style="margin-top:16px"><a class="lc-btn lc-btn-green" target="_blank" rel="noopener" href="'+waLink("আমি স্লিপ টেস্ট বুক করতে চাই।")+'">WhatsApp-এ বুকিং করুন ('+esc(D.whatsapp)+')</a></div></div></section>';
}else if(state.tab==="diseases"){
h+='<section class="lc-sec"><h2 class="lc-title">রোগ নির্দেশিকা, ডায়াবেটিস নিয়ন্ত্রণ ও দৈনন্দিন স্বাস্থ্য পরামর্শ</h2>';
h+='<div class="lc-pills">';
D.diseases.forEach(function(d){h+='<button type="button" class="lc-pill'+(state.disId===d.id?" active":"")+'" data-dis="'+d.id+'">'+esc(d.nameBn)+'</button>';});
h+='</div>';
var ad=D.diseases.find(function(x){return x.id===state.disId;})||D.diseases[0];
if(ad){
h+='<div class="lc-card" style="padding:22px;margin-bottom:22px"><h3>'+esc(ad.nameBn)+'</h3><p>'+esc(ad.overviewBn)+'</p>';
h+='<div class="lc-grid" style="margin-top:14px"><div><strong>সাধারণ লক্ষণসমূহ:</strong><ul>'+ad.symptoms.map(function(s){return '<li>'+esc(s)+'</li>';}).join("")+'</ul></div>';
h+='<div><strong>নিয়ন্ত্রণ ও করণীয়:</strong><ul>'+ad.immediateActions.map(function(a){return '<li>'+esc(a)+'</li>';}).join("")+'</ul></div></div>';
h+='<p style="margin-top:10px"><strong>চিকিৎসা পরামর্শ:</strong> '+esc(ad.treatmentBn)+'</p></div>';
}
h+='<h3 class="lc-title" style="font-size:18px;margin-top:18px">প্রতিদিনের সুস্থতার পরামর্শ (Daily Health Advice)</h3><div class="lc-grid">';
D.dailyAdvices.forEach(function(adv){
h+='<div class="lc-card" style="padding:16px"><h3>'+esc(adv.title)+'</h3><p>'+esc(adv.summary)+'</p><ul>'+adv.points.map(function(pt){return '<li style="font-size:12.5px;margin-top:4px">'+esc(pt)+'</li>';}).join("")+'</ul></div>';
});
h+='</div></section>';
}else if(state.tab==="hospitals"){
h+='<section class="lc-sec"><h2 class="lc-title">বাংলাদেশের সরকারি ও স্বায়ত্তশাসিত হাসপাতাল তালিকা</h2><div class="lc-grid">';
D.hospitals.filter(function(hp){return !q||(hp.nameBn+" "+hp.division+" "+hp.locationBn).toLowerCase().indexOf(q)!==-1;}).forEach(function(hp){
h+='<div class="lc-card" style="padding:16px"><h3>'+esc(hp.nameBn)+'</h3><p>'+esc(hp.division)+' · '+esc(hp.locationBn)+'</p><p style="margin-top:8px;font-weight:700;color:#2D89C8">জরুরি: <a href="tel:'+esc(hp.emergencyPhone)+'">'+esc(hp.emergencyPhone)+'</a></p></div>';
});
h+='</div></section>';
}else if(state.tab==="faq"){
h+='<section class="lc-sec"><h2 class="lc-title">সাধারণ প্রশ্নোত্তর (FAQ)</h2><p class="lc-sub">প্রশ্নে ক্লিক করলে সরাসরি উত্তরে নিয়ে যাবে:</p>';
h+='<div class="lc-pills">';
D.faqs.forEach(function(f,i){h+='<button type="button" class="lc-pill" data-jump="'+esc(f.id)+'">'+(i+1)+'. '+esc(f.questionBn)+'</button>';});
h+='</div>';
D.faqs.forEach(function(f,i){
h+='<div class="lc-faq-item'+(i===0?" open":"")+'" id="lc-faq-'+esc(f.id)+'"><button type="button" class="lc-faq-q" data-toggle-faq="'+esc(f.id)+'"><span>'+(i+1)+'. '+esc(f.questionBn)+'</span><span>▾</span></button><div class="lc-faq-a">'+esc(f.answerBn)+'</div></div>';
});
h+='</section>';
}else if(state.tab==="contact"){
h+='<section class="lc-sec"><div class="lc-card" style="padding:24px"><h2 class="lc-title">যোগাযোগ ও পেমেন্ট তথ্য</h2>';
h+='<p><strong>WhatsApp ও হটলাইন:</strong> <a href="'+waLink()+'" target="_blank" rel="noopener">'+esc(D.whatsapp)+'</a></p>';
h+='<p><strong>বিকাশ (bKash):</strong> '+esc(D.bkash)+'</p>';
h+='<p><strong>সময়সূচি:</strong> '+esc(D.hours)+'</p>';
if(D.addresses&&D.addresses.length){h+='<p><strong>ঠিকানা:</strong> '+D.addresses.map(esc).join(" | ")+'</p>';}
h+='<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><input class="lc-input" id="lc-wa-q" placeholder="আপনার প্রশ্ন লিখুন..."/><button type="button" class="lc-btn lc-btn-green" id="lc-wa-send">WhatsApp-এ পাঠান</button></div>';
h+='</div></section>';
}
h+='</main>';
h+='<footer class="lc-footer"><div class="lc-container">© '+new Date().getFullYear()+' '+esc(D.companyName)+' · WhatsApp: '+esc(D.whatsapp)+' · bKash: '+esc(D.bkash)+'</div></footer>';
h+='<div class="lc-modal-bg" id="lc-reg-modal"><div class="lc-modal"><button type="button" class="lc-x" id="lc-reg-x" aria-label="বন্ধ করুন">×</button>';
h+='<h3 style="margin:0 0 8px;font-size:18px">আপনার তথ্য সংরক্ষণ করতে রেজিস্ট্রেশন করুন</h3>';
h+='<p style="font-size:13.5px;color:#475569;line-height:1.55;margin:0 0 16px">আপনার স্বাস্থ্য রেকর্ড, স্লিপ টেস্ট রিপোর্ট ও অর্ডার তথ্য সংরক্ষিত রাখতে অনুগ্রহ করে রেজিস্ট্রেশন করুন।</p>';
h+='<div id="lc-reg-form-area"><input class="lc-input" id="lc-reg-name" placeholder="আপনার নাম" style="width:100%;box-sizing:border-box;margin-bottom:8px"/><input class="lc-input" id="lc-reg-phone" placeholder="মোবাইল নম্বর / ইমেইল" style="width:100%;box-sizing:border-box;margin-bottom:12px"/>';
h+='<div style="display:flex;gap:8px"><button type="button" class="lc-btn lc-btn-green" id="lc-reg-submit" style="flex:1;justify-content:center">রেজিস্টার</button><button type="button" class="lc-btn lc-btn-outline" id="lc-reg-later">Not Now</button></div></div></div></div>';
h+='</div>';
root.innerHTML=h;
bindEvents();
}
function showReg(){if(state.regDismissed)return;var m=document.getElementById("lc-reg-modal");if(m)m.classList.add("show");}
function hideReg(){state.regDismissed=true;var m=document.getElementById("lc-reg-modal");if(m)m.classList.remove("show");}
function bindEvents(){
root.querySelectorAll("[data-nav]").forEach(function(b){b.addEventListener("click",function(){state.tab=b.getAttribute("data-nav");render();window.scrollTo({top:0,behavior:"smooth"});});});
root.querySelectorAll("[data-cat]").forEach(function(b){b.addEventListener("click",function(){state.cat=b.getAttribute("data-cat");render();});});
root.querySelectorAll("[data-dis]").forEach(function(b){b.addEventListener("click",function(){state.disId=b.getAttribute("data-dis");render();});});
root.querySelectorAll("[data-toggle-faq]").forEach(function(b){b.addEventListener("click",function(){var id=b.getAttribute("data-toggle-faq");var el=document.getElementById("lc-faq-"+id);if(el)el.classList.toggle("open");});});
root.querySelectorAll("[data-jump]").forEach(function(b){b.addEventListener("click",function(){var id=b.getAttribute("data-jump");var el=document.getElementById("lc-faq-"+id);if(el){el.classList.add("open");el.classList.add("lc-hl");el.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(function(){el.classList.remove("lc-hl");},2200);}});});
var si=document.getElementById("lc-search");if(si){si.addEventListener("input",function(e){state.q=e.target.value;render();var ns=document.getElementById("lc-search");if(ns){ns.focus();ns.setSelectionRange(ns.value.length,ns.value.length);}});}
var tb=document.getElementById("lc-theme-btn");if(tb){tb.addEventListener("click",function(){state.dark=!state.dark;render();});}
var ob=document.getElementById("lc-open-reg");if(ob){ob.addEventListener("click",function(){state.regDismissed=false;showReg();});}
var rx=document.getElementById("lc-reg-x");if(rx)rx.addEventListener("click",hideReg);
var rl=document.getElementById("lc-reg-later");if(rl)rl.addEventListener("click",hideReg);
function openExternal(url){var a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";document.body.appendChild(a);a.click();document.body.removeChild(a);}
var rs=document.getElementById("lc-reg-submit");if(rs){rs.addEventListener("click",function(){var nm=(document.getElementById("lc-reg-name")||{}).value||"";var ph=(document.getElementById("lc-reg-phone")||{}).value||"";if(!nm.trim()||!ph.trim())return;openExternal(waLink("নতুন রেজিস্ট্রেশন: "+nm.trim()+" ("+ph.trim()+")"));hideReg();});}
var ws=document.getElementById("lc-wa-send");if(ws){ws.addEventListener("click",function(){var qv=(document.getElementById("lc-wa-q")||{}).value||"";openExternal(waLink(qv.trim()||"আসসালামু আলাইকুম lifecircle.bd"));});}
}
window.addEventListener("scroll",function(){if(!state.regShown&&!state.regDismissed&&window.scrollY>260){state.regShown=true;showReg();}},{passive:true});
render();
})();`;
  // Minify newlines/whitespace cleanly without touching string literals
  return raw.replace(/\r?\n/g, '');
}

export interface WordPressFreeBlockStep {
  id: string;
  stepNumber: number;
  titleBn: string;
  whereToPasteBn: string;
  gutenbergHtml: string;
  nativeGutenbergHtml: string;
  customHtml: string;
}

export function generateWordPressFreeStepBlocks(
  data: ExportBundleData
): WordPressFreeBlockStep[] {
  const clean = sanitizeExportData(data, { allowDataUri: false });
  const waDigits = String(clean.whatsapp || '01754149749').replace(/[^\d]/g, '');
  const waIntl = waDigits.startsWith('880')
    ? waDigits
    : waDigits.startsWith('0')
      ? `88${waDigits}`
      : `880${waDigits}`;
  const waHref = (msg: string) =>
    `https://wa.me/${waIntl}?text=${encodeURIComponent(msg)}`;

  const wrapBlock = (
    id: string,
    titleBn: string,
    stepNumber: number,
    whereToPasteBn: string,
    html: string,
    nativeGutenbergHtml: string
  ): WordPressFreeBlockStep => ({
    id,
    stepNumber,
    titleBn,
    whereToPasteBn,
    customHtml: html,
    gutenbergHtml: `<!-- wp:html -->\n${html}\n<!-- /wp:html -->`,
    nativeGutenbergHtml,
  });

  const wpHeading = (text: string, level: 2 | 3 | 4 = 2, textColor?: string) =>
    textColor
      ? `<!-- wp:heading {"level":${level},"style":{"color":{"text":"${textColor}"}}} -->\n<h${level} class="wp-block-heading has-text-color" style="color:${textColor}">${escapeHtml(text)}</h${level}>\n<!-- /wp:heading -->`
      : `<!-- wp:heading {"level":${level}} -->\n<h${level} class="wp-block-heading">${escapeHtml(text)}</h${level}>\n<!-- /wp:heading -->`;
  const wpPara = (htmlContent: string) =>
    `<!-- wp:paragraph -->\n<p>${htmlContent}</p>\n<!-- /wp:paragraph -->`;
  const wpBtn = (label: string, href: string, bg = '#2D89C8') =>
    `<!-- wp:button {"style":{"color":{"background":"${bg}","text":"#ffffff"}}} -->\n<div class="wp-block-button"><a class="wp-block-button__link has-text-color has-background wp-element-button" href="${escapeHtml(href)}" style="color:#ffffff;background-color:${bg}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></div>\n<!-- /wp:button -->`;
  const wpDetails = (summary: string, innerBlocks: string) =>
    `<!-- wp:details {"summary":"${escapeHtml(summary)}"} -->\n<details class="wp-block-details"><summary>${escapeHtml(summary)}</summary>${innerBlocks}</details>\n<!-- /wp:details -->`;
  const chunkCols = (colBlocks: string[], colsPerRow = 3): string => {
    const rows: string[] = [];
    for (let i = 0; i < colBlocks.length; i += colsPerRow) {
      const slice = colBlocks.slice(i, i + colsPerRow);
      const cols = slice
        .map((c) => `<!-- wp:column -->\n<div class="wp-block-column">${c}</div>\n<!-- /wp:column -->`)
        .join('\n');
      rows.push(`<!-- wp:columns -->\n<div class="wp-block-columns">\n${cols}\n</div>\n<!-- /wp:columns -->`);
    }
    return rows.join('\n');
  };

  // Step 1: Header, Top Nav, Hero Banner & Registration Notice
  const step1Html =
    `<div style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1D2B53;padding:18px;border-radius:14px;border:1px solid #e2e8f0;max-width:1160px;margin:0 auto 20px;">` +
    `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;">` +
    `<div style="font-size:22px;font-weight:800;color:#1D2B53;">${escapeHtml(clean.companyName)}</div>` +
    `<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:13px;font-weight:600;">` +
    `<a href="#lc-wp-products" style="color:#2D89C8;text-decoration:none;">যন্ত্রপাতি</a>` +
    `<a href="#lc-wp-sleep" style="color:#2D89C8;text-decoration:none;">স্লিপ টেস্ট</a>` +
    `<a href="#lc-wp-diseases" style="color:#2D89C8;text-decoration:none;">রোগ ও স্বাস্থ্য</a>` +
    `<a href="#lc-wp-hospitals" style="color:#2D89C8;text-decoration:none;">হাসপাতাল</a>` +
    `<a href="#lc-wp-faq" style="color:#2D89C8;text-decoration:none;">FAQ</a>` +
    `<a href="#lc-wp-contact" style="color:#2DA94F;text-decoration:none;">যোগাযোগ</a>` +
    `</div></div>` +
    `<div style="background:linear-gradient(125deg,#1D2B53,#2D89C8);color:#ffffff;border-radius:14px;padding:24px;margin:16px 0 12px;">` +
    `<h2 style="margin:0 0 8px;font-size:24px;color:#ffffff;">${escapeHtml(clean.companyName)} — ${escapeHtml(clean.tagline)}</h2>` +
    `<p style="margin:0 0 14px;font-size:14px;color:#e0f2fe;line-height:1.6;">বিপি মেশিন, ডায়াবেটিস মিটার, ডিজিটাল ও অ্যানালগ থার্মোমিটার, অক্সিজেন কনসেন্ট্রেটর, বাইপ্যাপ, সি-প্যাপ, সিঙ্গেল এনপিভি মাস্ক ও হোম স্লিপ টেস্ট।</p>` +
    `<div style="display:flex;flex-wrap:wrap;gap:10px;">` +
    `<a href="${waHref('আসসালামু আলাইকুম lifecircle.bd, আমি রেজিস্ট্রেশন ও সেবা সম্পর্কে জানতে চাই।')}" target="_blank" rel="noopener noreferrer" style="background:#2DA94F;color:#ffffff;text-decoration:none;padding:9px 15px;border-radius:8px;font-size:13px;font-weight:700;">তথ্য সংরক্ষণে রেজিস্টার / WhatsApp (${escapeHtml(clean.whatsapp)})</a>` +
    `<a href="#lc-wp-faq" style="background:#ffffff;color:#1D2B53;text-decoration:none;padding:9px 15px;border-radius:8px;font-size:13px;font-weight:700;">সাধারণ প্রশ্নোত্তর (FAQ)</a>` +
    `</div></div>` +
    `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:12px 14px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;font-size:13px;color:#065f46;">` +
    `<span><strong>বিজ্ঞপ্তি:</strong> আপনার স্বাস্থ্য ও অর্ডার তথ্য সংরক্ষিত রাখতে অনুগ্রহ করে WhatsApp-এ রেজিস্ট্রেশন করুন।</span>` +
    `<a href="${waHref('আমি lifecircle.bd-তে আমার তথ্য সংরক্ষণের জন্য রেজিস্ট্রেশন করতে চাই।')}" target="_blank" rel="noopener noreferrer" style="background:#2DA94F;color:#ffffff;text-decoration:none;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:700;">রেজিস্টার করুন</a>` +
    `</div></div>`;

  // Step 2: Medical Products Catalog (Zero prices, description beneath image)
  const productsHtml = clean.products
    .map(
      (p) =>
        `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;">` +
        (p.imageUrl
          ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nameBn)}" style="width:100%;height:190px;object-fit:cover;display:block;background:#f1f5f9;" />`
          : `<div style="height:140px;background:linear-gradient(135deg,#e0f2fe,#dcfce7);display:flex;align-items:center;justify-content:center;padding:12px;text-align:center;color:#1D2B53;font-weight:700;font-size:15px;">${escapeHtml(p.nameBn)}</div>`) +
        `<div style="padding:16px;flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">` +
        `<div>` +
        `<h3 style="margin:0 0 6px;font-size:16px;color:#1D2B53;font-weight:700;">${escapeHtml(p.nameBn)}</h3>` +
        `<p style="margin:0;font-size:13px;color:#475569;line-height:1.55;">${escapeHtml(p.descriptionBn)}</p>` +
        `</div>` +
        `<div style="padding-top:10px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">` +
        `<span style="font-size:12px;color:#2DA94F;font-weight:600;">${escapeHtml(p.warranty)}</span>` +
        `<a href="${waHref(`আসসালামু আলাইকুম lifecircle.bd, আমি ${p.nameBn} সম্পর্কে জানতে চাই।`)}" target="_blank" rel="noopener noreferrer" style="background:#2D89C8;color:#ffffff;text-decoration:none;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:600;">WhatsApp-এ জানুন</a>` +
        `</div></div></div>`
    )
    .join('');

  const step2Html =
    `<div id="lc-wp-products" style="font-family:system-ui,-apple-system,sans-serif;max-width:1160px;margin:20px auto;padding:18px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">` +
    `<h3 style="margin:0 0 6px;font-size:20px;color:#1D2B53;">মেডিকেল যন্ত্রপাতিসমূহ</h3>` +
    `<p style="margin:0 0 14px;font-size:13px;color:#475569;">কোনো মূল্য প্রদর্শিত হয় না; বিস্তারিত জানতে প্রতিটি পণ্যের WhatsApp বাটনে ক্লিক করুন।</p>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">${productsHtml}</div>` +
    `</div>`;

  // Step 3: Sleep Test Section
  const step3Html =
    `<div id="lc-wp-sleep" style="font-family:system-ui,-apple-system,sans-serif;max-width:1160px;margin:20px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;">` +
    `<h3 style="margin:0 0 8px;font-size:20px;color:#1D2B53;">হোম ও ক্লিনিক স্লিপ টেস্ট (Sleep Study)</h3>` +
    `<p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">${escapeHtml(clean.sleepLabNote)}</p>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:16px;">` +
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;"><strong style="color:#1D2B53;font-size:14px;">হোম স্লিপ টেস্ট (HSAT)</strong><p style="margin:6px 0 0;font-size:13px;color:#475569;">বাসায় গিয়ে টেকনিশিয়ান যন্ত্র সেট করে দেবেন। ২৪ ঘণ্টায় রিপোর্ট।</p></div>` +
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;"><strong style="color:#1D2B53;font-size:14px;">ক্লিনিক পলিসমনোগ্রাফি (PSG)</strong><p style="margin:6px 0 0;font-size:13px;color:#475569;">পূর্ণাঙ্গ EEG, ECG, SpO2 এবং CPAP/BiPAP টাইট্রেশন সহ স্লিপ স্টাডি।</p></div>` +
    `</div>` +
    `<a href="${waHref('আমি স্লিপ টেস্ট বুকিং করতে চাই।')}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#2DA94F;color:#ffffff;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:700;">স্লিপ টেস্ট বুক করুন (WhatsApp: ${escapeHtml(clean.whatsapp)})</a>` +
    `</div>`;

  // Step 4: Disease Guide (Diabetes symptoms/control) & Daily Health Advice
  const diseasesHtml = clean.diseases
    .map(
      (d) =>
        `<details style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:10px;">` +
        `<summary style="cursor:pointer;font-weight:700;font-size:15px;color:#1D2B53;">${escapeHtml(d.nameBn)}</summary>` +
        `<p style="margin:10px 0 8px;font-size:13.5px;color:#334155;line-height:1.6;">${escapeHtml(d.overviewBn)}</p>` +
        `<p style="margin:8px 0 4px;font-weight:700;font-size:13px;color:#1D2B53;">সাধারণ লক্ষণসমূহ:</p>` +
        `<ul style="margin:0 0 8px 18px;padding:0;font-size:13px;color:#334155;line-height:1.55;">${d.symptoms.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` +
        `<p style="margin:8px 0 4px;font-weight:700;font-size:13px;color:#2DA94F;">নিয়ন্ত্রণ ও করণীয়:</p>` +
        `<ul style="margin:0 0 8px 18px;padding:0;font-size:13px;color:#334155;line-height:1.55;">${d.immediateActions.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>` +
        `<p style="margin:8px 0 0;font-size:13px;color:#1D2B53;line-height:1.55;"><strong>চিকিৎসা পরামর্শ:</strong> ${escapeHtml(d.treatmentBn)}</p>` +
        `</details>`
    )
    .join('');

  const advicesHtml = clean.dailyAdvices
    .map(
      (adv) =>
        `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">` +
        `<h4 style="margin:0 0 6px;font-size:15px;color:#1D2B53;font-weight:700;">${escapeHtml(adv.title)}</h4>` +
        `<p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.55;">${escapeHtml(adv.summary)}</p>` +
        `<ul style="margin:0 0 0 16px;padding:0;font-size:12.5px;color:#334155;line-height:1.55;">${adv.points.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('')}</ul>` +
        `</div>`
    )
    .join('');

  const step4Html =
    `<div id="lc-wp-diseases" style="font-family:system-ui,-apple-system,sans-serif;max-width:1160px;margin:20px auto;padding:18px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">` +
    `<h3 style="margin:0 0 12px;font-size:20px;color:#1D2B53;">রোগের লক্ষণ, ডায়াবেটিস নিয়ন্ত্রণ ও চিকিৎসা</h3>` +
    `${diseasesHtml}` +
    `<h3 style="margin:22px 0 12px;font-size:18px;color:#1D2B53;">প্রতিদিনের সুস্থতার পরামর্শ (Daily Health Advice)</h3>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">${advicesHtml}</div>` +
    `</div>`;

  // Step 5: Bangladesh Gov & Autonomous Hospitals Directory
  const hospitalsHtml = clean.hospitals
    .map(
      (h) =>
        `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">` +
        `<h4 style="margin:0 0 4px;font-size:14.5px;color:#1D2B53;font-weight:700;">${escapeHtml(h.nameBn)}</h4>` +
        `<p style="margin:0 0 8px;font-size:12.5px;color:#475569;">${escapeHtml(h.division)} · ${escapeHtml(h.locationBn)}</p>` +
        `<a href="tel:${escapeHtml(h.emergencyPhone)}" style="color:#2D89C8;font-weight:700;font-size:13px;text-decoration:none;">জরুরি: ${escapeHtml(h.emergencyPhone)}</a>` +
        `</div>`
    )
    .join('');

  const step5Html =
    `<div id="lc-wp-hospitals" style="font-family:system-ui,-apple-system,sans-serif;max-width:1160px;margin:20px auto;padding:18px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">` +
    `<h3 style="margin:0 0 12px;font-size:20px;color:#1D2B53;">সরকারি ও স্বায়ত্তশাসিত হাসপাতাল তালিকা</h3>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">${hospitalsHtml}</div>` +
    `</div>`;

  // Step 6: Interactive FAQ (Question pills jump straight to answers)
  const faqJumpHtml = clean.faqs
    .map(
      (f, i) =>
        `<a href="#lc-wp-faq-${escapeHtml(f.id)}" style="display:inline-block;background:#ffffff;border:1px solid #cbd5e1;color:#1D2B53;text-decoration:none;padding:6px 11px;border-radius:8px;font-size:12px;font-weight:600;margin:0 6px 6px 0;">${i + 1}. ${escapeHtml(f.questionBn)}</a>`
    )
    .join('');

  const faqAnswersHtml = clean.faqs
    .map(
      (f, i) =>
        `<details id="lc-wp-faq-${escapeHtml(f.id)}" open style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:10px;">` +
        `<summary style="cursor:pointer;font-weight:700;font-size:14px;color:#1D2B53;">${i + 1}. ${escapeHtml(f.questionBn)}</summary>` +
        `<p style="margin:10px 0 0;font-size:13.5px;color:#334155;line-height:1.6;">${escapeHtml(f.answerBn)}</p>` +
        `</details>`
    )
    .join('');

  const step6Html =
    `<div id="lc-wp-faq" style="font-family:system-ui,-apple-system,sans-serif;max-width:1160px;margin:20px auto;padding:18px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">` +
    `<h3 style="margin:0 0 8px;font-size:20px;color:#1D2B53;">সাধারণ প্রশ্নোত্তর (FAQ)</h3>` +
    `<p style="margin:0 0 10px;font-size:13px;color:#475569;">প্রশ্নে ক্লিক করলে সরাসরি উত্তরে নিয়ে যাবে:</p>` +
    `<div style="margin-bottom:14px;">${faqJumpHtml}</div>` +
    `${faqAnswersHtml}` +
    `</div>`;

  // Step 7: Contact, WhatsApp, bKash & Admin Addresses Footer
  const addrHtml =
    clean.addresses.length > 0
      ? `<p style="margin:6px 0;"><strong>ঠিকানা:</strong> ${clean.addresses.map(escapeHtml).join(' | ')}</p>`
      : '';

  const step7Html =
    `<div id="lc-wp-contact" style="font-family:system-ui,-apple-system,sans-serif;max-width:1160px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;margin:20px auto;font-size:14px;color:#334155;">` +
    `<h3 style="margin:0 0 10px;font-size:18px;color:#1D2B53;">যোগাযোগ, bKash ও ঠিকানা</h3>` +
    `<p style="margin:6px 0;"><strong>WhatsApp ও হটলাইন:</strong> <a href="${waHref('আসসালামু আলাইকুম lifecircle.bd, আমার একটি প্রশ্ন আছে।')}" target="_blank" rel="noopener noreferrer" style="color:#2DA94F;font-weight:700;">${escapeHtml(clean.whatsapp)}</a></p>` +
    `<p style="margin:6px 0;"><strong>বিকাশ (bKash):</strong> ${escapeHtml(clean.bkash)}</p>` +
    `<p style="margin:6px 0;"><strong>সময়সূচি:</strong> ${escapeHtml(clean.hours)}</p>` +
    addrHtml +
    `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #f1f5f9;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:12.5px;color:#64748b;">` +
    `<span>© ${new Date().getFullYear()} ${escapeHtml(clean.companyName)}</span>` +
    `<a href="${waHref('আসসালামু আলাইকুম lifecircle.bd, আমি সরাসরি কথা বলতে চাই।')}" target="_blank" rel="noopener noreferrer" style="background:#2DA94F;color:#ffffff;text-decoration:none;padding:7px 14px;border-radius:7px;font-weight:700;">WhatsApp-এ মেসেজ দিন</a>` +
    `</div></div>`;

  // Native Gutenberg Visual Blocks (100% Free WordPress.com Editable)
  const nativeStep1 = [
    `<!-- wp:group {"style":{"color":{"background":"#1D2B53","text":"#ffffff"}},"layout":{"type":"constrained"}} -->`,
    `<div class="wp-block-group has-text-color has-background" style="color:#ffffff;background-color:#1D2B53">`,
    wpHeading(`${clean.companyName} — ${clean.tagline}`, 2, '#ffffff'),
    wpPara(
      'বিপি মেশিন, ডায়াবেটিস মিটার, ডিজিটাল ও অ্যানালগ থার্মোমিটার, অক্সিজেন কনসেন্ট্রেটর, বাইপ্যাপ, সি-প্যাপ, সিঙ্গেল এনপিভি মাস্ক ও হোম স্লিপ টেস্ট।'
    ),
    `<!-- wp:buttons -->\n<div class="wp-block-buttons">`,
    wpBtn(
      `তথ্য সংরক্ষণে রেজিস্টার / WhatsApp (${clean.whatsapp})`,
      waHref('আসসালামু আলাইকুম lifecircle.bd, আমি রেজিস্ট্রেশন ও সেবা সম্পর্কে জানতে চাই।'),
      '#2DA94F'
    ),
    `</div>\n<!-- /wp:buttons -->`,
    wpPara(
      '<strong>বিজ্ঞপ্তি:</strong> আপনার স্বাস্থ্য ও অর্ডার তথ্য সংরক্ষিত রাখতে অনুগ্রহ করে WhatsApp-এ রেজিস্ট্রেশন করুন।'
    ),
    `</div>\n<!-- /wp:group -->`,
  ].join('\n');

  const productCols = clean.products.map((p) => {
    const imgBlock = p.imageUrl
      ? `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nameBn)}"/></figure>\n<!-- /wp:image -->`
      : `<!-- wp:image -->\n<figure class="wp-block-image"></figure>\n<!-- /wp:image -->`;
    return [
      imgBlock,
      wpHeading(p.nameBn, 3),
      wpPara(escapeHtml(p.descriptionBn)),
      wpPara(`<strong>ওয়ারেন্টি:</strong> ${escapeHtml(p.warranty)}`),
      `<!-- wp:buttons -->\n<div class="wp-block-buttons">${wpBtn(
        'WhatsApp-এ জানুন',
        waHref(`আসসালামু আলাইকুম lifecircle.bd, আমি ${p.nameBn} সম্পর্কে জানতে চাই।`)
      )}</div>\n<!-- /wp:buttons -->`,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const nativeStep2 = [
    wpHeading('মেডিকেল যন্ত্রপাতিসমূহ', 2),
    wpPara('কোনো মূল্য প্রদর্শিত হয় না; বিস্তারিত পরামর্শের জন্য প্রতিটি যন্ত্রের WhatsApp বাটনে ক্লিক করুন।'),
    chunkCols(productCols, 3),
  ].join('\n');

  const nativeStep3 = [
    wpHeading('হোম ও ক্লিনিক স্লিপ টেস্ট (Sleep Study)', 2),
    wpPara(escapeHtml(clean.sleepLabNote)),
    chunkCols(
      [
        [
          wpHeading('হোম স্লিপ টেস্ট (HSAT)', 3),
          wpPara('বাসায় গিয়ে টেকনিশিয়ান যন্ত্র সেট করে দেবেন। ২৪ ঘণ্টায় রিপোর্ট।'),
        ].join('\n'),
        [
          wpHeading('ক্লিনিক পলিসমনোগ্রাফি (PSG)', 3),
          wpPara('পূর্ণাঙ্গ EEG, ECG, SpO2 এবং CPAP/BiPAP টাইট্রেশন সহ স্লিপ স্টাডি।'),
        ].join('\n'),
      ],
      2
    ),
    `<!-- wp:buttons -->\n<div class="wp-block-buttons">${wpBtn(
      `স্লিপ টেস্ট বুক করুন (WhatsApp: ${clean.whatsapp})`,
      waHref('আমি স্লিপ টেস্ট বুকিং করতে চাই।'),
      '#2DA94F'
    )}</div>\n<!-- /wp:buttons -->`,
  ].join('\n');

  const nativeDiseaseDetails = clean.diseases
    .map((d) =>
      wpDetails(
        d.nameBn,
        [
          wpPara(escapeHtml(d.overviewBn)),
          wpPara(`<strong>সাধারণ লক্ষণসমূহ:</strong><br/>${d.symptoms.map((s) => `• ${escapeHtml(s)}`).join('<br/>')}`),
          wpPara(`<strong>নিয়ন্ত্রণ ও করণীয়:</strong><br/>${d.immediateActions.map((a) => `• ${escapeHtml(a)}`).join('<br/>')}`),
          wpPara(`<strong>চিকিৎসা পরামর্শ:</strong> ${escapeHtml(d.treatmentBn)}`),
        ].join('\n')
      )
    )
    .join('\n');

  const nativeAdviceCols = clean.dailyAdvices.map((adv) =>
    [
      wpHeading(adv.title, 4),
      wpPara(escapeHtml(adv.summary)),
      wpPara(adv.points.map((pt) => `• ${escapeHtml(pt)}`).join('<br/>')),
    ].join('\n')
  );

  const nativeStep4 = [
    wpHeading('রোগের লক্ষণ, ডায়াবেটিস নিয়ন্ত্রণ ও চিকিৎসা', 2),
    nativeDiseaseDetails,
    wpHeading('প্রতিদিনের সুস্থতার পরামর্শ (Daily Health Advice)', 3),
    chunkCols(nativeAdviceCols, 2),
  ].join('\n');

  const nativeHospitalCols = clean.hospitals.map((h) =>
    [
      wpHeading(h.nameBn, 4),
      wpPara(`${escapeHtml(h.division)} · ${escapeHtml(h.locationBn)}`),
      wpPara(`<strong>জরুরি:</strong> <a href="tel:${escapeHtml(h.emergencyPhone)}">${escapeHtml(h.emergencyPhone)}</a>`),
    ].join('\n')
  );

  const nativeStep5 = [
    wpHeading('সরকারি ও স্বায়ত্তশাসিত হাসপাতাল তালিকা', 2),
    chunkCols(nativeHospitalCols, 3),
  ].join('\n');

  const nativeStep6 = [
    wpHeading('সাধারণ প্রশ্নোত্তর (FAQ)', 2),
    ...clean.faqs.map((f, i) =>
      wpDetails(`${i + 1}. ${f.questionBn}`, wpPara(escapeHtml(f.answerBn)))
    ),
  ].join('\n');

  const nativeStep7 = [
    wpHeading('যোগাযোগ, bKash ও ঠিকানা', 2),
    wpPara(`<strong>WhatsApp ও হটলাইন:</strong> ${escapeHtml(clean.whatsapp)}`),
    wpPara(`<strong>বিকাশ (bKash):</strong> ${escapeHtml(clean.bkash)}`),
    wpPara(`<strong>সময়সূচি:</strong> ${escapeHtml(clean.hours)}`),
    ...(clean.addresses.length > 0
      ? [wpPara(`<strong>ঠিকানা:</strong> ${clean.addresses.map(escapeHtml).join(' | ')}`)]
      : []),
    `<!-- wp:buttons -->\n<div class="wp-block-buttons">${wpBtn(
      'WhatsApp-এ সরাসরি মেসেজ দিন',
      waHref('আসসালামু আলাইকুম lifecircle.bd, আমার একটি প্রশ্ন আছে।'),
      '#2DA94F'
    )}</div>\n<!-- /wp:buttons -->`,
  ].join('\n');

  return [
    wrapBlock(
      'step-1-header',
      'ধাপ ১: হেডার, মেনু, ব্যানার ও রেজিস্ট্রেশন নোটিশ',
      1,
      'আপনার WordPress পেজের সবার ওপরে "+" আইকন -> Custom HTML ব্লকে (অথবা Native মোডে খালি পেজে) পেস্ট করুন।',
      step1Html,
      nativeStep1
    ),
    wrapBlock(
      'step-2-products',
      'ধাপ ২: মেডিকেল যন্ত্রপাতির তালিকা (ছবি + নিচে বিবরণ)',
      2,
      'ধাপ ১-এর ঠিক নিচে নতুন ব্লকে পেস্ট করুন (অথবা আলাদা Products পেজে)।',
      step2Html,
      nativeStep2
    ),
    wrapBlock(
      'step-3-sleep',
      'ধাপ ৩: হোম ও ক্লিনিক স্লিপ টেস্ট সেকশন',
      3,
      'যন্ত্রপাতির নিচে নতুন ব্লকে পেস্ট করুন (অথবা আলাদা Sleep Test পেজে)।',
      step3Html,
      nativeStep3
    ),
    wrapBlock(
      'step-4-diseases',
      'ধাপ ৪: রোগ, ডায়াবেটিস নিয়ন্ত্রণ ও দৈনন্দিন স্বাস্থ্য পরামর্শ',
      4,
      'স্লিপ টেস্টের নিচে নতুন ব্লকে পেস্ট করুন (অথবা আলাদা Health Guide পেজে)।',
      step4Html,
      nativeStep4
    ),
    wrapBlock(
      'step-5-hospitals',
      'ধাপ ৫: সরকারি ও স্বায়ত্তশাসিত হাসপাতাল তালিকা',
      5,
      'স্বাস্থ্য পরামর্শের নিচে নতুন ব্লকে পেস্ট করুন (অথবা আলাদা Hospitals পেজে)।',
      step5Html,
      nativeStep5
    ),
    wrapBlock(
      'step-6-faq',
      'ধাপ ৬: সাধারণ প্রশ্নোত্তর (FAQ — ক্লিক করলে উত্তরে যাবে)',
      6,
      'হাসপাতালের নিচে নতুন ব্লকে পেস্ট করুন (অথবা আলাদা FAQ পেজে)।',
      step6Html,
      nativeStep6
    ),
    wrapBlock(
      'step-7-contact',
      'ধাপ ৭: যোগাযোগ (WhatsApp, bKash ও ঠিকানা ফুটার)',
      7,
      'পেজের একদম নিচে নতুন ব্লকে পেস্ট করুন (অথবা আলাদা Contact পেজে)।',
      step7Html,
      nativeStep7
    ),
  ];
}

export function generateWordPressFreeHtml(data: ExportBundleData): string {
  const steps = generateWordPressFreeStepBlocks(data);
  return steps.map((s) => s.customHtml).join('');
}

export function generateStandaloneHtml(data: ExportBundleData): string {
  const clean = sanitizeExportData(data);
  const css = getExportCss();
  const js = getExportAppScript(safeJsonForHtml(clean));

  return `<!doctype html><html lang="bn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${escapeHtml(clean.companyName)} — মেডিকেল যন্ত্রপাতি ও স্লিপ টেস্ট</title><style>${css}</style></head><body><div id="lifecircle-bd-wp-root"></div><script>${js}</script></body></html>`;
}

export function generateGutenbergBlockHtml(data: ExportBundleData): string {
  const clean = sanitizeExportData(data);
  const css = getExportCss();
  const js = getExportAppScript(safeJsonForHtml(clean));

  return `<div id="lifecircle-bd-wp-root"></div><style>${css}</style><script>${js}</script>`;
}

export async function generateWordPressPluginZip(data: ExportBundleData): Promise<Blob> {
  const clean = sanitizeExportData(data);
  const css = getExportCss();
  const js = getExportAppScript(safeJsonForHtml(clean));

  const phpCode = `<?php
/**
 * Plugin Name: lifecircle.bd Medical & Sleep Clinic
 * Description: Safe shortcode [lifecircle_bd] for lifecircle.bd medical catalog, sleep test, diabetes guide, hospitals directory, FAQ, and copy protection.
 * Version: 1.0.0
 * Author: lifecircle.bd
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function lifecircle_bd_enqueue_assets() {
    wp_register_style(
        'lifecircle-bd-style',
        plugins_url( 'assets/app.css', __FILE__ ),
        array(),
        '1.0.0'
    );
    wp_register_script(
        'lifecircle-bd-script',
        plugins_url( 'assets/app.min.js', __FILE__ ),
        array(),
        '1.0.0',
        true
    );
}
add_action( 'wp_enqueue_scripts', 'lifecircle_bd_enqueue_assets' );

function lifecircle_bd_shortcode() {
    wp_enqueue_style( 'lifecircle-bd-style' );
    wp_enqueue_script( 'lifecircle-bd-script' );
    return '<div id="lifecircle-bd-wp-root"></div>';
}
add_shortcode( 'lifecircle_bd', 'lifecircle_bd_shortcode' );
`;

  const readmeTxt = `=== lifecircle.bd Medical & Sleep Clinic ===
Shortcode: [lifecircle_bd]

Installation:
1. WordPress Admin > Plugins > Add New > Upload Plugin
2. Select lifecircle-bd-wp-plugin.zip and click Install Now > Activate Plugin.
3. Add a Shortcode block with [lifecircle_bd] on any page.
4. Do NOT paste the Gutenberg Custom HTML block on the same page where [lifecircle_bd] is active.
`;

  const zip = new JSZip();
  const rootFolder = zip.folder('lifecircle-bd');
  if (!rootFolder) throw new Error('Failed to initialize ZIP archive');
  rootFolder.file('lifecircle-bd.php', phpCode);
  rootFolder.file('README.txt', readmeTxt);
  const assets = rootFolder.folder('assets');
  if (!assets) throw new Error('Failed to create assets folder in ZIP');
  assets.file('app.css', css);
  assets.file('app.min.js', js);

  return zip.generateAsync({ type: 'blob' });
}
