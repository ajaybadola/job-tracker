import React, { useState, useEffect, useCallback } from "react";
import { useAuth, AuthProvider } from "react-oidc-context";
import axios from "axios";

// ─── Cognito Config ────────────────────────────────────────────────────────────
const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-west-1.amazonaws.com/us-west-1_kUvDNO3K2",
  client_id: "5fipvmst2f886tips7ft4d6t5l",
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI || "http://localhost:5173",   // Production URL or localhost (no trailing slash)
  response_type: "code",
  scope: "openid email",                   // openid MUST be first. Remove 'phone'/'profile' unless enabled in your User Pool.
};

const API_BASE = import.meta.env.VITE_API_URL || "/api/jobs";   // Production API URL or Vite proxy
console.log('🔧 API_BASE resolved to:', API_BASE);
console.log('🔍 Current API Base:', import.meta.env.VITE_API_URL);

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Applied: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
    dot: "bg-blue-400",
    glyph: "●",
  },
  Interview: {
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
    dot: "bg-yellow-400",
    glyph: "◆",
  },
  Offer: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    dot: "bg-emerald-400",
    glyph: "▲",
  },
  Rejected: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    dot: "bg-red-400",
    glyph: "✕",
  },
  Ghosted: {
    color: "text-zinc-500",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    dot: "bg-zinc-500",
    glyph: "○",
  },
};

