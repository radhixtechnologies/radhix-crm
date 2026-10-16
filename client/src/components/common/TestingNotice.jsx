import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';

// Shown once per login session while the portal is in testing
const TestingNotice = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      return;
    }
    const sessionKey = `testingNoticeSeen:${localStorage.getItem('sessionId') || localStorage.getItem('token')}`;
    if (!sessionStorage.getItem(sessionKey)) setOpen(true);
  }, [isAuthenticated]);

  const handleClose = () => {
    const sessionKey = `testingNoticeSeen:${localStorage.getItem('sessionId') || localStorage.getItem('token')}`;
    sessionStorage.setItem(sessionKey, '1');
    setOpen(false);
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="Testing Mode" size="sm">
      <div style={{ padding: '8px 4px 4px', textAlign: 'center' }}>
        <img src="/radhix-logo.png" alt="Radhix Technologies" style={{ height: 64, width: 'auto', marginBottom: 12 }} />
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>
          This portal is currently under testing.
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
          Some features may change or not work as expected. Please report any issue to the Radhix team.
        </p>
        <button type="button" className="btn btn-primary" onClick={handleClose} style={{ minWidth: 120 }}>
          OK, Got it
        </button>
      </div>
    </Modal>
  );
};

export default TestingNotice;
