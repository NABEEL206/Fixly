// src/pages/Reports/Reports.jsx
import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { BASE_URL } from "@/API/BaseURL";
import { getAuthHeaders } from "@/utils/authHeaders";
import toast from "react-hot-toast";

// Import logo - make sure the file exists at this path
import logo from "../../assets/Fixly_1_-removebg-preview (1).png";
/* ---------------------------------------------------------
    CURRENCY FORMATTER - Fixed for PDF compatibility
--------------------------------------------------------- */
const formatCurrency = (amount, forPDF = false) => {
  if (amount === null || amount === undefined || amount === '') return forPDF ? '0.00' : '₹0.00';
  
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[₹,]/g, '')) : amount;
  const formattedNum = (num || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // For PDF, use "Rs." instead of ₹ symbol (Helvetica doesn't support ₹)
  if (forPDF) {
    return `Rs. ${formattedNum}`;
  }
  
  // For UI display, keep ₹ symbol
  return `₹${formattedNum}`;
};

/* ---------------------------------------------------------
    PROFIT SHARE HELPER
--------------------------------------------------------- */
function createProfitRow(id, date, total, customer) {
  return {
    "Complaint ID": id,
    "Complaint Date": date,
    "Customer Name": customer,
    "Total Amount": total,
    "Shop (40%)": (total * 0.4).toFixed(2),
    "Grow Tags (40%)": (total * 0.4).toFixed(2),
    "Fixly Admin (20%)": (total * 0.2).toFixed(2),
  };
}

/* ---------------------------------------------------------
    API DATA FETCHING
--------------------------------------------------------- */
const fetchReportData = async (reportType) => {
  try {
    const response = await fetch(`${BASE_URL}/reports/${reportType}/`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${reportType} report`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${reportType} report:`, error);
    toast.error(`Failed to load ${reportType} report`);
    return null;
  }
};

/* ---------------------------------------------------------
    DYNAMIC TRANSFORM FUNCTION
    This maps backend columns exactly to object keys
--------------------------------------------------------- */
const transformReportData = (apiData) => {
  if (!apiData || !apiData.results || !apiData.columns) return [];
  
  const columns = apiData.columns;
  
  return apiData.results.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      // Use the exact column name from backend as the key
      obj[col] = row[index];
    });
    return obj;
  });
};

