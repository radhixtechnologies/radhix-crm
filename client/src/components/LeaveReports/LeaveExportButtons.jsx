import { FiDownload, FiFileText, FiFile, FiTable } from 'react-icons/fi';
import '../../styles/leaveReports.css';

/**
 * Leave Export Buttons Component
 * Provides export options (PDF, Excel, CSV)
 */
const LeaveExportButtons = ({ data, reportType, filename = 'leave-report', leaves = null }) => {
  // Helper to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const exportToCSV = () => {
    if (!data || !data.length) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).map(escapeCSV).join(',');
    const rows = data.map(row => 
      Object.values(row).map(escapeCSV).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    if (!data || !data.length) {
      alert('No data to export');
      return;
    }

    try {
      // Use XLSX library if available, otherwise fallback to CSV
      if (window.XLSX) {
        const XLSX = window.XLSX;
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leave Report');
        XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // Fallback to CSV with Excel-compatible format
        exportToCSV();
        alert('Excel export downloaded as CSV. Install xlsx library for full Excel support.');
      }
    } catch (error) {
      console.error('Excel export error:', error);
      exportToCSV();
      alert('Excel export failed. CSV downloaded instead.');
    }
  };

  const exportToPDF = () => {
    if (!data || !data.length) {
      alert('No data to export');
      return;
    }

    try {
      // Use jsPDF if available
      if (window.jspdf) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('Leave Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
        
        // Prepare table data
        const headers = Object.keys(data[0]);
        const rows = data.map(row => Object.values(row));
        
        // Add table (using autoTable if available)
        if (doc.autoTable) {
          doc.autoTable({
            head: [headers],
            body: rows,
            startY: 35,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [99, 102, 241] },
          });
        } else {
          // Fallback: simple text output
          let y = 35;
          doc.text(headers.join(' | '), 14, y);
          y += 10;
          rows.slice(0, 20).forEach(row => {
            doc.text(row.join(' | '), 14, y);
            y += 7;
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
          });
        }
        
        doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        alert('PDF export requires jsPDF library. Please install: npm install jspdf jspdf-autotable');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export failed. Please ensure jsPDF is installed.');
    }
  };

  return (
    <div className="export-buttons">
      <button className="btn btn-secondary btn-sm" onClick={exportToCSV} title="Export to CSV">
        <FiTable /> CSV
      </button>
      <button className="btn btn-secondary btn-sm" onClick={exportToExcel} title="Export to Excel">
        <FiFile /> Excel
      </button>
      <button className="btn btn-secondary btn-sm" onClick={exportToPDF} title="Export to PDF">
        <FiFileText /> PDF
      </button>
    </div>
  );
};

export default LeaveExportButtons;

