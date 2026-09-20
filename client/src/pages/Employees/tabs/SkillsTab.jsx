import { useState } from 'react';
import { employeeService } from '../../../services/employeeService';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Modal from '../../../components/common/Modal';
import SkillSelector from '../../../components/Employees/SkillSelector';
import '../../../styles/forms.css';

const SkillsTab = ({ employee, canEdit, onRefresh }) => {
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillForm, setSkillForm] = useState({ name: '', proficiency: 'intermediate', yearsOfExperience: 0 });

  const handleAddSkill = async () => {
    try {
      await employeeService.addSkill(employee._id, skillForm);
      setShowSkillModal(false);
      setSkillForm({ name: '', proficiency: 'intermediate', yearsOfExperience: 0 });
      onRefresh();
      alert('Skill added successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding skill');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    try {
      await employeeService.deleteSkill(employee._id, skillId);
      onRefresh();
      alert('Skill deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting skill');
    }
  };

  return (
    <div className="skills-tab">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Skills Matrix</h3>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowSkillModal(true)}>
              <FiPlus /> Add Skill
            </button>
          )}
        </div>
        {employee.skills && employee.skills.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '20px' }}>
            {employee.skills.map((skill, idx) => (
              <div key={skill._id || idx} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontWeight: 600 }}>{skill.name}</h4>
                    <div style={{ marginBottom: '8px' }}>
                      <span className={`badge badge-${skill.proficiency === 'expert' ? 'success' : skill.proficiency === 'advanced' ? 'info' : skill.proficiency === 'intermediate' ? 'warning' : 'secondary'}`}>
                        {skill.proficiency}
                      </span>
                    </div>
                    {skill.yearsOfExperience && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {skill.yearsOfExperience} year(s) of experience
                      </div>
                    )}
                    {skill.certifications && skill.certifications.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Certifications:</div>
                        {skill.certifications.map((cert, cIdx) => (
                          <div key={cIdx} style={{ fontSize: '12px', marginLeft: '8px' }}>
                            • {cert.name} {cert.issuer && `(${cert.issuer})`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSkill(skill._id)}>
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No skills added yet
          </div>
        )}
      </div>

      <Modal isOpen={showSkillModal} onClose={() => setShowSkillModal(false)} title="Add Skill">
        <form onSubmit={(e) => { e.preventDefault(); handleAddSkill(); }}>
          <div className="form-group">
            <label className="form-label">Skill Name *</label>
            <input
              type="text"
              className="form-input"
              value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              required
              placeholder="e.g., React, Node.js, AWS"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Proficiency Level *</label>
            <select
              className="form-select"
              value={skillForm.proficiency}
              onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value })}
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input
              type="number"
              className="form-input"
              value={skillForm.yearsOfExperience}
              onChange={(e) => setSkillForm({ ...skillForm, yearsOfExperience: Number(e.target.value) })}
              min="0"
              placeholder="0"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Skill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SkillsTab;

