import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { FaArrowRight, FaUniversity, FaUserCircle } from 'react-icons/fa';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      <Container>
        {/* Welcome banner */}
        <div className="techiz-card fade-in mb-4" style={{ padding: '32px', background: 'linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,212,170,0.1))' }}>
          <Row className="align-items-center">
            <Col>
              <h2 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                <FaUserCircle className="welcome-icon" aria-hidden="true" /> Welcome back, {user?.name?.split(' ')[0]}!
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                {user?.college && <><FaUniversity className="welcome-detail-icon" aria-hidden="true" /> {user.college}</>} {user?.rollNumber && `· Roll: ${user.rollNumber}`}
              </p>
            </Col>
            <Col xs="auto">
              <Link to="/languages" className="btn-techiz">Take Assessment <FaArrowRight aria-hidden="true" /></Link>
            </Col>
          </Row>
        </div>

      </Container>
    </div>
  );
};

export default StudentDashboard;
