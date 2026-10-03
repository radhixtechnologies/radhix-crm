import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/sales/deal-card.css';

const DealCard = ({ deal, onClick }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('dealId', deal._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Get owner initials
  const getOwnerInitials = () => {
    const ownerName = deal.assignedTo?.user?.name || deal.owner?.name || 'Unassigned';
    if (ownerName === 'Unassigned') return 'U';
    return ownerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const ownerName = deal.assignedTo?.user?.name || deal.owner?.name || 'Unassigned';
  const probability = deal.probability || 0;

  return (
    <div className="deal-card" onClick={onClick} draggable onDragStart={handleDragStart}>
      {/* Header: Deal Name + Amount */}
      <div className="deal-card-header">
        <h4 className="deal-card-title">{deal.title || deal.name || 'Untitled Deal'}</h4>
        <div className="deal-card-value">{formatCurrency(deal.value || 0)}</div>
      </div>

      {/* Secondary: Client/Company */}
      {deal.client?.name && (
        <div className="deal-card-company">{deal.client.name}</div>
      )}

      {/* Probability Section */}
      <div className="deal-card-probability">
        <div className="probability-bar">
          <div
            className="probability-fill"
            style={{ width: `${probability}%` }}
          ></div>
        </div>
        <span className="probability-percentage">{probability}%</span>
      </div>

      {/* Footer: Owner */}
      <div className="deal-card-footer">
        <div className="deal-card-owner">
          <div className="owner-avatar">{getOwnerInitials()}</div>
          <span className="owner-name">{ownerName}</span>
        </div>
      </div>
    </div>
  );
};

export default DealCard;

