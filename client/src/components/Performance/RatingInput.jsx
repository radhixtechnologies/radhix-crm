import { FiStar } from 'react-icons/fi';
import '../../styles/performance.css';

/**
 * Rating Input Component
 * 1-5 star rating input
 */
const RatingInput = ({ value, onChange, disabled = false }) => {
  const handleClick = (rating) => {
    if (!disabled && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`rating-star ${star <= value ? 'rating-star-filled' : 'rating-star-empty'}`}
          onClick={() => handleClick(star)}
          disabled={disabled}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <FiStar size={24} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
      {value > 0 && <span className="rating-value">{value}/5</span>}
    </div>
  );
};

export default RatingInput;

