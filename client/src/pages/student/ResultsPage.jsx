import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

const langMap = { java: 'Java', python: 'Python', c: 'C', cpp: 'C++', javascript: 'JavaScript' };
const typeLabels = { mcq: 'MCQ', output: 'Output Prediction', syntax: 'Syntax Error', coding: 'Coding' };

const ResultsPage = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aRes = await api.get(`/assessments/${id}`);
        setAssessment(aRes.data.data);
      } catch { toast.error('Could not load results'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <Spinner text="Loading results..." />;
  if (!assessment) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Results not found.</div>;

  const { score, maxScore, percentage, status, answers } = assessment;
  const passed = percentage >= 40;
  const grade = percentage >= 90 ? 'S' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';
  const gradeColor = percentage >= 70 ? 'var(--success)' : percentage >= 40 ? '#ffd166' : 'var(--danger)';

  const byType = {};
  (answers || []).forEach((a) => {
    if (!a.questionId) return;
    const t = a.questionId.type;
    if (!byType[t]) byType[t] = { total: 0, correct: 0 };
    byType[t].total++;
    if (a.isCorrect) byType[t].correct++;
  });

  return (
    <div className="page-wrapper">
      <Container>
        {/* Score hero */}
        <div className="techiz-card fade-in mb-4 text-center" style={{ padding: '48px 32px', background: passed ? 'linear-gradient(135deg,rgba(6,214,160,0.08),rgba(108,99,255,0.08))' : 'linear-gradient(135deg,rgba(239,71,111,0.08),rgba(108,99,255,0.08))' }}>
          <div className="score-circle" style={{ background: passed ? 'linear-gradient(135deg,#6c63ff,#00d4aa)' : 'linear-gradient(135deg,#ef476f,#ff6b6b)' }}>
            <div className="score-number">{grade}</div>
            <div className="score-sub">{percentage}%</div>
          </div>
          <h2 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            {passed ? 'Congratulations!' : 'Keep Practicing'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {passed ? 'You have passed the assessment!' : 'You need ≥40% to pass. Try again!'}
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '24px 0', flexWrap: 'wrap' }}>
            {[['Score', `${score}/${maxScore}`], ['Percentage', `${percentage}%`], ['Language', langMap[assessment.language] || assessment.language], ['Status', status]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{v}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/languages" className="btn-outline-techiz">Try Again</Link>
            <Link to="/dashboard" className="btn-outline-techiz">Dashboard</Link>
            <Link to="/leaderboard" className="btn-outline-techiz">Leaderboard</Link>
          </div>
        </div>

        {/* Type breakdown */}
        {Object.keys(byType).length > 0 && (
          <div className="techiz-card fade-in p-4 mb-4">
            <h5 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Performance by Question Type</h5>
            <Row className="g-3">
              {Object.entries(byType).map(([type, data]) => (
                <Col key={type} xs={6} md={3}>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary)' }}>{data.correct}/{data.total}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>{typeLabels[type] || type}</div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gradient-primary)', width: `${(data.correct / data.total) * 100}%`, borderRadius: 2 }} />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Answer review */}
        {answers && answers.length > 0 && (
          <div className="techiz-card fade-in p-0 overflow-hidden">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Answer Review</h5>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {answers.map((a, i) => {
                const q = a.questionId;
                if (!q) return null;
                return (
                  <div key={i} style={{ padding: '16px', borderRadius: 10, border: `1px solid ${a.isCorrect ? 'var(--success)' : a.selectedAnswer ? 'var(--danger)' : 'var(--border)'}`, marginBottom: 12, background: a.isCorrect ? 'rgba(6,214,160,0.05)' : a.selectedAnswer ? 'rgba(239,71,111,0.05)' : 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, marginRight: 8 }}>Q{i + 1}.</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{q.question}</span>
                      </div>
                      <span style={{ flexShrink: 0, fontWeight: 700, color: a.isCorrect ? 'var(--success)' : a.selectedAnswer ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {a.isCorrect ? 'Correct' : a.selectedAnswer ? 'Incorrect' : 'Skipped'}
                      </span>
                    </div>
                    {a.selectedAnswer && <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your answer: <strong style={{ color: 'var(--text-primary)' }}>{a.selectedAnswer}</strong></div>}
                    {!a.isCorrect && q.answer && <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: 4 }}>Correct: <strong>{q.answer}</strong></div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ResultsPage;
