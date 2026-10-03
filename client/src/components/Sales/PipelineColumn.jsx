import { useState } from 'react';
import DealCard from './DealCard';
import { formatCurrency } from '../../utils/format';
import '../../styles/sales/pipeline.css';

const PipelineColumn = ({ stage, deals, onDragOver, onDrop, onDealClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId && onDrop) {
      onDrop(e, dealId);
    }
  };

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div
      className={`pipeline-column ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ '--stage-color': stage.color }}
    >
      <div className="column-header">
        <div className="column-header-top">
          <h3 className="column-title">{stage.name}</h3>
          <span className="deal-count-badge">{deals.length}</span>
        </div>
        <div className="column-total">
          {formatCurrency(totalValue)}
        </div>
      </div>
      <div className="deals-container">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <DealCard key={deal._id} deal={deal} onClick={() => onDealClick(deal._id)} />
          ))
        ) : (
          <div className="empty-column">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No deals yet</div>
            <div className="empty-subtitle">Drag a deal here</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineColumn;

