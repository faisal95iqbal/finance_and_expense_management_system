import { useState, useContext, useRef, useEffect } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate, NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import NotificationsBell from "./NotificationsBell";
import "./header.css";


const loggedInMenuItems = [
  { to: "/", icon: "fas fa-home", label: "Home" },
  { label: "Logout", icon: "fa-solid fa-arrow-right-from-bracket", action: "logout" },
];
const generalMenuItems = [
  { to: "/", icon: "fas fa-home", label: "Home" },
  { to: "/login", icon: "fa-solid fa-arrow-right-from-bracket", label: "Login" },
];


const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  const menuItems = token ? loggedInMenuItems : generalMenuItems;

  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [selectorStyle, setSelectorStyle] = useState({});

  const navRef = useRef(null);
  // Adjust selector position when route changes or window resizes
  useEffect(() => {
    const updateSelector = () => {
      if (!navRef.current) return;
      const activeLink = navRef.current.querySelector(".nav-link.active");
      if (activeLink) {
        const { offsetTop, offsetLeft, offsetHeight, offsetWidth } = activeLink;
        setSelectorStyle({
          top: offsetTop + "px",
          left: offsetLeft + "px",
          height: offsetHeight + "px",
          width: offsetWidth + "px",
        });
      } else {
        setSelectorStyle({ display: "none" });
      }
    };
    updateSelector();
    window.addEventListener("resize", updateSelector);
    return () => window.removeEventListener("resize", updateSelector);
  }, [location.pathname]);
  // Close menu on mobile after clicking a link
  const handleNavClick = () => {
    setExpanded(false);
  };

  return (

    <Navbar
      expand="lg"
      className="navbar-mainbg"
      variant="dark"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="navbar-logo">
          Business Management Portal
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav className="ms-auto position-relative" ref={navRef}>
            <div className="hori-selector" style={selectorStyle}>
              <div className="left"></div>
              <div className="right"></div>
            </div>

            {menuItems.map((item) => (
              item.action === "logout" ? (
                <>
                  <Nav.Link
                    key={item.label}
                    as="span"
                    className="nav-link"
                    style={{ cursor: "pointer" }}
                    onClick={logout}
                  >
                    <i className={item.icon}></i> {item.label}
                  </Nav.Link>
                  <NotificationsBell key={"bell"}/>
                </>
              ) : (
                <Nav.Link
                  as={NavLink}
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <i className={item.icon}></i> {item.label}
                </Nav.Link>)
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>

  );
};

export default Header;
