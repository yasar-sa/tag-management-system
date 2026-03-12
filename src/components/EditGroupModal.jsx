import { useState, useEffect } from "react";
import api from "../api/api";

function EditGroupModal({ group, close, refresh }) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(
    group.tags.map((t) => t._id),
  );

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

  const updateGroup = async () => {
    await api.put(`/groups/${group._id}`, {
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
        <h3>Edit Group</h3>

        <input value={name} onChange={(e) => setName(e.target.value)} />

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <h4>Select Tags</h4>

        {tags.map((tag) => (
          <div key={tag._id} className="course-row">
            <input
              type="checkbox"
              checked={selectedTags.includes(tag._id)}
              onChange={() => toggleTag(tag._id)}
            />

            {tag.name}
          </div>
        ))}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button onClick={updateGroup} className="btn btn-primary">
            Update
          </button>

          <button onClick={close} className="btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditGroupModal;
