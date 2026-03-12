import { FaEdit, FaTrash } from "react-icons/fa";
import api from "../api/api";
import { useState } from "react";
import EditGroupModal from "../components/EditGroupModal";

function GroupCard({ group, refresh }) {
  const [showEdit, setShowEdit] = useState(false);
  const MAX_TAGS = 3;

  const visibleTags = group.tags.slice(0, MAX_TAGS);
  const remainingCount = group.tags.length - MAX_TAGS;

  const deleteGroup = async () => {
    if (!window.confirm("Delete this group?")) return;

    try {
      await api.delete(`/groups/${group._id}`);

      refresh();
    } catch (error) {
      alert(error.response?.data?.message || "Cannot delete group");
    }
  };

  return (
    <>
      <div className="card card-grp">
        {/* Header */}
        <div
          className="group-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h3 className="group-title">{group.name}</h3>
            <p className="group-count">Tags ({group.tags.length})</p>
          </div>
          <span className="group-badge">Group</span>
        </div>

        {/* Tags */}

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
              {visibleTags.map((tag) => (
                <span key={tag._id} className="tag-chip">
                  {tag.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span
                  className="tag-more"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  +{remainingCount}
                </span>
              )}
            </>
          ) : (
            "No tags assigned"
          )}
        </div>

        <div style={{ flex: 1 }}></div>



        {/* Actions Layout */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <div className="card-actions">
            <button
              className="action-btn"
              onClick={() => setShowEdit(true)}
              title="Edit"
            >
              <FaEdit size={14} />
            </button>
            <button className="action-btn" onClick={deleteGroup} title="Delete">
              <FaTrash size={14} />
            </button>
          </div>
        </div>
      </div>
      {showEdit && (
        <EditGroupModal
          group={group}
          close={() => setShowEdit(false)}
          refresh={refresh}
        />
      )}
    </>
  );
}

export default GroupCard;
