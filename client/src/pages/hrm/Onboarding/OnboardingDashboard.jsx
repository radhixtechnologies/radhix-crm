import { useEffect, useState } from 'react';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/onboarding.css';

const OnboardingDashboard = ({ employeeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [checklist, setChecklist] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, checklistRes] = await Promise.all([
        hrmService.getOnboardingTasks(employeeId),
        hrmService.getNewHireChecklist(employeeId),
      ]);
      setTasks(tasksRes.data.data || []);
      setChecklist(checklistRes.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  if (loading) return <div className="page-container">Loading onboarding...</div>;
  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Onboarding Dashboard</h1>
      </div>

      <div className="section two-col">
        <div>
          <h2>Tasks</h2>
          <div className="simple-table">
            <div className="table-header">
              <div>Title</div>
              <div>Status</div>
              <div>Due</div>
            </div>
            {tasks.map((t) => (
              <div className="table-row" key={t._id}>
                <div>{t.title}</div>
                <div>{t.status}</div>
                <div>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>Checklist</h2>
          <ul>
            {checklist.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDashboard;


