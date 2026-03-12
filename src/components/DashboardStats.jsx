import { useEffect, useState } from "react";
import api from "../api/api";
import { FaTags, FaUsers, FaLayerGroup, FaEye } from "react-icons/fa";

function DashboardStats({ refreshKey }) {
  const [stats, setStats] = useState({
    tags: 0,
    groups: 0,
    families: 0,
    activeTags: 0,
    inactiveTags: 0,
  });

useEffect(() => {
  api
    .get("/dashboard")
    .then((res) => {
      setStats(res.data);
    })
    .catch((err) => console.error("Error fetching stats:", err));
}, [refreshKey]);

  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Total Tags</span>
          <span className="stat-number">{stats.tags}</span>
          <div className="stat-pills">
            <span className="stat-pill pill-active">
              {stats.activeTags} Active
            </span>
            <span className="stat-pill pill-inactive">
              {stats.inactiveTags} Inactive
            </span>
          </div>
        </div>
        <div className="stat-icon icon-green">
          <FaTags />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Tag Groups</span>
          <span className="stat-number">{stats.groups}</span>
        </div>
        <div className="stat-icon icon-orange">
          <FaUsers />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Tag Families</span>
          <span className="stat-number">{stats.families}</span>
        </div>
        <div className="stat-icon icon-purple">
          <FaLayerGroup />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Coverage</span>
          <span className="stat-number">
  { ((stats.activeTags / stats.tags) * 100).toFixed(2) }%

            </span>
        </div>
        <div className="stat-icon icon-blue">
          <FaEye />
        </div>
      </div>
    </div>
  );
}

export default DashboardStats;
