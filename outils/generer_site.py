# -*- coding: utf-8 -*-
"""
Génère / met à jour le site Akeed – Fournisseurs.
  1) copie le dossier Bureau\\Fournisseurs_Bornes_Multifonction + le fichier Excel dans  ..\\data
  2) extrait les photos du tableau Excel dans ..\\assets\\excel
  3) écrit ..\\assets\\js\\data.enc.js : toutes les feuilles, articles, fichiers,
     CHIFFRÉS avec le mot de passe du site (AES-256-GCM, clé PBKDF2-SHA256)
Relancer après chaque mise à jour du tableau :  python outils\\generer_site.py
Changer le mot de passe :  python outils\\generer_site.py --nouveau-mot-de-passe
Le mot de passe est gardé seulement sur ce PC (outils\\.motdepasse), jamais envoyé sur GitHub.
Prod by Oussema Jl
"""
import base64, getpass, json, os, re, shutil, sys
from pathlib import Path
from urllib.parse import quote
import openpyxl

SITE = Path(__file__).resolve().parent.parent
DESKTOP = SITE.parent
SRC_XLSX = DESKTOP / "Fournisseurs_Bornes_Multifonction.xlsx"
SRC_DIR = DESKTOP / "Fournisseurs_Bornes_Multifonction"
DATA = SITE / "data"
DST_DIR = DATA / "Fournisseurs_Bornes_Multifonction"
DST_XLSX = DATA / "Fournisseurs_Bornes_Multifonction.xlsx"
EXCEL_IMG = SITE / "assets" / "excel"
PWD_FILE = SITE / "outils" / ".motdepasse"
PBKDF2_ITER = 310000

IMG = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}
VID = {".mp4", ".webm", ".mov", ".m4v"}

# mot-clé (dans le nom du fournisseur Excel) -> mot-clé du dossier
FOLDER_KEYS = [
    ("chuangli", "chuangli"), ("poling", "poling"), ("blu-ray", "blu-ray"),
    ("hongzhou", "hongzhou"), ("lcdkiosk", "lcdkiosk"), ("lean kiosk", "lean kiosk"),
    ("seelinkin", "seelinkin"), ("diversity", "diversity"), ("huachen", "hcctg"),
    ("hcctg", "hcctg"), ("urovo", "urovo"), ("telpo", "telpo"), ("ciontek", "ciontek"),
    ("nexgo", "nexgo"), ("xinguodu", "nexgo"), ("sunmi", "sunmi"), ("centerm", "centerm"),
    ("topwise", "topwise"), ("rongta", "rongta"), ("xprinter", "xprinter"),
    ("hprt", "hprt"), ("hanin", "hprt"),
]

STATUS = {
    "FFC6EFCE": "termine",
    "FFFFDDAA": "partiel", "FFFFEB9C": "partiel",
    "FFFFC7CE": "attente",
}


def url(rel: Path) -> str:
    return "/".join(quote(p, safe="") for p in rel.as_posix().split("/"))


def copy_data():
    DATA.mkdir(parents=True, exist_ok=True)
    if SRC_DIR.exists():
        # copie miroir : les fichiers supprimés du dossier source sont aussi retirés de la copie
        if DST_DIR.exists():
            shutil.rmtree(DST_DIR)
        shutil.copytree(SRC_DIR, DST_DIR, ignore=shutil.ignore_patterns('~$*', 'desktop.ini', 'Thumbs.db'))
    if SRC_XLSX.exists():
        shutil.copy2(SRC_XLSX, DST_XLSX)


def kind(p: Path) -> str:
    e = p.suffix.lower()
    if e in IMG: return "image"
    if e in VID: return "video"
    if e == ".pdf": return "pdf"
    if e == ".txt": return "texte"
    if e == ".zip": return "archive"
    return "fichier"


