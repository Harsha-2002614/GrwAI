const FRAME_ID = "3:112"; const CHUNK = 0;
const FONTS = ["P Regular","Regular","Medium","P Italic","Semi Bold"];
const IMG = {};
const ICONS = {"093bac84ec":"14:246","06f5b3103f":"14:61","10a94212d0":"14:249","9667dfdf63":"14:135","9bcfe5f8ba":"14:96","fcf6b7f217":"14:252","12a3f36df5":"14:102","5f6497f065":"14:107","803df2d8b6":"14:157","ecf00df1bb":"14:256","93e09adac1":"14:261","f7eb34f026":"14:266"};
const UNITS = [{"k":"F","n":"box","x":0,"y":0,"w":390,"h":844,"bg":"#ffffff","c":[{"k":"F","n":"group","x":0,"y":0,"w":390,"h":844,"c":[{"k":"F","n":"group","x":0,"y":0,"w":390,"h":780,"bg":"#ffffff","clip":1,"c":[{"k":"F","n":"box","x":0,"y":0,"w":390,"h":56,"bg":"#ffffff","st":{"c":"#000000","a":1,"w":[0,0,1,0],"dashed":false},"c":[{"k":"T","n":"heading","x":24,"y":12.5,"w":69,"h":30,"runs":[{"s":"Closet","f":"P Regular","fs":24,"c":"#0f0f0f","lh":30}]},{"k":"F","n":"group","x":286,"y":9.5,"w":80,"h":36,"c":[{"k":"S","n":"plus","x":294,"y":17.5,"w":20,"h":20,"ic":"093bac84ec","op":1},{"k":"F","n":"Notifications","x":330,"y":9.5,"w":36,"h":36,"rad":[18,18,18,18],"c":[{"k":"S","n":"bell","x":336,"y":15.5,"w":24,"h":24,"ic":"06f5b3103f","op":1},{"k":"F","n":"box","x":352,"y":15.5,"w":8,"h":8,"bg":"#c75d3a","rad":[4,4,4,4]}]}]}]},{"k":"F","n":"group","x":0,"y":56,"w":390,"h":724,"c":[{"k":"F","n":"box","x":163,"y":299,"w":64,"h":64,"bg":"#f4f2ee","rad":[32,32,32,32],"c":[{"k":"S","n":"shirt","x":181,"y":317,"w":28,"h":28,"ic":"10a94212d0","op":1}]},{"k":"T","n":"Your closet is empty.","x":86.5,"y":383,"w":217,"h":30,"runs":[{"s":"Your closet is empty.","f":"P Regular","fs":24,"c":"#0f0f0f","lh":30,"ls":-0.24}],"al":"CENTER"},{"k":"T","n":"Snap a photo of anything you own. The mo","x":35,"y":421,"w":320,"h":44,"runs":[{"s":"Snap a photo of anything you own. The more Iris sees, the better it styles you.","f":"Regular","fs":15,"c":"#6b6b6b","lh":22}],"al":"CENTER"},{"k":"F","n":"button","x":98,"y":489,"w":194,"h":48,"bg":"#0f0f0f","rad":[12,12,12,12],"c":[{"k":"T","n":"Add your first piece.","x":118,"y":504,"w":154,"h":18,"runs":[{"s":"Add your first piece.","f":"Medium","fs":16,"c":"#ffffff","lh":18}]}]}]}]},{"k":"F","n":"box","x":0,"y":780,"w":390,"h":64,"bg":"#ffffff","st":{"c":"#d8d8d8","a":1,"w":[1,0,0,0],"dashed":false},"c":[{"k":"F","n":"tablist","x":0,"y":781,"w":390,"h":63,"c":[{"k":"F","n":"tab","x":0,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"sun","x":27,"y":788,"w":24,"h":24,"ic":"9667dfdf63","op":1},{"k":"T","n":"Today","x":20.5,"y":818,"w":37,"h":16,"runs":[{"s":"Today","f":"Regular","fs":13,"c":"#767676","lh":16}]}]},{"k":"F","n":"tab","x":78,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"calendar","x":105,"y":788,"w":24,"h":24,"ic":"9bcfe5f8ba","op":1},{"k":"T","n":"Events","x":96,"y":818,"w":42,"h":16,"runs":[{"s":"Events","f":"Regular","fs":13,"c":"#767676","lh":16}]}]},{"k":"F","n":"tab","x":156,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"shirt","x":183,"y":788,"w":24,"h":24,"ic":"fcf6b7f217","op":1},{"k":"T","n":"Closet","x":175,"y":818,"w":40,"h":16,"runs":[{"s":"Closet","f":"Medium","fs":13,"c":"#0f0f0f","lh":16}]}]},{"k":"F","n":"tab","x":234,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"heart","x":261,"y":788,"w":24,"h":24,"ic":"12a3f36df5","op":1},{"k":"T","n":"Saved","x":254,"y":818,"w":38,"h":16,"runs":[{"s":"Saved","f":"Regular","fs":13,"c":"#767676","lh":16}]}]},{"k":"F","n":"tab","x":312,"y":781,"w":78,"h":63,"c":[{"k":"S","n":"circle-user","x":339,"y":788,"w":24,"h":24,"ic":"5f6497f065","op":1},{"k":"T","n":"You","x":339,"y":818,"w":24,"h":16,"runs":[{"s":"You","f":"Regular","fs":13,"c":"#767676","lh":16}]}]}]}]}]},{"k":"F","n":"Ask Iris","x":305.6,"y":678,"w":68.4,"h":78,"c":[{"k":"F","n":"box","x":311.8,"y":678,"w":56,"h":56,"rad":[28,28,28,28],"sh":[{"c":"#0f0f0f","a":0.06,"x":0,"y":4,"b":12,"s":0}],"c":[{"k":"F","n":"group","x":311.8,"y":678,"w":56,"h":56,"rad":[28,28,28,28],"c":[{"k":"F","n":"group","x":311.8,"y":678,"w":56,"h":56,"bg":"#0f0f0f","clip":1,"c":[{"k":"T","n":"I","x":334.8,"y":691.3,"w":10,"h":29.4,"runs":[{"s":"I","f":"P Italic","fs":28,"c":"#ffffff","lh":29.4}]}]},{"k":"F","n":"box","x":349.8,"y":716,"w":18,"h":18,"bg":"#ffffff","rad":[9,9,9,9],"c":[{"k":"F","n":"box","x":351.8,"y":718,"w":14,"h":14,"bg":"#2f7a4d","rad":[7,7,7,7]}]}]}]},{"k":"F","n":"box","x":305.6,"y":738,"w":68.4,"h":18,"bg":"#ffffff","rad":[9,9,9,9],"st":{"c":"#eae7e1","a":1,"w":[1,1,1,1],"dashed":false},"c":[{"k":"T","n":"Ask Iris","x":314.6,"y":741,"w":50.4,"h":12,"runs":[{"s":"Ask Iris","f":"Semi Bold","fs":10,"c":"#0f0f0f","lh":12,"ls":0.8,"u":1}]}]}]}]},{"k":"F","n":"box","x":0,"y":0,"w":390,"h":844,"bg":{"c":"#0f0f0f","a":0.4},"c":[{"k":"F","n":"box","x":0,"y":417,"w":390,"h":427,"bg":"#faf7f2","rad":[24,24,0,0],"st":{"c":"#eae7e1","a":1,"w":[1,0,0,0],"dashed":false},"c":[{"k":"F","n":"box","x":177,"y":426,"w":36,"h":4,"bg":"#d6d2cb","rad":[2,2,2,2]},{"k":"F","n":"group","x":24,"y":454,"w":342,"h":58,"c":[{"k":"F","n":"group","x":24,"y":454,"w":298,"h":58,"c":[{"k":"T","n":"Add a piece","x":24,"y":454,"w":298,"h":34,"runs":[{"s":"Add a piece","f":"P Regular","fs":28,"c":"#0f0f0f","lh":34}]},{"k":"T","n":"How are you adding this?","x":24,"y":492,"w":298,"h":20,"runs":[{"s":"How are you adding this?","f":"Regular","fs":14,"c":"#6b6b6b","lh":20}]}]},{"k":"S","n":"x","x":340,"y":456,"w":20,"h":20,"ic":"803df2d8b6","op":1}]},{"k":"F","n":"group","x":24,"y":536,"w":342,"h":276,"c":[{"k":"F","n":"button","x":24,"y":536,"w":342,"h":84,"bg":"#ffffff","rad":[16,16,16,16],"st":{"c":"#eae7e1","a":1,"w":[1,1,1,1],"dashed":false},"clip":1,"c":[{"k":"F","n":"group","x":45,"y":557,"w":300,"h":42,"c":[{"k":"F","n":"box","x":45,"y":558,"w":40,"h":40,"bg":"#f4f2ee","rad":[12,12,12,12],"c":[{"k":"S","n":"camera","x":53,"y":566,"w":24,"h":24,"ic":"ecf00df1bb","op":1}]},{"k":"F","n":"group","x":101,"y":557,"w":244,"h":42,"c":[{"k":"T","n":"Take a photo","x":101,"y":557,"w":244,"h":20,"runs":[{"s":"Take a photo","f":"Medium","fs":16,"c":"#0f0f0f","lh":20}]},{"k":"T","n":"Snap your piece — crop 1:1 next","x":101,"y":579,"w":244,"h":20,"runs":[{"s":"Snap your piece — crop 1:1 next","f":"Regular","fs":14,"c":"#6b6b6b","lh":20}]}]}]}]},{"k":"F","n":"button","x":24,"y":632,"w":342,"h":84,"bg":"#ffffff","rad":[16,16,16,16],"st":{"c":"#eae7e1","a":1,"w":[1,1,1,1],"dashed":false},"clip":1,"c":[{"k":"F","n":"group","x":45,"y":653,"w":300,"h":42,"c":[{"k":"F","n":"box","x":45,"y":654,"w":40,"h":40,"bg":"#f4f2ee","rad":[12,12,12,12],"c":[{"k":"S","n":"image","x":53,"y":662,"w":24,"h":24,"ic":"93e09adac1","op":1}]},{"k":"F","n":"group","x":101,"y":653,"w":244,"h":42,"c":[{"k":"T","n":"Choose from library","x":101,"y":653,"w":244,"h":20,"runs":[{"s":"Choose from library","f":"Medium","fs":16,"c":"#0f0f0f","lh":20}]},{"k":"T","n":"Pick a photo — crop 1:1 next","x":101,"y":675,"w":244,"h":20,"runs":[{"s":"Pick a photo — crop 1:1 next","f":"Regular","fs":14,"c":"#6b6b6b","lh":20}]}]}]}]},{"k":"F","n":"button","x":24,"y":728,"w":342,"h":84,"bg":"#ffffff","rad":[16,16,16,16],"st":{"c":"#eae7e1","a":1,"w":[1,1,1,1],"dashed":false},"clip":1,"c":[{"k":"F","n":"group","x":45,"y":749,"w":300,"h":42,"c":[{"k":"F","n":"box","x":45,"y":750,"w":40,"h":40,"bg":"#f4f2ee","rad":[12,12,12,12],"c":[{"k":"S","n":"link-2","x":53,"y":758,"w":24,"h":24,"ic":"f7eb34f026","op":1}]},{"k":"F","n":"group","x":101,"y":749,"w":244,"h":42,"c":[{"k":"T","n":"Paste a link","x":101,"y":749,"w":244,"h":20,"runs":[{"s":"Paste a link","f":"Medium","fs":16,"c":"#0f0f0f","lh":20}]},{"k":"T","n":"From any shopping site","x":101,"y":771,"w":244,"h":20,"runs":[{"s":"From any shopping site","f":"Regular","fs":14,"c":"#6b6b6b","lh":20}]}]}]}]}]}]}]}];

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
