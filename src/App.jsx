import { useState } from "react";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import TagsPage from "./pages/TagsPage";
import GroupsPage from "./pages/GroupsPage";
import FamiliesPage from "./pages/FamiliesPage";
import DashboardStats from "./components/DashboardStats";
import NetworkView from "./components/NetworkView";
import "./style.css";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

function App() {
  const [active, setActive] = useState("tags");
  const [showNetworkView, setShowNetworkView] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);

  const refreshDashboard = () => {
    setDashboardRefresh((prev) => prev + 1);
  };

  return (
    <div className="container">
      {showNetworkView ? (
        <NetworkView onClose={() => setShowNetworkView(false)} />
      ) : showAnalytics ? (
        <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
      ) : (
        <div className="page">
          {/* Header Section */}
          <div
            className="page-header"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Header
              onOpenNetwork={() => setShowNetworkView(true)}
              onOpenAnalytics={() => setShowAnalytics(true)}
            />
          </div>
          <div className="page-content">
            <DashboardStats refreshKey={dashboardRefresh} />

            <Tabs active={active} setActive={setActive} />

            {active === "tags" && (
              <TagsPage refreshDashboard={refreshDashboard} />
            )}

            {active === "groups" && (
              <GroupsPage refreshDashboard={refreshDashboard} />
            )}

            {active === "families" && (
              <FamiliesPage refreshDashboard={refreshDashboard} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