// ─── Styles (injected globally) ────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --black:   #0a0b0e;
      --dark:    #12141c;
      --card:    #0f1117;
      --border:  #1e2029;
      --green:   #22c55e;
      --green-dim: rgba(34,197,94,0.12);
      --green-glow: 0 0 24px rgba(34,197,94,0.35), 0 0 64px rgba(34,197,94,0.12);
      --text:    #e2e8f0;
      --muted:   #64748b;
    }

    html, body, #root {
      min-height: 100vh;
      background: var(--black);
      color: var(--text);
      font-family: 'Sora', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: var(--black); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--green); }

    /* Landing Animations */
    @keyframes flicker {
      0%,100% { opacity: 1; }
      92% { opacity: 1; }
      93% { opacity: 0.4; }
      94% { opacity: 1; }
      96% { opacity: 0.6; }
      97% { opacity: 1; }
    }
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    @keyframes blink {
      0%,100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes fadein {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideup {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes modal-in {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes card-in {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .animate-fadein    { animation: fadein 0.7s ease both; }
    .animate-slideup   { animation: slideup 0.6s ease both; }
    .animate-modal-in  { animation: modal-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
    .animate-card-in   { animation: card-in 0.5s ease both; }
    .animate-flicker   { animation: flicker 8s infinite; }
    .animate-spin-slow { animation: spin-slow 12s linear infinite; }

    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }
    .delay-400 { animation-delay: 400ms; }
    .delay-500 { animation-delay: 500ms; }
    .delay-600 { animation-delay: 600ms; }

    /* Terminal cursor */
    .cursor::after {
      content: '_';
      animation: blink 1s step-end infinite;
      color: var(--green);
    }

    /* Card hover glow */
    .job-card {
      transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
    }
    .job-card:hover {
      border-color: rgba(34,197,94,0.4) !important;
      box-shadow: 0 0 0 1px rgba(34,197,94,0.15), 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.08);
      transform: translateY(-2px);
    }

    /* Glassmorphism modal backdrop */
    .modal-overlay {
      background: rgba(10,11,14,0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    /* Input focus glow */
    .terminal-input {
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .terminal-input:focus {
      border-color: rgba(34,197,94,0.6) !important;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.08), 0 0 16px rgba(34,197,94,0.06);
      outline: none;
    }

    /* Neon green button */
    .btn-terminal {
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.3s, transform 0.2s;
    }
    .btn-terminal::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(34,197,94,0.15), transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .btn-terminal:hover::before { opacity: 1; }
    .btn-terminal:hover {
      box-shadow: var(--green-glow);
      transform: translateY(-1px);
    }
    .btn-terminal:active { transform: translateY(0); }

    /* Scanline overlay */
    .scanline-overlay::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      );
      z-index: 9999;
    }

    /* Noise texture */
    .noise::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      z-index: 9998;
    }

    /* Grid mesh background */
    .grid-bg {
      background-image:
        linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px);
      background-size: 48px 48px;
    }

    /* Stat widget */
    .stat-widget {
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .stat-widget:hover {
      border-color: rgba(34,197,94,0.25);
      box-shadow: 0 0 16px rgba(34,197,94,0.06);
    }

    /* Select dropdown */
    select option {
      background: #12141c;
      color: #e2e8f0;
    }
  `}</style>
);

// ─── Landing Page ──────────────────────────────────────────────────────────────
function LandingPage() {
  const auth = useAuth();
  const [booting, setBooting] = useState(true);
  const [line, setLine] = useState(0);

  const bootLines = [
    "INITIALIZING SECURE SHELL...",
    "LOADING ENCRYPTION MODULES...",
    "ESTABLISHING COGNITO HANDSHAKE...",
    "READY.",
  ];

  useEffect(() => {
    const timers = bootLines.map((_, i) =>
      setTimeout(() => setLine(i + 1), i * 420)
    );
    const done = setTimeout(() => setBooting(false), bootLines.length * 420 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  return (
    <div
      className="noise scanline-overlay grid-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--black)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial ambient glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Spinning outer ring */}
      <div
        className="animate-spin-slow"
        style={{
          position: "absolute",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          border: "1px solid rgba(34,197,94,0.08)",
          borderTopColor: "rgba(34,197,94,0.35)",
          borderRightColor: "rgba(34,197,94,0.15)",
        }}
      />
      <div
        className="animate-spin-slow"
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          border: "1px solid rgba(34,197,94,0.06)",
          borderBottomColor: "rgba(34,197,94,0.25)",
          animationDirection: "reverse",
          animationDuration: "8s",
        }}
      />

      {/* Boot terminal */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          color: "rgba(34,197,94,0.5)",
          marginBottom: "48px",
          minHeight: "80px",
          textAlign: "center",
          letterSpacing: "0.08em",
          lineHeight: "1.8",
        }}
      >
        {bootLines.slice(0, line).map((l, i) => (
          <div key={i} style={{ opacity: 0, animation: `fadein 0.3s ease ${i * 0.1}s both` }}>
            <span style={{ color: "rgba(34,197,94,0.35)" }}>{">"} </span>{l}
          </div>
        ))}
      </div>

      {/* Core content */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 10 }}>
        {/* Logo mark */}
        <div className="animate-fadein" style={{ marginBottom: "24px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "var(--green)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "6px 16px",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "4px",
            background: "rgba(34,197,94,0.05)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 8px var(--green)" }} />
            SYS/JOBTRACKER v2.4.1
          </div>
        </div>

        <h1
          className="animate-fadein delay-100 animate-flicker"
          style={{
            fontSize: "clamp(42px, 8vw, 82px)",
            fontFamily: "'Sora', sans-serif",
            fontWeight: "700",
            letterSpacing: "-0.03em",
            lineHeight: "1",
            marginBottom: "20px",
            background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Job<span style={{
            background: "linear-gradient(135deg, var(--green), #16a34a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Track</span>
        </h1>

        <p
          className="animate-fadein delay-200"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            color: "var(--muted)",
            letterSpacing: "0.05em",
            marginBottom: "48px",
          }}
        >
          <span className="cursor">CLOUD_ENGINEER_TERMINAL</span>
        </p>

        {/* CTA Button */}
        <div className="animate-fadein delay-300" style={{ position: "relative", display: "inline-block" }}>
          {/* Pulse rings */}
          <div style={{
            position: "absolute",
            inset: "-20px",
            borderRadius: "50px",
            border: "1px solid rgba(34,197,94,0.3)",
            animation: "pulse-ring 2s ease-out infinite",
          }} />
          <div style={{
            position: "absolute",
            inset: "-20px",
            borderRadius: "50px",
            border: "1px solid rgba(34,197,94,0.2)",
            animation: "pulse-ring 2s ease-out 0.5s infinite",
          }} />

          <button
            className="btn-terminal"
            onClick={() => auth.signinRedirect()}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
              fontWeight: "600",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--green)",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.4)",
              borderRadius: "8px",
              padding: "16px 40px",
              cursor: "pointer",
              boxShadow: "0 0 32px rgba(34,197,94,0.15)",
            }}
          >
            ▶ Access Terminal
          </button>
        </div>

        <p className="animate-fadein delay-400" style={{
          marginTop: "32px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "rgba(100,116,139,0.5)",
          letterSpacing: "0.1em",
        }}>
          SECURED_BY_AWS_COGNITO · TLS_1.3
        </p>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Applied"];
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "10px",
      fontWeight: "600",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "3px 10px",
      borderRadius: "4px",
      border: `1px solid`,
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    }}
      className={`${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <span style={{ fontSize: "8px" }}>{cfg.glyph}</span>
      {status}
    </span>
  );
}

// ─── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, index }) {
  const dateStr = job.dateApplied
    ? new Date(job.dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
    : "—";
  const jobId = job._id ? `#${job._id.slice(-6).toUpperCase()}` : `#------`;

  return (
    <div
      className="job-card animate-card-in"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "default",
        animationDelay: `${index * 60}ms`,
        opacity: 0,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "15px",
            fontWeight: "600",
            color: "#f1f5f9",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}>
            {job.position || "Untitled Role"}
          </div>
          <div style={{
            fontSize: "12px",
            color: "var(--muted)",
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {job.company || "Unknown Company"}
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)" }} />

      {/* Meta */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {job.location && (
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ color: "rgba(34,197,94,0.5)" }}>◎</span>
              {job.location}
            </span>
          )}
          {job.salary && (
            <span style={{ fontSize: "11px", color: "rgba(34,197,94,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
              {job.salary}
            </span>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.05em" }}>
            {jobId}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(100,116,139,0.5)", marginTop: "2px" }}>
            {dateStr}
          </div>
        </div>
      </div>

      {job.notes && (
        <div style={{
          fontSize: "11px",
          color: "rgba(100,116,139,0.7)",
          background: "rgba(30,32,41,0.5)",
          borderRadius: "6px",
          padding: "8px 10px",
          lineHeight: "1.5",
          borderLeft: "2px solid rgba(34,197,94,0.2)",
          fontStyle: "italic",
        }}>
          {job.notes}
        </div>
      )}
    </div>
  );
}

// ─── Add Job Modal ─────────────────────────────────────────────────────────────
function AddJobModal({ onClose, onAdd, token }) {
  const [form, setForm] = useState({
    company: "", position: "", status: "Applied",
    location: "", salary: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.company || !form.position) {
      setError("Company and position are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/add`, form, {
        headers: { Authorization: "Bearer " + auth.user?.id_token },
      });
      onAdd(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add job. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(10,11,14,0.8)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "var(--text)",
    fontFamily: "'Sora', sans-serif",
  };

  const labelStyle = {
    display: "block",
    fontSize: "10px",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "6px",
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        className="animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(18,20,28,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(34,197,94,0.15)",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,197,94,0.06), 0 0 40px rgba(34,197,94,0.04)",
        }}
      >
        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--green)", letterSpacing: "0.15em", marginBottom: "6px" }}>
              ▶ NEW_ENTRY
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              Log Application
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "16px",
              color: "var(--muted)",
              background: "rgba(30,32,41,0.8)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f1f5f9"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = ""; e.currentTarget.style.borderColor = ""; }}
          >
            ✕
          </button>
        </div>

        {/* Form grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Company *</label>
            <input className="terminal-input" style={inputStyle} value={form.company} onChange={set("company")} placeholder="Google, Stripe, Vercel..." />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Position *</label>
            <input className="terminal-input" style={inputStyle} value={form.position} onChange={set("position")} placeholder="Cloud Engineer, DevOps..." />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select className="terminal-input" style={{ ...inputStyle, cursor: "pointer" }} value={form.status} onChange={set("status")}>
              {Object.keys(STATUS_CONFIG).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input className="terminal-input" style={inputStyle} value={form.location} onChange={set("location")} placeholder="Remote, NYC..." />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Salary</label>
            <input className="terminal-input" style={inputStyle} value={form.salary} onChange={set("salary")} placeholder="$140k–$180k / yr" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              className="terminal-input"
              style={{ ...inputStyle, resize: "vertical", minHeight: "72px", lineHeight: "1.6" }}
              value={form.notes}
              onChange={set("notes")}
              placeholder="Recruiter contact, referral, interview notes..."
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: "16px",
            padding: "10px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f87171",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            ✕ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--muted)",
              fontSize: "13px",
              fontFamily: "'Sora', sans-serif",
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(100,116,139,0.5)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}
          >
            Cancel
          </button>
          <button
            className="btn-terminal"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 2,
              padding: "11px",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.35)",
              borderRadius: "8px",
              color: "var(--green)",
              fontSize: "13px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: "600",
              letterSpacing: "0.08em",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "LOGGING..." : "▶ COMMIT_ENTRY"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "#e2e8f0", sub }) {
  return (
    <div className="stat-widget" style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "16px 20px",
      flex: "1",
      minWidth: "100px",
      transition: "border-color 0.3s, box-shadow 0.3s",
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "22px", fontWeight: "600", color, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px", letterSpacing: "0.02em" }}>{label}</div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(100,116,139,0.4)", marginTop: "4px", letterSpacing: "0.05em" }}>{sub}</div>}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const auth = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const token = auth.user?.access_token;
  console.log("🔑 access_token:", token);
  console.log("🔑 id_token:", auth.user?.id_token);
  const userEmail = auth.user?.profile?.email || auth.user?.profile?.sub || "engineer";
  const userHandle = userEmail.split("@")[0].toUpperCase();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const viteApiUrl = import.meta.env.VITE_API_URL;
      console.log('🔍 VITE_API_URL from env:', viteApiUrl);
      console.log('🔧 API_BASE resolved to:', API_BASE);
      
      const url = `${API_BASE}/all`;
      console.log('🌐 Final fetch URL:', url);
      console.log('🌐 URL breakdown - API_BASE:', API_BASE, '+ /all =', url);
      
      const res = await axios.get(url, {
        headers: { Authorization: "Bearer " + auth.user?.id_token },
      });
      console.log('📊 Jobs fetched successfully:', res.data.length, 'items');
      setJobs(res.data);
    } catch (err) {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || err.message;
  console.error('❌ Fetch jobs error:', { status, msg, url: `${API_BASE}/all` });
  setError(`[${status ?? "NETWORK"}] ${msg}`);
}
  }, [auth.user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filteredJobs = jobs.filter((j) => {
    const matchStatus = filter === "All" || j.status === filter;
    const matchSearch =
      !search ||
      j.company?.toLowerCase().includes(search.toLowerCase()) ||
      j.position?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Stats
  const stats = {
    total: jobs.length,
    interviews: jobs.filter((j) => j.status === "Interview").length,
    offers: jobs.filter((j) => j.status === "Offer").length,
    rate: jobs.length > 0 ? Math.round((jobs.filter(j => j.status !== "Rejected" && j.status !== "Ghosted").length / jobs.length) * 100) : 0,
  };

  const filterBtnStyle = (active) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    border: active ? "1px solid rgba(34,197,94,0.4)" : "1px solid var(--border)",
    background: active ? "rgba(34,197,94,0.08)" : "transparent",
    color: active ? "var(--green)" : "var(--muted)",
    transition: "all 0.2s",
  });

  return (
    <div className="noise scanline-overlay" style={{ minHeight: "100vh", background: "var(--black)" }}>
      {/* Header */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,11,14,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--green)" }}>▶</span>
            </div>
            <span style={{ fontWeight: "700", fontSize: "15px", letterSpacing: "-0.02em", color: "#f1f5f9" }}>
              Job<span style={{ color: "var(--green)" }}>Track</span>
            </span>
          </div>
          <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.05em" }}>
            {userHandle}@TERMINAL
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 6px var(--green)" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(34,197,94,0.6)", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setShowModal(true)}
            className="btn-terminal"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.1em",
              color: "var(--green)",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "7px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            + NEW_ENTRY
          </button>
          <button
            onClick={() => auth.signoutRedirect()}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "#f87171",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "7px",
              padding: "8px 14px",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.background = ""; }}
          >
            ✕ TERMINATE SESSION
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 32px 80px" }}>

        {/* Page title */}
        <div className="animate-fadein" style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--green)", letterSpacing: "0.15em", marginBottom: "8px" }}>
            ◎ DASHBOARD // {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1 }}>
            Application Pipeline
          </h1>
        </div>

        {/* Stats row */}
        <div className="animate-fadein delay-100" style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          <StatCard label="Total Applications" value={stats.total} sub="SINCE_SESSION_START" />
          <StatCard label="Interviews" value={stats.interviews} color="#facc15" sub="ACTIVE_PIPELINE" />
          <StatCard label="Offers" value={stats.offers} color="var(--green)" sub="CONVERSION_COUNT" />
          <StatCard label="Active Rate" value={`${stats.rate}%`} color="#60a5fa" sub="NON_REJECTED_RATIO" />
        </div>

        {/* Toolbar */}
        <div className="animate-fadein delay-200" style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "320px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "12px", pointerEvents: "none" }}>
              ◎
            </span>
            <input
              className="terminal-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies, roles..."
              style={{
                width: "100%",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "8px 12px 8px 32px",
                fontSize: "12px",
                color: "var(--text)",
                fontFamily: "'Sora', sans-serif",
              }}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["All", ...Object.keys(STATUS_CONFIG)].map((s) => (
              <button key={s} style={filterBtnStyle(filter === s)} onClick={() => setFilter(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchJobs}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.1em",
              color: "var(--muted)",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
              marginLeft: "auto",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--green)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = ""; e.currentTarget.style.borderColor = ""; }}
          >
            ↻ REFRESH
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            padding: "14px 18px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#f87171",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span>✕ ERROR:</span> {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "2px solid var(--border)",
              borderTopColor: "var(--green)",
              margin: "0 auto 16px",
              animation: "spin-slow 0.8s linear infinite",
            }} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em" }}>
              FETCHING_RECORDS...
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredJobs.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.2 }}>◈</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--muted)", letterSpacing: "0.05em" }}>
              NO_RECORDS_FOUND
            </div>
            <p style={{ fontSize: "12px", color: "rgba(100,116,139,0.5)", marginTop: "8px" }}>
              {filter !== "All" ? `No jobs with status "${filter}"` : "Start tracking by adding your first application."}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-terminal"
              style={{
                marginTop: "24px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "var(--green)",
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: "8px",
                padding: "10px 24px",
                cursor: "pointer",
              }}
            >
              + LOG_FIRST_APPLICATION
            </button>
          </div>
        )}

        {/* Bento grid */}
        {!loading && filteredJobs.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}>
            {filteredJobs.map((job, i) => (
              <JobCard key={job._id || i} job={job} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onAdd={(newJob) => setJobs((prev) => [newJob, ...prev])}
          token={token}
        />
      )}
    </div>
  );
}

