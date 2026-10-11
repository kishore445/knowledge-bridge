import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", background: "#f0f4ff" }}>
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <h2 style={{ color: "#0E1726", marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>{this.state.error.message}</p>
            <button onClick={() => window.location.reload()} style={{ background: "#1F63D6", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontSize: 14 }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
