import { useState, useEffect } from "react";
import api from "../api/api";
import FamilyCard from "../cards/FamilyCard";
import AddFamilyModal from "../components/AddFamilyModal";

function FamiliesPage() {
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

  return (
    <div>
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
            <h3>Families</h3>
      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        + Add Family
      </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "40px" }}>
          Loading families...
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {families.map((family) => (
            <FamilyCard
              key={family._id}
              family={family}
              refresh={fetchFamilies}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddFamilyModal
          close={() => setShowModal(false)}
          refresh={fetchFamilies}
        />
      )}
    </div>
  );
}

export default FamiliesPage;