// ─── Auth Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--black)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: "2px solid var(--border)",
          borderTopColor: "var(--green)",
          animation: "spin-slow 0.7s linear infinite",
        }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.15em" }}>
          AUTHENTICATING...
        </div>
      </div>
    );
  }

  if (auth.error) {
    // Clear any problematic storage
    const handleAuthError = () => {
      // Clear local storage and session storage for this origin
      localStorage.clear();
      sessionStorage.clear();
      // Retry authentication
      auth.signinRedirect();
    };

    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--black)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
        <div style={{
          background: "var(--card)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "420px",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", color: "rgba(239,68,68,0.3)", marginBottom: "16px" }}>✕</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#f87171", letterSpacing: "0.1em", marginBottom: "8px" }}>AUTH_ERROR</div>
          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.6", marginBottom: "16px" }}>
            {auth.error.message || "Authentication failed. Please try again."}
          </p>
          <p style={{ fontSize: "11px", color: "rgba(100,116,139,0.6)", marginBottom: "20px" }}>
            This will clear your session and retry login.
          </p>
          <button
            onClick={handleAuthError}
            style={{
              marginTop: "20px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "var(--green)",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "8px",
              padding: "10px 24px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(34,197,94,0.15)";
              e.target.style.borderColor = "rgba(34,197,94,0.5)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(34,197,94,0.08)";
              e.target.style.borderColor = "rgba(34,197,94,0.3)";
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return auth.isAuthenticated ? <Dashboard /> : <LandingPage />;
}

// ─── Root Export ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <GlobalStyles />
      <AppShell />
    </>
  );
}
