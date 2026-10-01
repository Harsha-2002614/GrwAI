const FRAME_ID = "3:102"; const CHUNK = 0;
const FONTS = ["P Regular","Semi Bold","P Italic","Regular","Medium"];
const IMG = {};
const ICONS = {"06f5b3103f":"14:61","a0c06ac801":"14:66","ccabc506bb":"14:228","f1b248be79":"14:232","ab4e2d1213":"14:236","7fc667cd27":"14:242","9667dfdf63":"14:135","96df5d0665":"14:153","ab99427ce9":"14:99","12a3f36df5":"14:102","5f6497f065":"14:107"};
const UNITS = [{"k":"F","n":"box","x":0,"y":0,"w":390,"h":844,"bg":"#ffffff","c":[{"k":"F","n":"group","x":0,"y":0,"w":390,"h":844,"c":[{"k":"F","n":"group","x":0,"y":0,"w":390,"h":780,"bg":"#ffffff","clip":1,"c":[{"k":"F","n":"box","x":0,"y":0,"w":390,"h":56,"bg":"#ffffff","st":{"c":"#000000","a":1,"w":[0,0,1,0],"dashed":false},"c":[{"k":"T","n":"heading","x":24,"y":14.5,"w":60,"h":26,"runs":[{"s":"Events","f":"P Regular","fs":20,"c":"#0f0f0f","lh":26}]},{"k":"F","n":"group","x":225,"y":9.5,"w":141,"h":36,"c":[{"k":"F","n":"Notifications","x":282,"y":9.5,"w":36,"h":36,"rad":[18,18,18,18],"c":[{"k":"S","n":"bell","x":288,"y":15.5,"w":24,"h":24,"ic":"06f5b3103f","op":1},{"k":"F","n":"box","x":304,"y":15.5,"w":8,"h":8,"bg":"#c75d3a","rad":[4,4,4,4]}]},{"k":"F","n":"Shopping bag","x":330,"y":9.5,"w":36,"h":36,"rad":[18,18,18,18],"c":[{"k":"S","n":"shopping-bag","x":336,"y":15.5,"w":24,"h":24,"ic":"a0c06ac801","op":1},{"k":"F","n":"box","x":348,"y":11.5,"w":16,"h":16,"bg":"#0f0f0f","rad":[8,8,8,8],"c":[{"k":"T","n":"2","x":353,"y":14.5,"w":6,"h":10,"runs":[{"s":"2","f":"Semi Bold","fs":10,"c":"#ffffff","lh":10,"u":1}]}]}]}]}]},{"k":"F","n":"group","x":0,"y":56,"w":390,"h":724,"clip":1,"c":[{"k":"F","n":"group","x":0,"y":56,"w":390,"h":2233.5,"c":[{"k":"F","n":"group","x":0,"y":56,"w":390,"h":206,"c":[{"k":"T","n":"Your week, composed in advance","x":24,"y":88,"w":342,"h":76,"runs":[{"s":"Your week, ","f":"P Regular","fs":32,"c":"#0f0f0f","lh":38,"ls":-0.32},{"s":"composed","f":"P Italic","fs":32,"c":"#c75d3a","lh":38,"ls":-0.32},{"s":" in advance","f":"P Regular","fs":32,"c":"#0f0f0f","lh":38,"ls":-0.32}]},{"k":"T","n":"4 moments · 1 trip · this month","x":24,"y":176,"w":342,"h":22,"runs":[{"s":"4 moments · 1 trip · this month","f":"Regular","fs":15,"c":"#6b6b6b","lh":22}]},{"k":"F","n":"button","x":24,"y":214,"w":176,"h":48,"bg":"#0f0f0f","rad":[12,12,12,12],"c":[{"k":"F","n":"group","x":44,"y":229,"w":136,"h":18,"c":[{"k":"S","n":"sparkles","x":44,"y":229,"w":18,"h":18,"ic":"ccabc506bb","op":1},{"k":"T","n":"Add a moment","x":70,"y":229,"w":110,"h":18,"runs":[{"s":"Add a moment","f":"Medium","fs":16,"c":"#ffffff","lh":18}]}]}]}]},{"k":"F","n":"group","x":0,"y":262,"w":390,"h":62,"clip":1,"c":[{"k":"F","n":"group","x":0,"y":286,"w":247,"h":38,"c":[{"k":"F","n":"button","x":24,"y":286,"w":113,"h":38,"bg":"#0f0f0f","rad":[19,19,19,19],"c":[{"k":"F","n":"group","x":40,"y":298,"w":81,"h":14,"c":[{"k":"T","n":"Upcoming","x":40,"y":298,"w":68,"h":14,"runs":[{"s":"Upcoming","f":"Medium","fs":14,"c":"#ffffff","lh":14}]},{"k":"T","n":"4","x":112,"y":298,"w":9,"h":14,"runs":[{"s":"4","f":"Regular","fs":14,"c":"#767676","lh":14}]}]}]},{"k":"F","n":"button","x":145,"y":286,"w":78,"h":38,"bg":"#ffffff","rad":[19,19,19,19],"st":{"c":"#eae7e1","a":1,"w":[1,1,1,1],"dashed":false},"c":[{"k":"F","n":"group","x":162,"y":298,"w":44,"h":14,"c":[{"k":"T","n":"Trips","x":162,"y":298,"w":34,"h":14,"runs":[{"s":"Trips","f":"Medium","fs":14,"c":"#0f0f0f","lh":14}]},{"k":"T","n":"1","x":200,"y":298,"w":6,"h":14,"runs":[{"s":"1","f":"Regular","fs":14,"c":"#767676","lh":14}]}]}]}]}]},{"k":"F","n":"group","x":24,"y":348,"w":342,"h":1701.5,"c":[{"k":"F","n":"group","x":24,"y":348,"w":342,"h":428.4,"c":[{"k":"T","n":"Featured","x":28,"y":348,"w":338,"h":12,"runs":[{"s":"Featured","f":"Semi Bold","fs":10,"c":"#b85432","lh":12,"ls":0.8,"u":1}]},{"k":"F","n":"button","x":24,"y":368,"w":342,"h":408.4,"bg":"#ffffff","rad":[16,16,16,16],"sh":[{"c":"#0f0f0f","a":0.04,"x":0,"y":1,"b":2,"s":0}],"clip":1,"c":[{"k":"F","n":"box","x":24,"y":368,"w":342,"h":192.4,"grad":{"angle":119.31,"stops":[{"c":"#e8edf2","a":1,"p":0},{"c":"#000000","a":1,"p":1}]},"c":[{"k":"S","n":"briefcase","x":40,"y":384,"w":18,"h":18,"ic":"f1b248be79","op":1},{"k":"T","n":"WORK · CONFERENCE ROOM","x":108.3,"y":457.2,"w":173.4,"h":14,"runs":[{"s":"WORK · CONFERENCE ROOM","f":"Semi Bold","fs":11,"c":"#0f0f0f","lh":14,"ls":0.88,"a":0.6,"u":1}],"al":"CENTER"},{"k":"T","n":"ILLUSTRATION","x":274.6,"y":537.4,"w":79.4,"h":11,"runs":[{"s":"ILLUSTRATION","f":"Semi Bold","fs":9,"c":"#0f0f0f","lh":11,"ls":1.2,"a":0.4,"u":1}]}]},{"k":"F","n":"group","x":24,"y":560.4,"w":342,"h":216,"c":[{"k":"T","n":"TODAY · 2:00 PM","x":40,"y":576.4,"w":310,"h":14,"runs":[{"s":"TODAY · 2:00 PM","f":"Semi Bold","fs":11,"c":"#b85432","lh":14,"ls":0.88,"u":1}]},{"k":"T","n":"QR review with Maya","x":40,"y":598.4,"w":310,"h":30,"runs":[{"s":"QR review with Maya","f":"P Regular","fs":24,"c":"#0f0f0f","lh":30,"ls":-0.24}]},{"k":"F","n":"group","x":40,"y":636.4,"w":310,"h":20,"c":[{"k":"S","n":"map-pin","x":40,"y":639.4,"w":14,"h":14,"ic":"ab4e2d1213","op":1},{"k":"T","n":"Office","x":62,"y":636.4,"w":288,"h":20,"runs":[{"s":"Office","f":"Regular","fs":14,"c":"#6b6b6b","lh":20}]}]},{"k":"F","n":"group","x":40,"y":672.4,"w":310,"h":60,"c":[{"k":"F","n":"box","x":40,"y":672.4,"w":60,"h":60,"grad":{"angle":135,"stops":[{"c":"#e8edf2","a":1,"p":0},{"c":"#000000","a":1,"p":1}]},"rad":[8,8,8,8],"c":[{"k":"T","n":"👕️ 👖️","x":40,"y":688.4,"w":60,"h":28,"runs":[{"s":"👕️ 👖️","f":"Regular","fs":22,"c":"#000000","lh":28}],"al":"CENTER"}]},{"k":"F","n":"group","x":112,"y":673.4,"w":238,"h":58,"c":[{"k":"T","n":"Today’s pick","x":112,"y":673.4,"w":238,"h":12,"runs":[{"s":"Today’s pick","f":"Semi Bold","fs":10,"c":"#b85432","lh":12,"ls":0.8,"u":1}]},{"k":"T","n":"The Polish","x":112,"y":687.4,"w":238,"h":22,"runs":[{"s":"The Polish","f":"Medium","fs":15,"c":"#0f0f0f","lh":22}]},{"k":"T","n":"cream blouse · tailored trousers","x":112,"y":711.4,"w":238,"h":20,"runs":[{"s":"cream blouse · tailored trousers","f":"Regular","fs":14,"c":"#6b6b6b","lh":20}]}]}]},{"k":"T","n":"FROM CALENDAR","x":40,"y":748.4,"w":310,"h":12,"runs":[{"s":"FROM CALENDAR","f":"Semi Bold","fs":10,"c":"#767676","lh":12,"ls":0.8,"u":1}]}]}]}]},{"k":"F","n":"button","x":24,"y":792.4,"w":342,"h":408.4,"bg":"#ffffff","rad":[16,16,16,16],"sh":[{"c":"#0f0f0f","a":0.04,"x":0,"y":1,"b":2,"s":0}],"clip":1,"c":[{"k":"F","n":"box","x":24,"y":792.4,"w":342,"h":192.4,"grad":{"angle":119.31,"stops":[{"c":"#f5e6d3","a":1,"p":0},{"c":"#000000","a":1,"p":1}]},"c":[{"k":"S","n":"utensils-crossed","x":40,"y":808.4,"w":18,"h":18,"ic":"7fc667cd27","op":1}]}]}]}]}]}]},{"k":"F","n":"box","x":0,"y":780,"w":390,"h":64,"bg":"#ffffff","st":{"c":"#d8d8d8","a":1,"w":[1,0,0,0],"dashed":false},"c":[{"k":"F","n":"tablist","x":0,"y":781,"w":390,"h":63,"c":[{"k":"F","n":"tab","x":0,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"sun","x":27,"y":788,"w":24,"h":24,"ic":"9667dfdf63","op":1},{"k":"T","n":"Today","x":20.5,"y":818,"w":37,"h":16,"runs":[{"s":"Today","f":"Regular","fs":13,"c":"#767676","lh":16}]}]},{"k":"F","n":"tab","x":78,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"calendar","x":105,"y":788,"w":24,"h":24,"ic":"96df5d0665","op":1},{"k":"T","n":"Events","x":96,"y":818,"w":42,"h":16,"runs":[{"s":"Events","f":"Medium","fs":13,"c":"#0f0f0f","lh":16}]}]},{"k":"F","n":"tab","x":156,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"shirt","x":183,"y":788,"w":24,"h":24,"ic":"ab99427ce9","op":1},{"k":"T","n":"Closet","x":175,"y":818,"w":40,"h":16,"runs":[{"s":"Closet","f":"Regular","fs":13,"c":"#767676","lh":16}]}]},{"k":"F","n":"tab","x":234,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"heart","x":261,"y":788,"w":24,"h":24,"ic":"12a3f36df5","op":1},{"k":"T","n":"Saved","x":254,"y":818,"w":38,"h":16,"runs":[{"s":"Saved","f":"Regular","fs":13,"c":"#767676","lh":16}]}]},{"k":"F","n":"tab","x":312,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"circle-user","x":339,"y":788,"w":24,"h":24,"ic":"5f6497f065","op":1},{"k":"T","n":"You","x":339,"y":818,"w":24,"h":16,"runs":[{"s":"You","f":"Regular","fs":13,"c":"#767676","lh":16}]}]}]}]}]},{"k":"F","n":"Ask Iris","x":305.6,"y":678,"w":68.4,"h":78,"c":[{"k":"F","n":"box","x":311.8,"y":678,"w":56,"h":56,"rad":[28,28,28,28],"sh":[{"c":"#0f0f0f","a":0.06,"x":0,"y":4,"b":12,"s":0}],"c":[{"k":"F","n":"group","x":311.8,"y":678,"w":56,"h":56,"rad":[28,28,28,28],"c":[{"k":"F","n":"group","x":311.8,"y":678,"w":56,"h":56,"bg":"#0f0f0f","clip":1,"c":[{"k":"T","n":"I","x":334.8,"y":691.3,"w":10,"h":29.4,"runs":[{"s":"I","f":"P Italic","fs":28,"c":"#ffffff","lh":29.4}]}]},{"k":"F","n":"box","x":349.8,"y":716,"w":18,"h":18,"bg":"#ffffff","rad":[9,9,9,9],"c":[{"k":"F","n":"box","x":351.8,"y":718,"w":14,"h":14,"bg":"#2f7a4d","rad":[7,7,7,7]}]}]}]},{"k":"F","n":"box","x":305.6,"y":738,"w":68.4,"h":18,"bg":"#ffffff","rad":[9,9,9,9],"st":{"c":"#eae7e1","a":1,"w":[1,1,1,1],"dashed":false},"c":[{"k":"T","n":"Ask Iris","x":314.6,"y":741,"w":50.4,"h":12,"runs":[{"s":"Ask Iris","f":"Semi Bold","fs":10,"c":"#0f0f0f","lh":12,"ls":0.8,"u":1}]}]}]}]}];

