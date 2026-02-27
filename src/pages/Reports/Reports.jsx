// src/pages/Reports/Reports.jsx
import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import axiosInstance from "@/API/axiosInstance";
import toast from "react-hot-toast";

// Import logo - make sure the file exists at this path
import logo from "../../assets/Fixly_1_-removebg-preview (1).png";

/* ---------------------------------------------------------
    CONSTANTS & CONFIGURATION
--------------------------------------------------------- */
const REPORTS_CONFIG = [
  { key: "expenses", title: "Expense Report", endpoint: "/reports/expenses/" },
  { key: "customers", title: "Total Customers Report", endpoint: "/reports/customers/" },
  { key: "growtags", title: "Total Growth Tags Report", endpoint: "/reports/growtags/" },
  { key: "complaints", title: "Total Complaints Report", endpoint: "/reports/complaints/" },
  { key: "sales-summary", title: "Sales Summary Report", endpoint: "/reports/sales-summary/" },
  { key: "profit-share", title: "Profit Share Distribution Report", endpoint: "/reports/profit-share/" }
];

const YEARS = Array.from({ length: 30 }, (_, i) => (2010 + i).toString());

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const WEEKS = ["1", "2", "3", "4", "5"];

/* ---------------------------------------------------------
    HELPER FUNCTIONS
--------------------------------------------------------- */
const formatCurrency = (amount, forPDF = false) => {
  if (amount === null || amount === undefined || amount === '') return forPDF ? '0.00' : '₹0.00';
  
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[₹,]/g, '')) : amount;
  const formattedNum = (num || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return forPDF ? `Rs. ${formattedNum}` : `₹${formattedNum}`;
};

const getErrorMessage = (error) => {
  return error.response?.data?.message || error.message || "An unexpected error occurred";
};

const transformReportData = (apiData) => {
  if (!apiData || !apiData.results || !apiData.columns) return [];
  
  const columns = apiData.columns;
  
  return apiData.results.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
};

