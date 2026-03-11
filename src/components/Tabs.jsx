function Tabs({ active, setActive }) {
  return (
    <div className="tabs">
      <button
        className={active === "tags" ? "tab active" : "tab"}
        onClick={() => setActive("tags")}
      >
        Tags
      </button>

      <button
        className={active === "groups" ? "tab active" : "tab"}
        onClick={() => setActive("groups")}
      >
        Groups
      </button>

      <button
        className={active === "families" ? "tab active" : "tab"}
        onClick={() => setActive("families")}
      >
        Families
      </button>
    </div>
  );
}

export default Tabs;
