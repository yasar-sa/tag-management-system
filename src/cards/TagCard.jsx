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
        <p style={{ marginTop: "10px", fontWeight: "500" }}>Courses</p>

        <div className="badge">{tag.courses.map((c) => c.name).join(", ")}</div>

        {/* Status Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "15px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Status</span>

            <label className="switch">
              <input
                type="checkbox"
                checked={tag.isActive}
                onChange={toggleStatus}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Actions */}
          <div className="card-actions">
            <FaEdit
              style={{ cursor: "pointer" }}
              onClick={() => setShowEdit(true)}
            />

            <FaTrash
              style={{
                cursor: "pointer",
                opacity: deleting ? 0.5 : 1,
              }}
              onClick={deleteTag}
            />
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
