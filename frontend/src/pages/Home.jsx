import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div style={styles.container}>

      {/* 🔷 NAVBAR */}
      <div style={styles.navbar}>
        <h3 style={{ margin: 0 }}>Clinic System</h3>

        <div>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#about" style={styles.navLink}>About</a>
          <a href="#contact" style={styles.navLink}>Contact</a>

          <Link to="/login" style={styles.navBtn}>
            Login
          </Link>
        </div>
      </div>

      {/* 🔷 HERO */}
      <section style={styles.hero}>
        <h1 style={styles.title}>Clinic Management System</h1>
        <p style={styles.subtitle}>
          Manage patients, diagnostics, billing, and clinic operations efficiently.
        </p>

        <Link to="/login" style={styles.primaryBtn}>
          🚀 Try Live Demo
        </Link>
      </section>
      <section style={styles.sectionAlt}>
        <h2 style={styles.heading}>Clinic Management System Project</h2>

        <p style={styles.text}>
            This Clinic Management System project is a full-stack web application designed to manage patient records, diagnostic reports, billing, and doctor referrals efficiently. It is built using modern web technologies to streamline healthcare operations and improve data management in clinics and diagnostic centers.
        </p>

        <p style={styles.text}>
            The system includes features such as patient registration, CT scan reports, ultrasound reports, doctor referral tracking, settlement management, and financial reporting. This project demonstrates real-world implementation of a hospital or clinic management system.
        </p>
        </section>

      {/* 🔷 FEATURES */}
      <section id="features" style={styles.section}>
        <h2 style={styles.heading}>Features</h2>

        <div style={styles.grid}>
          <div style={styles.card}>👨‍⚕️ Patient Management</div>
          <div style={styles.card}>🧪 Diagnostic Reports</div>
          <div style={styles.card}>💳 Billing System</div>
          <div style={styles.card}>📄 Doctor Referrals</div>
        </div>
      </section>

      {/* 🔷 ABOUT */}
      <section id="about" style={styles.sectionAlt}>
        <h2 style={styles.heading}>About</h2>
        <p style={styles.text}>
          This system helps clinics digitize patient data, reports, and billing.
          Built with modern technologies for efficiency and scalability.
        </p>
      </section>

      {/* 🔷 CONTACT */}
      <section id="contact" style={styles.section}>
        <h2 style={styles.heading}>Contact</h2>
        <p style={styles.text}>👤 Indrasena Reddy</p>
        <p style={styles.text}>📧 indrasenareddy787@gmail.com</p>
      </section>

      {/* 🔷 FOOTER */}
      <footer style={styles.footer}>
        <p>© 2026 Clinic System</p>
      </footer>
    </div>
  );
};

export default Home;

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },

  /* 🔷 NAVBAR */
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: "#fff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    flexWrap: "wrap",
  },

  navLink: {
    margin: "5px 10px",
    textDecoration: "none",
    color: "#333",
    fontSize: "14px",
  },

  navBtn: {
    marginLeft: "10px",
    padding: "8px 15px",
    background: "#007BFF",
    color: "#fff",
    borderRadius: "5px",
    textDecoration: "none",
    fontSize: "14px",
  },

  /* 🔷 HERO */
  hero: {
    textAlign: "center",
    padding: "60px 15px",
    background: "linear-gradient(to right, #075aa3, #0d7cc5)",
    color: "white",
  },

  title: {
    fontSize: "clamp(28px, 5vw, 42px)",
    marginBottom: "10px",
  },

  subtitle: {
    fontSize: "clamp(14px, 3vw, 18px)",
    maxWidth: "600px",
    margin: "0 auto 20px",
  },

  primaryBtn: {
    display: "inline-block",
    background: "#fff",
    color: "#0400ff",
    padding: "12px 25px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "bold",
    marginTop: "10px",
  },

  /* 🔷 SECTIONS */
  section: {
    padding: "40px 15px",
    textAlign: "center",
  },

  sectionAlt: {
    padding: "40px 15px",
    textAlign: "center",
    background: "#f5f5f5",
  },

  heading: {
    fontSize: "clamp(22px, 4vw, 28px)",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    fontSize: "clamp(14px, 2.5vw, 16px)",
  },

  text: {
    fontSize: "clamp(14px, 2.5vw, 16px)",
    maxWidth: "700px",
    margin: "10px auto",
  },

  footer: {
    textAlign: "center",
    padding: "15px",
    background: "#222",
    color: "#fff",
    fontSize: "14px",
  },
};