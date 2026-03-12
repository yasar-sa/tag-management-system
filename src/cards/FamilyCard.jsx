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
        <div
          className="family-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h3 className="family-title">{family.name}</h3>
            <p className="family-count">Groups ({family.groups.length})</p>
          </div>
          <span className="family-badge">Family</span>
        </div>

        <p>Groups Included</p>

        <div
          className="assignments-box"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignContent: "flex-start",
          }}
        >
          {visibleTags.length > 0 ? (
            <>
              {visibleTags.map((group) => (
                <span key={group._id} className="group-chip">
                  {group.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span
                  className="group-more"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  +{remainingCount}
                </span>
              )}
            </>
          ) : (
            "No groups assigned"
          )}
        </div>

        <div style={{ flex: 1 }}></div>



        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <div className="card-actions">
            <button
              className="action-btn"
              onClick={() => setShowEdit(true)}
              title="Edit"
            >
              <FaEdit size={14} />
            </button>
            <button
              className="action-btn"
              onClick={deleteFamily}
              title="Delete"
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
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
