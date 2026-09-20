import '../../styles/dashboard.css';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="loader">
      <div>
        <div className="spinner"></div>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>{message}</p>
      </div>
    </div>
  );
};

export default Loader;

