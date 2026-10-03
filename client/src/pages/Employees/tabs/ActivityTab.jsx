import { useState, useEffect } from 'react';
import { employeeService } from '../../../services/employeeService';
import { formatDate } from '../../../utils/format';
import Timeline from '../../../components/Employees/Timeline';
import '../../../styles/forms.css';

const ActivityTab = ({ employeeId }) => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchActivityLogs();
    }
  }, [employeeId]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getActivityLogs(employeeId);
      if (response.data.success) {
        setActivityLogs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading activity logs...</div>;
  }

  return (
    <div className="activity-tab">
      <div className="card">
        <h3 className="card-title">Activity Timeline</h3>
        {activityLogs.length > 0 ? (
          <Timeline logs={activityLogs} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No activity logs found
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;

