import { FaEdit, FaTrash } from "react-icons/fa";
import api from "../api/api";
import { useState } from "react";
import EditTagModal from "../components/EditTagModal";

function TagCard({ tag, refresh }) {
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleStatus = async () => {
    await api.put(`/tags/${tag._id}`, {
      name: tag.name,
      description: tag.description,
      courses: tag.courses.map((c) => c._id),
      isActive: !tag.isActive,
    });
    refresh();
  };

  const deleteTag = async () => {
    if (!window.confirm("Delete this tag?")) return;

    try {
      setDeleting(true);
      await api.delete(`/tags/${tag._id}`);
      refresh();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="card">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>{tag.name}</h3>
          <span className={`status ${tag.isActive ? "active" : "inactive"}`}>
            {tag.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Courses */}
        <p>Courses</p>

        <div className="assignments-box">
          {tag.courses && tag.courses.length > 0
            ? tag.courses.map((c) => c.name).join(", ")
            : "No assignments"}
        </div>

        <div style={{ flex: 1 }}></div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "#f3f4f6",
            margin: "16px 0 12px 0",
          }}
        ></div>

        {/* Status Toggle & Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>Status:</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={tag.isActive}
                onChange={toggleStatus}
              />
              <span className="slider"></span>
            </label>
          </div>

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
              onClick={deleteTag}
              disabled={deleting}
              style={{ opacity: deleting ? 0.5 : 1 }}
              title="Delete"
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditTagModal
          tag={tag}
          close={() => setShowEdit(false)}
          refresh={refresh}
        />
      )}
    </>
  );
}

export default TagCard;
