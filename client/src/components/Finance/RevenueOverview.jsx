import { formatCurrency } from '../../utils/format';
import '../../styles/finance/revenue-overview.css';

const RevenueOverview = ({ data }) => {
  return (
    <div className="revenue-overview">
      <div className="revenue-card">
        <h4>Total Revenue</h4>
        <p className="revenue-amount">{formatCurrency(data?.totalRevenue || 0)}</p>
      </div>
      <div className="revenue-card">
        <h4>Outstanding</h4>
        <p className="revenue-amount">{formatCurrency(data?.outstanding || 0)}</p>
      </div>
      <div className="revenue-card">
        <h4>Expenses</h4>
        <p className="revenue-amount">{formatCurrency(data?.totalExpenses || 0)}</p>
      </div>
      <div className="revenue-card">
        <h4>Net Profit</h4>
        <p className="revenue-amount">{formatCurrency(data?.netProfit || 0)}</p>
      </div>
    </div>
  );
};

export default RevenueOverview;

