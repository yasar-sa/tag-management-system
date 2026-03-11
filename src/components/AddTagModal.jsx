import { useState, useEffect } from "react";
import api from "../api/api";

function AddTagModal({ close, refresh }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/courses").then((res) => {
      setCourses(res.data);
    });
  }, []);

  const toggleCourse = (id) => {
    if (selectedCourses.includes(id)) {
      setSelectedCourses(selectedCourses.filter((c) => c !== id));
    } else {
      setSelectedCourses([...selectedCourses, id]);
    }
  };

  const createTag = async () => {
    setSaving(true);

    await api.post("/tags", {
      name,
      description,
      courses: selectedCourses,
      isActive,
    });

    setSaving(false);

    refresh();
    close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create Tag</h3>

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

        <h4>Select Courses</h4>

        {courses.map((course) => (
          <label key={course._id} className="course-row">
            <input
              type="checkbox"
              checked={selectedCourses.includes(course._id)}
              onChange={() => toggleCourse(course._id)}
            />
            <span> {course.name}</span>
          </label>
        ))}
        <div style={{ marginTop: "20px",display:"flex",gap:"10px" }}>
        <button
          className="btn btn-primary"
          disabled={saving}
          onClick={createTag}
        >
          {saving ? "Creating..." : "Create"}
        </button>

        <button className="btn btn-danger" onClick={close}>
          Cancel
        </button>
        </div>
      </div>
    </div>
  );
}

export default AddTagModal;
