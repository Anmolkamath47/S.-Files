import { useState, useEffect, useRef, useCallback } from "react";

const ACCENT = "#E8FF47";
const DARK = "#0D0D0D";
const SURFACE = "#161616";
const BORDER = "#2A2A2A";
const MUTED = "#6B6B6B";
const MAX_CHARS = 3_400_000;

// ── Storage adapter: window.storage (Claude) → localStorage fallback ─────────
const store = {
  async get(key, shared) {
    try {
      if (typeof window.storage?.get === "function") {
        return await window.storage.get(key, shared);
      }
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    } catch { return null; }
  },
  async set(key, value, shared) {
    try {
      if (typeof window.storage?.set === "function") {
        return await window.storage.set(key, value, shared);
      }
      localStorage.setItem(key, value);
      return { value };
    } catch { return null; }
  },
};

// ── Image compression ─────────────────────────────────────────────────────────
function compressOnce(dataUrl, maxW, q) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const s = Math.min(1, maxW / Math.max(img.width, 1));
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", q));
    };
    img.onerror = () => rej(new Error("Could not read image. Try a different file."));
    img.src = dataUrl;
  });
}

async function compress(dataUrl) {
  for (const [maxW, q] of [[1200, 0.80], [900, 0.75], [700, 0.70], [500, 0.65]]) {
    const out = await compressOnce(dataUrl, maxW, q);
    if (out.length <= MAX_CHARS) return out;
  }
  throw new Error("Photo is too large even after compression. Please use a smaller image.");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body,#root{background:${DARK};color:#F0F0F0;font-family:'DM Mono',ui-monospace,monospace;min-height:100vh}
  .zone{border:1.5px dashed ${BORDER};border-radius:12px;padding:2.5rem;text-align:center;cursor:pointer;
        background:${SURFACE};transition:border-color .2s,background .2s}
  .zone:hover,.zone.over{border-color:${ACCENT};background:#1A1A0F}
  .grid{columns:3 220px;column-gap:12px}
  .card{break-inside:avoid;margin-bottom:12px;border-radius:10px;overflow:hidden;
        border:1px solid ${BORDER};background:${SURFACE};cursor:pointer;
        transition:transform .2s,border-color .2s}
  .card:hover{transform:translateY(-3px);border-color:#444}
  .card img{width:100%;display:block}
  .card-label{padding:10px 12px;font-size:12px;border-top:1px solid ${BORDER};
              display:flex;justify-content:space-between;align-items:center;gap:8px}
  .card-name{font-weight:500;color:#F0F0F0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .card-date{font-size:11px;color:${MUTED};flex-shrink:0}
  .btn{border-radius:8px;padding:10px 20px;font-family:inherit;font-size:13px;
       cursor:pointer;transition:opacity .15s,transform .15s}
  .btn:active{transform:scale(.97)}
  .btn-y{background:${ACCENT};color:#000;border:none;font-weight:500}
  .btn-y:hover{opacity:.88}
  .btn-y:disabled{opacity:.4;cursor:not-allowed}
  .btn-g{background:transparent;color:#AAA;border:1px solid ${BORDER}}
  .btn-g:hover{border-color:#555;color:#F0F0F0}
  .inp{background:#1E1E1E;border:1px solid ${BORDER};border-radius:8px;
       padding:10px 14px;font-family:inherit;font-size:13px;color:#F0F0F0;
       width:100%;outline:none;transition:border-color .15s}
  .inp:focus{border-color:${ACCENT}}
  .inp::placeholder{color:${MUTED}}
  .tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:4px;
       background:#1E1E1E;color:${MUTED};border:1px solid ${BORDER};letter-spacing:.03em}
  .live{background:#0A1A0A;color:#4CAF50;border-color:#1A3A1A}
  .spin{border:2px solid ${BORDER};border-top-color:${ACCENT};
        border-radius:50%;animation:sp .7s linear infinite;display:inline-block;vertical-align:middle}
  @keyframes sp{to{transform:rotate(360deg)}}
  .empty{text-align:center;padding:5rem 2rem;color:${MUTED}}
  .viewer{background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;
          margin-bottom:1.5rem;overflow:hidden}
  .viewer img{width:100%;max-height:60vh;object-fit:contain;display:block;background:#111}
  .viewer-bar{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  @media(max-width:600px){.grid{columns:2 160px}}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function FilesApp() {
  const [photos, setPhotos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null);
  const [prevName, setPrevName]   = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [error, setError]         = useState("");
  const fileRef = useRef();
  const pollRef = useRef();

  // Load fonts safely via <link> (not @import inside JS-injected style)
  useEffect(() => {
    if (document.querySelector("#files-font")) return;
    const l = document.createElement("link");
    l.id = "files-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap";
    document.head.appendChild(l);
  }, []);

  const loadPhotos = useCallback(async () => {
    try {
      const idx = await store.get("files:index", true);
      if (!idx?.value) { setPhotos([]); return; }
      const list = JSON.parse(idx.value);
      const loaded = await Promise.all(
        list.map(async (item) => {
          const img = await store.get(`files:photo:${item.id}`, true);
          return img?.value ? { ...item, src: img.value } : null;
        })
      );
      setPhotos(loaded.filter(Boolean).reverse());
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
    pollRef.current = setInterval(loadPhotos, 8000);
    return () => clearInterval(pollRef.current);
  }, [loadPhotos]);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Max file size is 8 MB."); return; }
    setError("");
    const r = new FileReader();
    r.onload = (e) => { setPreview(e.target.result); setPrevName(file.name.replace(/\.[^.]+$/, "")); };
    r.onerror = () => setError("Could not read the file.");
    r.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    setError("");
    try {
      const compressed = await compress(preview);
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const saved = await store.set(`files:photo:${id}`, compressed, true);
      if (!saved) throw new Error("Could not save image. It may be too large.");

      let list = [];
      try {
        const idx = await store.get("files:index", true);
        if (idx?.value) list = JSON.parse(idx.value);
      } catch {}

      list.push({ id, name: prevName.trim() || "Untitled", ts: Date.now() });
      await store.set("files:index", JSON.stringify(list), true);

      setPreview(null);
      setPrevName("");
      await loadPhotos();
    } catch (e) {
      setError(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"2rem 1.5rem 4rem" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:"2.5rem", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(2rem,6vw,3.2rem)", letterSpacing:"-0.04em", color:"#F0F0F0", lineHeight:1 }}>
              Files<span style={{ color:ACCENT }}>.</span>
            </h1>
            <p style={{ fontSize:12, color:MUTED, marginTop:6, letterSpacing:"0.04em" }}>
              shared photo space — upload anything, seen by everyone
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span className="tag live">● live</span>
            <span className="tag">{photos.length} files</span>
          </div>
        </div>

        {/* In-flow photo viewer (no position:fixed) */}
        {selected && (
          <div className="viewer">
            <img src={selected.src} alt={selected.name} />
            <div className="viewer-bar">
              <div>
                <span style={{ fontWeight:500, color:"#F0F0F0", fontSize:14 }}>{selected.name}</span>
                <span style={{ fontSize:12, color:MUTED, marginLeft:12 }}>{timeAgo(selected.ts)}</span>
              </div>
              <button className="btn btn-g" style={{ padding:"6px 14px", fontSize:12 }} onClick={() => setSelected(null)}>
                ✕ Close
              </button>
            </div>
          </div>
        )}

        {/* Upload zone / preview panel */}
        {!preview ? (
          <div
            className={`zone${dragOver ? " over" : ""}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
              onChange={(e) => handleFile(e.target.files[0])} />
            <div style={{ fontSize:32, marginBottom:12, opacity:.5 }}>⬆</div>
            <p style={{ fontSize:14, color:"#CCC", marginBottom:4 }}>Drop an image or click to browse</p>
            <p style={{ fontSize:12, color:MUTED }}>JPG · PNG · GIF · WEBP · max 8 MB</p>
            {error && <p style={{ fontSize:12, color:"#E24B4A", marginTop:12 }}>{error}</p>}
          </div>
        ) : (
          <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1.25rem" }}>
            <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start", flexWrap:"wrap" }}>
              <img src={preview} alt="preview"
                style={{ width:110, height:110, objectFit:"cover", borderRadius:8, border:`1px solid ${BORDER}`, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:200 }}>
                <label style={{ fontSize:12, color:MUTED, display:"block", marginBottom:8, letterSpacing:"0.05em" }}>
                  FILE NAME
                </label>
                <input className="inp" value={prevName} onChange={(e) => setPrevName(e.target.value)}
                  placeholder="Name your photo..." maxLength={80}
                  onKeyDown={(e) => e.key === "Enter" && !uploading && handleUpload()} />
                {error && <p style={{ fontSize:12, color:"#E24B4A", marginTop:8 }}>{error}</p>}
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <button className="btn btn-y" onClick={handleUpload} disabled={uploading}>
                    {uploading
                      ? <><span className="spin" style={{ width:14, height:14, marginRight:8 }} />Uploading…</>
                      : "Upload →"}
                  </button>
                  <button className="btn btn-g" disabled={uploading}
                    onClick={() => { setPreview(null); setPrevName(""); setError(""); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop:`1px solid ${BORDER}`, margin:"2rem 0", position:"relative" }}>
          <span style={{ position:"absolute", top:-10, left:0, background:DARK, paddingRight:12,
                        fontSize:11, color:MUTED, letterSpacing:"0.08em" }}>GALLERY</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"4rem", color:MUTED }}>
            <div className="spin" style={{ width:24, height:24, margin:"0 auto 12px" }} />
            <p style={{ fontSize:13 }}>Loading photos…</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize:48, marginBottom:16, opacity:.3 }}>🖼</div>
            <p style={{ fontSize:14 }}>No photos yet.</p>
            <p style={{ fontSize:12, marginTop:6 }}>Be the first to upload one.</p>
          </div>
        ) : (
          <div className="grid">
            {photos.map((p) => (
              <div key={p.id} className="card" onClick={() => setSelected(p)}>
                <img src={p.src} alt={p.name} loading="lazy" />
                <div className="card-label">
                  <span className="card-name">{p.name}</span>
                  <span className="card-date">{timeAgo(p.ts)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
