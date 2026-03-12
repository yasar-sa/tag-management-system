import { useState, useEffect } from "react";
import api from "../api/api";
import TagCard from "../cards/TagCard";
import AddTagModal from "../components/AddTagModal";
import { FaPlus } from "react-icons/fa";

function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tags");
      setTags(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "20px" }}>Loading tags...</p>
    );
  }

  return (
    <div
      style={{
        padding: "0 40px",
        maxWidth: "1200px",
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
          marginBottom: "20px",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h3 style={{ margin: "0", fontSize: "20px" }}>Tag Management</h3>
          <p
            style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}
          >
            Create and manage individual tags with hierarchy assignments
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus size={12} /> Add Tag
        </button>
      </div>

      {showModal && (
        <AddTagModal close={() => setShowModal(false)} refresh={fetchTags} />
      )}

      <div className="card-grid">
        {tags.length === 0 ? (
          <p>No tags found.</p>
        ) : (
          tags.map((tag) => (
            <TagCard key={tag._id} tag={tag} refresh={fetchTags} />
          ))
        )}
      </div>
    </div>
  );
}

export default TagsPage;
