"use client";
import { useState, useEffect, useCallback } from "react";

const DEFAULT_ENDPOINT = "https://auth-uat.reportzero.net/api/oauth/token";

function StatusBadge({ status }) {
  const ok = status >= 200 && status < 300;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 700,
        fontFamily: "monospace",
        background: ok ? "#0f3" : "#f33",
        color: ok ? "#000" : "#fff",
      }}
    >
      {status} {ok ? "OK" : "ERROR"}
    </span>
  );
}

function JsonBlock({ data }) {
  return (
    <pre
      style={{
        background: "#0a0a0a",
        border: "1px solid #222",
        borderRadius: "6px",
        padding: "14px 16px",
        fontSize: "13px",
        lineHeight: "1.6",
        overflowX: "auto",
        color: "#7ee787",
        margin: 0,
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Section({ title, children, accent = "#4af" }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "3px",
            height: "18px",
            background: accent,
            borderRadius: "2px",
          }}
        />
        <h2
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#aaa",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  mono = false,
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          color: "#666",
          marginBottom: "5px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: "5px",
          padding: "9px 12px",
          color: "#e8e8e8",
          fontSize: mono ? "12px" : "14px",
          fontFamily: mono ? "monospace" : "inherit",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#4af")}
        onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
      />
    </div>
  );
}

export default function Page() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tokenEndpoint, setTokenEndpoint] = useState(DEFAULT_ENDPOINT);
  const [deployedUrl, setDeployedUrl] = useState("");
  const [useCallbackMode, setUseCallbackMode] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [tokenResult, setTokenResult] = useState(null);

  const [callbackLog, setCallbackLog] = useState([]);
  const [polling, setPolling] = useState(false);

  const callbackUrl = deployedUrl
    ? `${deployedUrl.replace(/\/$/, "")}/api/oauth/token-update`
    : "";

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch("/api/callback-log");
      const data = await res.json();
      setCallbackLog(data.log || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLog();
    // Try to auto-detect deployed URL
    if (typeof window !== "undefined") {
      setDeployedUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(fetchLog, 3000);
    return () => clearInterval(id);
  }, [polling, fetchLog]);

  async function generateToken() {
    setGenerating(true);
    setTokenResult(null);
    try {
      const res = await fetch("/api/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientSecret,
          tokenEndpoint,
          callbackUrl: useCallbackMode ? callbackUrl : undefined,
        }),
      });
      const data = await res.json();
      setTokenResult(data);
      if (useCallbackMode) {
        setPolling(true);
        setTimeout(() => setPolling(false), 60000);
      }
    } catch (err) {
      setTokenResult({ error: err.message });
    } finally {
      setGenerating(false);
    }
  }

  async function clearLog() {
    await fetch("/api/callback-log", { method: "DELETE" });
    setCallbackLog([]);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0c",
        color: "#e0e0e0",
        fontFamily: "'Geist', 'SF Pro Display', -apple-system, sans-serif",
        padding: "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1a1a1a",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "#0e0e0e",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #4af, #2af)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          ⚡
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "15px",
              letterSpacing: "-0.01em",
            }}
          >
            Report Zero
          </div>
          <div style={{ fontSize: "12px", color: "#555" }}>
            OAuth Callback Tester
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: polling ? "#0f3" : "#333",
              boxShadow: polling ? "0 0 6px #0f3" : "none",
            }}
          />
          <span style={{ fontSize: "12px", color: "#555" }}>
            {polling ? "Listening for callbacks..." : "Idle"}
          </span>
        </div>
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 32px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
        }}
      >
        {/* LEFT COLUMN - Config & Token Generation */}
        <div style={{ minWidth: 0 }}>
          <Section title="Configuration" accent="#4af">
            <Field
              label="Client ID"
              value={clientId}
              onChange={setClientId}
              placeholder="2637c963-01e9-44f8-..."
              mono
            />
            <Field
              label="Client Secret"
              value={clientSecret}
              onChange={setClientSecret}
              type="password"
              placeholder="Your client secret"
              mono
            />
            <Field
              label="Token Endpoint"
              value={tokenEndpoint}
              onChange={setTokenEndpoint}
              placeholder={DEFAULT_ENDPOINT}
              mono
            />
            <Field
              label="Your Deployed URL (for callback)"
              value={deployedUrl}
              onChange={setDeployedUrl}
              placeholder="https://your-app.vercel.app"
              mono
            />
          </Section>

          <Section title="Renewal Mode" accent="#fa4">
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "Server-Managed (with callback)", value: true },
                { label: "Client-Managed (no callback)", value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setUseCallbackMode(opt.value)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor:
                      useCallbackMode === opt.value ? "#4af" : "#222",
                    background:
                      useCallbackMode === opt.value
                        ? "rgba(68,170,255,0.08)"
                        : "#111",
                    color: useCallbackMode === opt.value ? "#4af" : "#666",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {useCallbackMode && callbackUrl && (
              <div
                style={{
                  background: "#0f1a1a",
                  border: "1px solid #1a3333",
                  borderRadius: "6px",
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#4af",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Callback URL
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#7ee787",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {callbackUrl}
                </div>
              </div>
            )}
          </Section>

          <button
            onClick={generateToken}
            disabled={generating || !clientId || !clientSecret}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "7px",
              border: "none",
              background: generating
                ? "#1a1a1a"
                : "linear-gradient(135deg, #2af, #4af)",
              color: generating ? "#555" : "#000",
              fontSize: "14px",
              fontWeight: 700,
              cursor: generating ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              transition: "all 0.2s",
            }}
          >
            {generating ? "⏳ Requesting Token..." : "→ Generate Token"}
          </button>

          {tokenResult && (
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#666" }}>
                  Response
                </span>
                {tokenResult.status && (
                  <StatusBadge status={tokenResult.status} />
                )}
              </div>
              <JsonBlock data={tokenResult.data || tokenResult} />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Callback Log */}
        <div style={{ minWidth: 0 }}>
          <Section title="Callback Log" accent="#0f3">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={fetchLog}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "5px",
                    border: "1px solid #2a2a2a",
                    background: "#111",
                    color: "#aaa",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  ↻ Refresh
                </button>
                <button
                  onClick={() => setPolling((p) => !p)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "5px",
                    border: "1px solid",
                    borderColor: polling ? "#0f3" : "#2a2a2a",
                    background: polling ? "rgba(0,255,51,0.06)" : "#111",
                    color: polling ? "#0f3" : "#aaa",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {polling ? "⏸ Stop" : "▶ Auto-poll"}
                </button>
              </div>
              {callbackLog.length > 0 && (
                <button
                  onClick={clearLog}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "5px",
                    border: "1px solid #2a2a2a",
                    background: "#111",
                    color: "#f55",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Endpoint info */}
            <div
              style={{
                background: "#0a1a0a",
                border: "1px solid #1a2a1a",
                borderRadius: "6px",
                padding: "10px 14px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}
              >
                Listening on
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "#4a8",
                }}
              >
                POST /api/oauth/token-update
              </div>
              <div
                style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}
              >
                Responds with{" "}
                <code
                  style={{ color: "#7ee787" }}
                >{`{ "received": true }`}</code>
              </div>
            </div>

            {callbackLog.length === 0 ? (
              <div
                style={{
                  border: "1px dashed #1a1a1a",
                  borderRadius: "8px",
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#333",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>📭</div>
                No callbacks received yet.
                <div
                  style={{
                    fontSize: "12px",
                    marginTop: "6px",
                    color: "#2a2a2a",
                  }}
                >
                  Generate a token with server-managed mode to start.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {callbackLog.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid #1a2a1a",
                      borderRadius: "7px",
                      padding: "14px",
                      borderLeft: "3px solid #0f3",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          background: "rgba(0,255,51,0.1)",
                          color: "#0f3",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        received: true ✓
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#444",
                          fontFamily: "monospace",
                        }}
                      >
                        {new Date(entry.receivedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#555",
                        fontFamily: "monospace",
                        lineHeight: "1.8",
                      }}
                    >
                      <div>
                        <span style={{ color: "#444" }}>token:</span>{" "}
                        <span style={{ color: "#7ee787" }}>
                          {entry.accessToken}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#444" }}>expiresIn:</span>{" "}
                        <span style={{ color: "#e8c" }}>
                          {entry.expiresIn}s
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#444" }}>expiresAt:</span>{" "}
                        <span style={{ color: "#e8c" }}>{entry.expiresAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: "14px 32px",
          textAlign: "center",
          fontSize: "11px",
          color: "#333",
        }}
      >
        Report Zero OAuth Tester · Callback endpoint:{" "}
        <code style={{ color: "#444" }}>/api/oauth/token-update</code>
      </div>
    </div>
  );
}
