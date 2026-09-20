import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/finance/income-expense-chart.css';

const IncomeExpenseChart = ({ data }) => {
  return (
    <div className="income-expense-chart">
      <h3>Income vs Expense</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#22c55e" name="Income" />
          <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Expense" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;

