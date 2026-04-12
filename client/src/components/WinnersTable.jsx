import { FiPlus, FiTrash2 } from 'react-icons/fi';
import './WinnersTable.css';

const emptyWinner = { place: 'I', name: '', rollNumber: '', classSec: '', phone: '' };

export default function WinnersTable({ winners, onChange }) {
  const addRow = () => {
    onChange([...winners, { ...emptyWinner }]);
  };

  const removeRow = (index) => {
    onChange(winners.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const updated = winners.map((w, i) =>
      i === index ? { ...w, [field]: value } : w
    );
    onChange(updated);
  };

  return (
    <div className="winners-container">
      {winners.length > 0 && (
        <div className="winners-table-wrapper">
          <table className="winners-edit-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Place</th>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Class/Sec</th>
                <th>Phone</th>
                <th style={{ width: '44px' }}></th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner, idx) => (
                <tr key={idx} className="animate-fade-in">
                  <td>
                    <select
                      className="form-select winners-select"
                      value={winner.place}
                      onChange={(e) => updateRow(idx, 'place', e.target.value)}
                    >
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="form-input winners-input"
                      placeholder="Winner name"
                      value={winner.name}
                      onChange={(e) => updateRow(idx, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="form-input winners-input"
                      placeholder="Roll number"
                      value={winner.rollNumber}
                      onChange={(e) => updateRow(idx, 'rollNumber', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="form-input winners-input"
                      placeholder="e.g. III-A"
                      value={winner.classSec}
                      onChange={(e) => updateRow(idx, 'classSec', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="form-input winners-input"
                      placeholder="Phone"
                      value={winner.phone}
                      onChange={(e) => updateRow(idx, 'phone', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-icon btn-ghost winners-delete"
                      onClick={() => removeRow(idx)}
                      title="Remove winner"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn btn-outline btn-sm winners-add" onClick={addRow}>
        <FiPlus /> Add Winner
      </button>

      {winners.length === 0 && (
        <p className="winners-empty">No winners added yet. Click "Add Winner" to begin.</p>
      )}
    </div>
  );
}
