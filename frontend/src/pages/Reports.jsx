import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  Clock,
  Layers,
  FileSpreadsheet,
  FileText,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('daily_attendance'); // 'daily_attendance' | 'monthly_fees' | 'pending_fees' | 'expired' | 'branches'
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const loadReport = async () => {
    setLoading(true);
    setReportData([]);
    setSummary(null);

    try {
      if (activeReport === 'daily_attendance') {
        const res = await api.getDailyAttendanceReport({ date: selectedDate });
        if (res.success) {
          setReportData(res.data);
          setSummary(res.summary);
        }
      } else if (activeReport === 'monthly_fees') {
        const res = await api.getMonthlyFeeReport({ year: selectedYear, month: selectedMonth });
        if (res.success) {
          setReportData(res.data);
          setSummary(res.summary);
        }
      } else if (activeReport === 'pending_fees') {
        const res = await api.getPendingFeeReport();
        if (res.success) {
          setReportData(res.data);
          setSummary(res.summary);
        }
      } else if (activeReport === 'expired') {
        const res = await api.getExpiredMembershipsReport();
        if (res.success) {
          setReportData(res.data);
        }
      } else if (activeReport === 'branches') {
        const res = await api.getBranchPerformanceReport();
        if (res.success) {
          setReportData(res.data);
        }
      }
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport, selectedDate, selectedYear, selectedMonth]);

  // Export to Excel (.xlsx)
  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data available to export.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `Samurai_${activeReport}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF (.pdf)
  const exportToPDF = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Samurai Martial Arts Academy - Official Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Report Type: ${activeReport.toUpperCase().replace('_', ' ')} • Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = Object.keys(reportData[0] || {});
    const rows = reportData.map(item => headers.map(h => String(item[h] ?? '')));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`Samurai_${activeReport}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Reports & Financial Analytics
          </h2>
          <p className="text-xs text-gray-400">
            Export comprehensive attendance, fee collection, outstanding balance, and performance records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </button>

          <button
            onClick={exportToPDF}
            className="px-4 py-2 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs shadow-md shadow-samurai-600/30 flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            Export to PDF
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveReport('daily_attendance')}
          className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all ${
            activeReport === 'daily_attendance'
              ? 'bg-samurai-600 text-white border-samurai-600 shadow-md shadow-samurai-600/20'
              : 'bg-white dark:bg-dojo-850 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <CalendarCheck className="w-4 h-4 mb-1" />
          Daily Attendance
        </button>

        <button
          onClick={() => setActiveReport('monthly_fees')}
          className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all ${
            activeReport === 'monthly_fees'
              ? 'bg-samurai-600 text-white border-samurai-600 shadow-md shadow-samurai-600/20'
              : 'bg-white dark:bg-dojo-850 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <DollarSign className="w-4 h-4 mb-1" />
          Monthly Fee Collection
        </button>

        <button
          onClick={() => setActiveReport('pending_fees')}
          className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all ${
            activeReport === 'pending_fees'
              ? 'bg-samurai-600 text-white border-samurai-600 shadow-md shadow-samurai-600/20'
              : 'bg-white dark:bg-dojo-850 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mb-1" />
          Pending Fees
        </button>

        <button
          onClick={() => setActiveReport('expired')}
          className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all ${
            activeReport === 'expired'
              ? 'bg-samurai-600 text-white border-samurai-600 shadow-md shadow-samurai-600/20'
              : 'bg-white dark:bg-dojo-850 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Clock className="w-4 h-4 mb-1" />
          Expired Memberships
        </button>

        <button
          onClick={() => setActiveReport('branches')}
          className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all ${
            activeReport === 'branches'
              ? 'bg-samurai-600 text-white border-samurai-600 shadow-md shadow-samurai-600/20'
              : 'bg-white dark:bg-dojo-850 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Layers className="w-4 h-4 mb-1" />
          Branch Performance
        </button>
      </div>

      {/* Date Parameter Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 text-xs font-semibold">
        {activeReport === 'daily_attendance' && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Target Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 focus:outline-none"
            />
          </div>
        )}

        {activeReport === 'monthly_fees' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Year:</span>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {summary && (
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
            {summary.totalCollected !== undefined && (
              <span>Total Revenue: <strong className="text-emerald-500 font-mono">{summary.totalCollected} AED</strong></span>
            )}
            {summary.totalPendingAmount !== undefined && (
              <span>Total Outstanding: <strong className="text-rose-500 font-mono">{summary.totalPendingAmount} AED</strong></span>
            )}
            {summary.present !== undefined && (
              <span>Present: <strong className="text-emerald-500 font-mono">{summary.present}</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Report Data Preview Table */}
      <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                {reportData.length > 0 &&
                  Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="py-3 px-4 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-3 border-samurai-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Generating report data...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No data found for this report.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-dojo-800/30">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-xs font-medium">
                        {String(val ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

