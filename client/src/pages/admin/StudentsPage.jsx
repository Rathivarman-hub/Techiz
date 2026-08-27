import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp, FiDownload, FiEdit2, FiSearch, FiUsers } from 'react-icons/fi';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentAssessments, setStudentAssessments] = useState({});
  const [loadingAssessments, setLoadingAssessments] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', maxScore: '' });
  const [updatingMarks, setUpdatingMarks] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/students?page=${page}&limit=15${search ? `&search=${search}` : ''}`);
        setStudents(data.data);
        setTotal(data.total);
      } finally { setLoading(false); }
    };
    const t = setTimeout(fetch, 300);
    return () => clearTimeout(t);
  }, [page, search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/export-students', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'techiz_students.csv';
      a.click();
      toast.success('CSV downloaded');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handleExpandStudent = async (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
      return;
    }
    
    if (!studentAssessments[studentId]) {
      setLoadingAssessments((prev) => ({ ...prev, [studentId]: true }));
      try {
        const { data } = await api.get(`/admin/students/${studentId}/assessments`);
        setStudentAssessments((prev) => ({ ...prev, [studentId]: data.data }));
      } catch {
        toast.error('Failed to load assessments');
      } finally {
        setLoadingAssessments((prev) => ({ ...prev, [studentId]: false }));
      }
    }
    setExpandedStudent(studentId);
  };

  const handleEditMarks = (assessment) => {
    setEditingAssessment(assessment);
    setEditForm({ score: assessment.score, maxScore: assessment.maxScore });
    setShowEditModal(true);
  };

  const handleUpdateMarks = async () => {
    if (!editForm.score && editForm.score !== 0 || !editForm.maxScore) {
      toast.warning('Please fill all fields');
      return;
    }

    setUpdatingMarks(true);
    try {
      const { data } = await api.put(`/admin/assessment/${editingAssessment._id}/marks`, {
        score: parseFloat(editForm.score),
        maxScore: parseFloat(editForm.maxScore),
      });
      
      toast.success('Marks updated successfully');
      setShowEditModal(false);
      
      // Update student assessments in state
      setStudentAssessments((prev) => ({
        ...prev,
        [editingAssessment.userId]: prev[editingAssessment.userId].map((a) =>
          a._id === editingAssessment._id
            ? { ...a, score: data.data.score, maxScore: data.data.maxScore, percentage: data.data.percentage }
            : a
        ),
      }));
      
      // Update students list
      setStudents((prev) =>
        prev.map((s) => {
          if (s._id === editingAssessment.userId) {
            return {
              ...s,
              assessmentStats: {
                ...s.assessmentStats,
                bestScore: Math.max(s.assessmentStats?.bestScore || 0, data.data.score),
                bestPct: Math.max(s.assessmentStats?.bestPct || 0, data.data.percentage),
              },
            };
          }
          return s;
        })
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update marks');
    } finally {
      setUpdatingMarks(false);
    }
  };

  const totalPages = Math.ceil(total / 15);
  const langMap = { java: 'Java', python: 'Python', c: 'C', cpp: 'C++', javascript: 'JavaScript' };

  return (
    <div className="page-wrapper admin-page">
      <Container fluid>
        <div className="admin-header fade-in">
          <div>
            <div className="admin-eyebrow"><FiUsers /> Directory</div>
            <h2 className="admin-title">Students</h2>
            <p className="admin-subtitle">{total} registered students and assessment history</p>
          </div>
          <button className="btn-techiz" onClick={handleExport} disabled={exporting}>
            <FiDownload /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="glass-card mb-4 fade-in" style={{ padding: '14px 20px' }}>
          <div className="admin-search" style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
            <input className="techiz-input" placeholder="Search by name, email or college" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          </div>
        </div>

        {loading ? <Spinner text="Loading students..." /> : (
          <div className="techiz-card p-0 overflow-hidden fade-in">
            <div className="admin-table-wrap">
              <table className="techiz-table admin-table">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Email</th><th>College</th><th>Roll No.</th><th>Attempts</th><th>Best Score</th><th>Best %</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const bestScore = Number(s.assessmentStats?.bestScore ?? 0);
                    const bestPct = Number(s.assessmentStats?.bestPct ?? 0);

                    return (
                      <React.Fragment key={s._id}>
                        <tr>
                          <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 15 + i + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.email}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.college || '—'}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.rollNumber || '—'}</td>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.assessmentStats?.attempts || 0}</td>
                          <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{bestScore}</td>
                          <td>
                            {bestPct > 0 ? (
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: bestPct >= 70 ? 'rgba(6,214,160,0.15)' : 'rgba(255,209,102,0.15)', color: bestPct >= 70 ? 'var(--success)' : '#c8a200' }}>
                                {bestPct}%
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                          <td>
                            <button
                              onClick={() => handleExpandStudent(s._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '1.2rem' }}
                              title="View assessments"
                            >
                              {expandedStudent === s._id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>

                        {expandedStudent === s._id && (
                          <tr style={{ background: 'var(--bg-secondary)' }}>
                            <td colSpan="10" style={{ padding: '16px' }}>
                              {loadingAssessments[s._id] ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading assessments...</div>
                              ) : studentAssessments[s._id]?.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assessments taken</div>
                              ) : (
                                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                      <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Language</th>
                                      <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Score</th>
                                      <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Percentage</th>
                                      <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Status</th>
                                      <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Date</th>
                                      <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {studentAssessments[s._id]?.map((a) => (
                                      <tr key={a._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px' }}>{langMap[a.language] || a.language}</td>
                                        <td style={{ padding: '8px', fontWeight: 600 }}>{a.score}/{a.maxScore}</td>
                                        <td style={{ padding: '8px', fontWeight: 600, color: a.percentage >= 70 ? 'var(--success)' : a.percentage >= 40 ? '#c8a200' : 'var(--danger)' }}>
                                          {a.percentage}%
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                          {a.status === 'completed' ? (
                                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(6,214,160,0.15)', color: 'var(--success)' }}>completed</span>
                                          ) : a.status === 'failed' ? (
                                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: 'var(--danger)' }}>failed</span>
                                          ) : a.status === 'auto-submitted' ? (
                                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,209,102,0.15)', color: '#c8a200' }}>auto-submitted</span>
                                          ) : (
                                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,209,102,0.15)', color: '#c8a200' }}>{a.status}</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                                          {new Date(a.completedAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                          <button
                                            onClick={() => handleEditMarks({ ...a, userId: s._id })}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                                            title="Edit marks"
                                          >
                                            <FiEdit2 size={16} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {students.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No students found.</div>}
            </div>
            {totalPages > 1 && (
              <div style={{ padding: '12px 20px', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid var(--border)' }}>
                <button className="admin-icon-button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} title="Previous page"><FiChevronLeft /></button>
                <span style={{ padding: '4px 12px', color: 'var(--text-muted)' }}>Page {page}/{totalPages}</span>
                <button className="admin-icon-button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} title="Next page"><FiChevronRight /></button>
              </div>
            )}
          </div>
        )}
      </Container>

      {/* Edit Marks Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border)' }}>
          <Modal.Title style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Edit Assessment Marks</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          {editingAssessment && (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                <strong>Language:</strong> {langMap[editingAssessment.language] || editingAssessment.language}
              </p>
              <Form.Group className="mb-3">
                <Form.Label style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Marks Obtained</Form.Label>
                <Form.Control
                  type="number"
                  value={editForm.score}
                  onChange={(e) => setEditForm((f) => ({ ...f, score: e.target.value }))}
                  placeholder="Enter score"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total Marks</Form.Label>
                <Form.Control
                  type="number"
                  value={editForm.maxScore}
                  onChange={(e) => setEditForm((f) => ({ ...f, maxScore: e.target.value }))}
                  placeholder="Enter max score"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowEditModal(false)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateMarks}
            disabled={updatingMarks}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--primary)', color: '#fff', cursor: 'pointer', border: 'none' }}
          >
            {updatingMarks ? 'Updating...' : 'Update Marks'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentsPage;
