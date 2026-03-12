import { useState, useEffect } from "react";
import api from "../api/api";
import TagCard from "../cards/TagCard";
import AddTagModal from "../components/AddTagModal";

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
    return <p>Loading tags...</p>;
  }

  return (
    <div>
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
            <h3>Tags</h3>
      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        + Add Tag
      </button>
      </div>
      {showModal && (
        <AddTagModal close={() => setShowModal(false)} refresh={fetchTags} />
      )}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {loading ? (
          <p>Loading tags...</p>
        ) : (
          tags.map((tag) => (
            <TagCard key={tag._id} tag={tag} refresh={fetchTags}/>
          ))
        )}
      </div>
    </div>
  );
}

export default TagsPage;
