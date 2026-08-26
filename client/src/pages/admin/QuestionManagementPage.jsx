import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiEdit2, FiHelpCircle, FiPlus, FiSearch, FiTrash2, FiUpload } from 'react-icons/fi';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

const LANGS = ['java', 'python', 'c', 'cpp', 'javascript'];
const TYPES = ['mcq', 'output', 'syntax', 'error', 'coding'];
const DIFFS = ['easy', 'medium', 'hard'];
const EMPTY_Q = { language: 'java', type: 'mcq', question: '', codeSnippet: '', options: ['', '', '', ''], answer: '', difficulty: 'easy', explanation: '' };

const QuestionManagementPage = () => {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ language: '', type: '', difficulty: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [form, setForm] = useState(EMPTY_Q);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/questions?${params}`);
      setQuestions(data.data);
      setTotal(data.total);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const openCreate = () => { setForm(EMPTY_Q); setEditQ(null); setShowModal(true); };
  const openEdit = (q) => {
    setForm({ ...q, options: q.options?.length ? q.options : ['', '', '', ''] });
    setEditQ(q._id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        options: form.type === 'coding' ? [] : form.options.filter(Boolean),
      };
      if (editQ) await api.put(`/questions/${editQ}`, payload);
      else await api.post('/questions', payload);
      toast.success(editQ ? 'Question updated' : 'Question created');
      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setDeleting(id);
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted');
      fetchQuestions();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    try {
      const { data } = await api.post('/questions/bulk', fd);
      toast.success(`Uploaded ${data.inserted} questions`);
      setUploadFile(null);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const totalPages = Math.ceil(total / 15);
  const typeColors = { mcq: '#6c63ff', output: '#00d4aa', syntax: '#ff6b6b', coding: '#ffd166' };

  return (
    <div className="page-wrapper admin-page">
      <Container fluid>
        <div className="admin-header fade-in">
          <div>
            <div className="admin-eyebrow"><FiHelpCircle /> Content</div>
            <h2 className="admin-title">Question Management</h2>
            <p className="admin-subtitle">{total} questions in the assessment library</p>
          </div>
          <button className="btn-outline-techiz" onClick={openCreate}><FiPlus /> Create Question</button>
        </div>

        {/* Filters */}
        <div className="glass-card mb-4 fade-in" style={{ padding: '16px 20px' }}>
          <Row className="g-2 align-items-center">
            <Col md={3}><div style={{ position: 'relative' }}><FiSearch style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} /><input className="techiz-input" placeholder="Search questions" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ paddingLeft: 40 }} /></div></Col>
            <Col md={2}>
              <Form.Select className="techiz-input" value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} style={{ padding: '12px 10px' }}>
                <option value="">All Languages</option>
                {LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select className="techiz-input" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} style={{ padding: '12px 10px' }}>
                <option value="">All Types</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select className="techiz-input" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })} style={{ padding: '12px 10px' }}>
                <option value="">All Difficulty</option>
                {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="file" accept=".json,.csv" style={{ display: 'none' }} id="bulk-upload" onChange={(e) => setUploadFile(e.target.files[0])} />
                <label htmlFor="bulk-upload" className="btn-outline-techiz" style={{ cursor: 'pointer', margin: 0, fontSize: '0.8rem', padding: '8px 14px' }}>
                  <FiUpload /> {uploadFile ? uploadFile.name.substring(0, 10) + '...' : 'Bulk Upload'}
                </label>
                {uploadFile && (
                  <button className="btn-techiz" onClick={handleBulkUpload} disabled={uploading} style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </div>
            </Col>
          </Row>
        </div>

        {/* Table */}
        {loading ? <Spinner text="Loading questions..." /> : (
          <div className="techiz-card p-0 overflow-hidden fade-in">
            <div style={{ overflowX: 'auto' }}>
              <table className="techiz-table">
                <thead>
                  <tr><th>Language</th><th>Type</th><th>Question</th><th>Difficulty</th><th>Marks</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q._id}>
                      <td style={{ fontWeight: 600 }}>{q.language.toUpperCase()}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: `${typeColors[q.type]}22`, color: typeColors[q.type] }}>{q.type}</span>
                      </td>
                      <td style={{ maxWidth: 300, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question}
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: q.difficulty === 'easy' ? 'rgba(6,214,160,0.15)' : q.difficulty === 'medium' ? 'rgba(255,209,102,0.15)' : 'rgba(239,71,111,0.15)', color: q.difficulty === 'easy' ? 'var(--success)' : q.difficulty === 'medium' ? '#c8a200' : 'var(--danger)' }}>{q.difficulty}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{q.marks}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(q)} className="admin-icon-button" title="Edit question"><FiEdit2 /></button>
                          <button onClick={() => handleDelete(q._id)} disabled={deleting === q._id} className="admin-icon-button" title="Delete question" style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questions.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No questions found.</div>}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 20px', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid var(--border)' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: p === page ? 'var(--primary)' : 'var(--bg-secondary)', color: p === page ? '#fff' : 'var(--text-muted)' }}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header style={{ background: 'var(--bg-secondary)', border: 'none', padding: '24px 28px 0' }}>
            <h5 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{editQ ? 'Edit Question' : 'Create Question'}</h5>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
          </Modal.Header>
          <Modal.Body style={{ background: 'var(--bg-secondary)', padding: '20px 28px 28px' }}>
            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={4}>
                  <label className="techiz-label">Language *</label>
                  <Form.Select className="techiz-input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} style={{ padding: '12px 14px' }} required>
                    {LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <label className="techiz-label">Type *</label>
                  <Form.Select className="techiz-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, options: e.target.value === 'coding' ? [] : form.options.length === 1 ? ['', '', '', ''] : form.options })} style={{ padding: '12px 14px' }} required>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <label className="techiz-label">Difficulty</label>
                  <Form.Select className="techiz-input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} style={{ padding: '12px 14px' }}>
                    {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={12}>
                  <label className="techiz-label">Question *</label>
                  <textarea className="techiz-input" rows={3} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter the question text..." required />
                </Col>
                <Col xs={12}>
                  <label className="techiz-label">Code Snippet (optional)</label>
                  <textarea className="techiz-input" rows={4} value={form.codeSnippet} onChange={(e) => setForm({ ...form, codeSnippet: e.target.value })} placeholder="Paste code here..." style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.85rem' }} />
                </Col>
                {form.type !== 'coding' && (
                  <>
                    {form.options.map((opt, i) => (
                      <Col key={i} md={6}>
                        <label className="techiz-label">Option {String.fromCharCode(65 + i)}</label>
                        <input className="techiz-input" value={opt} onChange={(e) => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                      </Col>
                    ))}
                  </>
                )}
                <Col xs={12}>
                  <label className="techiz-label">Correct Answer *</label>
                  <input className="techiz-input" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Correct answer (must match one option exactly)" required />
                </Col>
                <Col xs={12}>
                  <label className="techiz-label">Explanation (optional)</label>
                  <input className="techiz-input" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Explanation for the answer..." />
                </Col>
              </Row>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn-techiz" disabled={saving}>{saving ? 'Saving...' : editQ ? 'Update' : 'Create'}</button>
                <button type="button" className="btn-outline-techiz" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default QuestionManagementPage;
