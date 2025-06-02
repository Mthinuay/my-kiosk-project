import React, { useState } from "react";
import "./DropdownMenu.css"; // Create this CSS file

const DropdownMenu = ({ userRole, onViewProducts, onViewCategories }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="dropdown-container">
      <button onClick={toggleDropdown} className="dropdown-button">
        Menu
      </button>

      <div className={`dropdown-menu ${isOpen ? "open" : "closed"}`}>
        <ul className="dropdown-list">
          <li>
            <button onClick={onViewProducts} className="dropdown-item">
              View Products
            </button>
          </li>
          <li>
            <button onClick={onViewCategories} className="dropdown-item">
              View Categories
            </button>
          </li>
          <li>
            <button onClick={handleLogout} className="dropdown-item logout">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DropdownMenu;