def scan_folders():
    out = []
    for d in sorted(p for p in DST_DIR.iterdir() if p.is_dir()):
        files = []
        for f in sorted(d.rglob("*")):
            if not f.is_file():
                continue
            rel = f.relative_to(SITE)
            item = {
                "name": f.name,
                "title": re.sub(r"\.[^.]+$", "", f.name),
                "sub": str(f.parent.relative_to(d)).replace("\\", "/") if f.parent != d else "",
                "kind": kind(f),
                "url": url(rel),
                "size": f.stat().st_size,
            }
            if item["kind"] == "texte":
                try:
                    item["text"] = f.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    item["text"] = ""
            files.append(item)
        m = re.match(r"^(.*?)\s*\((.*)\)\s*$", d.name)
        out.append({
            "id": re.sub(r"[^a-z0-9]+", "-", d.name.lower()).strip("-"),
            "folder": d.name,
            "name": m.group(1) if m else d.name,
            "contact": m.group(2) if m else "",
            "files": files,
        })
    return out


def folder_for(name: str, folders):
    n = (name or "").lower()
    for k, fk in FOLDER_KEYS:
        if k in n:
            for f in folders:
                if fk in f["folder"].lower():
                    return f["id"]
    return None


def model_tokens(product: str):
    toks = re.findall(r"[A-Za-z]*\d+[A-Za-z0-9\-]*|[A-Z]{2,}\d*", product or "")
    bad = {"80mm", "58mm", "1000", "500", "400", "50", "10", "11", "13", "14", "15", "16", "3", "6", "4G", "100000046548851"}
    res = []
    for t in toks:
        t = t.strip("-")
        if len(t) < 2 or t.lower() in {b.lower() for b in bad} or t.isdigit() or re.fullmatch(r"\d+(mm|inch)?", t, re.I):
            continue
        if re.search(r"\d", t):
            res.append(t.lower())
    return res


def extract_sheets(folders):
    wb = openpyxl.load_workbook(DST_XLSX if DST_XLSX.exists() else SRC_XLSX)
    EXCEL_IMG.mkdir(parents=True, exist_ok=True)
    sheets = []
    for si, ws in enumerate(wb.worksheets):
        sid = "f%d" % (si + 1)
        # photos par ligne (1re image de la ligne)
        photos = {}
        for img in ws._images:
            r = img.anchor._from.row + 1
            if r in photos:
                continue
            ext = "jpg" if (img.format or "").lower() in ("jpeg", "jpg") else "png"
            fn = f"{sid}_r{r}.{ext}"
            (EXCEL_IMG / fn).write_bytes(img._data())
            photos[r] = "assets/excel/" + fn
        headers = {c.column: str(c.value).strip() for c in ws[1] if c.value}
        col = {}
        for c, h in headers.items():
            hl = h.lower()
            if hl.startswith("fournisseur"): col["supplier"] = c
            elif hl.startswith("contact"): col["contact"] = c
            elif hl.startswith("type") or hl.startswith("catégorie"): col["category"] = c
            elif hl.startswith("produit"): col["product"] = c
            elif hl.startswith("caract"): col["specs"] = c
            elif hl.startswith("remarque"): col["remarks"] = c
            elif hl.startswith("prochaine"): col["next"] = c
            elif hl.startswith("lien"): col["link"] = c
            elif hl.startswith("documents"): col["docs"] = c
        role_cols = set(col.values())
        groups, items, legend = [], [], []
        current = None
        in_legend = False
        for r in range(2, ws.max_row + 1):
            b = ws.cell(r, col.get("supplier", 2))
            vals = {c: ws.cell(r, c).value for c in headers}
            filled = [c for c, v in vals.items() if v not in (None, "")]
            if not filled:
                continue
            bval = str(b.value or "").strip()
            if bval.upper().startswith("LÉGENDE") or bval.upper().startswith("LEGENDE"):
                in_legend = True
                continue
            if in_legend:
                legend.append(bval)
                continue
            if filled == [col.get("supplier", 2)]:
                current = {"id": f"{sid}-g{len(groups)+1}", "title": bval}
                groups.append(current)
                continue
            if current is None:
                current = {"id": f"{sid}-g1", "title": "Fournisseurs contactés sur Alibaba"}
                groups.append(current)
            fill = (b.fill.fgColor.rgb or "") if b.fill and b.fill.fgColor else ""
            fill = fill if isinstance(fill, str) else ""
            status = STATUS.get(fill.upper(), "autre")
            nxt = str(vals.get(col.get("next"), "") or "")
            ecarte = bool(b.font and b.font.strike) or "écarté" in nxt.lower()
            link_cell = ws.cell(r, col["link"]) if "link" in col else None
            fields = []
            for c, h in sorted(headers.items()):
                if c in role_cols or h.lower() == "photo":
                    continue
                v = vals.get(c)
                if v not in (None, ""):
                    fields.append({"label": h, "value": str(v)})
            supplier = str(vals.get(col.get("supplier"), "") or "")
            product = str(vals.get(col.get("product"), "") or "")
            items.append({
                "id": f"{sid}-r{r}",
                "row": r,
                "group": current["id"],
                "supplier": supplier,
                "contact": str(vals.get(col.get("contact"), "") or ""),
                "category": str(vals.get(col.get("category"), "") or ""),
                "product": product,
                "specs": str(vals.get(col.get("specs"), "") or ""),
                "remarks": str(vals.get(col.get("remarks"), "") or ""),
                "next": nxt,
                "linkText": str(link_cell.value or "") if link_cell else "",
                "link": (link_cell.hyperlink.target if link_cell is not None and link_cell.hyperlink and str(link_cell.hyperlink.target).startswith("http") else ""),
                "docs": str(vals.get(col.get("docs"), "") or ""),
                "photo": photos.get(r, ""),
                "status": status,
                "ecarte": ecarte,
                "folder": folder_for(supplier, folders),
                "tokens": model_tokens(product),
                "fields": fields,
            })
        sheets.append({"id": sid, "title": ws.title, "groups": groups, "items": items, "legend": legend})
    return sheets