const FRAME = await figma.getNodeByIdAsync(FRAME_ID);
if (!FRAME) throw new Error('frame missing');
const fontOf = (f) => f.startsWith('P ') ? { family: 'Playfair Display', style: f.slice(2) } : { family: 'Inter', style: f };
const bgOf = (bg) => typeof bg === 'string' ? { c: bg, a: 1 } : bg;
const loaded = {}; async function font(f) { const k = f.family + '|' + f.style; if (loaded[k] !== undefined) return loaded[k]; try { await figma.loadFontAsync(f); loaded[k] = f; } catch (e) { const fb = { family: 'Inter', style: /Italic/.test(f.style) ? 'Italic' : (f.style === 'Medium' || f.style === 'Semi Bold' || f.style === 'Bold') ? f.style : 'Regular' }; try { await figma.loadFontAsync(fb); loaded[k] = fb; } catch (e2) { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); loaded[k] = { family: 'Inter', style: 'Regular' }; } } return loaded[k]; }
for (const f of FONTS) await font(fontOf(f));
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const isHot = (c) => c.name.startsWith('→') || c.name.startsWith('swipe →') || c.name.startsWith('Reference');
if (CHUNK === 0) {
  const imgFill = FRAME.fills.find((f) => f.type === 'IMAGE');
  for (const c of [...FRAME.children]) if (!isHot(c) || c.name.startsWith('Reference')) c.remove();
  FRAME.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; FRAME.clipsContent = true;
  if (imgFill) { const ref = figma.createRectangle(); ref.name = 'Reference screenshot (hidden)'; ref.resize(390, 844); ref.fills = [imgFill]; ref.visible = false; ref.locked = true; FRAME.insertChild(0, ref); }
}
function gradTransform(angle) { const t = angle * Math.PI / 180; const dx = Math.sin(t), dy = -Math.cos(t); const s = 1 / (Math.abs(dx) + Math.abs(dy) || 1); return [[dx * s, dy * s, 0.5 - 0.5 * (dx + dy) * s], [-dy * s, dx * s, 0.5 + 0.5 * (dy - dx) * s]]; }
function fillsOf(n) {
  const out = [];
  if (n.bg) { const b = bgOf(n.bg); out.push({ type: 'SOLID', color: hex(b.c), opacity: b.a }); }
  if (n.grad) out.push({ type: 'GRADIENT_LINEAR', gradientTransform: gradTransform(n.grad.angle), gradientStops: n.grad.stops.map((s) => ({ position: s.p, color: { ...hex(s.c), a: s.a } })) });
  if (n.img) { const hsh = IMG[n.img]; if (hsh) out.push({ type: 'IMAGE', imageHash: hsh, scaleMode: n.fit || 'FILL' }); else if (!out.length) out.push({ type: 'SOLID', color: { r: 0.93, g: 0.92, b: 0.9 } }); }
  return out;
}
function decorate(node, n) {
  node.fills = fillsOf(n);
  if (n.rad) { node.topLeftRadius = n.rad[0]; node.topRightRadius = n.rad[1]; node.bottomRightRadius = n.rad[2]; node.bottomLeftRadius = n.rad[3]; }
  if (n.st) { node.strokes = [{ type: 'SOLID', color: hex(n.st.c), opacity: n.st.a }]; node.strokeAlign = 'INSIDE'; const [t, r, b, l] = n.st.w; if (t === r && r === b && b === l) node.strokeWeight = t; else { node.strokeTopWeight = t; node.strokeRightWeight = r; node.strokeBottomWeight = b; node.strokeLeftWeight = l; } if (n.st.dashed) node.dashPattern = [6, 4]; }
  if (n.sh) node.effects = n.sh.map((s) => ({ type: 'DROP_SHADOW', color: { ...hex(s.c), a: s.a }, offset: { x: s.x, y: s.y }, radius: s.b, spread: s.s, visible: true, blendMode: 'NORMAL' }));
  if (n.op) node.opacity = n.op;
}
async function makeText(n) {
  const t = figma.createText();
  const f0 = await font(fontOf(n.runs[0].f)); t.fontName = f0;
  const chars = n.runs.map((r) => r.s).join('');
  t.characters = chars;
  let pos = 0;
  for (const r of n.runs) {
    const end = pos + r.s.length; if (end > pos) {
      t.setRangeFontName(pos, end, await font(fontOf(r.f)));
      t.setRangeFontSize(pos, end, r.fs);
      t.setRangeFills(pos, end, [{ type: 'SOLID', color: hex(r.c), opacity: r.a === undefined ? 1 : r.a }]);
      t.setRangeLineHeight(pos, end, r.lh ? { unit: 'PIXELS', value: r.lh } : { unit: 'AUTO' });
      t.setRangeLetterSpacing(pos, end, { unit: 'PIXELS', value: r.ls || 0 });
      if (r.u) t.setRangeTextCase(pos, end, 'UPPER');
    }
    pos = end;
  }
  t.textAlignHorizontal = n.al || 'LEFT'; t.textAlignVertical = 'TOP';
  const pad = n.pad || [0, 0, 0, 0];
  const boxW = Math.max(2, n.w - pad[1] - pad[3]), boxH = Math.max(2, n.h - pad[0] - pad[2]);
  const lineH = n.runs[0].lh || n.runs[0].fs * 1.3;
  let dx = pad[3];
  if (boxH <= lineH + 1.5 && !chars.includes('\n')) {
    // single line in the app: never let Figma's slightly different metrics wrap it
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    if (n.al === 'CENTER') dx += (boxW - t.width) / 2; else if (n.al === 'RIGHT') dx += boxW - t.width;
  } else {
    t.textAutoResize = 'NONE'; t.resize(boxW + 2, boxH);
    t.textAutoResize = 'HEIGHT';
  }
  t.name = n.n || chars.slice(0, 40);
  return { node: t, dx, dy: pad[0] };
}
let count = 0;
async function make(n, parent, px, py) {
  let node, dx = 0, dy = 0;
  if (n.k === 'S') { const comp = ICONS[n.ic] ? await figma.getNodeByIdAsync(ICONS[n.ic]) : null; if (comp && comp.type === 'COMPONENT') { node = comp.createInstance(); } else { node = figma.createFrame(); node.fills = []; node.resize(Math.max(1, n.w), Math.max(1, n.h)); } node.name = n.n || 'icon'; if (n.op) node.opacity = n.op; }
  else if (n.k === 'T') { const r = await makeText(n); node = r.node; dx = r.dx; dy = r.dy; if (n.op) node.opacity = n.op; }
  else if (n.c && n.c.length) { node = figma.createFrame(); node.resize(Math.max(1, n.w), Math.max(1, n.h)); decorate(node, n); node.clipsContent = !!n.clip; node.name = n.n || 'group'; }
  else { node = figma.createRectangle(); node.resize(Math.max(1, n.w), Math.max(1, n.h)); decorate(node, n); node.name = n.n || (n.img ? 'image' : 'box'); }
  node.x = n.x - px + dx; node.y = n.y - py + dy;
  parent.appendChild(node); count++;
  if (n.rot) { const th = n.rot * Math.PI / 180, c = Math.cos(th), s = Math.sin(th); const cx = n.x + n.w / 2, cy = n.y + n.h / 2; const tlx = cx + (-n.w / 2) * c - (-n.h / 2) * s, tly = cy + (-n.w / 2) * s + (-n.h / 2) * c; node.relativeTransform = [[c, -s, tlx - px], [s, c, tly - py]]; }
  if (n.c) for (const c of n.c) await make(c, node, n.x, n.y);
  return node;
}
const created = [];
for (const u of UNITS) created.push((await make(u, FRAME, 0, 0)).id);
// hotspots back on top
for (const c of [...FRAME.children]) if (c.name.startsWith('→') || c.name.startsWith('swipe →')) FRAME.appendChild(c);
return { frame: FRAME_ID, chunk: CHUNK, nodes: count, created: created.length };
