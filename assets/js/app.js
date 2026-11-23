/* Akeed · Fournisseurs — Prod by Oussema Jl */
// démarré par auth.js une fois les données déchiffrées avec le mot de passe
window.AKEED_START = function (D) {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const view = $("#view");
  const LOCAL = location.protocol === "file:"; // le listing de dossier ne marche qu'en local

  /* ---------- icons ---------- */
  const I = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>',
    sheet: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    media: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 14h8M8 17h5"/></svg>',
    text: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    zip: '<svg viewBox="0 0 24 24"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>',
  };

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko";
  const shortProduct = (p) => String(p || "").replace(/\s*\((?:ID|annonce)[^)]*\)\s*/gi, " ").trim();
  const initials = (n) => n.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const STATUS_LABEL = { termine: "Terminé", partiel: "Infos partielles", attente: "En attente", ecarte: "Écarté", autre: "—" };
  const STATUS_COLOR = { termine: "var(--ok)", partiel: "var(--warn)", attente: "var(--bad)", ecarte: "var(--grey)", autre: "var(--grey)" };
  const st = (it) => (it.ecarte ? "ecarte" : it.status);
  const badge = (it) => `<span class="badge s-${st(it)}">${STATUS_LABEL[st(it)]}</span>`;

  /* ---------- index ---------- */
  const items = [], byId = {}, folders = {}, sheetsById = {};
  D.folders.forEach((f) => { folders[f.id] = f; f.items = []; });
  D.sheets.forEach((s) => {
    sheetsById[s.id] = s;
    s.groupsById = {};
    s.groups.forEach((g) => (s.groupsById[g.id] = g));
    s.items.forEach((it) => {
      it.sheet = s.id;
      items.push(it);
      byId[it.id] = it;
      if (it.folder && folders[it.folder]) folders[it.folder].items.push(it);
      it.media = mediaFor(it);
      it.cover = it.photo || (it.media.own.find((m) => m.kind === "image" && /photo|borne|usine/i.test(m.name)) || it.media.own.find((m) => m.kind === "image") || {}).url || "";
      it.firstPrice = (it.fields.find((f) => /prix/i.test(f.label) && !/^(en attente|à demander|pas de prix|non indiqué)/i.test(f.value)) || it.fields.find((f) => /prix/i.test(f.label)) || {});
    });
  });
  const BCATS = ((window.BORNES && window.BORNES.categories) || []).map((c) => Object.assign({ variants: [] }, c));
  const allFiles = D.folders.flatMap((f) => f.files.map((x) => Object.assign({ folder: f }, x)));

  function mediaFor(it) {
    const f = it.folder && D.folders.find((x) => x.id === it.folder);
    if (!f) return { own: [], other: [] };
    const toks = (it.tokens || []).filter((t) => t.length >= 2);
    let own = toks.length ? f.files.filter((x) => toks.some((t) => norm(x.name).replace(/\s+/g, "").includes(t.replace(/\s+/g, "")))) : [];
    // fichiers communs (messages, captures, vidéos) toujours utiles
    if (!own.length) return { own: f.files.slice(), other: [], all: true };
    const other = f.files.filter((x) => !own.includes(x));
    return { own, other };
  }

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem("akeed-theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("#themeBtn").onclick = () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("akeed-theme", root.dataset.theme); } catch (e) {}
  };
  if (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches) root.dataset.theme = "dark";

  /* ---------- sidebar ---------- */
  function buildNav() {
    let h = `<div class="nav-label" style="padding-top:4px">Catalogue bornes</div>`;
    h += `<a href="#/" data-r="bornes">${I.grid} Toutes les bornes</a>`;
    BCATS.forEach((c) => {
      h += `<a href="#/bornes/${c.id}" data-r="borne-${c.id}"><span class="bnum">${esc(c.num)}</span> ${esc(c.title)} <span class="count">${catItems(c).length}</span></a>`;
      if (c.variants.length > 1) h += `<div class="sub" data-sub="b-${c.id}">` + c.variants.map((v) => `<a href="#/bornes/${c.id}/${v.id}" data-r="bv-${c.id}-${v.id}">${esc(v.title)}</a>`).join("") + `</div>`;
    });
    h += `<div class="nav-label">Suivi</div>`;
    h += `<a href="#/tableau" data-r="home">${I.home} Tableau de bord</a>`;
    h += `<div class="nav-label">Feuilles Excel</div>`;
    D.sheets.forEach((s) => {
      h += `<a href="#/feuille/${s.id}" data-r="sheet-${s.id}">${I.sheet} ${esc(s.title)} <span class="count">${s.items.length}</span></a>`;
      h += `<div class="sub" data-sub="${s.id}">` + s.groups.map((g) => `<a href="#/feuille/${s.id}/${g.id}" data-r="grp-${g.id}">${esc(groupTitle(g.title))}</a>`).join("") + `</div>`;
    });
    h += `<div class="nav-label">Dossiers</div>`;
    h += `<a href="#/fournisseurs" data-r="folders">${I.users} Fournisseurs <span class="count">${D.folders.length}</span></a>`;
    h += `<a href="#/medias" data-r="medias">${I.media} Médiathèque <span class="count">${allFiles.length}</span></a>`;
    $("#nav").innerHTML = h;
  }
  const groupTitle = (t) => t.split(/ – https?:/)[0].replace(/\s+–\s+contacté.*$/i, "").replace(/\s+–\s+pas encore.*$/i, "");
  function setActive(key, sheet) {
    document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", !!(a.dataset.r === key || (sheet && a.dataset.r === "sheet-" + sheet && !key.startsWith("grp")))));
    document.querySelectorAll("#nav .sub").forEach((s) => (s.style.display = s.dataset.sub === sheet ? "" : "none"));
  }
  const crumbs = (arr) => ($("#crumbs").innerHTML = arr.map((c, i) => (i < arr.length - 1 && c[1] ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<b>${esc(c[0])}</b>`)).join('<span class="sep">/</span>'));

  /* ---------- components ---------- */
  function articleCard(it) {
    const m = it.media.own.concat(it.media.other);
    const n = (k) => m.filter((x) => x.kind === k).length;
    const meta = [["image", I.image], ["video", I.video], ["pdf", I.pdf]].filter(([k]) => n(k)).map(([k, ic]) => `<span>${ic}${n(k)}</span>`).join("");
    return `<a class="card acard ${it.ecarte ? "ecarte" : ""}" href="#/article/${it.id}">
      <div class="media">${it.cover ? `<img loading="lazy" src="${it.cover}" alt="">` : `<div class="ph">${I.box}</div>`}${badge(it)}<span class="rowno">L${it.row}</span></div>
      <div class="body">
        <div class="sup">${esc(it.supplier)}</div>
        <h3>${esc(shortProduct(it.product) || it.category)}</h3>
        <div class="cat">${esc(it.category)}</div>
        ${it.firstPrice.value ? `<div class="price"><b>${esc(it.firstPrice.label)} :</b> ${esc(it.firstPrice.value)}</div>` : ""}
        ${meta ? `<div class="meta">${meta}</div>` : ""}
      </div></a>`;
  }
  function mediaTile(f, list, idx) {
    let th;
    if (f.kind === "image") th = `<div class="th"><img loading="lazy" src="${f.url}" alt=""></div>`;
    else if (f.kind === "video") th = `<div class="th"><video preload="metadata" muted src="${f.url}#t=0.5"></video><div class="play"><span>${I.play}</span></div><span class="tag-kind">VIDÉO</span></div>`;
    else if (f.kind === "pdf") th = `<div class="th doc"><div class="big">${I.pdf}PDF</div></div>`;
    else if (f.kind === "texte") th = `<div class="th txt"><div class="big">${I.text}MESSAGE</div></div>`;
    else th = `<div class="th zip"><div class="big">${I.zip}${esc((f.name.split(".").pop() || "").toUpperCase())}</div></div>`;
    const attrs = f.kind === "pdf" || f.kind === "archive" || f.kind === "fichier" ? `href="${f.url}" target="_blank" rel="noopener"` : `href="javascript:void 0" data-media="${idx}"`;
    return `<a class="card mtile" ${attrs}>${th}<div class="cap"><span class="n">${esc(f.title)}</span><small>${f.sub ? esc(f.sub) + " · " : ""}${fmtSize(f.size)}${f.kind === "pdf" ? " · ouvrir le PDF" : ""}</small></div></a>`;
  }
  let currentList = [];
  function gallery(list) {
    const base = currentList.length;
    currentList = currentList.concat(list);
    return `<div class="gallery">${list.map((f, i) => mediaTile(f, list, base + i)).join("")}</div>`;
  }
  function section(title, n, extra = "") {
    return `<div class="section"><h2>${title}</h2>${n != null ? `<span class="n">${n}</span>` : ""}<div class="line"></div>${extra}</div>`;
  }
  function statusBar(list) {
    const c = {};
    list.forEach((it) => (c[st(it)] = (c[st(it)] || 0) + 1));
    const order = ["termine", "partiel", "attente", "ecarte"];
    return `<div class="bar">${order.filter((k) => c[k]).map((k) => `<span title="${STATUS_LABEL[k]} : ${c[k]}" style="width:${(c[k] / list.length) * 100}%;background:${STATUS_COLOR[k]}"></span>`).join("")}</div>
      <div class="legend">${order.filter((k) => c[k]).map((k) => `<span><i style="background:${STATUS_COLOR[k]}"></i>${STATUS_LABEL[k]} ${c[k]}</span>`).join("")}</div>`;
  }

  /* ---------- views ---------- */
  function vHome() {
    setActive("home");
    crumbs([["Tableau de bord"]]);
    const k = (kind) => allFiles.filter((f) => f.kind === kind).length;
    const stat = (ic, v, l, g) => `<div class="card stat"><div class="ic ${g ? "g" : ""}">${ic}</div><div><div class="v">${v}</div><div class="l">${l}</div></div></div>`;
    const actives = items.filter((it) => !it.ecarte && it.status !== "termine" && it.next).sort((a, b) => ({ partiel: 0, attente: 1 }[a.status] ?? 2) - ({ partiel: 0, attente: 1 }[b.status] ?? 2));
    const seen = new Set();
    const nextList = actives.filter((it) => { const key = it.supplier + "|" + it.next; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 9);
    const vids = allFiles.filter((f) => f.kind === "video");
    currentList = [];
    view.innerHTML = `
      <section class="hero">
        <img class="hero-icon" src="assets/img/icon-akeed.png" alt="">
        <h1>Suivi des fournisseurs — Bornes multifonction, POS &amp; imprimantes</h1>
        <p>Toutes les feuilles du tableau Excel, chaque article avec ses photos, vidéos, fiches PDF, messages envoyés et l'historique des échanges avec chaque fournisseur.</p>
        <div class="actions">
          ${D.sheets.map((s) => `<a class="btn" href="#/feuille/${s.id}">${I.sheet} ${esc(s.title)}</a>`).join("")}
          <a class="btn" href="#/fournisseurs">${I.users} Fournisseurs</a>
        </div>
      </section>
      <div class="stats">
        ${stat(I.box, items.length, "Articles suivis")}
        ${stat(I.users, new Set(items.map((i) => i.supplier)).size, "Fournisseurs (Excel)", 1)}
        ${stat(I.image, k("image"), "Photos")}
        ${stat(I.video, k("video"), "Vidéos", 1)}
        ${stat(I.pdf, k("pdf"), "Documents PDF")}
        ${stat(I.text, k("texte"), "Messages", 1)}
      </div>
      ${section("Feuilles du tableau", D.sheets.length)}
      <div class="sheet-cards">${D.sheets.map((s) => `
        <a class="card sheet-card" href="#/feuille/${s.id}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h3>${esc(s.title)}</h3><span class="chip">${s.items.length} articles</span></div>
          <div class="thumbs">${s.items.filter((i) => i.photo).slice(0, 6).map((i) => `<img loading="lazy" src="${i.photo}" alt="">`).join("")}</div>
          ${statusBar(s.items)}
          <div style="font-size:12.5px;color:var(--muted)">${s.groups.map((g) => esc(groupTitle(g.title))).join(" · ")}</div>
        </a>`).join("")}
      </div>
      <div class="grid-2">
        <div>
          ${section("Prochaines étapes", nextList.length)}
          <div class="card next-list">${nextList.map((it) => `
            <a class="next-item" href="#/article/${it.id}">
              ${it.cover ? `<img loading="lazy" src="${it.cover}" alt="">` : `<div class="ph">${I.box}</div>`}
              <div><div class="t">${esc(it.next)}</div><div class="d">${esc(it.supplier)} — ${esc(shortProduct(it.product))}</div></div>
              ${badge(it)}
            </a>`).join("")}
          </div>
        </div>
        <div>
          ${section("Dernières vidéos", vids.length, `<a href="#/medias/video" class="chip">Tout voir</a>`)}
          ${gallery(vids.slice(0, 4))}
        </div>
      </div>`;
  }

  /* ---------- catalogue bornes ---------- */
  function bvItems(v) { return (v.items || []).map((id) => byId[id]).filter(Boolean); }
  function catItems(c) { return [...new Set(c.variants.flatMap(bvItems))]; }
  function bVideos(it, v) {
    const all = it.media.own.concat(it.media.other).filter((f) => f.kind === "video");
    const pref = v && v.video && v.video[it.id];
    return pref ? all.slice().sort((a, b) => (b.name === pref) - (a.name === pref)) : all;
  }
  function bPrices(it, v) {
    const out = [];
    (v.prices || []).forEach((lab) => {
      const f = it.fields.find((x) => norm(x.label).includes(norm(lab)) && !out.includes(x));
      if (f) out.push(f);
    });
    return out;
  }
  const pending = (s) => /^(en attente|pas encore|pas donn|non indiqu|non disponible|à demander|a demander|à confirmer|devis demand|voir ligne)/i.test(String(s).trim());
  const priceLabel = (l) => l.replace(/^Prix d'1 pièce \(si on achète 1\)$/i, "1 pièce").replace(/^Prix d'1 pièce si on achète 10$/i, "10 pièces (par pièce)").replace(/^Prix (AVEC|SANS) combiné \(par pièce\)$/i, (m, a) => (a.toUpperCase() === "AVEC" ? "Avec combiné" : "Sans combiné"));
  function borneCard(it, v) {
    const vids = bVideos(it, v);
    const imgs = it.media.own.concat(it.media.other).filter((f) => f.kind === "image");
    let media;
    if (vids.length) {
      const i = currentList.length;
      currentList.push(Object.assign({}, vids[0], { title: vids[0].title || vids[0].name }));
      media = `<a class="bmedia" href="javascript:void 0" data-media="${i}"><video preload="metadata" muted src="${vids[0].url}#t=0.8"></video><div class="play"><span>${I.play}</span></div><span class="tag-kind">VIDÉO${vids.length > 1 ? " · " + vids.length : ""}</span></a>`;
    } else if (it.cover) {
      const i = currentList.length;
      currentList.push({ kind: "image", url: it.cover, title: shortProduct(it.product) });
      media = `<a class="bmedia img" href="javascript:void 0" data-media="${i}"><img loading="lazy" src="${it.cover}" alt=""><span class="tag-kind nov">Pas de vidéo</span></a>`;
    } else media = `<div class="bmedia img"><div class="ph">${I.box}</div><span class="tag-kind nov">Pas de vidéo</span></div>`;
    const prices = bPrices(it, v);
    const thumb = vids.length && it.cover ? `<img class="bthumb" src="${it.cover}" alt="" loading="lazy">` : "";
    return `<div class="card bcard ${it.ecarte ? "ecarte" : ""}">
      <div class="bmedia-wrap">${media}${badge(it)}${thumb}</div>
      <div class="body">
        <div class="sup">${esc(it.supplier)}</div>
        <h3>${esc(shortProduct(it.product) || it.category)}</h3>
        <div class="bprices">${prices.length ? prices.map((p) => `<div class="bp ${pending(p.value) ? "pend" : ""}"><span>${esc(priceLabel(p.label))}</span><b>${linkify(p.value)}</b></div>`).join("") : `<div class="bp pend"><span>Prix</span><b>Non renseigné</b></div>`}</div>
        <div class="bfoot">
          ${vids.length ? `<span class="chip">${I.video}${vids.length}</span>` : ""}${imgs.length ? `<span class="chip">${I.image}${imgs.length}</span>` : ""}
          <a class="btn sm" href="#/article/${it.id}">Détails ${I.arrow}</a>
        </div>
      </div></div>`;
  }
  function featChips(list, cls = "") { return list && list.length ? `<div class="bfeats ${cls}">${list.map((f) => `<span>${esc(f)}</span>`).join("")}</div>` : ""; }
  function variantBlock(c, v, showTitle) {
    const list = bvItems(v);
    const act = list.filter((it) => !it.ecarte), out = list.filter((it) => it.ecarte);
    return `${showTitle ? section(esc(v.title), act.length + " modèle" + (act.length > 1 ? "s" : "")) : ""}
      ${showTitle && (v.desc || v.features) ? `<div class="vdesc">${v.desc ? esc(v.desc) : ""}${v.features ? featChips(v.features.map((f) => "+ " + f), "plus") : ""}</div>` : ""}
      ${act.length ? `<div class="bcards">${act.map((it) => borneCard(it, v)).join("")}</div>` : `<div class="empty">Aucun modèle actif pour l'instant.</div>`}
      ${out.length ? `<details class="more"><summary>Modèles écartés (${out.length})</summary><div class="bcards">${out.map((it) => borneCard(it, v)).join("")}</div></details>` : ""}`;
  }
  function catHead(c, link) {
    const its = catItems(c);
    const nv = its.reduce((n, it) => n + bVideos(it).length, 0);
    return `<div class="bcat-head">
      <div class="bcat-num">${esc(c.num)}</div>
      <div style="min-width:0;flex:1">
        <h2>${link ? `<a href="#/bornes/${c.id}">${esc(c.title)}</a>` : esc(c.title)}</h2>
        <p>${esc(c.desc || "")}</p>
        ${featChips(c.features)}
      </div>
      <div class="bcat-stats"><span><b>${its.filter((i) => !i.ecarte).length}</b> modèles</span><span><b>${nv}</b> vidéos</span></div>
    </div>`;
  }
  function vBornes(cid, vid) {
    currentList = [];
    if (!cid) {
      setActive("bornes");
      crumbs([["Catalogue bornes"]]);
      view.innerHTML = `
        <section class="hero">
          <img class="hero-icon" src="assets/img/icon-akeed.png" alt="">
          <h1>Catalogue bornes Akeed</h1>
          <p>Les 3 familles de bornes : modèle, vidéo et prix de chaque fournisseur.</p>
          <div class="actions">${BCATS.map((c) => `<a class="btn" href="#/bornes/${c.id}"><span class="bnum">${esc(c.num)}</span> ${esc(c.title)}</a>`).join("")}</div>
        </section>
        <div class="btiles">${BCATS.map((c) => {
          const its = catItems(c).filter((i) => !i.ecarte);
          const pics = its.filter((i) => i.cover).slice(0, 4);
          return `<a class="card btile" href="#/bornes/${c.id}">
            <div class="bt-top"><span class="bcat-num">${esc(c.num)}</span><h3>${esc(c.title)}</h3></div>
            <div class="bt-pics">${pics.length ? pics.map((i) => `<img loading="lazy" src="${i.cover}" alt="">`).join("") : `<div class="ph">${I.box}</div>`}</div>
            ${c.variants.length > 1 ? `<div class="bt-vars">${c.variants.map((v) => `<span>${esc(v.title)} · ${bvItems(v).filter((i) => !i.ecarte).length}</span>`).join("")}</div>` : ""}
            <div class="bt-foot"><span>${its.length} modèle${its.length > 1 ? "s" : ""}</span><span class="go">Voir ${I.arrow}</span></div>
          </a>`;
        }).join("")}</div>
        ${BCATS.map((c) => `<div class="bcat">${catHead(c, true)}${c.variants.map((v) => variantBlock(c, v, true)).join("")}</div>`).join("")}`;
      return;
    }
    const c = BCATS.find((x) => x.id === cid);
    if (!c) return vNotFound();
    const v = vid && c.variants.find((x) => x.id === vid);
    setActive(v ? `bv-${c.id}-${v.id}` : "borne-" + c.id, "b-" + c.id);
    crumbs([["Catalogue bornes", "#/"], [c.title, v ? "#/bornes/" + c.id : null]].concat(v ? [[v.title]] : []));
    const tabs = c.variants.length > 1 ? `<div class="toolbar"><a class="filter ${!v ? "on" : ""}" href="#/bornes/${c.id}" style="text-decoration:none">Tous les modèles</a>${c.variants.map((x) => `<a class="filter ${v === x ? "on" : ""}" href="#/bornes/${c.id}/${x.id}" style="text-decoration:none">${esc(x.title)} <span class="n">${bvItems(x).filter((i) => !i.ecarte).length}</span></a>`).join("")}</div>` : "";
    view.innerHTML = `<div class="bcat">${catHead(c)}</div>${tabs}
      ${(v ? [v] : c.variants).map((x) => variantBlock(c, x, c.variants.length > 1)).join("")}`;
  }

  const state = { status: "all", mode: "cards", q: "" };
  try { state.mode = localStorage.getItem("akeed-mode") || "cards"; } catch (e) {}

  function vSheet(sid, gid) {
    const s = sheetsById[sid];
    if (!s) return vNotFound();
    setActive(gid ? "grp-" + gid : "sheet-" + sid, sid);
    crumbs([["Tableau de bord", "#/tableau"], [s.title, gid ? "#/feuille/" + sid : null]].concat(gid ? [[groupTitle(s.groupsById[gid]?.title || "")]] : []));
    const base = s.items.filter((it) => !gid || it.group === gid);
    const counts = { all: base.length };
    base.forEach((it) => (counts[st(it)] = (counts[st(it)] || 0) + 1));
    const filt = base.filter((it) => (state.status === "all" || st(it) === state.status) && (!state.q || norm([it.supplier, it.product, it.category, it.specs, it.contact].join(" ")).includes(norm(state.q))));
    const fbtn = (k, l) => (counts[k] || k === "all" ? `<button class="filter ${state.status === k ? "on" : ""}" data-st="${k}">${l} <span class="n">${counts[k] || 0}</span></button>` : "");
    const groups = s.groups.filter((g) => !gid || g.id === gid);
    let body = "";
    if (state.mode === "cards") {
      groups.forEach((g) => {
        const list = filt.filter((it) => it.group === g.id);
        if (!list.length) return;
        const link = (g.title.match(/https?:\/\/\S+/) || [])[0];
        body += section(esc(groupTitle(g.title)), list.length + " article" + (list.length > 1 ? "s" : ""), link ? `<a class="chip" href="${esc(link)}" target="_blank" rel="noopener">${I.link} Site</a>` : "");
        body += `<div class="cards">${list.map(articleCard).join("")}</div>`;
      });
    } else {
      body = `<div class="card tbl-wrap" style="margin-top:16px"><table class="tbl"><thead><tr><th></th><th>Statut</th><th>Fournisseur</th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Prochaine étape</th></tr></thead><tbody>`;
      groups.forEach((g) => {
        const list = filt.filter((it) => it.group === g.id);
        if (!list.length) return;
        body += `<tr class="grp"><td colspan="7">${esc(groupTitle(g.title))}</td></tr>`;
        body += list.map((it) => `<tr data-go="${it.id}"><td>${it.cover ? `<img loading="lazy" src="${it.cover}" alt="">` : ""}</td><td>${badge(it)}</td><td><div class="clip" style="${it.ecarte ? "text-decoration:line-through;color:var(--bad)" : ""}">${esc(it.supplier)}</div></td><td><div class="clip"><b>${esc(shortProduct(it.product))}</b></div></td><td><div class="clip">${esc(it.category)}</div></td><td><div class="clip">${esc(it.firstPrice.value || "")}</div></td><td><div class="clip">${esc(it.next)}</div></td></tr>`).join("");
      });
      body += `</tbody></table></div>`;
    }
    view.innerHTML = `
      <div class="page-head"><div><h1>${esc(gid ? groupTitle(s.groupsById[gid].title) : s.title)}</h1><p>Feuille « ${esc(s.title)} » — ${base.length} articles ${gid ? "" : "· " + s.groups.length + " sections"}</p></div></div>
      <div class="toolbar">
        ${fbtn("all", "Tous")}${fbtn("partiel", "Infos partielles")}${fbtn("attente", "En attente")}${fbtn("termine", "Terminé")}${fbtn("ecarte", "Écarté")}
        <div class="seg"><button data-mode="cards" class="${state.mode === "cards" ? "on" : ""}" title="Cartes">${I.grid}</button><button data-mode="table" class="${state.mode === "table" ? "on" : ""}" title="Tableau">${I.list}</button></div>
      </div>
      ${filt.length ? body : `<div class="empty">Aucun article pour ce filtre.</div>`}
      ${s.legend.length ? `<div class="card" style="padding:14px 18px;margin-top:26px;font-size:12.5px;color:var(--muted)"><b style="color:var(--ink)">Légende du tableau :</b><br>${s.legend.map(esc).join("<br>")}</div>` : ""}`;
    view.querySelectorAll("[data-st]").forEach((b) => (b.onclick = () => { state.status = b.dataset.st; vSheet(sid, gid); }));
    view.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => { state.mode = b.dataset.mode; try { localStorage.setItem("akeed-mode", state.mode); } catch (e) {} vSheet(sid, gid); }));
    view.querySelectorAll("[data-go]").forEach((tr) => (tr.onclick = () => (location.hash = "#/article/" + tr.dataset.go)));
  }

  function parseSpecs(s) {
    if (!s) return "";
    const parts = s.split(/\s*\|\|\s*/).flatMap((p) => p.split(/\s+;\s+/));
    const kv = parts.map((p) => { const m = p.match(/^([A-Za-zÀ-ÿ_ \/]{2,28}?)\s*:\s+(.+)$/s); return m ? [m[1].replace(/_/g, " ").trim(), m[2]] : [null, p]; });
    if (kv.filter((x) => x[0]).length >= 2) return `<div class="specs">${kv.map(([k, v]) => `<div class="row"><div class="k">${esc(k || "•")}</div><div>${linkify(v)}</div></div>`).join("")}</div>`;
    if (parts.length > 1) return `<div class="specs"><ul>${parts.map((p) => `<li>${linkify(p)}</li>`).join("")}</ul></div>`;
    return `<div class="specs"><ul><li>${linkify(s)}</li></ul></div>`;
  }
  function timeline(s) {
    if (!s) return "";
    const re = /(?=(?:^|\s)\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b(?:\s+\d{1,2}:\d{2}(?:\s*[–-]\s*\d{1,2}:\d{2})?)?[^:.]{0,40}:\s)/g;
    const chunks = s.split(re).map((x) => x.trim()).filter(Boolean);
    return `<div class="card timeline">${chunks.map((c) => {
      const m = c.match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b(?:\s+\d{1,2}:\d{2}(?:\s*[–-]\s*\d{1,2}:\d{2})?)?[^:.]{0,40}):\s([\s\S]*)$/);
      const when = m ? m[1] : "";
      const what = m ? m[2] : c;
      const cls = /⚠|écarté|pas de réponse|NE |PAS /.test(what) ? "warn" : /REÇU|reçu|OK/.test(what) ? "good" : "";
      return `<div class="tl ${cls}">${when ? `<div class="when">${esc(when)}</div>` : ""}<div class="what">${linkify(what)}</div></div>`;
    }).join("")}</div>`;
  }

  function vArticle(id) {
    const it = byId[id];
    if (!it) return vNotFound();
    const s = sheetsById[it.sheet];
    setActive("sheet-" + s.id, s.id);
    crumbs([["Tableau de bord", "#/tableau"], [s.title, "#/feuille/" + s.id], [shortProduct(it.product) || it.supplier]]);
    currentList = [];
    const f = it.folder && folders[it.folder];
    const prices = it.fields.filter((x) => /prix/i.test(x.label));
    const others = it.fields.filter((x) => !/prix/i.test(x.label));
    const siblings = s.items.filter((x) => x.supplier === it.supplier && x.id !== it.id);
    const idx = s.items.indexOf(it);
    const prev = s.items[idx - 1], next = s.items[idx + 1];
    const photoIdx = it.cover ? 0 : -1;
    if (it.cover) currentList.push({ kind: "image", url: it.cover, title: shortProduct(it.product) });
    view.innerHTML = `
      <div class="detail-top">
        <div class="card detail-photo" ${photoIdx === 0 ? 'data-media="0"' : ""}>${it.cover ? `<img src="${it.cover}" alt="">` : `<div class="ph">${I.box}</div>`}</div>
        <div class="card detail-info">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${badge(it)}<span class="chip">${esc(s.title)} · ligne ${it.row}</span><span class="chip">${esc(groupTitle(s.groupsById[it.group].title))}</span></div>
          <div class="sup ${it.ecarte ? "strike" : ""}">${esc(it.supplier)}</div>
          <h1>${esc(shortProduct(it.product) || it.category)}</h1>
          <div class="cat">${esc(it.category)}</div>
          ${it.contact ? `<div class="contact">${I.user}<div>${linkify(it.contact)}</div></div>` : ""}
          ${it.next ? `<div class="next-box">${I.flag}<div><b>Prochaine étape</b>${esc(it.next)}</div></div>` : ""}
          <div class="btns">
            ${it.link ? `<a class="btn primary" href="${esc(it.link)}" target="_blank" rel="noopener">${I.link} ${esc(it.linkText || "Voir le produit")}</a>` : ""}
            ${f ? `<a class="btn" href="#/fournisseur/${f.id}">${I.folder} Dossier fournisseur (${f.files.length})</a>` : ""}
            ${f && LOCAL ? `<a class="btn" href="data/Fournisseurs_Bornes_Multifonction/${encodeURIComponent(f.folder)}/" target="_blank">${I.folder} Ouvrir le dossier</a>` : ""}
          </div>
        </div>
      </div>
      ${prices.length ? section("Prix", prices.length) + `<div class="kv">${prices.map((x) => `<div class="card item price"><div class="k">${esc(x.label)}</div><div class="v">${linkify(x.value)}</div></div>`).join("")}</div>` : ""}
      ${others.length ? section("Garantie &amp; informations", others.length) + `<div class="kv">${others.map((x) => `<div class="card item"><div class="k">${esc(x.label)}</div><div class="v">${linkify(x.value)}</div></div>`).join("")}</div>` : ""}
      ${it.specs ? section("Caractéristiques techniques") + `<div class="card">${parseSpecs(it.specs)}</div>` : ""}
      ${it.docs ? section("Documents reçus") + `<div class="card" style="padding:14px 18px">${linkify(it.docs)}</div>` : ""}
      ${it.media.own.length ? section(it.media.all ? "Photos, vidéos &amp; documents du fournisseur" : "Photos, vidéos &amp; documents de l'article", it.media.own.length) + gallery(it.media.own) : ""}
      ${it.media.other.length ? `<details class="more"><summary>Autres fichiers du fournisseur (${it.media.other.length})</summary>${gallery(it.media.other)}</details>` : ""}
      ${it.remarks ? section("Historique des échanges") + timeline(it.remarks) : ""}
      ${siblings.length ? section("Autres articles du même fournisseur", siblings.length) + `<div class="cards">${siblings.map(articleCard).join("")}</div>` : ""}
      <div style="display:flex;justify-content:space-between;gap:10px;margin-top:28px;flex-wrap:wrap">
        ${prev ? `<a class="btn" href="#/article/${prev.id}">‹ ${esc(shortProduct(prev.product).slice(0, 40))}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#/article/${next.id}">${esc(shortProduct(next.product).slice(0, 40))} ›</a>` : ""}
      </div>`;
  }

  function vFolders() {
    setActive("folders");
    crumbs([["Tableau de bord", "#/tableau"], ["Fournisseurs"]]);
    view.innerHTML = `<div class="page-head"><div><h1>Dossiers fournisseurs</h1><p>${D.folders.length} dossiers — photos, vidéos, fiches PDF et messages reçus / envoyés.</p></div></div>
      <div class="sup-grid">${D.folders.map(folderCard).join("")}</div>`;
  }
  function folderCard(f) {
    const n = (k) => f.files.filter((x) => x.kind === k).length;
    const imgs = f.files.filter((x) => x.kind === "image").slice(0, 3);
    const st0 = f.items[0];
    return `<a class="card scard" href="#/fournisseur/${f.id}">
      <div class="top"><div class="av">${esc(initials(f.name))}</div><div style="min-width:0"><h3>${esc(f.name)}</h3><div class="c">${esc(f.contact)}</div></div></div>
      <div class="strip">${imgs.length ? imgs.map((x) => `<img loading="lazy" src="${x.url}" alt="">`).join("") : `<div class="ph" style="height:64px">${n("video") ? I.video : I.pdf}</div>`}</div>
      <div class="counts">
        ${n("image") ? `<span class="chip">${I.image}${n("image")}</span>` : ""}${n("video") ? `<span class="chip">${I.video}${n("video")}</span>` : ""}${n("pdf") ? `<span class="chip">${I.pdf}${n("pdf")}</span>` : ""}${n("texte") ? `<span class="chip">${I.text}${n("texte")}</span>` : ""}
        ${f.items.length ? `<span class="chip">${I.box}${f.items.length} article${f.items.length > 1 ? "s" : ""}</span>` : ""}
        ${st0 ? badge(st0) : ""}
      </div></a>`;
  }
  function vFolder(id) {
    const f = folders[id];
    if (!f) return vNotFound();
    setActive("folders");
    crumbs([["Tableau de bord", "#/tableau"], ["Fournisseurs", "#/fournisseurs"], [f.name]]);
    currentList = [];
    const kinds = [["video", "Vidéos"], ["image", "Photos"], ["pdf", "Documents PDF"], ["texte", "Messages"], ["archive", "Archives"], ["fichier", "Autres"]];
    const it0 = f.items[0];
    view.innerHTML = `
      <div class="page-head"><div><h1>${esc(f.name)}</h1><p>${esc(f.contact)}</p></div>
        ${LOCAL ? `<a class="btn" href="data/Fournisseurs_Bornes_Multifonction/${encodeURIComponent(f.folder)}/" target="_blank">${I.folder} Ouvrir le dossier</a>` : ""}</div>
      ${it0 && it0.contact ? `<div class="card" style="padding:14px 18px"><div class="contact">${I.user}<div>${linkify(it0.contact)}</div></div></div>` : ""}
      ${f.items.length ? section("Articles dans le tableau", f.items.length) + `<div class="cards">${f.items.map(articleCard).join("")}</div>` : ""}
      ${kinds.map(([k, l]) => { const list = f.files.filter((x) => x.kind === k); return list.length ? section(l, list.length) + gallery(list) : ""; }).join("")}`;
  }

  function vMedias(kind) {
    setActive("medias");
    crumbs([["Tableau de bord", "#/tableau"], ["Médiathèque"]]);
    currentList = [];
    const kinds = [["all", "Tout"], ["video", "Vidéos"], ["image", "Photos"], ["pdf", "PDF"], ["texte", "Messages"], ["archive", "Archives"]];
    kind = kind || "all";
    const list = allFiles.filter((f) => kind === "all" || f.kind === kind);
    let body = "";
    D.folders.forEach((fo) => {
      const l = list.filter((x) => x.folder === fo);
      if (l.length) body += section(`<a href="#/fournisseur/${fo.id}" style="color:inherit">${esc(fo.name)}</a>`, l.length) + gallery(l);
    });
    view.innerHTML = `<div class="page-head"><div><h1>Médiathèque</h1><p>Tous les fichiers reçus des fournisseurs, regroupés par dossier.</p></div></div>
      <div class="toolbar">${kinds.map(([k, l]) => { const c = k === "all" ? allFiles.length : allFiles.filter((f) => f.kind === k).length; return c ? `<a class="filter ${kind === k ? "on" : ""}" href="#/medias/${k}" style="text-decoration:none">${l} <span class="n">${c}</span></a>` : ""; }).join("")}</div>
      ${body || `<div class="empty">Aucun fichier.</div>`}`;
  }

  function vSearch(q) {
    setActive("");
    crumbs([["Tableau de bord", "#/tableau"], [`Recherche « ${q} »`]]);
    currentList = [];
    const nq = norm(q);
    const res = items.filter((it) => norm([it.supplier, it.product, it.category, it.specs, it.contact, it.remarks, it.next, it.fields.map((f) => f.value).join(" ")].join(" ")).includes(nq));
    const files = allFiles.filter((f) => norm(f.name + " " + f.folder.name).includes(nq));
    const fos = D.folders.filter((f) => norm(f.folder).includes(nq));
    view.innerHTML = `<div class="page-head"><div><h1>Résultats pour « ${esc(q)} »</h1><p>${res.length} articles · ${fos.length} fournisseurs · ${files.length} fichiers</p></div></div>
      ${res.length ? section("Articles", res.length) + `<div class="cards">${res.map(articleCard).join("")}</div>` : ""}
      ${fos.length ? section("Fournisseurs", fos.length) + `<div class="sup-grid">${fos.map(folderCard).join("")}</div>` : ""}
      ${files.length ? section("Fichiers", files.length) + gallery(files) : ""}
      ${!res.length && !files.length && !fos.length ? `<div class="empty">Aucun résultat.</div>` : ""}`;
  }
  function vNotFound() { view.innerHTML = `<div class="empty">Page introuvable. <a href="#/">Retour à l'accueil</a></div>`; }

  /* ---------- router ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const p = h.split("/");
    $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("open");
    if (p[0] === "feuille") { if (route.last !== p[1]) state.status = "all"; route.last = p[1]; vSheet(p[1], p[2]); }
    else if (p[0] === "article") vArticle(p[1]);
    else if (p[0] === "fournisseurs") vFolders();
    else if (p[0] === "fournisseur") vFolder(p[1]);
    else if (p[0] === "medias") vMedias(p[1]);
    else if (p[0] === "recherche") vSearch(p.slice(1).join("/"));
    else if (p[0] === "tableau") vHome();
    else if (p[0] === "bornes") vBornes(p[1], p[2]);
    else vBornes();
    if (p[0] !== "recherche") { $("#search").value = ""; }
    window.scrollTo(0, 0);
  }

  /* ---------- modal / lightbox ---------- */
  const modal = $("#modal"), box = $("#modalBox");
  let mi = -1;
  function openMedia(i) {
    const viewable = (f) => f && (f.kind === "image" || f.kind === "video" || f.kind === "texte");
    if (!viewable(currentList[i])) return;
    mi = i;
    const f = currentList[i];
    if (f.kind === "image") box.innerHTML = `<img src="${f.url}" alt=""><div class="cap">${esc(f.title || "")}</div>`;
    else if (f.kind === "video") box.innerHTML = `<video src="${f.url}" controls autoplay playsinline></video><div class="cap">${esc(f.title || "")} · <a href="${f.url}" download style="color:#9cc4ff">télécharger</a></div>`;
    else box.innerHTML = `<div class="txtbox"><h3 style="margin-bottom:12px">${esc(f.title)}</h3>${linkify(f.text || "")}</div>`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }
  function step(d) {
    for (let j = mi + d; j >= 0 && j < currentList.length; j += d) {
      if (["image", "video", "texte"].includes(currentList[j].kind)) return openMedia(j);
    }
  }
  function closeModal() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); box.innerHTML = ""; }
  $("#modalClose").onclick = closeModal;
  $("#modalPrev").onclick = () => step(-1);
  $("#modalNext").onclick = () => step(1);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  view.addEventListener("click", (e) => {
    const t = e.target.closest("[data-media]");
    if (t) { e.preventDefault(); openMedia(+t.dataset.media); }
  });

  /* ---------- search / menu ---------- */
  let tmr;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(tmr);
    const q = e.target.value.trim();
    tmr = setTimeout(() => {
      if (q.length >= 2) { history.replaceState(null, "", "#/recherche/" + encodeURIComponent(q)); vSearch(q); }
      else if (!q && location.hash.startsWith("#/recherche")) location.hash = "#/";
    }, 220);
  });
  $("#menuBtn").onclick = () => { $("#sidebar").classList.add("open"); $("#scrim").classList.add("open"); };
  $("#scrim").onclick = () => { $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("open"); };

  $("#excelLink").href = D.excel;
  $("#year").textContent = new Date().getFullYear();
  $("#gen").textContent = "Données mises à jour le " + D.generated;
  buildNav();
  window.addEventListener("hashchange", route);
  route();
};
