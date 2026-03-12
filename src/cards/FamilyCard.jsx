import { FaEdit, FaTrash } from "react-icons/fa";
import api from "../api/api";
import { useState } from "react";
import EditFamilyModal from "../components/EditFamilyModal";
function FamilyCard({ family, refresh }) {
  const [showEdit, setShowEdit] = useState(false);
  const MAX_GROUPS = 3;

  const visibleTags = family.groups.slice(0, MAX_GROUPS);
  const remainingCount = family.groups.length - MAX_GROUPS;

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
    <>
      <div className="card card-fam">
        <div className="family-header">
          <div>
            <h3 className="family-title">{family.name}</h3>
            <p className="family-count">Groups ({family.groups.length})</p>
          </div>

          <span className="family-badge">Family</span>
        </div>
        <div className="group-list">
          <div className="group-container">

          {visibleTags.map((group) => (
            <span key={group._id} className="group-chip">
              {group.name}
            </span>
          ))}

          {remainingCount > 0 && (
            <span className="group-more">+{remainingCount}</span>
          )}
          </div>
        </div>
        <div className="card-actions">
          <FaEdit
            style={{ marginRight: "10px", cursor: "pointer" }}
            onClick={() => setShowEdit(true)}
          />

          <FaTrash style={{ cursor: "pointer" }} onClick={deleteFamily} />
        </div>
        <div className="card-actions"></div>
      </div>
      {showEdit && (
        <EditFamilyModal
          family={family}
          close={() => setShowEdit(false)}
          refresh={refresh}
        />
      )}
    </>
  );
}

export default FamilyCard;