const calculateReportTotals = (data, title) => {
  if (!data || data.length === 0) return null;
  
  switch (title) {
    case "Sales Summary Report":
      const salesTotal = data.reduce((sum, row) => {
        if (row["DATE"] === "Total") return sum;
        return sum + (parseFloat(row["TOTAL SALES"]) || 0);
      }, 0);
      
      const salesWithTaxTotal = data.reduce((sum, row) => {
        if (row["DATE"] === "Total") return sum;
        return sum + (parseFloat(row["TOTAL SALES WITH TAX"]) || 0);
      }, 0);
      
      const taxTotal = data.reduce((sum, row) => {
        if (row["DATE"] === "Total") return sum;
        return sum + (parseFloat(row["TOTAL TAX AMOUNT"]) || 0);
      }, 0);
      
      const invoiceCountTotal = data.reduce((sum, row) => {
        if (row["DATE"] === "Total") return sum;
        return sum + (parseInt(row["INVOICE COUNT"]) || 0);
      }, 0);
      
      return {
        "Total Sales": formatCurrency(salesTotal),
        "Total Sales With Tax": formatCurrency(salesWithTaxTotal),
        "Total Tax": formatCurrency(taxTotal),
        "Total Invoices": invoiceCountTotal
      };
    
    case "Profit Share Distribution Report":
      const totalAmount = data.reduce((sum, row) => {
        if (row["INVOICE NO"] === "Total") return sum;
        return sum + (parseFloat(row["TOTAL AMOUNT"]) || 0);
      }, 0);
      
      const shopTotal = data.reduce((sum, row) => {
        if (row["INVOICE NO"] === "Total") return sum;
        return sum + (parseFloat(row["SHOP (40%)"]) || 0);
      }, 0);
      
      const growTagsTotal = data.reduce((sum, row) => {
        if (row["INVOICE NO"] === "Total") return sum;
        return sum + (parseFloat(row["GROW TAGS (40%)"]) || 0);
      }, 0);
      
      const adminTotal = data.reduce((sum, row) => {
        if (row["INVOICE NO"] === "Total") return sum;
        return sum + (parseFloat(row["ADMIN (20%)"]) || 0);
      }, 0);
      
      return {
        "Total Revenue": formatCurrency(totalAmount),
        "Total Shop Share (40%)": formatCurrency(shopTotal),
        "Total Grow Tags Share (40%)": formatCurrency(growTagsTotal),
        "Total Admin Share (20%)": formatCurrency(adminTotal)
      };
    
    case "Expense Report":
      const expenseTotal = data.reduce((sum, row) => {
        const amount = parseFloat(row["AMOUNT"]?.replace(/[₹,]/g, '')) || 0;
        return sum + amount;
      }, 0);
      
      return {
        "Total Expenses": formatCurrency(expenseTotal),
        "Count": data.length
      };
    
    case "Total Complaints Report":
      const statusCounts = data.reduce((acc, row) => {
        const status = row["STATUS"] || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        "Total Complaints": data.length,
        ...statusCounts
      };
    
    case "Total Growth Tags Report":
      const activeCount = data.filter(row => row["STATUS"] === "Active").length;
      const inactiveCount = data.filter(row => row["STATUS"] === "Inactive").length;
      
      return {
        "Total Growth Tags": data.length,
        "Active": activeCount,
        "Inactive": inactiveCount
      };
    
    case "Total Customers Report":
      const assignTypeCounts = data.reduce((acc, row) => {
        const type = row["ASSIGN TYPE"] || "Unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      return {
        "Total Customers": data.length,
        ...assignTypeCounts
      };
    
    default:
      return {
        "Total Records": data.length
      };
  }
};

const fetchReportData = async (endpoint) => {
  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint} report:`, error);
    toast.error(`Failed to load ${endpoint} report`);
    return null;
  }
};

/* ---------------------------------------------------------
    EXPORT BUTTON COMPONENT
--------------------------------------------------------- */
const ExportButton = ({ data, format, filteredData }) => {
  const exportExcel = () => {
    let excelData = filteredData;
    
    if (data.title === "Expense Report") {
      excelData = filteredData.map(item => {
        const newItem = {};
        Object.keys(item).forEach(key => {
          newItem[key === "EXPENSE ID" ? "ID" : key] = item[key];
        });
        return newItem;
      });
    }
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    saveAs(new Blob([buffer]), `${data.title}.xlsx`);
  };

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 120, 'F');
      doc.setFillColor(52, 152, 219);
      doc.rect(0, 100, pageWidth, 20, 'F');
      
      // Add logo
      try {
        const logoSize = 80;
        doc.addImage(logo, 'PNG', 40, 20, logoSize, logoSize);
      } catch (e) {
        console.log("Logo not found");
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      doc.text("FIXLY MOBILES", 140, 55);
      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      doc.text("Service with Care • Excellence in Mobile Repairs", 140, 80);
      
      // Report Title
      doc.setTextColor(41, 128, 185);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(data.title, 40, 160);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 40, 180);
      
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(2);
      doc.line(40, 190, pageWidth - 40, 190);
      
      // Summary
      const totals = calculateReportTotals(filteredData, data.title);
      let startY = 215;
      
      if (totals) {
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(40, startY - 5, pageWidth - 80, 30, 3, 3, 'F');
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(41, 128, 185);
        doc.text("SUMMARY", 50, startY + 12);
        
        startY += 40;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        const entries = Object.entries(totals);
        const leftColumn = entries.slice(0, Math.ceil(entries.length / 2));
        const rightColumn = entries.slice(Math.ceil(entries.length / 2));
        
        let leftY = startY;
        let rightY = startY;
        
        leftColumn.forEach(([key, value]) => {
          // Handle both string and number values safely
          let displayValue = value;
          if (typeof value === 'string' && value.includes('₹')) {
            displayValue = value.replace('₹', 'Rs. ');
          } else if (typeof value === 'number') {
            displayValue = formatCurrency(value, true);
          }
          doc.text(`${key}: ${displayValue}`, 50, leftY);
          leftY += 20;
        });
        
        rightColumn.forEach(([key, value]) => {
          // Handle both string and number values safely
          let displayValue = value;
          if (typeof value === 'string' && value.includes('₹')) {
            displayValue = value.replace('₹', 'Rs. ');
          } else if (typeof value === 'number') {
            displayValue = formatCurrency(value, true);
          }
          doc.text(`${key}: ${displayValue}`, pageWidth / 2 + 20, rightY);
          rightY += 20;
        });
        
        startY = Math.max(leftY, rightY) + 15;
      }
      
      // Table data preparation
      let pdfColumns = data.title === "Expense Report" 
        ? data.columns.map(col => col === "EXPENSE ID" ? "ID" : col)
        : [...data.columns];
      
      let pdfData = data.title === "Expense Report"
        ? filteredData.map(item => {
            const newItem = {};
            Object.keys(item).forEach(key => {
              newItem[key === "EXPENSE ID" ? "ID" : key] = item[key];
            });
            return newItem;
          })
        : filteredData;
      
      const cleanValueForPDF = (value, columnName) => {
        if (value === null || value === undefined) return "";
        
        const isIdColumn = ["ID", "CUSTOMER ID", "COMPLAINT ID", "INVOICE NO"].includes(columnName);
        const isCountColumn = ["INVOICE COUNT", "COUNT"].includes(columnName);
        const isAmountColumn = ["AMOUNT", "TOTAL AMOUNT", "TOTAL SALES", "TOTAL SALES WITH TAX", 
                                "TOTAL TAX AMOUNT", "SHOP (40%)", "GROW TAGS (40%)", "ADMIN (20%)"].includes(columnName);
        
        if (typeof value === 'number') {
          if (isIdColumn || isCountColumn) return Math.floor(value).toString();
          if (isAmountColumn) return formatCurrency(value, true);
          return Number.isInteger(value) ? value.toString() : value.toFixed(2);
        }
        
        if (typeof value === 'string') {
          // Check if string is actually a number
          if (!isNaN(parseFloat(value)) && isFinite(value)) {
            const numValue = parseFloat(value);
            if (isIdColumn || isCountColumn) return Math.floor(numValue).toString();
            if (isAmountColumn) return formatCurrency(numValue, true);
            return Number.isInteger(numValue) ? numValue.toString() : numValue.toFixed(2);
          }
          
          // Check if string contains ₹ symbol
          if (typeof value === 'string' && value.includes('₹') && isAmountColumn) {
            return formatCurrency(parseFloat(value.replace(/[₹,]/g, '')), true);
          }
          
          // Regular string
          return value.replace(/[^\x20-\x7E]/g, "");
        }
        
        return String(value);
      };
      
      const tableRows = pdfData.map(item => 
        pdfColumns.map(col => cleanValueForPDF(item[col], col))
      );
      
      autoTable(doc, {
        head: [pdfColumns],
        body: tableRows,
        startY: startY,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          cellPadding: 6,
          font: 'helvetica',
          textColor: [0, 0, 0],
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          ...pdfColumns.reduce((acc, col) => {
            if (["AMOUNT", "TOTAL AMOUNT", "TOTAL SALES", "TOTAL SALES WITH TAX", 
                  "TOTAL TAX AMOUNT", "SHOP (40%)", "GROW TAGS (40%)", "ADMIN (20%)"].includes(col)) {
              acc[col] = { halign: 'right' };
            } else if (["ID", "CUSTOMER ID", "COMPLAINT ID", "INVOICE NO", 
                        "INVOICE COUNT", "COUNT", "EXPENSE ID"].includes(col)) {
              acc[col] = { halign: 'center' };
            }
            return acc;
          }, {})
        },
        margin: { left: 40, right: 40 },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("© 2024 FIXLY MOBILES | Confidential Report", 40, doc.internal.pageSize.height - 20);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });
          doc.text(new Date().toLocaleDateString(), pageWidth - 40, doc.internal.pageSize.height - 20, { align: 'right' });
        }
      });
      
      doc.save(`${data.title}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error generating PDF. Please try again.");
    }
  };

  return (
    <button
      onClick={format === "xlsx" ? exportExcel : exportPDF}
      className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${
        format === "xlsx" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
      } transition-colors`}
    >
      <span>{format === "xlsx" ? "📊" : "📄"}</span>
      Export {format.toUpperCase()}
    </button>
  );
};

/* ---------------------------------------------------------
    TABLE VIEW COMPONENT
--------------------------------------------------------- */
const ReportTable = ({ data, loading }) => {
  const [filterText, setFilterText] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [assignTypeFilter, setAssignTypeFilter] = useState("");

  const categories = ["", ...new Set(data.data.map(item => item["CATEGORY"]).filter(Boolean))];
  const assignTypes = ["", ...new Set(data.data.map(item => item["ASSIGN TYPE"]).filter(Boolean))];
  const statusOptions = ["", ...new Set(data.data.map(item => item["STATUS"]).filter(Boolean))];

  const displayData = useMemo(() => {
    if (data.title === "Expense Report") {
      return data.data.map(item => {
        const newItem = {};
        Object.keys(item).forEach(key => {
          newItem[key === "EXPENSE ID" ? "ID" : key] = item[key];
        });
        return newItem;
      });
    }
    return data.data;
  }, [data]);

  const displayColumns = useMemo(() => {
    return data.title === "Expense Report" 
      ? data.columns.map(col => col === "EXPENSE ID" ? "ID" : col)
      : data.columns;
  }, [data]);

  const filtered = useMemo(() => {
    return displayData.filter((row) => {
      const dateStr = row["DATE"] || row["JOIN DATE"] || row["COMPLAINT DATE"] || row["INVOICE DATE"];
      
      if (dateStr && dateStr !== "Total") {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear().toString();
          const m = (d.getMonth() + 1).toString().padStart(2, "0");
          const w = Math.ceil(d.getDate() / 7).toString();

          if (year && year !== y) return false;
          if (month && month !== m) return false;
          if (week && week !== w) return false;
        }
      }

      if (categoryFilter && row["CATEGORY"] && row["CATEGORY"] !== categoryFilter) return false;
      if (statusFilter && row["STATUS"] && row["STATUS"] !== statusFilter) return false;
      if (assignTypeFilter && row["ASSIGN TYPE"] && row["ASSIGN TYPE"] !== assignTypeFilter) return false;

      if (filterText) {
        const searchLower = filterText.toLowerCase();
        return displayColumns.some((col) => {
          const value = row[col];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      }

      return true;
    });
  }, [displayData, displayColumns, filterText, year, month, week, statusFilter, categoryFilter, assignTypeFilter]);

  const reportTotals = useMemo(() => {
    return calculateReportTotals(filtered, data.title);
  }, [filtered, data.title]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 w-full">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading report data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">{data.title}</h3>
          <p className="text-sm text-gray-500 mt-1">Total Records: {data.data.length}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButton data={data} format="xlsx" filteredData={filtered} />
          <ExportButton data={data} format="pdf" filteredData={filtered} />
        </div>
      </div>

      {/* Filters */}
      {!["Sales Summary Report", "Profit Share Distribution Report"].includes(data.title) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-3 md:p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
              <option value="">All Years</option>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Week</label>
            <select value={week} onChange={(e) => setWeek(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
              <option value="">All Weeks</option>
              {WEEKS.map((w) => <option key={w}>Week {w}</option>)}
            </select>
          </div>

          {data.title === "Expense Report" && categories.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
                {categories.map((category) => (
                  <option key={category} value={category}>{category || "All Categories"}</option>
                ))}
              </select>
            </div>
          )}

          {["Total Complaints Report", "Total Growth Tags Report"].includes(data.title) && statusOptions.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status || "All Statuses"}</option>
                ))}
              </select>
            </div>
          )}

          {["Total Complaints Report", "Total Customers Report"].includes(data.title) && assignTypes.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign Type</label>
              <select value={assignTypeFilter} onChange={(e) => setAssignTypeFilter(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
                {assignTypes.map((type) => (
                  <option key={type} value={type}>{type || "All Types"}</option>
                ))}
              </select>
            </div>
          )}

          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input
              placeholder="Search in all columns..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {displayColumns.map((col) => (
                <th 
                  key={col} 
                  className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    ["ID", "CUSTOMER ID", "COMPLAINT ID", "INVOICE NO", "INVOICE COUNT", "COUNT"].includes(col)
                      ? "text-center" 
                      : ["AMOUNT", "TOTAL AMOUNT", "TOTAL SALES", "TOTAL SALES WITH TAX", 
                         "TOTAL TAX AMOUNT", "SHOP (40%)", "GROW TAGS (40%)", "ADMIN (20%)"].includes(col)
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {displayColumns.map((col) => (
                  <td 
                    key={col} 
                    className={`px-4 py-3 text-sm ${
                      ["ID", "CUSTOMER ID", "COMPLAINT ID", "INVOICE NO", "INVOICE COUNT", "COUNT"].includes(col)
                        ? "text-center" 
                        : ["AMOUNT", "TOTAL AMOUNT", "TOTAL SALES", "TOTAL SALES WITH TAX", 
                           "TOTAL TAX AMOUNT", "SHOP (40%)", "GROW TAGS (40%)", "ADMIN (20%)"].includes(col)
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {["AMOUNT", "TOTAL AMOUNT", "TOTAL SALES", "TOTAL SALES WITH TAX", 
                      "TOTAL TAX AMOUNT", "SHOP (40%)", "GROW TAGS (40%)", "ADMIN (20%)"].includes(col) ? (
                      <span className="font-semibold text-blue-600">
                        {row[col] && typeof row[col] === 'string' && row[col].includes('₹') 
                          ? row[col] 
                          : formatCurrency(row[col], false)}
                      </span>
                    ) : col === "STATUS" && row[col] ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ["Closed", "Active", "Resolved"].includes(row[col]) ? "bg-green-100 text-green-800" :
                        row[col] === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                        ["Open", "Inactive", "Pending"].includes(row[col]) ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {row[col]}
                      </span>
                    ) : col === "ASSIGN TYPE" && row[col] && row[col] !== "-" ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row[col] === "Franchise" ? "bg-purple-100 text-purple-800" :
                        row[col] === "Other Shop" ? "bg-orange-100 text-orange-800" :
                        row[col] === "Growtag" ? "bg-indigo-100 text-indigo-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {row[col]}
                      </span>
                    ) : (
                      row[col] || "-"
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={displayColumns.length} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">📊</span>
                    <p className="text-lg font-medium">No data found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
    SIDEBAR COMPONENT
--------------------------------------------------------- */
const Sidebar = ({ 
  reports, 
  activeReport, 
  onSelectReport, 
  sidebarOpen, 
  onToggleSidebar,
  collapsed,
  onToggleCollapse 
}) => {
  const getIcon = (key) => {
    const icons = {
      expenses: "💰",
      customers: "👥",
      growtags: "🏷️",
      complaints: "📋",
      "sales-summary": "📈",
      "profit-share": "🤝"
    };
    return icons[key] || "📊";
  };

  const getLabel = (key) => {
    const labels = {
      expenses: "Expense Report",
      customers: "Customers Report",
      growtags: "Grow Tags Report",
      complaints: "Complaints Report",
      "sales-summary": "Sales Summary",
      "profit-share": "Profit Share"
    };
    return labels[key] || key.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <aside className={`
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      ${collapsed ? 'lg:w-16' : 'lg:w-64 w-72'}
      fixed lg:relative z-40 transition-all duration-300 ease-in-out
      h-screen lg:h-auto bg-white shadow-lg lg:rounded-xl
      flex flex-col
    `}>
      <div className={`p-4 ${collapsed ? 'lg:p-3' : 'lg:p-5'} border-b flex items-center justify-between`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="text-2xl">📊</div>
            <h2 className="text-xl font-bold text-gray-800">Reports</h2>
          </div>
        ) : (
          <div className="text-2xl mx-auto">📊</div>
        )}
        
        <button onClick={onToggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
        
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center text-gray-500 hover:text-gray-700"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className={`flex-1 p-4 ${collapsed ? 'lg:px-2' : ''} overflow-y-auto`}>
        <div className="space-y-2">
          {reports.map((key) => {
            const icon = getIcon(key);
            const label = getLabel(key);
            
            return (
              <button
                key={key}
                onClick={() => {
                  onSelectReport(key);
                  if (window.innerWidth < 1024) onToggleSidebar();
                }}
                className={`
                  w-full p-3 rounded-lg flex items-center gap-3 transition-all
                  ${activeReport === key
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }
                  ${collapsed ? 'lg:justify-center lg:px-3' : ''}
                `}
                title={collapsed ? label : ""}
              >
                <span className="text-lg">{icon}</span>
                {!collapsed && <span className="font-medium truncate">{label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

/* ---------------------------------------------------------
    MAIN PAGE COMPONENT
--------------------------------------------------------- */
const Reports = () => {
  const [active, setActive] = useState("expenses");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(
    REPORTS_CONFIG.reduce((acc, { key, title }) => ({
      ...acc,
      [key]: { title, columns: [], data: [] }
    }), {})
  );

  const loadAllReports = async () => {
    setLoading(true);
    
    try {
      const promises = REPORTS_CONFIG.map(async ({ key, endpoint }) => {
        const data = await fetchReportData(endpoint);
        return { key, data };
      });

      const results = await Promise.all(promises);
      
      const newReportData = results.reduce((acc, { key, data }) => ({
        ...acc,
        [key]: {
          title: REPORTS_CONFIG.find(r => r.key === key).title,
          columns: data?.columns || [],
          data: transformReportData(data)
        }
      }), {});

      setReportData(newReportData);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reportsList = REPORTS_CONFIG.map(r => r.key);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        reports={reportsList}
        activeReport={active}
        onSelectReport={setActive}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 p-3 md:p-4 lg:p-6">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4 p-2 bg-white rounded-lg shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Menu size={20} />
            <span className="text-sm font-medium">Reports Menu</span>
          </button>
          
          <div className="text-sm font-medium text-gray-700 truncate ml-2">
            {reportData[active]?.title}
          </div>
        </div>

        {/* Desktop Toggle Buttons */}
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="hidden lg:flex fixed left-[calc(16rem+1rem)] top-6 z-10 p-2 bg-blue-600 text-white rounded-r-lg shadow-lg hover:bg-blue-700 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed left-4 top-6 z-10 p-2 bg-blue-600 text-white rounded-r-lg shadow-lg hover:bg-blue-700 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <ReportTable data={reportData[active]} loading={loading} />
      </main>
    </div>
  );
};

export default Reports;