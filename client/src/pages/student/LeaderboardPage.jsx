import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import LanguageLogo from '../../components/LanguageLogo';

const langMap = { java: { name: 'Java' }, python: { name: 'Python' }, c: { name: 'C' }, cpp: { name: 'C++' }, javascript: { name: 'JavaScript' }, '': { name: 'All' } };

const LeaderboardPage = () => {
  const [data, setData] = useState([]);
  const [lang, setLang] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get(`/leaderboard?${lang ? `language=${lang}` : ''}&limit=100`);
        setData(res.data);
      } finally { setLoading(false); }
    };
    fetch();
  }, [lang]);

  const filtered = data.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.college || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-wrapper">
      <Container>
        <div className="text-center mb-5 fade-in">
          <h2 className="section-title"><span className="gradient-text">Leaderboard</span></h2>
          <div className="divider" />
          <p className="section-subtitle mt-3">Top performers across all assessments</p>
        </div>

        {/* Filters */}
        <div className="glass-card mb-4 fade-in" style={{ padding: '16px 20px' }}>
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <input className="techiz-input" placeholder="Search by name or college" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Select className="techiz-input" value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: '12px 16px' }}>
                <option value="">All Languages</option>
                {['java', 'python', 'c', 'cpp', 'javascript'].map((l) => (
                  <option key={l} value={l}>{langMap[l].name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing <strong style={{ color: 'var(--primary)' }}>{filtered.length}</strong> entries
              </div>
            </Col>
          </Row>
        </div>

        {/* Top 3 podium */}
        {filtered.length >= 3 && (
          <div className="fade-in mb-4">
            <Row className="g-3 justify-content-center align-items-end">
              {[filtered[1], filtered[0], filtered[2]].map((entry, podiumIdx) => {
                const actualRank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
                const heights = { 1: 160, 2: 120, 3: 100 };
                return (
                  <Col key={entry.userId} xs={4} md={3} className="text-center">
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                      {actualRank === 1 ? '1st' : actualRank === 2 ? '2nd' : '3rd'}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{entry.bestScore} pts</div>
                    <div style={{ height: heights[actualRank], background: actualRank === 1 ? 'linear-gradient(135deg,#ffd700,#ffaa00)' : actualRank === 2 ? 'linear-gradient(135deg,#c0c0c0,#888)' : 'linear-gradient(135deg,#cd7f32,#a05c1a)', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                      {actualRank}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* Full table */}
        {loading ? <Spinner text="Loading leaderboard..." /> : (
          <div className="techiz-card p-0 overflow-hidden fade-in">
            <div style={{ overflowX: 'auto' }}>
              <table className="techiz-table leaderboard-table">
                <thead>
                  <tr><th>Rank</th><th>Student</th><th>College</th><th>Language</th><th>Best Score</th><th>Percentage</th><th>Attempts</th></tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.userId}>
                      <td>
                        <div className={`rank-badge rank-${entry.rank <= 3 ? entry.rank : 'other'}`}>
                          {entry.rank}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{entry.college || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><LanguageLogo language={entry.language} size="sm" /> {langMap[entry.language]?.name || entry.language}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{entry.bestScore}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: entry.bestPercentage >= 70 ? 'rgba(6,214,160,0.15)' : 'rgba(108,99,255,0.15)', color: entry.bestPercentage >= 70 ? 'var(--success)' : 'var(--primary)' }}>
                          {entry.bestPercentage}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{entry.totalAttempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No results found.</div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default LeaderboardPage;
