import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer
      className="mt-auto py-2 text-center"
    >
      <Container>
        <small>
          © {new Date().getFullYear()} Business Management Portal. All rights reserved.
        </small>
      </Container>
    </footer>
  );
};

export default Footer;
