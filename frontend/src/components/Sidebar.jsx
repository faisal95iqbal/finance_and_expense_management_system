// Sidebar.js
import { Nav, OverlayTrigger, Tooltip } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";


const menu = (role, onLinkClick) => {
    switch (role) {
        case 'superuser':
            return <Nav className="flex-column">
                <NavLink
                    to="/"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-home me-2"></i> Home
                </NavLink>
                <NavLink
                    to="/admin"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-home me-2"></i> Admin
                </NavLink>
            </Nav>;
        case 'accountant':
            return <Nav className="flex-column">
                <NavLink
                    to="/"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-home me-2"></i> Home
                </NavLink>
                <NavLink
                    to="/dashboard"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-chart-line me-2"></i> Dashboard
                </NavLink>
                <NavLink
                    to="/expenses"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-regular fa-square-plus me-2"></i> Expenses
                </NavLink>
                <NavLink
                    to="/incomes"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-regular fa-square-plus me-2"></i> Incomes
                </NavLink>
                <NavLink
                    to="/chatroom"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-message me-2"></i> Chat Room
                </NavLink>
                <NavLink
                    to="/activityfeed"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-square-person-confined me-2"></i> Activity Feed
                </NavLink>
            </Nav>;
        case 'staff':
            return <Nav className="flex-column">
                <NavLink
                    to="/"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-home me-2"></i> Home
                </NavLink>
                <NavLink
                    to="/chatroom"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-message me-2"></i> Chat Room
                </NavLink>
                <NavLink
                    to="/activityfeed"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-square-person-confined me-2"></i> Activity Feed
                </NavLink>
            </Nav>;
        default:
            return <Nav className="flex-column">
                <NavLink
                    to="/"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-home me-2"></i> Home
                </NavLink>
                <NavLink
                    to="/dashboard"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-chart-line me-2"></i> Dashboard
                </NavLink>
                <NavLink
                    to="/business/users"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fas fa-cog me-2"></i> Business Settings
                </NavLink>

                <NavLink
                    to="/expenses"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-regular fa-square-plus me-2"></i> Expenses
                </NavLink>
                <NavLink
                    to="/incomes"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-regular fa-square-plus me-2"></i> Incomes
                </NavLink>
                <NavLink
                    to="/chatroom"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-message me-2"></i> Chat Room
                </NavLink>
                <NavLink
                    to="/activityfeed"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-square-person-confined me-2"></i> Activity Feed
                </NavLink>
            </Nav>;

    }
}



const Sidebar = ({ onLinkClick, onClose }) => {
    const { user } = useContext(AuthContext);
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
            <div
                className="d-flex align-items-center p-3 mx-0 my-1 rounded-2 shadow-sm user-welcome"
                style={{
                    transition: 'all 0.3s ease',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                }}
            >

                {/* Info */}
                <div
                    className="d-flex flex-column align-items-start flex-grow-1 overflow-hidden"
                    style={{ lineHeight: 1.4, minWidth: 0 }}
                >
                    <span className="text-secondary small">👋 Welcome</span>
                    <OverlayTrigger
                        placement="top"
                        delay={{ show: 200, hide: 100 }}
                        overlay={<Tooltip>{user.email || 'User'}</Tooltip>}
                    >
                        <span
                            className="fw-semibold text-dark"
                            style={{ maxWidth: '170px' }}
                        >
                            {user.email || 'User'}
                        </span>
                    </OverlayTrigger>

                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 300, hide: 100 }}
                        overlay={<Tooltip>{user.role || 'Member'}</Tooltip>}
                    >
                        <span className="text-muted text-truncate" style={{ fontSize: '0.9rem' }}>
                            Role: {user.role || 'Member'}
                        </span>
                    </OverlayTrigger>
                </div>
            </div>
            {menu(user.role, onLinkClick)}
            {/*<Nav className="flex-column">
                <NavLink
                    to="/"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-home me-2"></i> Home
                </NavLink>
                <NavLink
                    to="/dashboard"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-chart-line me-2"></i> Dashboard
                </NavLink>
                <NavLink
                    to="/business/users"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fas fa-cog me-2"></i> Business Settings
                </NavLink>

                <NavLink
                    to="/expenses"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-regular fa-square-plus me-2"></i> Expenses
                </NavLink>
                <NavLink
                    to="/incomes"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-regular fa-square-plus me-2"></i> Incomes
                </NavLink>
                <NavLink
                    to="/chatroom"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-message me-2"></i> Chat Room
                </NavLink>
                <NavLink
                    to="/activityfeed"
                    className="nav-link text-white"
                    onClick={onLinkClick}
                >
                    <i className="fa-solid fa-square-person-confined me-2"></i> Activity Feed
                </NavLink>
            </Nav>*/}
        </div>
    );
};

export default Sidebar;
