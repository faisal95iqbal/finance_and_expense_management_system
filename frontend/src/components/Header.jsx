import { useState,useContext } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";


const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar expand="lg" expanded={expanded} onToggle={(val) => setExpanded(val)} className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <h3 className="mb-0">Business Management Portal</h3>
        </Navbar.Brand>
        {user && token && (
          <div className="d-none d-lg-flex align-items-center ms-3 me-auto">
            <Link onClick={() => setExpanded(false)}>
              <span className="text-muted">Welcome,&nbsp;</span>
              <strong className="text-dark">{user.email}</strong>
            </Link>
          </div>
        )}
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar" className="justify-content-end">
          <Nav>
            {!token ? (
              <>
                <Nav.Link as={Link} to="/login" onClick={() => setExpanded(false)}>
                  <Button variant="outline-light" className="me-1">
                    Login
                  </Button>
                </Nav.Link>
              </>
            ) : (
              <>
                
                <Nav.Link as={Link} to="/dashboard" onClick={() => setExpanded(false)}>
                  <Button variant="success" className="me-1">
                    Dashboard
                  </Button>
                </Nav.Link>
                  <Nav.Link onClick={() => {setExpanded(false); }}>
                  <Button variant="danger" onClick={logout}>
                    Logout
                  </Button>
                </Nav.Link>

              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
