import React, { useContext, useEffect, useState } from 'react';
import { Card, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // for custom animations

const Home = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // trigger fade-in animation after mount
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleButtonClick = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="login-wrapper d-flex align-items-center justify-content-center">
      <Container style={{ maxWidth: "500px" }}>
        <Card
          className={`p-4 text-center shadow-sm rounded-4 home-card ${fadeIn ? 'fade-in' : ''
            }`}
          style={{ transition: 'transform 0.3s ease' }}
        >
          <Card.Body>
            <h3 className="fw-bold mb-4 text-primary">Welcome to <br/>Finanace Manaegment Portal</h3>
            <p className="text-muted mb-4">
              A complete solution to manage your business finances, track
              performance, and make data-driven decisions — all in one place.
            </p>
            <Button
              variant="outline-primary"
              size="lg"
              className="home-btn"
              onClick={handleButtonClick}
            >
              {token ? 'Go to Dashboard' : 'Login'}
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Home;
