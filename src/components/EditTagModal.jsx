import { useState, useEffect } from "react";
import api from "../api/api";

function EditTagModal({ tag, close, refresh }) {

  const [name,setName] = useState(tag.name);
  const [description,setDescription] = useState(tag.description);
  const [courses,setCourses] = useState([]);
  const [selectedCourses,setSelectedCourses] = useState(
    tag.courses.map(c => c._id)
  );
  const [isActive] = useState(tag.isActive);

  useEffect(()=>{
    api.get("/courses").then(res=>{
      setCourses(res.data);
    });
  },[]);

  const toggleCourse = (id)=>{
    if(selectedCourses.includes(id)){
      setSelectedCourses(selectedCourses.filter(c=>c!==id));
    }else{
      setSelectedCourses([...selectedCourses,id]);
    }
  };

  const updateTag = async ()=>{
    await api.put(`/tags/${tag._id}`,{
      name,
      description,
      courses:selectedCourses,
      isActive
    });

    refresh();
    close();
  };

  return (

    <div className="modal-overlay">

      <div className="modal">

        <h3>Edit Tag</h3>

        <input
          placeholder="Tag Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />

        <h4>Select Courses</h4>

        {courses.map(course => (

          <label key={course._id} className="course-row">

            <input
              type="checkbox"
              checked={selectedCourses.includes(course._id)}
              onChange={()=>toggleCourse(course._id)}
            />

            <span>{course.name}</span>

          </label>

        ))}

        <div style={{display:"flex",gap:"10px",marginTop:"15px"}}>

          <button
            className="btn btn-primary"
            onClick={updateTag}
          >
            Update
          </button>

          <button
            className="btn"
            onClick={close}
          >
            Cancel
          </button>

        </div>

      </div>

    </div>

  )

}

export default EditTagModal;