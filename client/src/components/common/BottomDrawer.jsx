import { useEffect } from 'react';
import { FiX, FiZap } from 'react-icons/fi';
import '../../styles/mobile-enhancements.css';

const BottomDrawer = ({ isOpen, onClose, children, title = "Quick Actions" }) => {
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on overlay click
    const handleOverlayClick = () => {
        onClose();
    };

    // Prevent closing when clicking inside drawer
    const handleDrawerClick = (e) => {
        e.stopPropagation();
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`bottom-drawer-overlay ${isOpen ? 'active' : ''}`}
                onClick={handleOverlayClick}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className={`bottom-drawer ${isOpen ? 'active' : ''}`}
                onClick={handleDrawerClick}
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-title"
            >
                {/* Handle */}
                <div className="bottom-drawer-handle" />

                {/* Header */}
                <div className="bottom-drawer-header">
                    <h2 id="drawer-title" className="bottom-drawer-title">
                        <FiZap />
                        {title}
                    </h2>
                    <button
                        className="bottom-drawer-close"
                        onClick={onClose}
                        aria-label="Close drawer"
                    >
                        <FiX />
                    </button>
                </div>

                {/* Content */}
                <div className="bottom-drawer-content">
                    {children}
                </div>
            </div>
        </>
    );
};

export default BottomDrawer;
