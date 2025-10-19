// Sidebar.js
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const Sidebar = ({ onLinkClick, onClose }) => {
    return (
        <div className="sidebar h-100 d-flex flex-column">
            {/* Close button (mobile only) */}
            <div className="d-flex justify-content-between align-items-center mb-3 d-md-none">
                <h5 className="mb-0 text-white ms-2">Menu</h5>
                <button
                    className="btn btn-link text-white fs-4 me-2"
                    onClick={onClose}
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <Nav className="flex-column">
                <NavLink
                    to="/"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fas fa-tachometer-alt me-2"></i> Home
                </NavLink>
                <NavLink
                    to="/dashboard"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fas fa-tachometer-alt me-2"></i> Dashboard
                </NavLink>
                
                <NavLink
                    to="/expenses"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fas fa-cog me-2"></i> Expenses
                </NavLink>
                <NavLink
                    to="/incomes"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fas fa-cog me-2"></i> Incomes
                </NavLink>
            </Nav>
        </div>
    );
};

export default Sidebar;
