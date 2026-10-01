const FRAME_ID = "3:141"; const CHUNK = 0;
const FONTS = ["P Regular","Semi Bold","P Italic","Regular","Medium"];
const IMG = {};
const ICONS = {"67b3fdcecc":"15:44","19d7f0955a":"14:277","a06419fe85":"15:48"};
const UNITS = [{"k":"F","n":"box","x":0,"y":0,"w":390,"h":844,"bg":"#ffffff","c":[{"k":"F","n":"group","x":0,"y":0,"w":390,"h":56,"c":[{"k":"F","n":"group","x":0,"y":0,"w":390,"h":56,"c":[{"k":"T","n":"Iris","x":179.5,"y":6,"w":31,"h":26,"runs":[{"s":"Iris","f":"P Regular","fs":20,"c":"#0f0f0f","lh":26}]},{"k":"F","n":"group","x":144.3,"y":36,"w":101.3,"h":14,"c":[{"k":"F","n":"box","x":144.3,"y":40,"w":6,"h":6,"bg":"#2f7a4d","rad":[3,3,3,3]},{"k":"T","n":"STYLIST · LIVE","x":154.3,"y":36,"w":91.3,"h":14,"runs":[{"s":"STYLIST · LIVE","f":"Semi Bold","fs":11,"c":"#6b6b6b","lh":14,"ls":0.88}]}]}]},{"k":"S","n":"x","x":336,"y":16,"w":24,"h":24,"ic":"67b3fdcecc","op":1}]},{"k":"F","n":"group","x":0,"y":56,"w":390,"h":788,"c":[{"k":"F","n":"group","x":0,"y":56,"w":390,"h":715,"clip":1,"c":[{"k":"F","n":"group","x":24,"y":80,"w":342,"h":178,"c":[{"k":"F","n":"box","x":24,"y":80,"w":342,"h":124,"bg":"#faf7f2","rad":[16,16,16,16],"clip":1,"c":[{"k":"F","n":"group","x":44,"y":100,"w":302,"h":32,"c":[{"k":"F","n":"group","x":44,"y":100,"w":32,"h":32,"rad":[16,16,16,16],"c":[{"k":"F","n":"group","x":44,"y":100,"w":32,"h":32,"bg":"#0f0f0f","clip":1,"c":[{"k":"T","n":"I","x":57.5,"y":107.6,"w":5,"h":16.8,"runs":[{"s":"I","f":"P Italic","fs":16,"c":"#ffffff","lh":16.8}]}]},{"k":"F","n":"box","x":65,"y":121,"w":12,"h":12,"bg":"#ffffff","rad":[6,6,6,6],"c":[{"k":"F","n":"box","x":67,"y":123,"w":8,"h":8,"bg":"#2f7a4d","rad":[4,4,4,4]}]}]},{"k":"F","n":"group","x":88,"y":109,"w":258,"h":14,"c":[{"k":"T","n":"Iris","x":88,"y":109,"w":23.5,"h":14,"runs":[{"s":"Iris","f":"Semi Bold","fs":11,"c":"#6b6b6b","lh":14,"ls":0.88,"u":1}]},{"k":"T","n":"· GOOD AFTERNOON","x":115.5,"y":109,"w":123.1,"h":14,"runs":[{"s":"· GOOD AFTERNOON","f":"Semi Bold","fs":11,"c":"#6b6b6b","lh":14,"ls":0.88,"u":1}]}]}]},{"k":"T","n":"What are we solving today? A moment, a p","x":44,"y":144,"w":302,"h":40,"runs":[{"s":"What are we solving today? A moment, a piece, a maybe — tell me.","f":"Regular","fs":14,"c":"#0f0f0f","lh":20}]}]},{"k":"F","n":"group","x":24,"y":220,"w":342,"h":38,"c":[{"k":"F","n":"button","x":24,"y":220,"w":166,"h":38,"rad":[19,19,19,19],"st":{"c":"#0f0f0f","a":1,"w":[1,1,1,1],"dashed":false},"c":[{"k":"T","n":"Style my next event","x":41,"y":232,"w":132,"h":14,"runs":[{"s":"Style my next event","f":"Medium","fs":14,"c":"#0f0f0f","lh":14}]}]},{"k":"F","n":"button","x":198,"y":220,"w":152,"h":38,"rad":[19,19,19,19],"st":{"c":"#0f0f0f","a":1,"w":[1,1,1,1],"dashed":false},"c":[{"k":"T","n":"What goes with…","x":215,"y":232,"w":118,"h":14,"runs":[{"s":"What goes with…","f":"Medium","fs":14,"c":"#0f0f0f","lh":14}]}]}]}]}]},{"k":"F","n":"box","x":0,"y":771,"w":390,"h":73,"bg":"#ffffff","st":{"c":"#eae7e1","a":1,"w":[1,0,0,0],"dashed":false},"c":[{"k":"F","n":"box","x":24,"y":784,"w":298,"h":48,"bg":"#f4f2ee","rad":[24,24,24,24],"c":[{"k":"S","n":"plus","x":40,"y":798,"w":20,"h":20,"ic":"19d7f0955a","op":1},{"k":"T","n":"What should I wear to a wedding on Satur","x":76,"y":786,"w":238,"h":44,"runs":[{"s":"What should I wear to a wedding on Saturday?","f":"Regular","fs":15,"c":"#0f0f0f","lh":22}]}]},{"k":"F","n":"Send message","x":330,"y":790,"w":36,"h":36,"bg":"#0f0f0f","rad":[18,18,18,18],"c":[{"k":"S","n":"send","x":339,"y":799,"w":18,"h":18,"ic":"a06419fe85","op":1}]}]}]}]}];

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
