import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

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
    EXPENSE REPORT HELPER (Removed Status)
--------------------------------------------------------- */
function createExpenseRow(id, date, title, category, amount, paymentMethod) {
  return {
    "Expense ID": id,
    "Date": date,
    "Title": title,
    "Category": category,
    "Amount": amount,
    "Payment Method": paymentMethod,
    "Receipt": "Available"
  };
}

/* ---------------------------------------------------------
    COMPLAINTS REPORT HELPER
--------------------------------------------------------- */
function createComplaintRow(id, date, customer, issue, assignTo, assignType, status) {
  return {
    "ID": id,
    "Date": date,
    "Customer Name": customer,
    "Issue": issue,
    "Assign To": assignTo,
    "Assign Type": assignType,
    "Status": status,
  };
}

/* ---------------------------------------------------------
    CUSTOMERS REPORT HELPER
--------------------------------------------------------- */
function createCustomerRow(id, date, name, phone, issue, assignTo, assignType) {
  return {
    "Customer ID": id,
    "Date": date,
    "Name": name,
    "Phone": phone,
    "Issue": issue,
    "Assign To": assignTo,
    "Assign Type": assignType,
  };
}

/* ---------------------------------------------------------
    ALL REPORT DATA
--------------------------------------------------------- */
const reportData = {
  complaints: {
    title: "Total Complaints Report",
    columns: ["ID", "Date", "Customer Name", "Issue", "Assign To", "Assign Type", "Status"],
    data: [
      createComplaintRow(1001, "2025-06-03", "David", "Billing Error", "John", "Franchise", "Open"),
      createComplaintRow(1002, "2025-06-12", "Miller", "Internet Down", "Arun", "Other Shop", "Closed"),
      createComplaintRow(1003, "2025-06-15", "Sarah Johnson", "Software Bug", "Mike", "Growtag", "In Progress"),
      createComplaintRow(1004, "2025-06-18", "Robert Brown", "Hardware Issue", "Emma", "Franchise", "Open"),
      createComplaintRow(1005, "2025-06-22", "Priya Sharma", "Service Complaint", "Rahul", "Other Shop", "Closed"),
      createComplaintRow(1006, "2025-06-25", "Amit Patel", "Network Problem", "Suresh", "Growtag", "In Progress"),
      createComplaintRow(1007, "2025-06-28", "Neha Gupta", "Payment Issue", "Vikram", "Franchise", "Open"),
    ],
  },

  "grow-tags": {
    title: "Total Growth Tags Report",
    columns: ["Grow ID", "Join Date", "Name", "Aadhar No", "Phone", "Email", "Status"],
    data: [
      {
        "Grow ID": "G001",
        "Join Date": "2025-06-01",
        Name: "Ramesh",
        "Aadhar No": "1234-5678-9101",
        Phone: "9876543210",
        Email: "ramesh@example.com",
        Status: "Active",
      },
      {
        "Grow ID": "G002",
        "Join Date": "2025-06-10",
        Name: "Suresh Kumar",
        "Aadhar No": "2345-6789-0123",
        Phone: "8765432109",
        Email: "suresh@example.com",
        Status: "Inactive",
      },
      {
        "Grow ID": "G003",
        "Join Date": "2025-06-20",
        Name: "Priya Sharma",
        "Aadhar No": "3456-7890-1234",
        Phone: "7654321098",
        Email: "priya@example.com",
        Status: "Active",
      }
    ],
  },

  customers: {
    title: "Total Customers Report",
    columns: ["Customer ID", "Date", "Name", "Phone", "Issue", "Assign To", "Assign Type"],
    data: [
      createCustomerRow("C001", "2025-06-03", "Mark Smith", "9000000001", "Mobile Screen", "John", "Franchise"),
      createCustomerRow("C002", "2025-06-10", "Emma Watson", "9000000002", "Laptop Repair", "Sarah", "Other Shop"),
      createCustomerRow("C003", "2025-06-18", "Robert Brown", "9000000003", "Network Setup", "Mike", "Growtag"),
      createCustomerRow("C004", "2025-06-20", "Lisa Ray", "9000000004", "Software Installation", "Ravi", "Franchise"),
      createCustomerRow("C005", "2025-06-22", "David Miller", "9000000005", "Printer Issue", "Anita", "Other Shop"),
      createCustomerRow("C006", "2025-06-25", "Sophia Williams", "9000000006", "Data Recovery", "Raj", "Growtag"),
      createCustomerRow("C007", "2025-06-28", "James Wilson", "9000000007", "Virus Removal", "Kumar", "Franchise"),
    ],
  },

  /* ---------------------------------------------------------
      SALES SUMMARY REPORT
  --------------------------------------------------------- */
  "sales-summary": {
    title: "Sales Summary Report",
    columns: [
      "Date",
      "Invoice Count",
      "Total Sales",
      "Total Sales With Tax",
      "Total Tax Amount"
    ],
    data: [
      {
        Date: "03/12/2025",
        "Invoice Count": 1,
        "Total Sales": 15000.0,
        "Total Sales With Tax": 17700.0,
        "Total Tax Amount": 2700.0
      },
      {
        Date: "04/12/2025",
        "Invoice Count": 2,
        "Total Sales": 25000.0,
        "Total Sales With Tax": 29500.0,
        "Total Tax Amount": 4500.0
      },
      {
        Date: "05/12/2025",
        "Invoice Count": 3,
        "Total Sales": 18000.0,
        "Total Sales With Tax": 21240.0,
        "Total Tax Amount": 3240.0
      },
      {
        Date: "06/12/2025",
        "Invoice Count": 2,
        "Total Sales": 32000.0,
        "Total Sales With Tax": 37760.0,
        "Total Tax Amount": 5760.0
      }
    ]
  },

  /* ---------------------------------------------------------
      PROFIT SHARE REPORT
  --------------------------------------------------------- */
  "profit-share": {
    title: "Profit Share Distribution Report",
    columns: [
      "Complaint ID",
      "Complaint Date",
      "Customer Name",
      "Total Amount",
      "Shop (40%)",
      "Grow Tags (40%)",
      "Fixly Admin (20%)",
    ],
    data: [
      createProfitRow(1001, "2025-06-03", 10000, "David"),
      createProfitRow(1002, "2025-06-12", 25000, "Miller"),
      createProfitRow(1003, "2025-06-15", 15000, "Sarah Johnson"),
      createProfitRow(1004, "2025-06-20", 30000, "Robert Brown"),
      createProfitRow(1005, "2025-06-25", 18000, "Emma Watson"),
    ],
  },

  /* ---------------------------------------------------------
      EXPENSE REPORT (Removed Status column)
  --------------------------------------------------------- */
  "expense-report": {
    title: "Expense Report",
    columns: [
      "Expense ID",
      "Date",
      "Title",
      "Category",
      "Amount",
      "Payment Method",
      "Receipt"
    ],
    data: [
      createExpenseRow("EXP001", "2025-06-01", "Office Rent", "Rent", "₹25,000.00", "Bank Transfer"),
      createExpenseRow("EXP002", "2025-06-03", "Internet Bill", "Utilities", "₹1,500.00", "UPI"),
      createExpenseRow("EXP003", "2025-06-05", "Team Lunch", "Food & Beverage", "₹3,200.00", "Cash"),
      createExpenseRow("EXP004", "2025-06-08", "Software Subscription", "Software", "₹8,900.00", "Card"),
      createExpenseRow("EXP005", "2025-06-10", "Travel Expenses", "Travel", "₹5,600.00", "Card"),
      createExpenseRow("EXP006", "2025-06-12", "Office Supplies", "Office Supplies", "₹2,300.00", "Cash"),
      createExpenseRow("EXP007", "2025-06-15", "Marketing Campaign", "Marketing", "₹15,000.00", "Bank Transfer"),
      createExpenseRow("EXP008", "2025-06-18", "Electricity Bill", "Utilities", "₹4,800.00", "UPI"),
      createExpenseRow("EXP009", "2025-06-20", "Employee Training", "Training", "₹12,000.00", "Bank Transfer"),
      createExpenseRow("EXP010", "2025-06-25", "Maintenance", "Maintenance", "₹7,500.00", "Card"),
    ],
  },
};

