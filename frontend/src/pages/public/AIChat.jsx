import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Plus, Trash2, Send, Copy, Check,
  BookOpen, ChevronLeft, MessageSquare, Menu,
  Package, GraduationCap, BookMarked,
  ShoppingBag, BarChart2, Heart, User,
} from "lucide-react";
import { chatAPI } from "../../lib/api";
import { C } from "../../lib/theme";

const PROMPTS = [
  "How do I donate books?",
  "How can my school order books?",
  "What is the kabadiwala pickup process?",
  "How does sponsorship work?",
  "Which books go to the donate lane?",
  "How are books priced?",
];

/** Renders assistant text with basic markdown — bold, lists, line breaks. */
function MdContent({ text }) {
  const lines = String(text ?? "").split("\n");
  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list block
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={i} style={{ margin: "6px 0 6px 18px", padding: 0, lineHeight: 1.75 }}>
          {items.map((it, j) => <li key={j} style={{ marginBottom: 3 }}><InlineText text={it} /></li>)}
        </ol>
      );
      continue;
    }

    // Bullet list block
    if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ""));
        i++;
      }
      nodes.push(
        <ul key={i} style={{ margin: "6px 0 6px 18px", padding: 0, lineHeight: 1.75 }}>
          {items.map((it, j) => <li key={j} style={{ marginBottom: 3 }}><InlineText text={it} /></li>)}
        </ul>
      );
      continue;
    }

    // Heading lines (## or ###)
    if (/^#{1,3}\s/.test(line)) {
      const txt = line.replace(/^#{1,3}\s/, "");
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: 15, color: "#0E1726", margin: "10px 0 4px" }}><InlineText text={txt} /></div>);
      i++;
      continue;
    }

    // Empty line = spacer
    if (line.trim() === "") {
      nodes.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Regular paragraph line
    nodes.push(<div key={i} style={{ marginBottom: 2 }}><InlineText text={line} /></div>);
    i++;
  }

  return <div>{nodes}</div>;
}

