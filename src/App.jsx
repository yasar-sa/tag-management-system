import { useState } from "react";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import TagsPage from "./pages/TagsPage";
import GroupsPage from "./pages/GroupsPage";
import FamiliesPage from "./pages/FamiliesPage";
import DashboardStats from "./components/DashboardStats";
import "./style.css";

function App() {

  const [active, setActive] = useState("tags");

  const [dashboardRefresh, setDashboardRefresh] = useState(0);

  const refreshDashboard = () => {
    setDashboardRefresh(prev => prev + 1);
  };

  return (
    <div className="container">
      <div className="page">

  {/* Header Section */}
  <div className="page-header">

      <Header />
</div>
<div className="page-content">
      <DashboardStats refreshKey={dashboardRefresh} />

      <Tabs active={active} setActive={setActive} />

      {active === "tags" && (
        <TagsPage refreshDashboard={refreshDashboard}/>
      )}

      {active === "groups" && (
        <GroupsPage refreshDashboard={refreshDashboard}/>
      )}

      {active === "families" && (
        <FamiliesPage refreshDashboard={refreshDashboard}/>
      )}
</div>
      </div>
    </div>
  );
}

export default App;