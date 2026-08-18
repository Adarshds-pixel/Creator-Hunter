import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TooltipProvider } from "./components/ui/Tooltip";
import { SideRail } from "./components/layout/SideRail";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import CreatorList from "./pages/creators/CreatorList";
import CreatorProfile from "./pages/creators/CreatorProfile";
import CreatorCompare from "./pages/creators/CreatorCompare";
import CampaignList from "./pages/campaigns/CampaignList";
import NewCampaign from "./pages/campaigns/NewCampaign";
import CampaignDetail from "./pages/campaigns/CampaignDetail";
import Shortlists from "./pages/shortlists/Shortlists";
import ShortlistDetail from "./pages/shortlists/ShortlistDetail";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-paper text-ink">
      <SideRail />
      <main className="min-w-0 flex-1 overflow-y-auto pb-16 sm:pb-0">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-10">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/creators" element={<CreatorList />} />
            <Route path="/creators/compare" element={<CreatorCompare />} />
            <Route path="/creators/:id" element={<CreatorProfile />} />
            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <CampaignList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/new"
              element={
                <ProtectedRoute>
                  <NewCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/:id"
              element={
                <ProtectedRoute>
                  <CampaignDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shortlists"
              element={
                <ProtectedRoute>
                  <Shortlists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shortlists/:id"
              element={
                <ProtectedRoute>
                  <ShortlistDetail />
                </ProtectedRoute>
              }
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <AppLayout />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
