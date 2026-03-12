import { useState, useEffect } from "react";
import api from "../api/api";
import FamilyCard from "../cards/FamilyCard";
import AddFamilyModal from "../components/AddFamilyModal";
import { FaPlus } from "react-icons/fa";

function FamiliesPage({ refreshDashboard }) {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/families");
      setFamilies(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const handleRefresh = () => {
    fetchFamilies();
    if (refreshDashboard) refreshDashboard();
  };

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "20px" }}>
        Loading families...
      </p>
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
          <h3 style={{ margin: "0", fontSize: "20px" }}>Family Management</h3>
          <p
            style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}
          >
            Create and manage tag families to group related items together
          </p>
        </div>
        <button
          className="btn btn-primary btn-fam"
          onClick={() => setShowModal(true)}
        >
          <FaPlus size={12} /> Add Family
        </button>
      </div>

      <div className="card-grid">
        {families.length === 0 ? (
          <p>No families found.</p>
        ) : (
          families.map((family) => (
            <FamilyCard
              key={family._id}
              family={family}
              refresh={handleRefresh}
            />
          ))
        )}
      </div>

      {showModal && (
        <AddFamilyModal
          close={() => setShowModal(false)}
          refresh={handleRefresh}
        />
      )}
    </div>
  );
}

export default FamiliesPage;
