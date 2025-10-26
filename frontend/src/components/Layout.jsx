// Layout.js
import { Container, Row, Col, Button } from "react-bootstrap";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom"; // to render nested routes

const Layout = () => {
    const token = localStorage.getItem("token");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const {pathname} = location;

    if (pathname.startsWith('/set-password/')  && token) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        localStorage.removeItem("business_id");
        setUser(null);
        
    }

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false)
    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />
            {/* Sidebar toggle button (only on small screens) */}
            <div className="d-md-none text-start px-3 py-2 bg-light shadow-sm">
                <Button
                    variant="light"
                    className="sidebar-toggle-btn"
                    onClick={toggleSidebar}
                >
                    <i className="fas fa-bars text-primary fs-5"></i>
                </Button>
            </div>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div className="sidebar-overlay d-md-none" onClick={closeSidebar}></div>
            )}
            <Container fluid className="flex-grow-1 px-0">
                {token ? (<Row className="g-0">
                    <Col
                        xs={12}
                        md={3}
                        lg={2}
                        className={`sidebar-container ${sidebarOpen ? "open" : ""
                            } bg-primary text-white`}
                    >
                        <Sidebar onLinkClick={closeSidebar} onClose={closeSidebar} />
                    </Col>
                    <Col xs={12} md={9} lg={10} className="content-container p-4">
                        <Outlet />
                    </Col>
                </Row>) : (<Row className="g-0">
                    <Outlet />
                </Row>)}
                <ToastContainer position="top-right" autoClose={3000} theme="colored" />

            </Container>
            <Footer />
        </div>
    );
};

export default Layout;
