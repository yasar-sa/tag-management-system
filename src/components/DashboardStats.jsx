import { useEffect, useState } from "react";
import api from "../api/api";

function DashboardStats() {

  const [stats,setStats] = useState({
    tags:0,
    groups:0,
    families:0
  });

  useEffect(()=>{

    api.get("/dashboard").then(res=>{
      setStats(res.data);
    });

  },[]);

  return (

    <div>
<div className="stats">
      <div className="stat-card">
        <h2>{stats.tags}</h2>
        <p>Total Tags</p>
      </div>

      <div className="stat-card">
        <h2>{stats.groups}</h2>
        <p>Tag Groups</p>
      </div>

      <div className="stat-card">
        <h2>{stats.families}</h2>
        <p>Tag Families</p>
      </div>
</div>
    </div>

  );

}

export default DashboardStats;