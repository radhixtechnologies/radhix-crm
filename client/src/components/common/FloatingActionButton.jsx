import { FiPlus } from 'react-icons/fi';
import '../../styles/mobile-enhancements.css';

const FloatingActionButton = ({ onClick, isActive = false, icon: Icon = FiPlus, ariaLabel = "Quick actions" }) => {
    return (
        <div className="fab-container">
            <button
                className={`fab-button ${isActive ? 'active' : ''}`}
                onClick={onClick}
                aria-label={ariaLabel}
                aria-expanded={isActive}
            >
                <Icon />
            </button>
        </div>
    );
};

export default FloatingActionButton;
