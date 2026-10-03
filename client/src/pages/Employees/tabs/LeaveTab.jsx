import { useState, useEffect } from 'react';
import { employeeService } from '../../../services/employeeService';
import { formatDate } from '../../../utils/format';
import LeaveCard from '../../../components/Employees/LeaveCard';
import '../../../styles/forms.css';

const LeaveTab = ({ employeeId }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchLeaves();
    }
  }, [employeeId]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getLeaves();
      if (response.data.success) {
        const empLeaves = response.data.data.filter(l => l.employee?._id === employeeId);
        setLeaves(empLeaves);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading leaves...</div>;
  }

  return (
    <div className="leave-tab">
      {leaves.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {leaves.map((leave) => (
            <LeaveCard key={leave._id} leave={leave} />
          ))}
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No leave records found
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTab;

