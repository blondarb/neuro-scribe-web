/**
 * App shell — sidebar navigation + main content area.
 */

import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="logo">Neuro Scribe</div>
        <nav>
          <NavLink to="/encounters">Encounters</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", marginTop: "auto" }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>
            {user?.email}
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
