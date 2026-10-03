import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import '../../styles/finance/add-item-row.css';

const AddItemRow = ({ item, index, onChange, onDelete, isLast }) => {
  const [description, setDescription] = useState(item?.description || '');
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [rate, setRate] = useState(item?.rate || 0);

  const calculateAmount = (qty, rte) => {
    const amount = qty * rte;
    onChange(index, { description, quantity: qty, rate: rte, amount });
    return amount;
  };

  const handleQuantityChange = (e) => {
    const qty = parseFloat(e.target.value) || 0;
    setQuantity(qty);
    calculateAmount(qty, rate);
  };

  const handleRateChange = (e) => {
    const rte = parseFloat(e.target.value) || 0;
    setRate(rte);
    calculateAmount(quantity, rte);
  };

  const handleDescriptionChange = (e) => {
    const desc = e.target.value;
    setDescription(desc);
    onChange(index, { description: desc, quantity, rate, amount: quantity * rate });
  };

  return (
    <tr className="add-item-row">
      <td>
        <input
          type="text"
          className="form-input"
          placeholder="Description"
          value={description}
          onChange={handleDescriptionChange}
        />
      </td>
      <td>
        <input
          type="number"
          className="form-input"
          placeholder="Qty"
          value={quantity}
          onChange={handleQuantityChange}
          min="0"
          step="0.01"
        />
      </td>
      <td>
        <input
          type="number"
          className="form-input"
          placeholder="Rate"
          value={rate}
          onChange={handleRateChange}
          min="0"
          step="0.01"
        />
      </td>
      <td className="amount">${(quantity * rate).toFixed(2)}</td>
      <td>
        {!isLast && (
          <button className="btn-icon btn-error" onClick={() => onDelete(index)} title="Remove">
            <FiTrash2 />
          </button>
        )}
      </td>
    </tr>
  );
};

export default AddItemRow;

