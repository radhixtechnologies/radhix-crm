import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import EmployeeForm from '../../components/Employees/EmployeeForm';
import '../../styles/forms.css';

const AddEmployee = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const submitData = {
        employeeId: formData.employeeId,
        department: formData.department,
        designation: formData.designation,
        idDeptCode: formData.idDeptCode,
      };

      if (formData.salary) {
        submitData.salary = formData.salary;
      }
      if (formData.phone) {
        submitData.phone = formData.phone;
      }
      if (formData.role) {
        submitData.role = formData.role;
      }

      if (formData.userId) {
        submitData.userId = formData.userId;
      } else {
        submitData.name = formData.name;
        submitData.email = formData.email;
        // Include password if provided
        if (formData.password) {
          submitData.password = formData.password;
        }
      }

      const response = await employeeService.createEmployee(submitData);

      // Show success message with generated password if available
      let successMessage = 'Employee created successfully!';
      if (response.data.generatedPassword) {
        successMessage = `Employee created successfully!\n\nTemporary Password: ${response.data.generatedPassword}\n\nPlease share this password with the employee securely.`;
      }

      const showPassword = window.confirm(successMessage + '\n\nDo you want to copy the password to clipboard?');
      if (showPassword && response.data.generatedPassword) {
        navigator.clipboard.writeText(response.data.generatedPassword).catch(console.error);
        alert('Password copied to clipboard!');
      }

      navigate(`/employees/${response.data.data._id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error creating employee';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in add-employee-page">
      <div className="page-header">
        <h1 className="page-title">Add Employee</h1>
        <p className="page-subtitle">Create a new employee profile</p>
      </div>

      <div className="page-content">
        <EmployeeForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default AddEmployee;

