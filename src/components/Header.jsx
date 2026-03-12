import { AiOutlineApartment, AiOutlineBarChart } from "react-icons/ai";

function Header() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        width: "100%",
        maxWidth: "1200px",
      }}
    >
      <div style={{ textAlign: "left" }}>
        <h3 className="header-title">Tag Management System</h3>
        <p className="header-subtitle">
          Organize and manage your tags with dynamic hierarchy assignments
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn-outline">
          <AiOutlineApartment size={16} /> Tree View
        </button>
        <button className="btn btn-outline">
          <AiOutlineBarChart size={16} /> Analytics
        </button>
      </div>
    </div>
  );
}

export default Header;
