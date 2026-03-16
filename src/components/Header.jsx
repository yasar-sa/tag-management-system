import { AiOutlineApartment, AiOutlineBarChart } from "react-icons/ai";

function Header({ onOpenNetwork, onOpenAnalytics }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: "1100px",
        padding: "12px 0",
      }}
    >
      <div style={{ textAlign: "left" }}>
        <h3 className="header-title">Tag Management System</h3>
        <p className="header-subtitle">
          Organize and manage your tags with dynamic hierarchy assignments
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn-outline" onClick={onOpenNetwork}>
          <AiOutlineApartment size={16} /> Tree View
        </button>
        <button className="btn btn-outline" onClick={onOpenAnalytics}>
          <AiOutlineBarChart size={16} /> Analytics
        </button>
      </div>
    </div>
  );
}

export default Header;
