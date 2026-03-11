import { useState, useEffect } from "react";
import api from "../api/api";
import GroupCard from "../cards/GroupCard";
import AddGroupModal from "../components/AddGroupModal";

function GroupsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);

      const res = await api.get("/groups");

      setGroups(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div>
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
            <h3>Groups</h3>
      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        + Add Group
      </button>
</div>
      {loading ? (
        <p style={{ textAlign: "center", marginTop: "40px" }}>
          Loading groups...
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {groups.map((group) => (
            <GroupCard key={group._id} group={group} refresh={fetchGroups} />
          ))}
        </div>
      )}

      {showModal && (
        <AddGroupModal
          close={() => setShowModal(false)}
          refresh={fetchGroups}
        />
      )}
    </div>
  );
}

export default GroupsPage;
