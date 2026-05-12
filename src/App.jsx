import { useState, useEffect, useRef, useCallback } from "react";

const ACCENT = "#E8FF47";
const DARK = "#0D0D0D";
const SURFACE = "#161616";
const BORDER = "#2A2A2A";
const MUTED = "#6B6B6B";
const MAX_CHARS = 3_400_000;

// ── User ID Management ────────────────────────────────────────────────────────
function getUserId() {
  let id = localStorage.getItem("user:id");
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("user:id", id);
  }
  return id;
}

function getUsername() {
  let name = localStorage.getItem("user:name");
  if (!name) {
    const id = getUserId();
    name = `User ${id.slice(-4).toUpperCase()}`;
    localStorage.setItem("user:name", name);
  }
  return name;
}

function setUsername(name) {
  localStorage.setItem("user:name", name);
}

// ── API Configuration ────────────────────────────────────────────────────────
// Detect environment and set correct API URL
const getApiUrl = () => {
  // If running on Vercel deployed URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin; // Use same origin (Vercel deployment)
  }
  // Local development
  return "http://localhost:3000";
};

const API_URL = getApiUrl();

// ── Storage adapter: Use API server → localStorage fallback ──────────────────
const store = {
  async get(key, shared) {
    try {
      if (shared && key === "files:index") {
        // Load from API server
        const res = await fetch(`${API_URL}/api/photos`, { mode: "cors" });
        if (res.ok) {
          const photos = await res.json();
          return { value: JSON.stringify(photos) };
        }
      }
      // Fallback to localStorage
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    } catch {
      // Fallback to localStorage
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    }
  },
  
  async set(key, value, shared) {
    try {
      if (shared && key === "files:index") {
        // Save to API server via POST
        const photos = JSON.parse(value);
        for (const photo of photos) {
          // Only upload new photos (those without a server ack)
          if (!photo._uploaded) {
            await fetch(`${API_URL}/api/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(photo),
              mode: "cors"
            });
          }
        }
        return { value };
      }
      // For non-shared data, use localStorage
      localStorage.setItem(key, value);
      return { value };
    } catch (error) {
      // Fallback: save to localStorage
      localStorage.setItem(key, value);
      return { value };
    }
  }
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
              display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
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
  const [currentView, setCurrentView] = useState("all"); // "all" or userId
  const [users, setUsers]         = useState([]);
  const [username, setUsernameState] = useState(getUsername());
  const [editingName, setEditingName] = useState(false);
  const fileRef = useRef();
  const pollRef = useRef();
  const currentUserId = useRef(getUserId()).current;

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
      const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? '/api/photos'
        : `${API_URL}/api/photos`;
      
      const res = await fetch(apiUrl, { mode: "cors" });
      if (!res.ok) throw new Error("Failed to fetch photos");
      
      const allPhotos = (await res.json()).reverse();
      
      // Filter out any null/invalid photos
      const validPhotos = allPhotos.filter(p => p && p.src && p.id);
      setPhotos(validPhotos);
      
      // Extract unique users
      const userMap = {};
      validPhotos.forEach(photo => {
        const uid = photo.userId || "anonymous";
        if (!userMap[uid]) {
          userMap[uid] = {
            id: uid,
            name: photo.username || (uid === "anonymous" ? "Anonymous" : `User ${uid.slice(-4).toUpperCase()}`),
            count: 0,
            lastUpload: 0
          };
        }
        userMap[uid].count++;
        userMap[uid].lastUpload = Math.max(userMap[uid].lastUpload, photo.ts || 0);
      });
      
      setUsers(Object.values(userMap).sort((a, b) => b.lastUpload - a.lastUpload));
    } catch (error) {
      console.error("Failed to load photos:", error);
      // Try fallback from localStorage
      try {
        const idx = await store.get("files:index", true);
        if (idx?.value) {
          const list = JSON.parse(idx.value);
          setPhotos(list.reverse());
        }
      } catch {}
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

      // Determine API endpoint based on environment
      const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? '/api/photos'
        : `${API_URL}/api/photos`;

      // Upload directly to API server
      const uploadRes = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: prevName.trim() || "Untitled",
          ts: Date.now(),
          userId: currentUserId,
          username: username,
          imageData: compressed
        }),
        mode: "cors"
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload to server");
      }

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
              shared gallery by multiple users — upload anything, seen by everyone
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {editingName ? (
              <input
                className="inp"
                value={username}
                onChange={(e) => setUsernameState(e.target.value)}
                onBlur={() => { setUsername(username); setEditingName(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { setUsername(username); setEditingName(false); } }}
                autoFocus
                style={{ width:120, fontSize:11 }}
              />
            ) : (
              <button
                className="btn btn-g"
                onClick={() => setEditingName(true)}
                style={{ padding:"4px 10px", fontSize:11 }}
              >
                👤 {username}
              </button>
            )}
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
                <span style={{ fontSize:12, color:MUTED, marginLeft:12 }}>by <strong>{selected.username || (selected.userId || "anonymous").slice(-4).toUpperCase()}</strong> • {timeAgo(selected.ts)}</span>
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
                        fontSize:11, color:MUTED, letterSpacing:"0.08em" }}>USERS</span>
        </div>

        {/* Users list */}
        {loading ? null : (
          <div style={{ display:"flex", gap:8, marginBottom:"2rem", flexWrap:"wrap", overflowX:"auto", paddingBottom:8 }}>
            <button
              className={`btn ${currentView === "all" ? "btn-y" : "btn-g"}`}
              onClick={() => setCurrentView("all")}
              style={{ padding:"8px 16px", fontSize:12 }}
            >
              🌍 All ({photos.length})
            </button>
            {users.map(user => (
              <button
                key={user.id}
                className={`btn ${currentView === user.id ? "btn-y" : "btn-g"}`}
                onClick={() => setCurrentView(user.id)}
                style={{ padding:"8px 16px", fontSize:12 }}
              >
                {user.name} ({user.count})
              </button>
            ))}
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
        ) : (() => {
          const filteredPhotos = currentView === "all" ? photos : photos.filter(p => (p.userId || "anonymous") === currentView);
          return filteredPhotos.length === 0 ? (
            <div className="empty">
              <div style={{ fontSize:48, marginBottom:16, opacity:.3 }}>🖼</div>
              <p style={{ fontSize:14 }}>No photos found.</p>
              <p style={{ fontSize:12, marginTop:6 }}>{currentView === "all" ? "Be the first to upload one." : "This user hasn't uploaded any photos yet."}</p>
            </div>
          ) : (
            <div className="grid">
              {filteredPhotos.map((p) => (
                <div key={p.id} className="card" onClick={() => setSelected(p)}>
                  <img src={p.src} alt={p.name} loading="lazy" />
                  <div className="card-label">
                    <div style={{ flex:1 }}>
                      <span className="card-name">{p.name}</span>
                      <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>by {p.username || (p.userId || "anonymous").slice(-4).toUpperCase()}</div>
                    </div>
                    <span className="card-date">{timeAgo(p.ts)}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </>
  );
}
