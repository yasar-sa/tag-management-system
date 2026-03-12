import { useState, useEffect } from "react";
import api from "../api/api";
import GroupCard from "../cards/GroupCard";
import AddGroupModal from "../components/AddGroupModal";
import { FaPlus } from "react-icons/fa";

function GroupsPage({ refreshDashboard }) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleRefresh = () => {
    fetchGroups();
    if (refreshDashboard) refreshDashboard();
  };

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "20px" }}>Loading groups...</p>
    );
  }

  return (
    <div
      style={{
        padding: "0",
        maxWidth: "1100px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h3 style={{ margin: "0", fontSize: "20px" }}>Group Management</h3>
          <p
            style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}
          >
            Create and manage tag groups for better organization
          </p>
        </div>
        <button
          className="btn btn-primary btn-grp"
          onClick={() => setShowModal(true)}
        >
          <FaPlus size={12} /> Add Group
        </button>
      </div>

      <div className="card-grid">
        {groups.length === 0 ? (
          <p>No groups found.</p>
        ) : (
          groups.map((group) => (
            <GroupCard key={group._id} group={group} refresh={handleRefresh} />
          ))
        )}
      </div>

      {showModal && (
        <AddGroupModal
          close={() => setShowModal(false)}
          refresh={handleRefresh}
        />
      )}
    </div>
  );
}

export default GroupsPage;
