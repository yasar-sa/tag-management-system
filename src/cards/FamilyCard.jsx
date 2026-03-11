import { FaEdit, FaTrash } from "react-icons/fa";
import api from "../api/api";
import { useState } from "react";
import EditFamilyModal from "../components/EditFamilyModal";
function FamilyCard({ family, refresh }) {
  const [showEdit, setShowEdit] = useState(false);

  const deleteFamily = async () => {
    if (!window.confirm("Delete this family?")) return;

    try {
      await api.delete(`/families/${family._id}`);

      refresh();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="card">
      <h3>{family.name}</h3>

      <p>{family.groups.map((g) => g.name).join(", ")}</p>

      <div className="card-actions">
        <FaEdit
          style={{ marginRight: "10px", cursor: "pointer" }}
          onClick={() => setShowEdit(true)}
        />

        <FaTrash style={{ cursor: "pointer" }} onClick={deleteFamily} />
      </div>
      <div className="card-actions">
        {showEdit && (
          <EditFamilyModal
            family={family}
            close={() => setShowEdit(false)}
            refresh={refresh}
          />
        )}
      </div>
    </div>
  );
}

export default FamilyCard;
