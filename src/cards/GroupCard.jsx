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
        <div className="group-header">
          <div>
            <h3 className="group-title">{group.name}</h3>
            <p className="group-count">Tags ({group.tags.length})</p>
          </div>

          <span className="group-badge">Group</span>
        </div>
        <div className="tag-list">
          <div className="tag-container">
            {visibleTags.map((tag) => (
              <span key={tag._id} className="tag-chip">
                {tag.name}
              </span>
            ))}

            {remainingCount > 0 && (
              <span className="tag-more">+{remainingCount}</span>
            )}
          </div>
        </div>
        <div className="card-actions">
          <FaEdit
            style={{ marginRight: "10px", cursor: "pointer" }}
            onClick={() => setShowEdit(true)}
          />

          <FaTrash style={{ cursor: "pointer" }} onClick={deleteGroup} />
        </div>
        <div className="card-actions"></div>
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
