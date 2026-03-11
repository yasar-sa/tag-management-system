function StatsCards({tags,groups,families}){

  return(
    <div style={{display:"flex",gap:"20px"}}>

      <div>Total Tags: {tags}</div>
      <div>Tag Groups: {groups}</div>
      <div>Tag Families: {families}</div>

    </div>
  );

}

export default StatsCards;