import { Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "./components/ui/Tooltip";
import { SideRail } from "./components/layout/SideRail";
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

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-paper">
        <SideRail />
        <main className="min-w-0 flex-1 overflow-y-auto pb-16 sm:pb-0">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-10">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/creators" element={<CreatorList />} />
              <Route path="/creators/compare" element={<CreatorCompare />} />
              <Route path="/creators/:id" element={<CreatorProfile />} />
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/campaigns/new" element={<NewCampaign />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/shortlists" element={<Shortlists />} />
              <Route path="/shortlists/:id" element={<ShortlistDetail />} />
            </Routes>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
