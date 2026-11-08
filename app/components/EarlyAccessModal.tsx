"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useModal } from "./ModalContext";

export default function EarlyAccessModal() {
  const { isOpen, close } = useModal();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Trap focus within modal
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    close();
    // Return focus to trigger
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      // Reset state when closed
      setTimeout(() => {
        setEmail("");
        setError("");
        setSuggestion("");
        setSuccess(false);
        setLoading(false);
      }, 300);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuggestion("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        if (data.suggestion) setSuggestion(data.suggestion);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          background: "#08090B",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "44px 40px 40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(45,212,191,0.08)",
          boxSizing: "border-box",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            padding: 8,
            borderRadius: "50%",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            e.currentTarget.style.background = "none";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {success ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(45,212,191,0.12)",
              border: "1px solid rgba(45,212,191,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11l5 5 9-9" stroke="#2DD4BF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{
              margin: "0 0 12px",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#f7f8f8",
            }}>
              You&apos;re on the list.
            </h2>
            <p style={{
              margin: 0,
              fontSize: 15,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}>
              We&apos;ll be in touch when Olo is ready.
            </p>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Eyebrow */}
            <p style={{
              margin: "0 0 20px",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#2DD4BF",
            }}>
              olo / Early Access
            </p>

            {/* Headline */}
            <h2
              id="modal-headline"
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(24px, 4vw, 31px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.15,
                color: "#f7f8f8",
              }}
            >
              Business is about to look a lot different.
            </h2>

            {/* Supporting text */}
            <p style={{
              margin: "0 0 32px",
              fontSize: 15,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.68)",
            }}>
              Be among the first to try the business AI you&apos;ve been waiting for. Built for business owners with better things to do.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: error ? 8 : 16 }}>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@yourbusiness.com"
                  autoComplete="email"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: 48,
                    padding: "0 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${error ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10,
                    color: "#f7f8f8",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(45,212,191,0.5)")}
                  onBlur={e => (e.currentTarget.style.borderColor = error ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)")}
                />
              </div>

              {error && (
                <p style={{
                  margin: "0 0 16px",
                  fontSize: 13,
                  color: "rgba(255,100,100,0.9)",
                }}>
                  {error}
                  {suggestion && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => { setEmail(suggestion); setError(""); setSuggestion(""); }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#2DD4BF",
                          fontSize: 13,
                          padding: 0,
                          textDecoration: "underline",
                        }}
                      >
                        Use {suggestion}
                      </button>
                    </>
                  )}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: 48,
                  background: loading ? "rgba(45,212,191,0.5)" : "#2DD4BF",
                  color: "#07080a",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.15s, opacity 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#22bfa8"; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#2DD4BF"; }}
              >
                {loading ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                    <circle cx="9" cy="9" r="7" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
                    <path d="M9 2a7 7 0 017 7" stroke="#07080a" strokeWidth="2" strokeLinecap="round"/>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </svg>
                ) : (
                  <>Get Early Access →</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