def get_password(new=False):
    """Mot de passe du site : variable AKEED_SITE_PASSWORD, sinon outils\\.motdepasse, sinon on le demande."""
    env = os.environ.get("AKEED_SITE_PASSWORD")
    if env:
        return env
    if not new and PWD_FILE.exists():
        pwd = PWD_FILE.read_text(encoding="utf-8").strip()
        if pwd:
            return pwd
    print("\n=== Mot de passe du site ===")
    print("(rien ne s'affiche pendant la saisie, c'est normal)")
    while True:
        p1 = getpass.getpass("Nouveau mot de passe : ")
        if len(p1) < 8:
            print("  -> au moins 8 caractères, recommence.")
            continue
        if getpass.getpass("Confirmer le mot de passe : ") != p1:
            print("  -> les deux mots de passe sont différents, recommence.")
            continue
        break
    PWD_FILE.write_text(p1, encoding="utf-8")
    print("Mot de passe enregistré sur ce PC (outils\\.motdepasse, jamais envoyé sur GitHub).\n")
    return p1


def encrypt(plain: bytes, password: str) -> dict:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=PBKDF2_ITER).derive(password.encode("utf-8"))
    ct = AESGCM(key).encrypt(iv, plain, None)
    b64 = lambda b: base64.b64encode(b).decode("ascii")
    return {"v": 1, "iter": PBKDF2_ITER, "salt": b64(salt), "iv": b64(iv), "data": b64(ct)}


def main():
    copy_data()
    folders = scan_folders()
    sheets = extract_sheets(folders)
    data = {
        "generated": __import__("datetime").datetime.now().strftime("%d/%m/%Y %H:%M"),
        "excel": "data/" + quote(DST_XLSX.name),
        "sheets": sheets,
        "folders": folders,
    }
    js_dir = SITE / "assets" / "js"
    js_dir.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    enc = encrypt(payload, get_password("--nouveau-mot-de-passe" in sys.argv))
    (js_dir / "data.enc.js").write_text("window.SITE_ENC = " + json.dumps(enc) + ";\n", encoding="utf-8")
    old_plain = js_dir / "data.js"
    if old_plain.exists():
        old_plain.unlink()  # ancienne version NON chiffrée
    n = sum(len(s["items"]) for s in sheets)
    nf = sum(len(f["files"]) for f in folders)
    print(f"OK : {len(sheets)} feuilles, {n} articles, {len(folders)} fournisseurs, {nf} fichiers")


if __name__ == "__main__":
    main()
