import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="app-footer text-center text-white py-2">
      <Container>
        <small>
          © {new Date().getFullYear()} Business Management Portal. All rights reserved.
        </small>
      </Container>
    </footer>
  );
};

export default Footer;
