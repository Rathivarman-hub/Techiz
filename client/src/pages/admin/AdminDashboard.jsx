import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FiBarChart2, FiCheckCircle, FiFileText, FiHelpCircle, FiPieChart, FiSettings, FiTrendingUp, FiUser, FiUsers } from 'react-icons/fi';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const langColors = { java: '#f89820', python: '#3776ab', c: '#a8b9cc', cpp: '#00599c', javascript: '#f7df1e' };
const LANGUAGE_LABELS = { java: 'Java', python: 'Python', c: 'C', cpp: 'C++', javascript: 'JavaScript' };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [langStats, setLangStats] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, l, t] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/language-stats'),
          api.get('/admin/trends'),
        ]);
        setStats(s.data.data);
        setLangStats(l.data.data);
        setTrends(t.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load admin dashboard data.');
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <Spinner text="Loading dashboard..." />;

  const statCards = [
    { icon: <FiUsers />, label: 'Total Students', value: stats?.totalStudents || 0, color: '#6c63ff' },
    { icon: <FiFileText />, label: 'Total Assessments', value: stats?.totalAssessments || 0, color: '#00d4aa' },
    { icon: <FiHelpCircle />, label: 'Total Questions', value: stats?.totalQuestions || 0, color: '#d99a3d' },
    { icon: <FiBarChart2 />, label: 'Average Score', value: `${stats?.avgScore || 0}%`, color: '#d96555' },
    { icon: <FiCheckCircle />, label: 'Pass Rate', value: `${stats?.passRate || 0}%`, color: '#27856b' },
  ];

  const doughnutData = {
    labels: langStats.map((l) => LANGUAGE_LABELS[l._id] || l._id.toUpperCase()),
    datasets: [{
      data: langStats.map((l) => l.count),
      backgroundColor: langStats.map((l) => langColors[l._id] || '#6c63ff'),
      borderWidth: 2,
      borderColor: 'var(--bg-card)',
    }],
  };

  const barData = {
    labels: langStats.map((l) => LANGUAGE_LABELS[l._id] || l._id.toUpperCase()),
    datasets: [{
      label: 'Avg Score %',
      data: langStats.map((l) => Math.round(l.avgScore || 0)),
      backgroundColor: langStats.map((l) => `${langColors[l._id] || '#6c63ff'}cc`),
      borderRadius: 8,
    }],
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = {
    labels: trends.map((t) => `${monthNames[t._id.month - 1]} ${t._id.year}`),
    datasets: [{
      label: 'Assessments',
      data: trends.map((t) => t.count),
      backgroundColor: 'rgba(108, 99, 255, 0.7)',
      borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: 'var(--text-secondary)' } } },
    scales: { x: { ticks: { color: 'var(--text-muted)' } }, y: { ticks: { color: 'var(--text-muted)' } } },
  };

  return (
    <div className="page-wrapper admin-page">
      <Container fluid>
        <div className="admin-header fade-in">
          <div>
            <div className="admin-eyebrow">Administration</div>
            <h2 className="admin-title">Dashboard</h2>
            <p className="admin-subtitle">Platform overview and performance metrics</p>
          </div>
        </div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <div className="admin-stat-grid">
          {statCards.map((s, i) => (
              <div key={i} className="stat-card admin-stat fade-in" style={{ cursor: 'default' }}>
                <span className="stat-icon">{s.icon}</span>
                <div className="stat-number" style={{ color: s.color, WebkitTextFillColor: s.color, fontSize: '2rem' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
          ))}
        </div>

        <Row className="g-3 mb-4">
          {[
            { icon: <FiHelpCircle />, label: 'Manage Questions', to: '/admin/questions' },
            { icon: <FiUsers />, label: 'View Students', to: '/admin/students' },
            { icon: <FiUser />, label: 'Profile', to: '/admin/profile' },
            { icon: <FiSettings />, label: 'Settings', to: '/admin/settings' },
          ].map((item) => (
            <Col key={item.to} xs={6} md={3}>
              <Link to={item.to} style={{ textDecoration: 'none' }}>
                <div className="techiz-card fade-in" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.label}</div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          <Col md={6} lg={4}>
            <div className="techiz-card admin-chart-card p-4 fade-in">
              <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}><FiPieChart /> Language Popularity</h6>
              {langStats.length > 0 ? <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { labels: { color: '#888' } } } }} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data yet</p>}
            </div>
          </Col>
          <Col md={6} lg={4}>
            <div className="techiz-card admin-chart-card p-4 fade-in">
              <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}><FiBarChart2 /> Average Score by Language</h6>
              {langStats.length > 0 ? <Bar data={barData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data yet</p>}
            </div>
          </Col>
          <Col md={12} lg={4}>
            <div className="techiz-card admin-chart-card p-4 fade-in">
              <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}><FiTrendingUp /> Monthly Attempts</h6>
              {trends.length > 0 ? <Bar data={trendData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data yet</p>}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;
