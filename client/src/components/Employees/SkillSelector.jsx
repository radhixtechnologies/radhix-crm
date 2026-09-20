import '../../styles/forms.css';

const SkillSelector = ({ value, onChange, placeholder = "Select or type a skill..." }) => {
  const commonSkills = [
    'React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++',
    'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
    'GraphQL', 'REST API', 'Git', 'CI/CD', 'Agile', 'Scrum'
  ];

  return (
    <div className="skill-selector">
      <input
        type="text"
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list="common-skills"
      />
      <datalist id="common-skills">
        {commonSkills.map((skill, idx) => (
          <option key={idx} value={skill} />
        ))}
      </datalist>
    </div>
  );
};

export default SkillSelector;

