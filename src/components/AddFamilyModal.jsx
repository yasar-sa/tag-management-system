import { useState, useEffect } from "react";
import api from "../api/api";

function AddFamilyModal({ close, refresh }) {
  const [name, setName] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    api.get("/groups").then((res) => {
      setGroups(res.data);
    });
  }, []);

  const toggleGroup = (id) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== id));
    } else {
      setSelectedGroups([...selectedGroups, id]);
    }
  };

  const createFamily = async () => {
    await api.post("/families", {
      name,
      groups: selectedGroups,
    });

    refresh();
    close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create Family</h3>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <h4>Select Groups</h4>

        {groups.map((group) => (
          <div key={group._id} className="course-row">
            <input type="checkbox" onChange={() => toggleGroup(group._id)} />

            <span>{group.name}</span>
          </div>
        ))}
        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button className="btn btn-primary" onClick={createFamily}>
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

export default AddFamilyModal;