/* ---------------------------------------------------------
    CALCULATE TOTALS FOR EACH REPORT TYPE
--------------------------------------------------------- */
const calculateReportTotals = (data, title) => {
  if (!data || data.length === 0) return null;
  
  switch (title) {
    case "Sales Summary Report":
      const salesTotal = data.reduce((sum, row) => sum + (row["Total Sales"] || 0), 0);
      const salesWithTaxTotal = data.reduce((sum, row) => sum + (row["Total Sales With Tax"] || 0), 0);
      const taxTotal = data.reduce((sum, row) => sum + (row["Total Tax Amount"] || 0), 0);
      const invoiceCountTotal = data.reduce((sum, row) => sum + (row["Invoice Count"] || 0), 0);
      
      return {
        "Total Sales": `₹${salesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        "Total Sales With Tax": `₹${salesWithTaxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        "Total Tax": `₹${taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        "Total Invoices": invoiceCountTotal
      };
    
    case "Profit Share Distribution Report":
      const totalAmount = data.reduce((sum, row) => sum + (parseFloat(row["Total Amount"]) || 0), 0);
      const shopTotal = data.reduce((sum, row) => sum + (parseFloat(row["Shop (40%)"]) || 0), 0);
      const growTagsTotal = data.reduce((sum, row) => sum + (parseFloat(row["Grow Tags (40%)"]) || 0), 0);
      const adminTotal = data.reduce((sum, row) => sum + (parseFloat(row["Fixly Admin (20%)"]) || 0), 0);
      
      return {
        "Total Revenue": `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        "Total Shop Share (40%)": `₹${shopTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        "Total Grow Tags Share (40%)": `₹${growTagsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        "Total Admin Share (20%)": `₹${adminTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      };
    
    case "Expense Report":
      const expenseTotal = data.reduce((sum, row) => {
        const amount = parseFloat(row.Amount?.replace(/[₹,]/g, '')) || 0;
        return sum + amount;
      }, 0);
      
      return {
        "Total Expenses": `₹${expenseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        "Count": data.length
      };
    
    case "Total Complaints Report":
      const openCount = data.filter(row => row.Status === "Open").length;
      const closedCount = data.filter(row => row.Status === "Closed").length;
      const inProgressCount = data.filter(row => row.Status === "In Progress").length;
      
      return {
        "Total Complaints": data.length,
        "Open": openCount,
        "Closed": closedCount,
        "In Progress": inProgressCount
      };
    
    case "Total Growth Tags Report":
      const activeCount = data.filter(row => row.Status === "Active").length;
      const inactiveCount = data.filter(row => row.Status === "Inactive").length;
      
      return {
        "Total Growth Tags": data.length,
        "Active": activeCount,
        "Inactive": inactiveCount
      };
    
    case "Total Customers Report":
      const franchiseCount = data.filter(row => row["Assign Type"] === "Franchise").length;
      const otherShopCount = data.filter(row => row["Assign Type"] === "Other Shop").length;
      const growtagCount = data.filter(row => row["Assign Type"] === "Growtag").length;
      
      return {
        "Total Customers": data.length,
        "Franchise": franchiseCount,
        "Other Shop": otherShopCount,
        "Growtag": growtagCount
      };
    
    default:
      return {
        "Total Records": data.length
      };
  }
};

/* ---------------------------------------------------------
    EXPORT BUTTON - FIXED VERSION
--------------------------------------------------------- */
const ExportButton = ({ data, format, filteredData }) => {
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.data);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    saveAs(new Blob([buffer]), `${data.title}.xlsx`);
  };

const exportPDF = async () => {
  try {
    // Dynamically import jsPDF with autoTable
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF("p", "pt", "a4");
    
    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(data.title, 40, 40);
    
    // Add date generated
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 60);
    
    // Calculate totals for PDF using FILTERED data
    const totals = calculateReportTotals(filteredData, data.title);
    
    let startY = 80;
    
    // ALWAYS show summary for all report types
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    let yPos = 80;
    
    // [Keep all the summary section code the same as you have]
    // ... (all the summary logic remains the same)
    
    // Prepare table data using FILTERED data
    const tableColumn = data.columns;
    
    // Function to clean up values for PDF - FIXED VERSION
    const cleanValueForPDF = (value, isTotalRow = false) => {
      if (value === null || value === undefined) return "";
      
      // For total row, we already have formatted values
      if (isTotalRow && typeof value === 'string') {
        // Remove currency symbol and return just the number part
        return value.replace(/[₹,]/g, '');
      }
      
      if (typeof value === 'number') {
        // For regular numbers, format without locale formatting
        // This prevents the "1" issue
        if (value % 1 === 0) {
          return value.toString();
        } else {
          return value.toFixed(2);
        }
      }
      
      if (typeof value === 'string') {
        // Handle currency formatted strings
        if (value.includes('₹')) {
          // Extract just the number part from currency strings
          const num = value.replace(/[₹,]/g, '');
          return parseFloat(num).toFixed(2);
        }
        
        // Remove any non-ASCII characters that might cause issues
        return value.replace(/[^\x00-\x7F]/g, "");
      }
      
      return String(value);
    };
    
    const tableRows = filteredData.map(item => 
      tableColumn.map(col => {
        const value = item[col] || "";
        return cleanValueForPDF(value);
      })
    );
    
    // ADD TOTAL ROW TO TABLE DATA FOR PDF
    if (filteredData.length > 0 && totals) {
      let totalRow = [];
      
      if (data.title === "Sales Summary Report") {
        totalRow = [
          "Total",
          totals["Total Invoices"].toString(),
          cleanValueForPDF(totals["Total Sales"], true),
          cleanValueForPDF(totals["Total Sales With Tax"], true),
          cleanValueForPDF(totals["Total Tax"], true)
        ];
      } else if (data.title === "Profit Share Distribution Report") {
        totalRow = [
          "", // Complaint ID
          "", // Complaint Date
          "Total", // Customer Name
          cleanValueForPDF(totals["Total Revenue"], true),
          cleanValueForPDF(totals["Total Shop Share (40%)"], true),
          cleanValueForPDF(totals["Total Grow Tags Share (40%)"], true),
          cleanValueForPDF(totals["Total Admin Share (20%)"], true)
        ];
      } else if (data.title === "Expense Report") {
        totalRow = [
          "Total", // Expense ID
          "", // Date
          "", // Title
          "", // Category
          cleanValueForPDF(totals["Total Expenses"], true),
          "", // Payment Method
          "" // Receipt
        ];
      }
      
      // Add total row to table rows if it's not empty
      if (totalRow.length > 0) {
        tableRows.push(totalRow);
      }
    }
    
    // Create the table with better font settings
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        font: 'helvetica',
        fontStyle: 'normal'
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        font: 'helvetica'
      },
      bodyStyles: {
        font: 'helvetica',
        fontSize: 9,
        fontStyle: 'normal'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      // Style the last row (total row) differently
      didParseCell: function(data) {
        // Style total row
        if (data.section === 'body' && data.row.index === data.table.body.length - 1 && 
            filteredData.length > 0 && totals && 
            (data.title === "Sales Summary Report" || 
             data.title === "Profit Share Distribution Report" || 
             data.title === "Expense Report")) {
          data.cell.styles.fillColor = [41, 128, 185]; // Blue color
          data.cell.styles.textColor = [255, 255, 255]; // White text
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { top: startY }
    });
    
    // Add footer with page number
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`${data.title}.pdf`);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error generating PDF. Please try again.");
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
const ReportTable = ({ data }) => {
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
  
  // Categories for expense report
  const categories = [
    "", "Rent", "Utilities", "Food & Beverage", "Software", 
    "Travel", "Office Supplies", "Marketing", "Training", 
    "Maintenance", "Salary", "Others"
  ];

  // Assign Type options
  const assignTypes = ["", "Franchise", "Other Shop", "Growtag"];

  const filtered = useMemo(() => {
    return data.data.filter((row) => {
      const dateStr =
        row["Date"] || row["Join Date"] || row["Complaint Date"];

      if (dateStr) {
        const d = new Date(dateStr);
        const y = d.getFullYear().toString();
        const m = (d.getMonth() + 1).toString().padStart(2, "0");
        const w = Math.ceil(d.getDate() / 7).toString();

        if (year && year !== y) return false;
        if (month && month !== m) return false;
        if (week && week !== w) return false;
      }

      // Expense-specific filters
      if (categoryFilter && row["Category"] && row["Category"] !== categoryFilter) return false;

      // Status filter for complaints report
      if (data.title === "Total Complaints Report" && statusFilter && row["Status"] && row["Status"] !== statusFilter) return false;

      // Status filter for grow-tags report
      if (data.title === "Total Growth Tags Report" && statusFilter && row["Status"] && row["Status"] !== statusFilter) return false;

      // Assign Type filter for complaints and customers reports
      if ((data.title === "Total Complaints Report" || data.title === "Total Customers Report") && 
          assignTypeFilter && row["Assign Type"] && row["Assign Type"] !== assignTypeFilter) return false;

      if (filterText) {
        return data.columns.some((c) =>
          String(row[c] || "")
            .toLowerCase()
            .includes(filterText.toLowerCase())
        );
      }

      return true;
    });
  }, [data, filterText, year, month, week, statusFilter, categoryFilter, assignTypeFilter]);

  // Calculate totals for the report
  const reportTotals = useMemo(() => {
    return calculateReportTotals(filtered, data.title);
  }, [filtered, data.title]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">{data.title}</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButton data={data} format="xlsx" filteredData={filtered} />
          <ExportButton data={data} format="pdf" filteredData={filtered} />
        </div>
      </div>

      {/* Filters Section - Always visible */}
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

        {/* Category filter only for expense report */}
        {data.title === "Expense Report" && (
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

        {/* Status filter for complaints report */}
        {data.title === "Total Complaints Report" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
        )}

        {/* Status filter for grow-tags report */}
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

        {/* Assign Type filter for complaints and customers reports */}
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

        {/* Search field - adjusts based on other filters */}
        <div className={`
          ${data.title === "Expense Report" ? "lg:col-span-2" : ""}
          ${data.title === "Total Complaints Report" && (assignTypeFilter || statusFilter) ? "lg:col-span-2" : ""}
          ${data.title === "Total Customers Report" && assignTypeFilter ? "lg:col-span-2" : ""}
          ${data.title === "Total Growth Tags Report" && statusFilter ? "lg:col-span-2" : ""}
          ${!["Expense Report", "Total Complaints Report", "Total Customers Report", "Total Growth Tags Report"].includes(data.title) ? "lg:col-span-4" : ""}
          ${data.title === "Total Complaints Report" && !assignTypeFilter && !statusFilter ? "lg:col-span-4" : ""}
          ${data.title === "Total Customers Report" && !assignTypeFilter ? "lg:col-span-4" : ""}
          ${data.title === "Total Growth Tags Report" && !statusFilter ? "lg:col-span-4" : ""}
        `}>
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            placeholder="Search in all columns..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {data.columns.map((col) => (
                <th 
                  key={col} 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
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
                {data.columns.map((col) => (
                  <td key={col} className="px-4 py-3 text-sm">
                    {col === "Total Sales" || col === "Total Sales With Tax" || col === "Total Tax Amount" ? (
                      <span className="font-semibold text-blue-600">
                        ₹{(row[col] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    ) : col === "Total Amount" || col === "Shop (40%)" || col === "Grow Tags (40%)" || col === "Fixly Admin (20%)" ? (
                      <span className="font-semibold text-green-600">
                        ₹{parseFloat(row[col] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    ) : col === "Amount" && row[col] ? (
                      <span className="font-semibold text-blue-600">{row[col]}</span>
                    ) : col === "Status" && row[col] ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row[col] === "Closed" || row[col] === "Active" ? "bg-green-100 text-green-800" :
                        row[col] === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                        row[col] === "Open" || row[col] === "Inactive" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {row[col]}
                      </span>
                    ) : col === "Receipt" && row[col] === "Available" ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <span className="text-xs">✓</span> Available
                      </span>
                    ) : col === "Category" && row[col] ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {row[col]}
                      </span>
                    ) : col === "Assign Type" && row[col] ? (
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

            {/* TOTAL ROWS FOR DIFFERENT REPORTS */}
            {filtered.length > 0 && reportTotals && (
              <>
                {data.title === "Sales Summary Report" && (
                  <tr className="bg-gray-800 text-white font-bold">
                    <td className="px-4 py-3 text-sm">Total</td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Invoices"]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Sales"]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Sales With Tax"]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Tax"]}
                    </td>
                  </tr>
                )}

                {data.title === "Profit Share Distribution Report" && (
                  <tr className="bg-gray-800 text-white font-bold">
                    <td className="px-4 py-3 text-sm" colSpan="3">Total</td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Revenue"]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Shop Share (40%)"]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Grow Tags Share (40%)"]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Admin Share (20%)"]}
                    </td>
                  </tr>
                )}

                {data.title === "Expense Report" && (
                  <tr className="bg-gray-800 text-white font-bold">
                    <td className="px-4 py-3 text-sm">Total</td>
                    <td className="px-4 py-3 text-sm" colSpan="3"></td>
                    <td className="px-4 py-3 text-sm">
                      {reportTotals["Total Expenses"]}
                    </td>
                    <td className="px-4 py-3 text-sm" colSpan="2"></td>
                  </tr>
                )}
              </>
            )}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={data.columns.length} className="px-4 py-8 text-center text-gray-500">
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
    if (key === "expense-report") return "💰";
    if (key === "sales-summary") return "📈";
    if (key === "profit-share") return "🤝";
    if (key.includes("customer")) return "👥";
    if (key.includes("grow")) return "🏷️";
    return "📋";
  };

  return (
    <aside className={`
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      ${collapsed ? 'lg:w-16' : 'lg:w-64 w-72'}
      fixed lg:relative z-40 transition-all duration-300 ease-in-out
      h-screen lg:h-auto bg-white shadow-lg lg:rounded-xl
      flex flex-col
    `}>
      {/* Sidebar Header */}
      <div className={`p-4 ${collapsed ? 'lg:p-3' : 'lg:p-5'} border-b flex items-center justify-between`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="text-2xl">📊</div>
            <h2 className="text-xl font-bold text-gray-800">Reports</h2>
          </div>
        ) : (
          <div className="text-2xl mx-auto">📊</div>
        )}
        
        {/* Close button for mobile */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        
        {/* Collapse/Expand button for desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center text-gray-500 hover:text-gray-700"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className={`flex-1 p-4 ${collapsed ? 'lg:px-2' : ''} overflow-y-auto`}>
        <div className="space-y-2">
          {reports.map((key) => {
            const reportName = key.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
            const icon = getIcon(key);
            
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
                title={collapsed ? reportName : ""}
              >
                <span className="text-lg">{icon}</span>
                {!collapsed && (
                  <span className="font-medium truncate">{reportName}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer - Only show when expanded */}
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
  const keys = Object.keys(reportData);
  const [active, setActive] = useState(keys[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // On desktop, keep sidebar visible
        setSidebarOpen(true);
      } else {
        // On mobile, close sidebar
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        reports={keys}
        activeReport={active}
        onSelectReport={setActive}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 p-3 md:p-4 lg:p-6">
        {/* Mobile Header with Toggle Button */}
        <div className="lg:hidden flex items-center justify-between mb-4 p-2 bg-white rounded-lg shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Menu size={20} />
            <span className="text-sm font-medium">Reports Menu</span>
          </button>
          
          {/* Current Report Title for mobile */}
          <div className="text-sm font-medium text-gray-700 truncate ml-2">
            {reportData[active]?.title}
          </div>
        </div>

        {/* Desktop Toggle Button - Floating */}
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
        <ReportTable data={reportData[active]} />
      </main>
    </div>
  );
};

export default Reports;