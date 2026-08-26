import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import LanguageLogo from '../../components/LanguageLogo';

const languages = [
  { key: 'java', name: 'Java', desc: 'Object-Oriented Programming, JVM, Collections', color: '#f89820', topics: ['OOP', 'JVM', 'Collections', 'Threads'] },
  { key: 'python', name: 'Python', desc: 'Scripting, Data Structures, Algorithms, Libraries', color: '#3776ab', topics: ['Scripting', 'Data Structures', 'Algorithms', 'Libraries'] },
  { key: 'c', name: 'C', desc: 'Systems Programming, Pointers, Memory Management', color: '#a8b9cc', topics: ['Systems', 'Pointers', 'Memory', 'Embedded'] },
  { key: 'cpp', name: 'C++', desc: 'OOP, STL, Templates, Modern C++ Features', color: '#00599c', topics: ['OOP', 'STL', 'Templates', 'Modern C++'] },
  { key: 'javascript', name: 'JavaScript', desc: 'Web Development, Async, DOM, ES6+ Features', color: '#f7df1e', topics: ['Web', 'Async', 'DOM', 'ES6+'] },
];

const LanguageSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <Container>
        <div className="text-center mb-5 fade-in">
          <h2 className="section-title">Choose Your <span className="gradient-text">Language</span></h2>
          <div className="divider" />
          <p className="section-subtitle mt-3">Select a programming language to start your timed assessment. 10 random questions · 30 seconds each.</p>
        </div>

        {/* Assessment rules */}
        <div className="glass-card mb-5 fade-in" style={{ padding: '24px 28px' }}>
          <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Assessment Rules</h6>
          <Row className="g-3">
            {[
              ['30 seconds per question'],
              ['10 random questions'],
              ['One question at a time'],
              ['Cannot go back to previous'],
              ['Fullscreen required'],
              ['Tab switching monitored (3 warnings)'],
              ['MCQ=1, Output=2, Syntax=2, Coding=5 marks'],
            ].map(([text], i) => (
              <Col key={i} xs={12} sm={6} md={3}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span className="rule-marker" aria-hidden="true" /> {text}
                </div>
              </Col>
            ))}
          </Row>
        </div>

        <Row className="g-4">
          {languages.map((lang) => (
            <Col key={lang.key} md={6} lg={4}>
              <div
                className="lang-card fade-in"
                onClick={() => navigate(`/assessment/${lang.key}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/assessment/${lang.key}`)}
              >
                <LanguageLogo language={lang.key} size="md" style={{ '--language-color': lang.color }} />
                <div className="lang-name" style={{ fontSize: '1.4rem' }}>{lang.name}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '10px 0 16px' }}>{lang.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
                  {lang.topics.map((t) => (
                    <span key={t} style={{ fontSize: '0.7rem', padding: '2px 10px', borderRadius: 12, background: `${lang.color}22`, color: lang.color, fontWeight: 600, border: `1px solid ${lang.color}44` }}>{t}</span>
                  ))}
                </div>
                <button className="btn-techiz" style={{ width: '100%', justifyContent: 'center' }}>
                  Start {lang.name} Assessment
                </button>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default LanguageSelectionPage;
