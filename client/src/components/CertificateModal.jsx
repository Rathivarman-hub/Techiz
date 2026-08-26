import React, { useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CertificateModal = ({ show, onHide, cert }) => {
  const certRef = useRef();

  const downloadPDF = async () => {
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#1a1a2e' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`Techiz_Certificate_${cert?.language?.toUpperCase()}.pdf`);
  };

  if (!cert) return null;

  const langMap = { java: 'Java', python: 'Python', c: 'C', cpp: 'C++', javascript: 'JavaScript' };
  const date = new Date(cert.issuedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Body style={{ background: 'var(--bg-secondary)', padding: '24px' }}>
        {/* Certificate Preview */}
        <div ref={certRef} className="certificate-wrapper" style={{ margin: '0 auto' }}>
          {/* Decorative corners */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
            <div key={pos} style={{
              position: 'absolute',
              width: 40, height: 40,
              border: '3px solid rgba(108,99,255,0.5)',
              borderRadius: pos.includes('top') && pos.includes('left') ? '12px 0 0 0' : pos.includes('top') ? '0 12px 0 0' : pos.includes('left') ? '0 0 0 12px' : '0 0 12px 0',
              top: pos.includes('top') ? 30 : 'auto',
              bottom: pos.includes('bottom') ? 30 : 'auto',
              left: pos.includes('left') ? 30 : 'auto',
              right: pos.includes('right') ? 30 : 'auto',
            }} />
          ))}

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12, fontWeight: 800 }}>T</div>
            <div className="cert-title">Certificate of Achievement</div>
            <div className="cert-subtitle">Techiz Programming Assessment Platform</div>

            <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8, fontSize: '1rem' }}>
              This is to certify that
            </div>
            <div className="cert-student-name">{cert.studentName}</div>

            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: 6 }}>
              has successfully completed the
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 20 }}>
              {langMap[cert.language] || cert.language} Programming Assessment
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 30 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6c63ff' }}>{cert.score}/{cert.maxScore}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Score</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00d4aa' }}>{cert.percentage}%</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Percentage</div>
              </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              Issued on {date}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-techiz" onClick={downloadPDF}>
            Download PDF
          </button>
          <button className="btn-outline-techiz" onClick={onHide}>
            Close
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CertificateModal;
