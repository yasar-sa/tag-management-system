import { useState,useEffect } from "react";
import api from "../api/api";

function EditFamilyModal({family,close,refresh}){

  const [name,setName] = useState(family.name);
  const [groups,setGroups] = useState([]);
  const [selectedGroups,setSelectedGroups] = useState(
    family.groups.map(g=>g._id)
  );

  useEffect(()=>{

    api.get("/groups").then(res=>{
      setGroups(res.data);
    });

  },[]);

  const toggleGroup = (id)=>{

    if(selectedGroups.includes(id)){
      setSelectedGroups(selectedGroups.filter(g=>g!==id));
    }else{
      setSelectedGroups([...selectedGroups,id]);
    }

  };

  const updateFamily = async ()=>{

    await api.put(`/families/${family._id}`,{
      name,
      groups:selectedGroups
    });

    refresh();
    close();

  };

  return(

    <div className="modal-overlay">

      <div className="modal">

        <h3>Edit Family</h3>

        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <h4>Select Groups</h4>

        {groups.map(group=>(
          <div key={group._id}>

            <input
              type="checkbox"
              checked={selectedGroups.includes(group._id)}
              onChange={()=>toggleGroup(group._id)}
            />

            {group.name}

          </div>
        ))}

        <button onClick={updateFamily} className="btn btn-primary">
          Update
        </button>

        <button onClick={close} className="btn">
          Cancel
        </button>

      </div>

    </div>

  );

}

export default EditFamilyModal;