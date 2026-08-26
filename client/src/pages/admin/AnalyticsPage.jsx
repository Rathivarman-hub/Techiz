import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { FiBarChart2, FiCheckCircle, FiFileText, FiGlobe, FiTrendingUp, FiUsers } from 'react-icons/fi';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const AnalyticsPage = () => {
  const [langStats, setLangStats] = useState([]);
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([api.get('/admin/stats'), api.get('/admin/language-stats'), api.get('/admin/trends')])
      .then(([statsResult, languageResult, trendsResult]) => {
        if (statsResult.status === 'fulfilled') setStats(statsResult.value.data.data);
        if (languageResult.status === 'fulfilled') setLangStats(languageResult.value.data.data);
        if (trendsResult.status === 'fulfilled') setTrends(trendsResult.value.data.data);
        if ([statsResult, languageResult, trendsResult].some((result) => result.status === 'rejected')) {
          setError('Some analytics data could not be loaded.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading analytics..." />;

  const langColors = { java: '#f89820', python: '#3776ab', c: '#a8b9cc', cpp: '#00599c', javascript: '#f7df1e' };
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const opts = { responsive: true, plugins: { legend: { labels: { color: '#888' } } }, scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } } };

  const charts = [
    {
      title: <><FiGlobe /> Language Distribution</>,
      chart: <Doughnut data={{ labels: langStats.map((l) => l._id.toUpperCase()), datasets: [{ data: langStats.map((l) => l.count), backgroundColor: langStats.map((l) => langColors[l._id] || '#6c63ff'), borderWidth: 2 }] }} options={{ responsive: true, plugins: { legend: { labels: { color: '#888' } } } }} />,
    },
    {
      title: <><FiBarChart2 /> Average Score by Language</>,
      chart: <Bar data={{ labels: langStats.map((l) => l._id.toUpperCase()), datasets: [{ label: 'Avg %', data: langStats.map((l) => Math.round(l.avgScore || 0)), backgroundColor: langStats.map((l) => `${langColors[l._id] || '#6c63ff'}cc`), borderRadius: 8 }] }} options={{ ...opts, plugins: { ...opts.plugins, legend: { display: false } } }} />,
    },
    {
      title: <><FiTrendingUp /> Monthly Attempt Trends</>,
      chart: <Line data={{ labels: trends.map((t) => `${monthNames[t._id.month - 1]} ${t._id.year}`), datasets: [{ label: 'Assessments', data: trends.map((t) => t.count), borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.1)', borderWidth: 2, pointBackgroundColor: '#6c63ff', tension: 0.4, fill: true }] }} options={opts} />,
    },
    {
      title: <><FiBarChart2 /> Average Score Trend</>,
      chart: <Line data={{ labels: trends.map((t) => `${monthNames[t._id.month - 1]} ${t._id.year}`), datasets: [{ label: 'Avg Score %', data: trends.map((t) => Math.round(t.avgScore || 0)), borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.1)', borderWidth: 2, pointBackgroundColor: '#00d4aa', tension: 0.4, fill: true }] }} options={opts} />,
    },
  ];

  return (
    <div className="page-wrapper admin-page">
      <Container fluid>
        <div className="admin-header fade-in">
          <div>
            <div className="admin-eyebrow"><FiTrendingUp /> Reporting</div>
            <h2 className="admin-title">Analytics</h2>
            <p className="admin-subtitle">Performance trends across the assessment platform</p>
          </div>
        </div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {/* Summary */}
        <Row className="g-3 mb-4">
          {[
            { label: 'Students', value: stats?.totalStudents || 0, icon: <FiUsers /> },
            { label: 'Assessments', value: stats?.totalAssessments || 0, icon: <FiFileText /> },
            { label: 'Average Score', value: `${stats?.avgScore || 0}%`, icon: <FiBarChart2 /> },
            { label: 'Pass Rate', value: `${stats?.passRate || 0}%`, icon: <FiCheckCircle /> },
          ].map((s, i) => (
            <Col key={i} xs={6} md={3}>
              <div className="stat-card admin-stat fade-in" style={{ cursor: 'default' }}>
                <span className="stat-icon">{s.icon}</span>
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          {charts.map((c, i) => (
            <Col key={i} md={6}>
              <div className="techiz-card admin-chart-card p-4 fade-in">
                <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>{c.title}</h6>
                {((i < 2 && langStats.length > 0) || (i >= 2 && trends.length > 0)) ? c.chart : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No data yet</p>}
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default AnalyticsPage;