/** Renders inline **bold** and *italic* within a line. */
function InlineText({ text }) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={last}>{text.slice(last, m.index)}</span>);
    if (m[0].startsWith("**")) parts.push(<strong key={m.index} style={{ fontWeight: 700 }}>{m[2]}</strong>);
    else parts.push(<em key={m.index}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

export default function AIChat() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const vantaRef = useRef(null);

  // ── Vanta NET background ────────────────────────────────────────────────────
  useEffect(() => {
    let vantaEffect = null;
    const initVanta = () => {
      const el = document.getElementById("vanta-bg-kb");
      if (window.VANTA?.NET && el) {
        vantaEffect = window.VANTA.NET({
          el,
          mouseControls: true, touchControls: true, gyroControls: false,
          minHeight: 200, minWidth: 200, scale: 1,
          color: 0x3a80e0,
          backgroundColor: 0xf0f4ff,
          points: 12, maxDistance: 24, spacing: 20, showDots: true,
        });
      }
    };
    const loadNet = () => {
      if (window.VANTA?.NET) { initVanta(); return; }
      const s = document.createElement("script");
      s.src = "/libs/vanta.net.min.js"; s.onload = initVanta;
      document.head.appendChild(s);
    };
    const timer = setTimeout(() => {
      if (!window.THREE) {
        const s1 = document.createElement("script");
        s1.src = "/libs/three.min.js"; s1.onload = loadNet;
        document.head.appendChild(s1);
      } else { loadNet(); }
    }, 50);
    return () => { clearTimeout(timer); if (vantaEffect) vantaEffect.destroy(); };
  }, []);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function loadSessions() {
    try {
      const data = (await chatAPI.getSessions()).data;
      setSessions(Array.isArray(data) ? data : []);
    } catch { setSessions([]); }
  }

  async function newSession() {
    try {
      const s = (await chatAPI.createSession()).data;
      setSessions(prev => [s, ...prev]);
      setActiveId(s.id); setMessages([]);
    } catch {}
  }

  async function startDonationChat() {
    try {
      const s = (await chatAPI.createSession()).data;
      setSessions(prev => [s, ...prev]);
      setActiveId(s.id);
      setMessages([]);
      // Kick off the donation collection flow
      const kickoff = "I'd like to donate some books.";
      setMessages([{ id: "u-init", role: "user", content: kickoff }]);
      setLoading(true);
      try {
        const res = (await chatAPI.sendMessage(s.id, kickoff)).data;
        setMessages([
          { id: "u-init", role: "user", content: kickoff },
          { id: res.message_id, role: "assistant", content: res.response },
        ]);
        loadSessions();
      } catch {
        setMessages(prev => [...prev, { id: "err-init", role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      } finally { setLoading(false); }
    } catch {}
  }

  async function openSession(id) {
    setActiveId(id);
    try {
      const data = (await chatAPI.getMessages(id)).data;
      setMessages(Array.isArray(data) ? data : []);
    } catch { setMessages([]); }
  }

  async function deleteSession(id, e) {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeId === id) { setActiveId(null); setMessages([]); }
    } catch {}
  }

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    let sid = activeId;
    if (!sid) {
      try {
        const s = (await chatAPI.createSession()).data;
        sid = s.id;
        setSessions(prev => [s, ...prev]);
        setActiveId(sid);
      } catch { return; }
    }

    setMessages(prev => [...prev, { id: "u-" + Date.now(), role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = (await chatAPI.sendMessage(sid, msg)).data;
      setMessages(prev => [...prev, { id: res.message_id, role: "assistant", content: res.response }]);
      loadSessions();
    } catch {
      setMessages(prev => [...prev, { id: "err-" + Date.now(), role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function autoResize(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
    setInput(el.value);
  }

  async function copyText(id, text) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const activeSession = sessions.find(s => s.id === activeId);
  const hasMessages = messages.length > 0;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Vanta background */}
      <div id="vanta-bg-kb" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
      {/* Frosted overlay so content is readable */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(240,244,255,0.55)", pointerEvents: "none" }} />

      {/* Sidebar */}
      <aside style={{
        position: "relative", zIndex: 10,
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRight: `1px solid rgba(31,99,214,0.12)`,
        display: "flex", flexDirection: "column",
        transition: "width 0.22s, min-width 0.22s",
        overflow: "hidden",
        boxShadow: "2px 0 20px rgba(31,99,214,0.06)",
      }}>
        {/* Brand header */}
        <div style={{
          padding: "20px 16px 16px",
          background: `linear-gradient(160deg, rgba(31,99,214,0.10) 0%, rgba(232,135,58,0.06) 100%)`,
          borderBottom: "1px solid rgba(31,99,214,0.10)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(31,99,214,0.28)",
              flexShrink: 0,
            }}>
              <BookOpen size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text, letterSpacing: "-0.3px", lineHeight: 1 }}>
                Knowledge Bridge
              </div>
              <div style={{ fontSize: 10, color: C.blue, fontWeight: 600, marginTop: 2, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                AI Assistant
              </div>
            </div>
          </div>

          {/* Theme tagline */}
          <div style={{
            background: "rgba(255,255,255,0.60)",
            borderRadius: 10,
            padding: "10px 12px",
            borderLeft: `3px solid ${C.accent}`,
          }}>
            <p style={{ fontSize: 11, color: C.text, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              "Every book that moves from a shelf to a school opens a door for a child."
            </p>
            <p style={{ fontSize: 10, color: C.muted, margin: "4px 0 0", fontWeight: 600 }}>
              — Knowledge Bridge Mission
            </p>
          </div>
        </div>

        {/* How it works pills */}
        <div style={{ padding: "12px 12px 6px" }}>
          {[
            { Icon: Package, label: "Donate a book", sub: "from home or kabadiwala", color: C.accent },
            { Icon: GraduationCap, label: "School receives it", sub: "verified govt schools", color: C.blue },
            { Icon: BookMarked, label: "Child reads it", sub: "free of cost", color: C.green },
          ].map(step => (
            <div key={step.label} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "6px 8px", borderRadius: 8, marginBottom: 4,
              background: "rgba(31,99,214,0.04)",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: `${step.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <step.Icon size={13} color={step.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{step.label}</div>
                <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.2 }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ margin: "4px 12px 2px", borderTop: "1px dashed rgba(31,99,214,0.12)" }} />

        {/* Ask a question button */}
        <div style={{ padding: "8px 10px 4px" }}>
          <button onClick={startDonationChat} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            background: C.blue, border: "none", borderRadius: 10,
            padding: "9px 12px", cursor: "pointer",
            color: "#fff", fontSize: 12, fontWeight: 700,
            boxShadow: "0 3px 10px rgba(31,99,214,0.28)",
          }}>
            <Plus size={13} /> Ask about book donations
          </button>
        </div>

        {/* Session list label */}
        {sessions.length > 0 && (
          <div style={{ padding: "6px 16px 2px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Recent chats
            </span>
          </div>
        )}

        {/* Session list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2px 8px 8px" }}>
          {sessions.length === 0 && (
            <p style={{ color: C.muted, fontSize: 11, textAlign: "center", padding: "16px 8px", lineHeight: 1.6 }}>
              No chats yet.<br />Ask your first question above.
            </p>
          )}
          {sessions.map(s => (
            <div key={s.id} onClick={() => openSession(s.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 2,
              background: activeId === s.id ? `rgba(31,99,214,0.12)` : "transparent",
              color: activeId === s.id ? C.blue : C.text,
              fontWeight: activeId === s.id ? 600 : 400,
              fontSize: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                <MessageSquare size={11} style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
              </div>
              <button onClick={e => deleteSession(s.id, e)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.muted, flexShrink: 0 }}>
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom nav links */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(31,99,214,0.10)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, paddingLeft: 8 }}>
            Explore
          </div>
          {[
            { to: "/browse", Icon: ShoppingBag, label: "Browse Books" },
            { to: "/impact", Icon: BarChart2, label: "Our Impact" },
            { to: "/sponsor", Icon: Heart, label: "Sponsor a School" },
            { to: "/auth", Icon: User, label: "Sign In" },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 8px", borderRadius: 7, fontSize: 12,
              color: C.muted, textDecoration: "none", marginBottom: 1,
              transition: "background 0.12s, color 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = C.blue; e.currentTarget.style.background = "rgba(31,99,214,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "transparent"; }}>
              <l.Icon size={13} />
              {l.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 10, overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          height: 50, display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
          background: "rgba(255,255,255,0.60)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(31,99,214,0.10)",
          boxShadow: "0 1px 12px rgba(31,99,214,0.06)",
        }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.muted, display: "flex", alignItems: "center" }}>
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <Sparkles size={15} color={C.blue} />
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
            {activeSession ? activeSession.title : "Knowledge Bridge AI"}
          </span>
        </div>

        {/* Messages scroll */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: hasMessages ? "24px 28px 12px" : "0" }}>

          {/* Empty state */}
          {!hasMessages && (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "20px 24px", textAlign: "center",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
                boxShadow: `0 8px 32px rgba(31,99,214,0.30)`,
              }}>
                <BookOpen size={34} color="#fff" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
                Knowledge Bridge AI
              </h1>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.7, maxWidth: 420 }}>
                Ask about donating books, school orders, kabadiwala pickups, sponsorships, or anything about how Knowledge Bridge works.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 540 }}>
                {PROMPTS.map(p => (
                  <button key={p} onClick={() => send(p)} style={{
                    background: "rgba(255,255,255,0.80)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid rgba(31,99,214,0.15)`,
                    borderRadius: 20, padding: "7px 16px", fontSize: 13,
                    color: C.textSub, cursor: "pointer", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; e.currentTarget.style.background = "rgba(31,99,214,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(31,99,214,0.15)"; e.currentTarget.style.color = C.textSub; e.currentTarget.style.background = "rgba(255,255,255,0.80)"; }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages — all left-aligned */}
          {messages.map(m => (
            <div key={m.id} style={{ marginBottom: m.role === "user" ? 6 : 18 }}>
              {m.role === "user" ? (
                /* User message — compact left chip */
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "rgba(31,99,214,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: C.blue,
                    marginTop: 1,
                  }}>
                    U
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.4px" }}>You</div>
                    <div style={{
                      fontSize: 14, color: C.text, lineHeight: 1.6,
                      background: "rgba(31,99,214,0.07)",
                      border: "1px solid rgba(31,99,214,0.12)",
                      borderRadius: "4px 14px 14px 14px",
                      padding: "9px 14px",
                      display: "inline-block",
                      maxWidth: "75%",
                    }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              ) : (
                /* Assistant reply — full-width card */
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                    boxShadow: "0 2px 8px rgba(31,99,214,0.22)",
                  }}>
                    <Sparkles size={13} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.4px" }}>Knowledge Bridge AI</span>
                      <div style={{ height: 1, flex: 1, background: "rgba(31,99,214,0.08)" }} />
                      <button onClick={() => copyText(m.id, m.content)} style={{
                        background: "rgba(255,255,255,0.7)", border: "1px solid rgba(31,99,214,0.12)",
                        borderRadius: 6, cursor: "pointer", padding: "2px 7px",
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 10, color: copied === m.id ? C.green : C.muted,
                        fontWeight: 600,
                      }}>
                        {copied === m.id ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                      </button>
                    </div>
                    <div style={{
                      background: "rgba(255,255,255,0.78)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderRadius: "4px 14px 14px 14px",
                      border: "1px solid rgba(31,99,214,0.10)",
                      boxShadow: "0 2px 16px rgba(31,99,214,0.08)",
                      padding: "14px 18px",
                      fontSize: 14, color: C.text, lineHeight: 1.75,
                    }}>
                      <MdContent text={m.content} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(31,99,214,0.22)",
              }}>
                <Sparkles size={13} color="#fff" />
              </div>
              <div style={{
                background: "rgba(255,255,255,0.78)",
                backdropFilter: "blur(12px)",
                borderRadius: "4px 14px 14px 14px",
                border: "1px solid rgba(31,99,214,0.10)",
                padding: "12px 16px",
                display: "flex", gap: 5, alignItems: "center",
                marginTop: 22,
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.blue,
                    animation: `kbBounce 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{
          padding: "12px 28px 14px",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(31,99,214,0.10)",
        }}>
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-end",
            background: "rgba(255,255,255,0.85)",
            border: `1.5px solid rgba(31,99,214,0.18)`,
            borderRadius: 16, padding: "8px 8px 8px 14px",
            boxShadow: "0 2px 16px rgba(31,99,214,0.10)",
          }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKey}
              placeholder="Ask about books, donations, schools…"
              style={{
                flex: 1, resize: "none", border: "none", background: "transparent",
                outline: "none", fontSize: 14, color: C.text, lineHeight: 1.5,
                fontFamily: "inherit", minHeight: 22, maxHeight: 160, overflowY: "auto",
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 11, border: "none",
                background: input.trim() && !loading ? C.blue : "rgba(31,99,214,0.15)",
                color: input.trim() && !loading ? "#fff" : "rgba(31,99,214,0.4)",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s",
              }}>
              <Send size={15} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: "center" }}>
            AI may make mistakes — verify important decisions on the platform.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes kbBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(31,99,214,0.20); border-radius: 4px; }
      `}</style>
    </div>
  );
}