/* ---------------------------------------------------------
    CALCULATE TOTALS FOR EACH REPORT TYPE
--------------------------------------------------------- */
const calculateReportTotals = (data, title) => {
  if (!data || data.length === 0) return null;
  
  switch (title) {
    case "Sales Summary Report":
      const salesTotal = data.reduce((sum, row) => {
        // Skip the "Total" row if it exists
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
        // Skip the "Total" row if it exists
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

/* ---------------------------------------------------------
    EXPORT BUTTON
--------------------------------------------------------- */
const ExportButton = ({ data, format, filteredData }) => {
  const exportExcel = () => {
    // For Excel export, we need to transform the column names
    let excelData = filteredData;
    
    // If this is the expense report, rename "EXPENSE ID" to "ID" for Excel
    if (data.title === "Expense Report") {
      excelData = filteredData.map(item => {
        const newItem = {};
        Object.keys(item).forEach(key => {
          if (key === "EXPENSE ID") {
            newItem["ID"] = item[key];
          } else {
            newItem[key] = item[key];
          }
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
      
      // ----- PROFESSIONAL GRADIENT HEADER -----
      // Create gradient effect with two rectangles
      doc.setFillColor(41, 128, 185); // Darker blue
      doc.rect(0, 0, pageWidth, 120, 'F');
      
      doc.setFillColor(52, 152, 219); // Lighter blue
      doc.rect(0, 100, pageWidth, 20, 'F');
      
      // Add decorative element
      doc.setFillColor(255, 255, 255);
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.circle(pageWidth - 50, 30, 60, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
      
      // Add logo - larger and better positioned
      try {
        const logoSize = 80; // Increased from 55 to 80
        const logoX = 40;
        const logoY = 20;
        doc.addImage(logo, 'PNG', logoX, logoY, logoSize, logoSize);
      } catch (e) {
        console.log("Logo not found, continuing without logo");
      }
      
      // Add company name - with better styling
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      doc.text("FIXLY MOBILES", 140, 55, { align: "left" });
      
      // Add tagline with styling
      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(230, 240, 255);
      doc.text("Service with Care • Excellence in Mobile Repairs", 140, 80, { align: "left" });
      
      // Add report type badge
      doc.setFillColor(255, 255, 255);
      doc.setGState(new doc.GState({ opacity: 0.2 }));
      doc.roundedRect(pageWidth - 200, 25, 160, 40, 5, 5, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL REPORT", pageWidth - 120, 50, { align: "center" });
      
      // Reset text color for rest of document
      doc.setTextColor(0, 0, 0);
      
      // ----- REPORT TITLE SECTION -----
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(41, 128, 185);
      doc.text(data.title, 40, 160);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 40, 180);
      
      // Add a decorative separator line
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(2);
      doc.line(40, 190, pageWidth - 40, 190);
      doc.setLineWidth(1);
      doc.setDrawColor(200, 200, 200);
      doc.line(40, 192, pageWidth - 40, 192);
      
      // Calculate totals for PDF using FILTERED data
      const totals = calculateReportTotals(filteredData, data.title);
      
      let startY = 215; // Adjusted for new header height
      
      // Show summary section if totals exist
      if (totals) {
        // Summary header
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
        
        // Create two-column summary layout
        const entries = Object.entries(totals);
        const leftColumn = entries.slice(0, Math.ceil(entries.length / 2));
        const rightColumn = entries.slice(Math.ceil(entries.length / 2));
        
        let leftY = startY;
        let rightY = startY;
        
        leftColumn.forEach(([key, value]) => {
          // For PDF summary, use the formatted value with "Rs." instead of ₹
          let displayValue = value;
          if (typeof value === 'string' && value.includes('₹')) {
            displayValue = value.replace('₹', 'Rs. ');
          }
          doc.text(`${key}: ${displayValue}`, 50, leftY);
          leftY += 20;
        });
        
        rightColumn.forEach(([key, value]) => {
          let displayValue = value;
          if (typeof value === 'string' && value.includes('₹')) {
            displayValue = value.replace('₹', 'Rs. ');
          }
          doc.text(`${key}: ${displayValue}`, pageWidth / 2 + 20, rightY);
          rightY += 20;
        });
        
        startY = Math.max(leftY, rightY) + 15;
      }
      
      // Prepare table data using FILTERED data - FIXED for proper ID formatting
      // For PDF, we need to transform column names for expense report
      let pdfColumns = [...data.columns];
      let pdfData = filteredData;
      
      // If this is the expense report, rename "EXPENSE ID" to "ID" for PDF
      if (data.title === "Expense Report") {
        pdfColumns = pdfColumns.map(col => col === "EXPENSE ID" ? "ID" : col);
        pdfData = filteredData.map(item => {
          const newItem = {};
          Object.keys(item).forEach(key => {
            if (key === "EXPENSE ID") {
              newItem["ID"] = item[key];
            } else {
              newItem[key] = item[key];
            }
          });
          return newItem;
        });
      }
      
      const tableColumn = pdfColumns;
      
      // Improved cleanValueForPDF - handles different column types correctly
      const cleanValueForPDF = (value, columnName) => {
        if (value === null || value === undefined) return "";
        
        // Check if this is an ID column - now matches "ID" only, not "Expense ID"
        const isIdColumn = columnName === "ID" || 
                          columnName === "CUSTOMER ID" ||
                          columnName === "COMPLAINT ID" ||
                          columnName === "INVOICE NO";
        
        // Check if this is a count column
        const isCountColumn = columnName === "INVOICE COUNT" || columnName === "COUNT";
        
        // Check if this is an amount column
        const isAmountColumn = columnName === "AMOUNT" || 
                              columnName === "TOTAL AMOUNT" || 
                              columnName === "TOTAL SALES" || 
                              columnName === "TOTAL SALES WITH TAX" || 
                              columnName === "TOTAL TAX AMOUNT" ||
                              columnName === "SHOP (40%)" || 
                              columnName === "GROW TAGS (40%)" || 
                              columnName === "ADMIN (20%)";
        
        // Handle numeric values
        if (typeof value === 'number') {
          if (isIdColumn || isCountColumn) {
            return Math.floor(value).toString(); // Return as integer for IDs and counts
          }
          if (isAmountColumn) {
            return formatCurrency(value, true); // Use PDF-friendly format (Rs.)
          }
          if (Number.isInteger(value)) {
            return value.toString(); // Return as integer
          }
          return value.toFixed(2); // Return with 2 decimals for other numbers
        }
        
        // Handle string values
        if (typeof value === 'string') {
          // Try to parse as number if it looks like one
          if (!isNaN(parseFloat(value)) && isFinite(value)) {
            const numValue = parseFloat(value);
            if (isIdColumn || isCountColumn) {
              return Math.floor(numValue).toString();
            }
            if (isAmountColumn) {
              return formatCurrency(numValue, true);
            }
            if (Number.isInteger(numValue)) {
              return numValue.toString();
            }
            return numValue.toFixed(2);
          }
          
          // Handle existing currency strings
          if (value.includes('₹') && isAmountColumn) {
            const numValue = parseFloat(value.replace(/[₹,]/g, ''));
            return formatCurrency(numValue, true);
          }
          
          // Regular string - clean it
          return value.replace(/[^\x20-\x7E]/g, "");
        }
        
        return String(value);
      };
      
      const tableRows = pdfData.map(item => 
        tableColumn.map(col => {
          const value = item[col] || "";
          return cleanValueForPDF(value, col);
        })
      );
      
      // Create the table with better font settings
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          cellPadding: 6,
          overflow: 'linebreak',
          font: 'helvetica',
          fontStyle: 'normal',
          textColor: [0, 0, 0],
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          font: 'helvetica',
          halign: 'center',
          cellPadding: 8
        },
        bodyStyles: {
          font: 'helvetica',
          fontSize: 9,
          fontStyle: 'normal'
        },
        columnStyles: {
          // Right-align amount columns
          'AMOUNT': { halign: 'right' },
          'TOTAL AMOUNT': { halign: 'right' },
          'TOTAL SALES': { halign: 'right' },
          'TOTAL SALES WITH TAX': { halign: 'right' },
          'TOTAL TAX AMOUNT': { halign: 'right' },
          'SHOP (40%)': { halign: 'right' },
          'GROW TAGS (40%)': { halign: 'right' },
          'ADMIN (20%)': { halign: 'right' },
          // Center-align ID columns
          'ID': { halign: 'center' },
          'CUSTOMER ID': { halign: 'center' },
          'COMPLAINT ID': { halign: 'center' },
          'INVOICE NO': { halign: 'center' },
          'INVOICE COUNT': { halign: 'center' },
          'COUNT': { halign: 'center' },
          // Also center-align "EXPENSE ID" for any reports that still have it
          'EXPENSE ID': { halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [249, 249, 249]
        },
        margin: { top: startY, left: 40, right: 40 },
        didDrawPage: (data) => {
          // Add footer on each page
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = data.pageNumber;
          
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          
          // Left footer - company name with copyright
          doc.text(
            "© 2024 FIXLY MOBILES | Confidential Report",
            40,
            doc.internal.pageSize.height - 20,
            { align: 'left' }
          );
          
          // Center footer - page number with styling
          doc.setFont("helvetica", "bold");
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 20,
            { align: 'center' }
          );
          
          // Right footer - generation date
          doc.setFont("helvetica", "normal");
          doc.text(
            new Date().toLocaleDateString(),
            pageWidth - 40,
            doc.internal.pageSize.height - 20,
            { align: 'right' }
          );
        }
      });
      
      // Save the PDF
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
        format === "xlsx" 
          ? "bg-green-600 hover:bg-green-700" 
          : "bg-red-600 hover:bg-red-700"
      } transition-colors`}
    >
      <span>{format === "xlsx" ? "📊" : "📄"}</span>
      Export {format.toUpperCase()}
    </button>
  );
};

/* ---------------------------------------------------------
    TABLE VIEW
--------------------------------------------------------- */
const ReportTable = ({ data, loading }) => {
  const [filterText, setFilterText] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [assignTypeFilter, setAssignTypeFilter] = useState("");

  const years = Array.from({ length: 30 }, (_, i) => (2010 + i).toString());
  const months = [
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
  const weeks = ["1", "2", "3", "4", "5"];
  
  // Get unique categories from data
  const categories = ["", ...new Set(data.data.map(item => item["CATEGORY"]).filter(Boolean))];
  
  // Get unique assign types from data
  const assignTypes = ["", ...new Set(data.data.map(item => item["ASSIGN TYPE"]).filter(Boolean))];
  
  // Get unique statuses from data
  const statusOptions = ["", ...new Set(data.data.map(item => item["STATUS"]).filter(Boolean))];

  // For display in the UI, we need to transform the data for expense report
  const displayData = useMemo(() => {
    if (data.title === "Expense Report") {
      // Rename "EXPENSE ID" to "ID" for display
      return data.data.map(item => {
        const newItem = {};
        Object.keys(item).forEach(key => {
          if (key === "EXPENSE ID") {
            newItem["ID"] = item[key];
          } else {
            newItem[key] = item[key];
          }
        });
        return newItem;
      });
    }
    return data.data;
  }, [data]);

  // Also update the columns for display
  const displayColumns = useMemo(() => {
    if (data.title === "Expense Report") {
      return data.columns.map(col => col === "EXPENSE ID" ? "ID" : col);
    }
    return data.columns;
  }, [data]);

  const filtered = useMemo(() => {
    return displayData.filter((row) => {
      // Find date field - try different possible date column names
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

      // Apply filters based on actual column names
      if (categoryFilter && row["CATEGORY"] && row["CATEGORY"] !== categoryFilter) return false;

      if (data.title === "Total Complaints Report" && statusFilter && row["STATUS"] && row["STATUS"] !== statusFilter) return false;
      if (data.title === "Total Growth Tags Report" && statusFilter && row["STATUS"] && row["STATUS"] !== statusFilter) return false;

      if ((data.title === "Total Complaints Report" || data.title === "Total Customers Report") && 
          assignTypeFilter && row["ASSIGN TYPE"] && row["ASSIGN TYPE"] !== assignTypeFilter) return false;

      // Text search across all columns
      if (filterText) {
        const searchLower = filterText.toLowerCase();
        return displayColumns.some((col) => {
          const value = row[col];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      }

      return true;
    });
  }, [displayData, displayColumns, filterText, year, month, week, statusFilter, categoryFilter, assignTypeFilter, data.title]);

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

      {/* Filters Section - Only show for reports that need filtering */}
      {data.title !== "Sales Summary Report" && data.title !== "Profit Share Distribution Report" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-3 md:p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)} 
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
            >
              <option value="">All Years</option>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)} 
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Week</label>
            <select 
              value={week} 
              onChange={(e) => setWeek(e.target.value)} 
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
            >
              <option value="">All Weeks</option>
              {weeks.map((w) => <option key={w}>Week {w}</option>)}
            </select>
          </div>

          {data.title === "Expense Report" && categories.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category || "All Categories"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {data.title === "Total Complaints Report" && statusOptions.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status || "All Statuses"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {data.title === "Total Growth Tags Report" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          {(data.title === "Total Complaints Report" || data.title === "Total Customers Report") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign Type</label>
              <select 
                value={assignTypeFilter} 
                onChange={(e) => setAssignTypeFilter(e.target.value)} 
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              >
                {assignTypes.map((type) => (
                  <option key={type} value={type}>
                    {type || "All Types"}
                  </option>
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
                    col === "ID" || col === "CUSTOMER ID" || col === "COMPLAINT ID" || col === "INVOICE NO" || col === "INVOICE COUNT" || col === "COUNT"
                      ? "text-center" 
                      : col === "AMOUNT" || col === "TOTAL AMOUNT" || col === "TOTAL SALES" || col === "TOTAL SALES WITH TAX" || col === "TOTAL TAX AMOUNT" || col === "SHOP (40%)" || col === "GROW TAGS (40%)" || col === "ADMIN (20%)"
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
              <tr 
                key={idx} 
                className="hover:bg-gray-50 transition-colors"
              >
                {displayColumns.map((col) => (
                  <td 
                    key={col} 
                    className={`px-4 py-3 text-sm ${
                      col === "ID" || col === "CUSTOMER ID" || col === "COMPLAINT ID" || col === "INVOICE NO" || col === "INVOICE COUNT" || col === "COUNT"
                        ? "text-center" 
                        : col === "AMOUNT" || col === "TOTAL AMOUNT" || col === "TOTAL SALES" || col === "TOTAL SALES WITH TAX" || col === "TOTAL TAX AMOUNT" || col === "SHOP (40%)" || col === "GROW TAGS (40%)" || col === "ADMIN (20%)"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {/* Format amount columns */}
                    {col === "AMOUNT" || col === "TOTAL AMOUNT" || col === "TOTAL SALES" || 
                     col === "TOTAL SALES WITH TAX" || col === "TOTAL TAX AMOUNT" ||
                     col === "SHOP (40%)" || col === "GROW TAGS (40%)" || col === "ADMIN (20%)" ? (
                      <span className="font-semibold text-blue-600">
                        {row[col] && typeof row[col] === 'string' && row[col].includes('₹') 
                          ? row[col] 
                          : formatCurrency(row[col], false)}
                      </span>
                    ) : col === "STATUS" && row[col] ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row[col] === "Closed" || row[col] === "Active" || row[col] === "Resolved" ? "bg-green-100 text-green-800" :
                        row[col] === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                        row[col] === "Open" || row[col] === "Inactive" || row[col] === "Pending" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {row[col]}
                      </span>
                    ) : col === "RECEIPT" && row[col] === "-" ? (
                      <span className="text-gray-400">No Receipt</span>
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
    if (key === "expenses") return "💰";
    if (key === "sales-summary") return "📈";
    if (key === "profit-share") return "🤝";
    if (key === "customers") return "👥";
    if (key === "growtags") return "🏷️";
    if (key === "complaints") return "📋";
    return "📊";
  };

  const getLabel = (key) => {
    switch(key) {
      case "expenses": return "Expense Report";
      case "customers": return "Customers Report";
      case "growtags": return "Grow Tags Report";
      case "complaints": return "Complaints Report";
      case "sales-summary": return "Sales Summary";
      case "profit-share": return "Profit Share";
      default: return key.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
    }
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
        
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center text-gray-500 hover:text-gray-700"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                  if (window.innerWidth < 1024) {
                    onToggleSidebar();
                  }
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
                {!collapsed && (
                  <span className="font-medium truncate">{label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 text-center">
            Total Reports: {reports.length}
          </div>
        </div>
      )}
    </aside>
  );
};

/* ---------------------------------------------------------
    MAIN PAGE LAYOUT
--------------------------------------------------------- */
const Reports = () => {
  const [active, setActive] = useState("expenses");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    expenses: { title: "Expense Report", columns: [], data: [] },
    customers: { title: "Total Customers Report", columns: [], data: [] },
    growtags: { title: "Total Growth Tags Report", columns: [], data: [] },
    complaints: { title: "Total Complaints Report", columns: [], data: [] },
    "sales-summary": { title: "Sales Summary Report", columns: [], data: [] },
    "profit-share": { title: "Profit Share Distribution Report", columns: [], data: [] }
  });

  const loadReportData = async () => {
    setLoading(true);
    
    try {
      // Fetch all reports in parallel
      const [expensesData, customersData, growtagsData, complaintsData, salesSummaryData, profitShareData] = await Promise.all([
        fetchReportData('expenses'),
        fetchReportData('customers'),
        fetchReportData('growtags'),
        fetchReportData('complaints'),
        fetchReportData('sales-summary'),
        fetchReportData('profit-share')
      ]);

      setReportData({
        expenses: {
          title: "Expense Report",
          columns: expensesData?.columns || [],
          data: transformReportData(expensesData)
        },
        customers: {
          title: "Total Customers Report",
          columns: customersData?.columns || [],
          data: transformReportData(customersData)
        },
        growtags: {
          title: "Total Growth Tags Report",
          columns: growtagsData?.columns || [],
          data: transformReportData(growtagsData)
        },
        complaints: {
          title: "Total Complaints Report",
          columns: complaintsData?.columns || [],
          data: transformReportData(complaintsData)
        },
        "sales-summary": {
          title: "Sales Summary Report",
          columns: salesSummaryData?.columns || [],
          data: transformReportData(salesSummaryData)
        },
        "profit-share": {
          title: "Profit Share Distribution Report",
          columns: profitShareData?.columns || [],
          data: transformReportData(profitShareData)
        }
      });
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadReportData();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reportsList = ["expenses", "customers", "growtags", "complaints", "sales-summary", "profit-share"];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        reports={reportsList}
        activeReport={active}
        onSelectReport={setActive}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
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
            title="Collapse sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed left-4 top-6 z-10 p-2 bg-blue-600 text-white rounded-r-lg shadow-lg hover:bg-blue-700 transition-all"
            title="Expand sidebar"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Report Table */}
        <ReportTable data={reportData[active]} loading={loading} />
      </main>
    </div>
  );
};

export default Reports;