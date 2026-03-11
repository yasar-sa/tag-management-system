import { FaEdit, FaTrash } from "react-icons/fa";
import api from "../api/api";
import { useState } from "react";
import EditGroupModal from "../components/EditGroupModal";

function GroupCard({ group, refresh }) {
  const [showEdit, setShowEdit] = useState(false);

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
    <div className="card">
      <h3>{group.name}</h3>

      <p>{group.tags.map((t) => t.name).join(", ")}</p>

      <div className="card-actions">
        <FaEdit
          style={{ marginRight: "10px", cursor: "pointer" }}
          onClick={() => setShowEdit(true)}
        />

        <FaTrash style={{ cursor: "pointer" }} onClick={deleteGroup} />
      </div>
      <div className="card-actions">
        {showEdit && (
          <EditGroupModal
            group={group}
            close={() => setShowEdit(false)}
            refresh={refresh}
          />
        )}
      </div>
    </div>
  );
}

export default GroupCard;
