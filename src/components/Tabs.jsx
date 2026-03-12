import { FaTags, FaUsers, FaLayerGroup } from "react-icons/fa";
import { useState, useEffect } from "react";
import api from "../api/api";

function Tabs({ active, setActive }) {
  const [counts, setCounts] = useState({ tags: 0, groups: 0, families: 0 });

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => {
        setCounts({
          tags: res.data.tags || 0,
          groups: res.data.groups || 0,
          families: res.data.families || 0,
        });
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="tabs-container">
      <div className="tabs">
        <button
          className={active === "tags" ? "tab active" : "tab"}
          onClick={() => setActive("tags")}
        >
          <FaTags size={14} /> Tags ({counts.tags})
        </button>

        <button
          className={active === "groups" ? "tab active" : "tab"}
          onClick={() => setActive("groups")}
        >
          <FaUsers size={14} /> Groups ({counts.groups})
        </button>

        <button
          className={active === "families" ? "tab active" : "tab"}
          onClick={() => setActive("families")}
        >
          <FaLayerGroup size={14} /> Families ({counts.families})
        </button>
      </div>
    </div>
  );
}

export default Tabs;
