import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import EncounterList from "./pages/EncounterList";
import Capture from "./pages/Capture";
import TranscriptReview from "./pages/TranscriptReview";
import NoteEditor from "./pages/NoteEditor";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EncounterList />} />
        <Route path="encounters" element={<EncounterList />} />
        <Route path="encounters/:id/capture" element={<Capture />} />
        <Route path="encounters/:id/transcript" element={<TranscriptReview />} />
        <Route path="encounters/:id/note" element={<NoteEditor />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
