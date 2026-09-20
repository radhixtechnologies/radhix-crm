import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import EmployeeForm from '../../components/Employees/EmployeeForm';
import Loader from '../../components/common/Loader';
import '../../styles/forms.css';

const EditEmployee = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [employee, setEmployee] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                const response = await employeeService.getEmployee(id);
                if (response.data.success) {
                    setEmployee(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching employee:', error);
                alert('Error fetching employee details');
                navigate('/employees');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [id, navigate]);

    const handleSubmit = async (formData) => {
        try {
            setSubmitting(true);
            const submitData = {
                employeeId: formData.employeeId,
                department: formData.department,
                designation: formData.designation,
                role: formData.role,
                salary: formData.salary,
                phone: formData.phone,
                idDeptCode: formData.idDeptCode
            };

            await employeeService.updateEmployee(id, submitData);
            alert('Employee updated successfully!');
            navigate(`/employees/${id}`);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Error updating employee';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="fade-in add-employee-page">
            <div className="page-header">
                <h1 className="page-title">Edit Employee</h1>
                <p className="page-subtitle">Update profile for {employee?.user?.name || 'Employee'}</p>
            </div>

            <div className="page-content">
                <EmployeeForm
                    onSubmit={handleSubmit}
                    loading={submitting}
                    initialData={employee}
                />
            </div>
        </div>
    );
};

export default EditEmployee;
