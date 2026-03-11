import { useState, useEffect } from "react";
import api from "../api/api";

function AddGroupModal({ close, refresh }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    api.get("/tags").then((res) => {
      setTags(res.data);
    });
  }, []);

  const toggleTag = (id) => {
    if (selectedTags.includes(id)) {
      setSelectedTags(selectedTags.filter((t) => t !== id));
    } else {
      setSelectedTags([...selectedTags, id]);
    }
  };

  const createGroup = async () => {
    await api.post("/groups", {
      name,
      description,
      tags: selectedTags,
    });

    refresh();
    close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create Group</h3>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <h4>Select Tags</h4>

        {tags.map((tag) => (
          <div key={tag._id} className="course-row">
            <input type="checkbox" onChange={() => toggleTag(tag._id)} />

            <span>{tag.name}</span>
          </div>
        ))}
        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button className="btn btn-primary" onClick={createGroup}>
            Create
          </button>

          <button className="btn btn-danger" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddGroupModal;
