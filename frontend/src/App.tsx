import { Routes, Route, Navigate } from "react-router-dom";
import { NavBar } from "./components/dashboard/NavBar";
import Dashboard from "./pages/Dashboard";
import CreatorList from "./pages/creators/CreatorList";
import CreatorProfile from "./pages/creators/CreatorProfile";
import CreatorCompare from "./pages/creators/CreatorCompare";
import CampaignList from "./pages/campaigns/CampaignList";
import NewCampaign from "./pages/campaigns/NewCampaign";
import CampaignDetail from "./pages/campaigns/CampaignDetail";
import Shortlists from "./pages/shortlists/Shortlists";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
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
      </Routes>
    </div>
  );
}

export default App;
