import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip
} from '@mui/material';
import {
  Download as DownloadIcon
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../context/SupabaseContext';
import html2pdf from 'html2pdf.js';

// Import Progress Report Components
import ReportHeader from '../../components/ProgressReport/ReportHeader';
import HealthReport from '../../components/ProgressReport/HealthReport';
import RoutineReport from '../../components/ProgressReport/RoutineReport';
import WellBeingReport from '../../components/ProgressReport/WellBeingReport';
import BehaviourReport from '../../components/ProgressReport/BehaviourReport';
import ProgressGraphs from '../../components/ProgressReport/ProgressGraphs';
import FillableFields from '../../components/ProgressReport/FillableFields';

// Import scoring and aggregation utilities
import {
  calculateHealthScore,
  calculateRoutineScore,
  calculateWellBeingScore,
  calculateBehaviourScore,
  calculateOverallScore,
  getIndicatorValue
} from '../../utils/reportScoring';
import { aggregateReportsData } from '../../utils/reportAggregation';

// Suppress ResizeObserver errors (common with html2pdf.js)
const originalError = console.error;
const originalErrorHandler = window.onerror;

// Suppress console.error ResizeObserver messages and React 19 deprecation warnings
console.error = (...args) => {
  const errorMessage = args[0]?.toString?.() || '';
  if (errorMessage.includes('ResizeObserver loop') || 
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMessage.includes('Accessing element.ref was removed in React 19') ||
      errorMessage.includes('ref is now a regular prop')) {
    return; // Suppress ResizeObserver errors and React 19 deprecation warnings
  }
  originalError.apply(console, args);
};

// Suppress window.onerror ResizeObserver messages and React 19 deprecation warnings
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === 'string' && 
      (message.includes('ResizeObserver loop') || 
       message.includes('ResizeObserver loop completed with undelivered notifications') ||
       message.includes('Accessing element.ref was removed in React 19') ||
       message.includes('ref is now a regular prop'))) {
    return true; // Suppress the error
  }
  if (originalErrorHandler) {
    return originalErrorHandler(message, source, lineno, colno, error);
  }
  return false;
};

// Suppress React's handleError for ResizeObserver and React 19 deprecation warnings (if it exists)
if (typeof window.handleError === 'function') {
  const originalHandleError = window.handleError;
  window.handleError = (error, errorInfo) => {
    const errorMessage = error?.message?.toString() || error?.toString() || '';
    if (errorMessage.includes('ResizeObserver loop') || 
        errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
        errorMessage.includes('Accessing element.ref was removed in React 19') ||
        errorMessage.includes('ref is now a regular prop')) {
      return; // Suppress ResizeObserver errors and React 19 deprecation warnings
    }
    return originalHandleError(error, errorInfo);
  };
}

// Suppress unhandled promise rejections for ResizeObserver and React 19 deprecation warnings
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message?.toString() || event.reason?.toString() || '';
  if (errorMessage.includes('ResizeObserver loop') || 
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMessage.includes('Accessing element.ref was removed in React 19') ||
      errorMessage.includes('ref is now a regular prop')) {
    event.preventDefault(); // Suppress the error
    return;
  }
});

function ProgressReport() {
  const history = useHistory();
  const location = useLocation();
  const { userProfile, loading: authLoading } = useSupabase();
  
  // Redirect employees away from this page
  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role !== 'admin') {
      console.log('⚠️ Non-admin user attempted to access Progress Report, redirecting...');
      history.replace('/app/dashboard');
    }
  }, [userProfile, authLoading, history]);
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Don't render if not admin
  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [reports, setReports] = useState([]);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [fillableData, setFillableData] = useState({});
  const [reportId, setReportId] = useState(null);
  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [reportType, setReportType] = useState('monthly');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [dateRange, setDateRange] = useState(null);
  
  // UI state

  // Suppress ResizeObserver errors from error overlay
  useEffect(() => {
    const handleError = (event) => {
      const errorMessage = event.message?.toString() || event.error?.message?.toString() || '';
      if (errorMessage.includes('ResizeObserver loop') || 
          errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError, true); // Use capture phase

    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  // Get client ID from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const clientId = urlParams.get('clientId');
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [location.search]);

  // Restore saved report from localStorage on mount and when tab becomes visible
  useEffect(() => {
    const restoreReport = () => {
      const savedReport = localStorage.getItem('progressReportData');
      if (savedReport) {
        try {
          const parsed = JSON.parse(savedReport);
          // Only restore if it's recent (less than 1 hour old)
          const reportAge = Date.now() - (parsed._savedAt || 0);
          if (reportAge < 60 * 60 * 1000) { // 1 hour
            console.log('✅ Restoring saved progress report');
            if (parsed.client) setClient(parsed.client);
            if (parsed.aggregatedData) setAggregatedData(parsed.aggregatedData);
            if (parsed.fillableData) setFillableData(parsed.fillableData);
            if (parsed.dateRange) setDateRange(parsed.dateRange);
            if (parsed.selectedClientId) setSelectedClientId(parsed.selectedClientId);
            if (parsed.reportType) setReportType(parsed.reportType);
            if (parsed.customDateRange) setCustomDateRange(parsed.customDateRange);
          } else {
            // Clear old report
            localStorage.removeItem('progressReportData');
          }
        } catch (error) {
          console.error('Error restoring saved report:', error);
          localStorage.removeItem('progressReportData');
        }
      }
    };

    // Restore on mount
    restoreReport();

    // Also restore when tab becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        restoreReport();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  // Fetch clients list
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            date_of_birth,
            alberta_health_card_number,
            client_id_no,
            band_no,
            admission_date,
            room,
            facilities(id, name, address)
          `)
          .order('first_name')
          .limit(100); // ✅ FIX #2: Limit to 100 records for performance

        if (error) throw error;
        const clientsData = data || [];
        setClients(clientsData);
        
        // Validate selectedClientId exists in the loaded clients
        // If it doesn't exist, reset it to empty string to avoid MUI warning
        if (selectedClientId && !clientsData.find(c => c.id === selectedClientId)) {
          console.warn('Selected client ID not found in clients list, resetting selection:', selectedClientId);
          setSelectedClientId('');
          // Also clear the client state if it was set
          setClient(null);
          // Clear any saved report data for this invalid client
          localStorage.removeItem('progressReportData');
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Failed to load clients');
      }
    };

    fetchClients();
  }, [selectedClientId]);


  // Calculate date range based on report type
  const calculateDateRange = (type, customRange = null) => {
    const today = new Date();
    let startDate, endDate;

    if (type === 'custom' && customRange) {
      startDate = new Date(customRange.startDate);
      endDate = new Date(customRange.endDate);
    } else if (type === 'monthly') {
      startDate = subMonths(today, 1);
      endDate = today;
    } else if (type === 'yearly') {
      startDate = subYears(today, 1);
      endDate = today;
    } else {
      startDate = subDays(today, 7);
      endDate = today;
    }

    return { startDate, endDate };
  };

  // Fetch daily reports for selected client and date range
  const fetchReports = async (clientId, startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('daily_reports_v2')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'submitted')
        .gte('report_date', format(startDate, 'yyyy-MM-dd'))
        .lte('report_date', format(endDate, 'yyyy-MM-dd'))
        .order('report_date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const calculatedDateRange = calculateDateRange(reportType, customDateRange);
      setDateRange(calculatedDateRange);

      // Fetch client details
      const selectedClient = clients.find(c => c.id === selectedClientId);
      if (!selectedClient) {
        throw new Error('Selected client not found');
      }
      setClient(selectedClient);

      // Fetch reports
      const reportsData = await fetchReports(selectedClientId, calculatedDateRange.startDate, calculatedDateRange.endDate);
      setReports(reportsData);

      // Aggregate data
      const aggregated = aggregateReportsData(reportsData, calculatedDateRange);
      setAggregatedData(aggregated);

      // Initialize fillable data
      setFillableData({});

      // Save report data to localStorage for persistence
      const reportDataToSave = {
        client: selectedClient,
        aggregatedData: aggregated,
        fillableData: {},
        dateRange: calculatedDateRange,
        selectedClientId,
        reportType,
        customDateRange,
        _savedAt: Date.now()
      };
      localStorage.setItem('progressReportData', JSON.stringify(reportDataToSave));
      console.log('✅ Progress report saved to localStorage');

    } catch (error) {
      console.error('Error generating report:', error);
      setError(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };


  // Download PDF (client-side html2pdf.js) - without BIR, AWOL, Injuries
  const handleDownloadPDF = async () => {
    if (!aggregatedData || !client) {
      setError('No report data to download');
      return;
    }

    const element = document.getElementById('progress-report-content');
    if (!element) {
      setError('Report content not found');
      return;
    }

    try {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after { box-shadow: none !important; }
        .MuiPaper-root, .MuiCard-root, .MuiTableContainer-root, .MuiTable-root,
        .MuiTableCell-root, .MuiTableRow-root, table, th, td { border: none !important; }
        body, #progress-report-content, .MuiCard-root, .MuiCardContent-root, .MuiPaper-root { background: #ffffff !important; }
        .MuiCardContent-root { padding-left: 16px !important; padding-right: 16px !important; }
        .recharts-wrapper, .MuiTableContainer-root, .MuiGrid-container { width: 100% !important; max-width: 100% !important; }

        /* Hide BIR, AWOL, Injuries sections */
        #bir-charts, #bir-summary, #awol-summary, #injury-summary,
        #awol-chart, #injury-chart, #incident-charts,
        #bir-summary-title, #awol-summary-title, #injury-summary-title,
        #incident-summaries,
        .bir-section, .awol-section, .injury-section {
          display: none !important;
        }


        /* Compact the health assessment table to fit on one page */
        #health-assessment-table th,
        #health-assessment-table td {
          padding: 4px 6px !important;
          font-size: 14px !important; /* Match other sections */
          line-height: 1.4 !important;
        }
        #health-assessment-table .MuiTypography-root {
          font-size: 14px !important; /* Match other sections */
          line-height: 1.4 !important;
          margin-bottom: 4px !important;
        }
        #health-assessment-table .MuiTextField-root,
        #health-assessment-table .MuiInputBase-input {
          font-size: 14px !important; /* Match other sections */
          line-height: 1.4 !important;
        }

        /* Hide Add Medication button and delete icons in PDF */
        .pdf-hide {
          display: none !important;
        }

        /* Ensure fillable text shows full content in PDF (no clipping) */
        textarea.MuiInputBase-input {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          white-space: pre-wrap !important;
          display: block !important;
        }
        .MuiTextField-root .MuiInputBase-root {
          align-items: start !important;
        }
        /* Remove input box visuals */
        .MuiOutlinedInput-notchedOutline { border: none !important; }
        .MuiInputBase-root { border: none !important; box-shadow: none !important; background: transparent !important; }
        /* Remove any max-heights on containers that could clip text */
        .MuiTableCell-root, .MuiBox-root {
          max-height: none !important;
          overflow: visible !important;
        }

        /* Remove extra space before behaviour assessment table */
        #behaviour-assessment-table {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        
        /* Remove extra space before activities assessment table */
        #activities-assessment-table {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }

        /* ============================================
           COMPREHENSIVE PAGE BREAK AVOIDANCE
           ============================================ */
        
        /* Avoid page breaks for ALL elements by default */
        * {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep sections together - entire section cards */
        .pdf-section,
        #section1, #section2, #section3, #section4, #section5,
        #section1 *, #section2 *, #section3 *, #section4 *, #section5 * {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep all cards together */
        .MuiCard-root,
        .MuiCardContent-root {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep all charts and their containers together */
        .recharts-wrapper,
        .recharts-surface,
        .recharts-legend-wrapper,
        .recharts-legend-item,
        .recharts-cartesian-axis,
        .recharts-cartesian-grid,
        .recharts-tooltip-wrapper,
        .recharts-responsive-container,
        [class*="recharts"] {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Section 5 - Keep entire graph containers together */
        #section5-card,
        #section5-graphs,
        #section5-graphs *,
        #section5-graphs .MuiGrid-item,
        #section5-graphs .MuiGrid-item *,
        #section5-graphs .recharts-wrapper,
        #section5-graphs .recharts-surface,
        #section5-graphs .recharts-legend-wrapper {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep each individual chart with its title */
        #section5-graphs .MuiGrid-item {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Keep chart title with chart */
        #section5-graphs .MuiTypography-h6 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        #section5-graphs .MuiTypography-h6 + * {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Section 2 - Keep chores table together */
        #section2,
        #section2 *,
        #section2 .MuiTableContainer-root,
        #section2 .MuiTable-root,
        #section2 .MuiTableHead,
        #section2 .MuiTableBody,
        #section2 .MuiTableRow,
        #section2 .MuiTableCell,
        #section2 table,
        #section2 thead,
        #section2 tbody,
        #section2 tr,
        #section2 th,
        #section2 td,
        #chores-performance-table,
        #chores-performance-table * {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep Section 2 title with score indicator */
        #section2-title {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        #routine-score-indicator {
          page-break-before: avoid !important;
          break-before: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Keep chores table title with table */
        #section2 .MuiTypography-h6 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        #section2 .MuiTableContainer-root,
        #chores-performance-table {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Keep all tables together */
        .MuiTableContainer-root,
        .MuiTable-root,
        .MuiTableHead,
        .MuiTableBody,
        .MuiTableRow,
        .MuiTableCell,
        table,
        thead,
        tbody,
        tr,
        th,
        td {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep table rows together */
        .MuiTableRow,
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep input fields together */
        .MuiTextField-root,
        .MuiInputBase-root,
        .MuiInputBase-input,
        textarea,
        input {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep text elements together */
        .MuiTypography-root,
        p, span, div, h1, h2, h3, h4, h5, h6 {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep Grid items together */
        .MuiGrid-item,
        .MuiGrid-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep Box containers together */
        .MuiBox-root {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep Chip components together */
        .MuiChip-root {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep Rating components together */
        .MuiRating-root {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Hide legends in Section 5 line graphs for PDF */
        #section5-graphs .recharts-legend-wrapper {
          display: none !important;
        }

        /* Stack Section 5 graphs vertically (full width) for PDF */
        #section5-graphs .MuiGrid-item {
          width: 100% !important;
          max-width: 100% !important;
          flex-basis: 100% !important;
        }
        
        /* Ensure Chip text is visible in PDF */
        .MuiChip-label {
          color: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
        }

        /* Ensure all table cells align to top */
        .MuiTableCell-root {
          vertical-align: top !important;
        }
        table td, table th {
          vertical-align: top !important;
        }
      `;
      document.head.appendChild(style);

      const opt = {
        margin: 0.5,
        filename: `Progress_Report_${client.first_name}_${client.last_name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          onclone: (clonedDoc) => {
            const root = clonedDoc.getElementById('progress-report-content');
            if (root) root.style.removeProperty('width');
            
            // Hide BIR, AWOL, Injuries sections - find all related elements
            const birCharts = clonedDoc.getElementById('bir-charts');
            const birSummary = clonedDoc.getElementById('bir-summary');
            const awolSummary = clonedDoc.getElementById('awol-summary');
            const injurySummary = clonedDoc.getElementById('injury-summary');
            const awolChart = clonedDoc.getElementById('awol-chart');
            const injuryChart = clonedDoc.getElementById('injury-chart');
            const incidentCharts = clonedDoc.getElementById('incident-charts');
            
            // Also find parent containers and hide them
            const birSummaryParent = birSummary?.closest('.MuiBox-root');
            const awolSummaryParent = awolSummary?.closest('.MuiBox-root');
            const injurySummaryParent = injurySummary?.closest('.MuiBox-root');
            
            // Hide all BIR/AWOL/Injury related elements and their parent containers
            const birSummaryTitle = clonedDoc.getElementById('bir-summary-title');
            const awolSummaryTitle = clonedDoc.getElementById('awol-summary-title');
            const injurySummaryTitle = clonedDoc.getElementById('injury-summary-title');
            const incidentSummaries = clonedDoc.getElementById('incident-summaries');
            
            // Hide the entire incident summaries container
            if (incidentSummaries) {
              incidentSummaries.style.display = 'none';
            }
            
            // Hide individual elements
            const elementsToHide = [
              birCharts, birSummary, awolSummary, injurySummary, 
              awolChart, injuryChart, incidentCharts,
              birSummaryTitle, awolSummaryTitle, injurySummaryTitle
            ];
            
            elementsToHide.forEach(el => {
              if (el) {
                el.style.display = 'none';
              }
            });
            
            // Replace MUI inputs with plain text to avoid clipping
            const inputs = clonedDoc.querySelectorAll('.MuiInputBase-input');
            inputs.forEach((inp) => {
              const value = inp.value || inp.textContent || '';
              const block = clonedDoc.createElement('div');
              block.textContent = value;
              block.style.whiteSpace = 'pre-wrap';
              block.style.fontSize = getComputedStyle(inp).fontSize;
              block.style.lineHeight = getComputedStyle(inp).lineHeight;
              block.style.minHeight = '0';
              inp.parentNode && inp.parentNode.replaceChild(block, inp);
            });

            // Ensure Chip labels are visible in PDF - replace with styled div
            const chips = clonedDoc.querySelectorAll('.MuiChip-root');
            chips.forEach((chip) => {
              const label = chip.querySelector('.MuiChip-label');
              if (label) {
                const labelText = label.textContent || '';
                const chipColor = getComputedStyle(chip).backgroundColor;
                const chipBorderColor = getComputedStyle(chip).borderColor;
                
                // Create a replacement div with visible text
                const replacement = clonedDoc.createElement('div');
                replacement.textContent = labelText;
                replacement.style.padding = '6px 12px';
                replacement.style.borderRadius = '16px';
                replacement.style.backgroundColor = chipColor || '#ffc107';
                replacement.style.border = `1px solid ${chipBorderColor || '#ffc107'}`;
                replacement.style.color = '#000000';
                replacement.style.fontSize = '1.2rem';
                replacement.style.fontWeight = 'bold';
                replacement.style.display = 'inline-block';
                replacement.style.minWidth = '120px';
                replacement.style.textAlign = 'center';
                
                // Replace the chip with the styled div
                if (chip.parentNode) {
                  chip.parentNode.replaceChild(replacement, chip);
                }
              }
            });

            // Remove spacing between behaviour assessment title and table (same as activities assessment)
            const behaviourAssessmentTitle = clonedDoc.getElementById('behaviour-assessment-title');
            const behaviourAssessmentTable = clonedDoc.getElementById('behaviour-assessment-table');
            if (behaviourAssessmentTitle) {
              // Remove gutterBottom spacing
              behaviourAssessmentTitle.style.marginBottom = '0';
              behaviourAssessmentTitle.style.paddingBottom = '0';
            }
            if (behaviourAssessmentTable) {
              behaviourAssessmentTable.style.marginTop = '0';
              behaviourAssessmentTable.style.paddingTop = '0';
              // Also remove any margin-bottom that might be inherited
              behaviourAssessmentTable.style.marginBottom = '0';
            }

            // Hide Add Medication button and delete icons in PDF
            const pdfHideElements = clonedDoc.querySelectorAll('.pdf-hide');
            pdfHideElements.forEach(el => {
              el.style.display = 'none';
            });

            // Hide legends in Section 5 line graphs
            const section5Graphs = clonedDoc.getElementById('section5-graphs');
            if (section5Graphs) {
              const legends = section5Graphs.querySelectorAll('.recharts-legend-wrapper');
              legends.forEach(legend => {
                legend.style.display = 'none';
              });
            }

            // Stack Section 5 graphs vertically (force full width)
            const section5GridItems = clonedDoc.querySelectorAll('#section5-graphs .MuiGrid-item');
            section5GridItems.forEach(item => {
              // Force full width for PDF (remove md={6} behavior)
              item.style.width = '100%';
              item.style.maxWidth = '100%';
              item.style.flexBasis = '100%';
            });
          }
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: {
          mode: 'avoid-all', // Avoid all page breaks by default
          avoid: [
            // Sections
            '#section1', '#section1 *',
            '#section2', '#section2 *',
            '#section3', '#section3 *',
            '#section4', '#section4 *',
            '#section5', '#section5 *',
            
            // Section 5 specific
            '#section5-card', '#section5-card *',
            '#section5-graphs', '#section5-graphs *',
            '#section5-title',
            
            // Charts - all Recharts elements
            '.recharts-wrapper', '.recharts-wrapper *',
            '.recharts-surface', '.recharts-surface *',
            '.recharts-legend-wrapper', '.recharts-legend-wrapper *',
            '.recharts-legend-item', '.recharts-legend-item *',
            '.recharts-cartesian-axis', '.recharts-cartesian-axis *',
            '.recharts-cartesian-grid', '.recharts-cartesian-grid *',
            '.recharts-tooltip-wrapper', '.recharts-tooltip-wrapper *',
            '.recharts-responsive-container', '.recharts-responsive-container *',
            '[class*="recharts"]', '[class*="recharts"] *',
            
            // Tables - all table elements
            '.MuiTableContainer-root', '.MuiTableContainer-root *',
            '.MuiTable-root', '.MuiTable-root *',
            '.MuiTableHead', '.MuiTableHead *',
            '.MuiTableBody', '.MuiTableBody *',
            '.MuiTableRow', '.MuiTableRow *',
            '.MuiTableCell', '.MuiTableCell *',
            'table', 'table *',
            'thead', 'thead *',
            'tbody', 'tbody *',
            'tr', 'tr *',
            'th', 'th *',
            'td', 'td *',
            
            // Section 2 specific
            '#section2 .MuiTableContainer-root', '#section2 .MuiTableContainer-root *',
            '#section2 .MuiTable-root', '#section2 .MuiTable-root *',
            '#section2-title', '#routine-score-indicator',
            '#chores-performance-table', '#chores-performance-table *',
            
            // Input fields
            '.MuiTextField-root', '.MuiTextField-root *',
            '.MuiInputBase-root', '.MuiInputBase-root *',
            '.MuiInputBase-input', '.MuiInputBase-input *',
            'textarea', 'textarea *',
            'input', 'input *',
            
            // Text elements
            '.MuiTypography-root', '.MuiTypography-root *',
            'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            
            // Layout components
            '.MuiCard-root', '.MuiCard-root *',
            '.MuiCardContent-root', '.MuiCardContent-root *',
            '.MuiGrid-container', '.MuiGrid-container *',
            '.MuiGrid-item', '.MuiGrid-item *',
            '.MuiBox-root', '.MuiBox-root *',
            '.MuiPaper-root', '.MuiPaper-root *',
            
            // Other components
            '.MuiChip-root', '.MuiChip-root *',
            '.MuiRating-root', '.MuiRating-root *',
            '.pdf-avoid-break', '.pdf-avoid-break *',
            '.pdf-section', '.pdf-section *',
            
            // Images
            'img', 'img *',
            
            // Activities assessment table (working well)
            '#activities-assessment-table', '#activities-assessment-table *',
            '#activities-assessment-title',
            
            // Health assessment table
            '#health-assessment-table', '#health-assessment-table *',
            
            // Behaviour assessment table
            '#behaviour-assessment-table', '#behaviour-assessment-table *',
            '#behaviour-assessment-title'
          ]
        }
      };

      // Suppress ResizeObserver errors and React 19 deprecation warnings during PDF generation
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const errorMessage = args[0]?.toString?.() || '';
        if (errorMessage.includes('ResizeObserver loop') || 
            errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
            errorMessage.includes('Accessing element.ref was removed in React 19') ||
            errorMessage.includes('ref is now a regular prop')) {
          return; // Suppress ResizeObserver errors and React 19 deprecation warnings
        }
        originalConsoleError.apply(console, args);
      };

      try {
        await html2pdf().set(opt).from(element).save();
      } finally {
        // Restore original console.error
        console.error = originalConsoleError;
        document.head.removeChild(style);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(error.message || 'Failed to generate PDF');
      // Clean up style if it exists
      const style = document.querySelector('style[data-pdf-style]');
      if (style) {
        document.head.removeChild(style);
      }
    }
  };

  // Download BIR, AWOL, Injuries only
  const handleDownloadBIRAWOLInjuries = async () => {
    if (!aggregatedData || !client) {
      setError('No report data to download');
      return;
    }

    const element = document.getElementById('progress-report-content');
    if (!element) {
      setError('Report content not found');
      return;
    }

    // Aggressive error suppression for ResizeObserver errors
    const originalConsoleError = console.error;
    const originalWindowError = window.onerror;
    const originalHandleError = window.handleError;
    
    // Suppress console.error
    console.error = (...args) => {
      const errorMessage = args[0]?.toString?.() || '';
      if (errorMessage.includes('ResizeObserver loop') || 
          errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
          errorMessage.includes('Accessing element.ref was removed in React 19') ||
          errorMessage.includes('ref is now a regular prop')) {
        return; // Suppress ResizeObserver errors and React 19 deprecation warnings
      }
      originalConsoleError.apply(console, args);
    };

    // Suppress window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = message?.toString() || error?.message?.toString() || '';
      if (errorMessage.includes('ResizeObserver loop') || 
          errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
          errorMessage.includes('Accessing element.ref was removed in React 19') ||
          errorMessage.includes('ref is now a regular prop')) {
        return true; // Suppress the error
      }
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Suppress window.handleError if it exists
    if (typeof window.handleError === 'function') {
      window.handleError = (error, errorInfo) => {
        const errorMessage = error?.message?.toString() || error?.toString() || '';
        if (errorMessage.includes('ResizeObserver loop') || 
            errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
            errorMessage.includes('Accessing element.ref was removed in React 19') ||
            errorMessage.includes('ref is now a regular prop')) {
          return; // Suppress ResizeObserver errors and React 19 deprecation warnings
        }
        if (originalHandleError) {
          return originalHandleError(error, errorInfo);
        }
      };
    }

    // Add error event listener in capture phase to stop propagation
    const errorHandler = (event) => {
      const errorMessage = event.message?.toString() || event.error?.message?.toString() || '';
      if (errorMessage.includes('ResizeObserver loop') || 
          errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    };
    window.addEventListener('error', errorHandler, true);

    // Add unhandled rejection handler
    const rejectionHandler = (event) => {
      const errorMessage = event.reason?.message?.toString() || event.reason?.toString() || '';
      if (errorMessage.includes('ResizeObserver loop') || 
          errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', rejectionHandler);

    try {
      const style = document.createElement('style');
      style.setAttribute('data-pdf-style', 'true');
      style.textContent = `
        *, *::before, *::after { box-shadow: none !important; }
        .MuiPaper-root, .MuiCard-root, .MuiTableContainer-root, .MuiTable-root,
        .MuiTableCell-root, .MuiTableRow-root, table, th, td { border: none !important; }
        body, #progress-report-content, .MuiCard-root, .MuiCardContent-root, .MuiPaper-root { background: #ffffff !important; }
        .MuiCardContent-root { padding-left: 16px !important; padding-right: 16px !important; }
        .recharts-wrapper, .MuiTableContainer-root, .MuiGrid-container { width: 100% !important; max-width: 100% !important; }

        /* Hide everything except BIR, AWOL, Injuries sections */
        #section1, #section2, #section3, #section5,
        #section4-title, #behaviour-score, #behaviour-charts, #behaviour-assessment-title, #behaviour-assessment-table,
        .health-section, .routine-section, .wellbeing-section, .progress-section {
          display: none !important;
        }

        /* Show only BIR, AWOL, Injuries sections */
        #bir-charts, #bir-summary, #awol-summary, #injury-summary,
        #awol-chart, #injury-chart, #incident-charts,
        #bir-summary-title, #awol-summary-title, #injury-summary-title,
        #incident-summaries {
          display: block !important;
        }


        /* Ensure fillable text shows full content in PDF (no clipping) */
        textarea.MuiInputBase-input {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          white-space: pre-wrap !important;
          display: block !important;
        }
        .MuiTextField-root .MuiInputBase-root {
          align-items: start !important;
        }
        /* Remove input box visuals */
        .MuiOutlinedInput-notchedOutline { border: none !important; }
        .MuiInputBase-root { border: none !important; box-shadow: none !important; background: transparent !important; }
        /* Remove any max-heights on containers that could clip text */
        .MuiTableCell-root, .MuiBox-root {
          max-height: none !important;
          overflow: visible !important;
        }

        /* Strong avoid inside wrappers and their children */
        .pdf-avoid-break,
        .pdf-avoid-break * {
        }

        /* Ensure all table cells align to top */
        .MuiTableCell-root {
          vertical-align: top !important;
        }
        table td, table th {
          vertical-align: top !important;
        }
      `;
      style.setAttribute('data-pdf-style', 'true');
      document.head.appendChild(style);

      const opt = {
        margin: 0.5,
        filename: `BIR_AWOL_Injuries_Report_${client.first_name}_${client.last_name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          onclone: (clonedDoc) => {
            const root = clonedDoc.getElementById('progress-report-content');
            if (root) root.style.removeProperty('width');
            
            // Hide all sections except BIR, AWOL, Injuries
            const section1 = clonedDoc.getElementById('section1');
            const section2 = clonedDoc.getElementById('section2');
            const section3 = clonedDoc.getElementById('section3');
            const section5 = clonedDoc.getElementById('section5');
            const reportHeader = clonedDoc.querySelector('[id*="report-header"]');
            const section4 = clonedDoc.getElementById('section4');
            const section4Title = clonedDoc.getElementById('section4-title');
            const behaviourScore = clonedDoc.getElementById('behaviour-score');
            const behaviourCharts = clonedDoc.getElementById('behaviour-charts');
            const behaviourAssessmentTitle = clonedDoc.getElementById('behaviour-assessment-title');
            const behaviourAssessmentTable = clonedDoc.getElementById('behaviour-assessment-table');
            
            // Hide entire sections
            if (section1) section1.style.display = 'none';
            if (section2) section2.style.display = 'none';
            if (section3) section3.style.display = 'none';
            if (section5) section5.style.display = 'none';
            if (reportHeader) reportHeader.style.display = 'none';
            
            // Hide behaviour-related elements in section4
            if (section4Title) section4Title.style.display = 'none';
            if (behaviourScore) behaviourScore.style.display = 'none';
            if (behaviourCharts) behaviourCharts.style.display = 'none';
            if (behaviourAssessmentTitle) behaviourAssessmentTitle.style.display = 'none';
            if (behaviourAssessmentTable) behaviourAssessmentTable.style.display = 'none';
            
            // Get BIR, AWOL, Injuries elements
            const birCharts = clonedDoc.getElementById('bir-charts');
            const birSummary = clonedDoc.getElementById('bir-summary');
            const awolSummary = clonedDoc.getElementById('awol-summary');
            const injurySummary = clonedDoc.getElementById('injury-summary');
            const awolChart = clonedDoc.getElementById('awol-chart');
            const injuryChart = clonedDoc.getElementById('injury-chart');
            const incidentCharts = clonedDoc.getElementById('incident-charts');
            const birSummaryTitle = clonedDoc.getElementById('bir-summary-title');
            const awolSummaryTitle = clonedDoc.getElementById('awol-summary-title');
            const injurySummaryTitle = clonedDoc.getElementById('injury-summary-title');
            
            // Create a new container for BIR/AWOL/Injuries only
            const newContainer = clonedDoc.createElement('div');
            newContainer.setAttribute('style', 'padding: 20px; background: white;');
            
            // Add title
            const title = clonedDoc.createElement('h2');
            title.setAttribute('style', 'color: #1976d2; font-size: 1.75rem; font-weight: 500; margin-bottom: 24px; margin-top: 0;');
            title.textContent = 'BIR, AWOL, and Injuries Report';
            newContainer.appendChild(title);
            
            // Clone and append BIR/AWOL/Injuries elements
            if (birCharts) {
              const clonedBirCharts = birCharts.cloneNode(true);
              clonedBirCharts.style.display = 'block';
              newContainer.appendChild(clonedBirCharts);
            }
            
            if (incidentCharts) {
              const clonedIncidentCharts = incidentCharts.cloneNode(true);
              clonedIncidentCharts.style.display = 'block';
              newContainer.appendChild(clonedIncidentCharts);
            }
            
            // Clone summary tables with their titles (using already declared variables)
            if (birSummaryTitle && birSummary) {
              const clonedTitle = birSummaryTitle.cloneNode(true);
              clonedTitle.style.display = 'block';
              newContainer.appendChild(clonedTitle);
              const clonedSummary = birSummary.cloneNode(true);
              clonedSummary.style.display = 'block';
              newContainer.appendChild(clonedSummary);
            }
            
            if (awolSummaryTitle && awolSummary) {
              const clonedTitle = awolSummaryTitle.cloneNode(true);
              clonedTitle.style.display = 'block';
              newContainer.appendChild(clonedTitle);
              const clonedSummary = awolSummary.cloneNode(true);
              clonedSummary.style.display = 'block';
              newContainer.appendChild(clonedSummary);
            }
            
            if (injurySummaryTitle && injurySummary) {
              const clonedTitle = injurySummaryTitle.cloneNode(true);
              clonedTitle.style.display = 'block';
              newContainer.appendChild(clonedTitle);
              const clonedSummary = injurySummary.cloneNode(true);
              clonedSummary.style.display = 'block';
              newContainer.appendChild(clonedSummary);
            }
            
            // Replace the entire content with just BIR/AWOL/Injuries
            if (root) {
              root.innerHTML = '';
              root.appendChild(newContainer);
            }
            
            // Replace MUI inputs with plain text to avoid clipping
            const inputs = clonedDoc.querySelectorAll('.MuiInputBase-input');
            inputs.forEach((inp) => {
              const value = inp.value || inp.textContent || '';
              const block = clonedDoc.createElement('div');
              block.textContent = value;
              block.style.whiteSpace = 'pre-wrap';
              block.style.fontSize = getComputedStyle(inp).fontSize;
              block.style.lineHeight = getComputedStyle(inp).lineHeight;
              block.style.minHeight = '0';
              inp.parentNode && inp.parentNode.replaceChild(block, inp);
            });

            // Ensure Chip labels are visible in PDF - replace with styled div
            const chips = clonedDoc.querySelectorAll('.MuiChip-root');
            chips.forEach((chip) => {
              const label = chip.querySelector('.MuiChip-label');
              if (label) {
                const labelText = label.textContent || '';
                const chipColor = getComputedStyle(chip).backgroundColor;
                const chipBorderColor = getComputedStyle(chip).borderColor;
                
                // Create a replacement div with visible text
                const replacement = clonedDoc.createElement('div');
                replacement.textContent = labelText;
                replacement.style.padding = '6px 12px';
                replacement.style.borderRadius = '16px';
                replacement.style.backgroundColor = chipColor || '#ffc107';
                replacement.style.border = `1px solid ${chipBorderColor || '#ffc107'}`;
                replacement.style.color = '#000000';
                replacement.style.fontSize = '1.2rem';
                replacement.style.fontWeight = 'bold';
                replacement.style.display = 'inline-block';
                replacement.style.minWidth = '120px';
                replacement.style.textAlign = 'center';
                
                // Replace the chip with the styled div
                if (chip.parentNode) {
                  chip.parentNode.replaceChild(replacement, chip);
                }
              }
            });
          }
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      try {
        // Completely isolate PDF generation from React's error handling
        // Use multiple layers of isolation to prevent errors from reaching React
        await new Promise((resolve, reject) => {
          // First layer: requestAnimationFrame
          requestAnimationFrame(() => {
            // Second layer: setTimeout
            setTimeout(() => {
              // Third layer: Another setTimeout for maximum isolation
              setTimeout(async () => {
                try {
                  await html2pdf().set(opt).from(element).save();
                  resolve();
                } catch (pdfError) {
                  // Check if it's a ResizeObserver error - if so, ignore it
                  const errorMessage = pdfError?.message?.toString() || pdfError?.toString() || '';
                  if (errorMessage.includes('ResizeObserver loop') || 
                      errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
                      errorMessage.includes('Accessing element.ref was removed in React 19') ||
                      errorMessage.includes('ref is now a regular prop')) {
                    // If it's a ResizeObserver error, silently resolve - PDF generation likely succeeded
                    resolve();
                  } else {
                    // Only reject for non-ResizeObserver errors
                    reject(pdfError);
                  }
                }
              }, 0);
            }, 0);
          });
        });
      } finally {
        // Restore original error handlers
        console.error = originalConsoleError;
        window.onerror = originalWindowError;
        if (originalHandleError) {
          window.handleError = originalHandleError;
        }
        // Remove event listeners
        window.removeEventListener('error', errorHandler, true);
        window.removeEventListener('unhandledrejection', rejectionHandler);
        // Clean up style
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }
    } catch (error) {
      // Restore original error handlers even on error
      console.error = originalConsoleError;
      window.onerror = originalWindowError;
      if (originalHandleError) {
        window.handleError = originalHandleError;
      }
      // Remove event listeners
      window.removeEventListener('error', errorHandler, true);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      
      // Only log non-ResizeObserver errors and non-React 19 deprecation warnings
      const errorMessage = error?.message?.toString() || error?.toString() || '';
      if (!errorMessage.includes('ResizeObserver loop') && 
          !errorMessage.includes('ResizeObserver loop completed with undelivered notifications') &&
          !errorMessage.includes('Accessing element.ref was removed in React 19') &&
          !errorMessage.includes('ref is now a regular prop')) {
        console.error('Error generating PDF:', error);
        setError(error.message || 'Failed to generate PDF');
      }
      
      // Clean up style on error
      const style = document.querySelector('style[data-pdf-style]');
      if (style) {
        document.head.removeChild(style);
      }
    }
  };


  // Handle fillable data changes
  const handleFillableDataChange = (section, data) => {
    setFillableData(prev => {
      const updated = {
        ...prev,
        [section]: data
      };
      // Save updated fillable data to localStorage immediately if report exists
      if (aggregatedData && client) {
        try {
          const savedReport = localStorage.getItem('progressReportData');
          if (savedReport) {
            const parsed = JSON.parse(savedReport);
            parsed.fillableData = updated;
            parsed._savedAt = Date.now();
            localStorage.setItem('progressReportData', JSON.stringify(parsed));
          } else {
            // If no saved report exists, create one with current state
            const reportDataToSave = {
              client,
              aggregatedData,
              fillableData: updated,
              dateRange,
              selectedClientId,
              reportType,
              customDateRange,
              _savedAt: Date.now()
            };
            localStorage.setItem('progressReportData', JSON.stringify(reportDataToSave));
          }
        } catch (error) {
          console.error('Error saving fillable data:', error);
        }
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Generating report...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Progress Report Generator
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Report Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={selectedClientId || ''}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  label="Client"
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {clients.length === 0 ? (
                    <MenuItem value="" disabled>Loading clients...</MenuItem>
                  ) : (
                    clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Report Type"
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="weekly">Last 7 Days</MenuItem>
                  <MenuItem value="monthly">Last Month</MenuItem>
                  <MenuItem value="yearly">Last Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={!selectedClientId}
                fullWidth
                size="large"
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>

          {/* Custom Date Range */}
          {reportType === 'custom' && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>


      {/* Generated Report */}
      {aggregatedData && client && (
        <Box>
          {/* Screen-only responsive styles for charts */}
          <style>{`
            @media screen {
              /* Prevent chart overflow on small screens */
              #progress-report-content .MuiGrid-item {
                min-width: 0 !important;
                overflow: visible !important;
              }
              #progress-report-content .recharts-wrapper {
                overflow: visible !important;
                width: 100% !important;
              }
              #progress-report-content .recharts-surface {
                overflow: visible !important;
              }
              #progress-report-content .recharts-responsive-container {
                width: 100% !important;
                min-width: 0 !important;
              }
              /* Ensure Grid containers don't cause overflow */
              #progress-report-content .MuiGrid-container {
                width: 100% !important;
                margin: 0 !important;
              }
            }
          `}</style>
          {/* Action Buttons at Top */}
          <Box display="flex" gap={2} mb={3} justifyContent="center" className="no-print">
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
            >
              Download Report
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadBIRAWOLInjuries}
            >
              Download BIR/AWOL/Injuries
            </Button>
          </Box>

          {/* PDF Content - Separate from action buttons */}
          <Box 
            id="progress-report-content"
            sx={{
              // Screen-only responsive styling (not applied in PDF)
              '@media screen': {
                width: '100%',
                overflowX: 'auto',
                '& .recharts-wrapper': {
                  overflow: 'visible !important'
                },
                '& .recharts-surface': {
                  overflow: 'visible !important'
                },
                '& .MuiGrid-container': {
                  width: '100%'
                },
                '& .MuiGrid-item': {
                  minWidth: 0
                }
              }
            }}
          >
            {/* Report Sections */}
          <ReportHeader
            client={client}
            dateRange={dateRange}
            overallScore={aggregatedData.overallScore}
            indicator={aggregatedData.indicator}
            reportDate={new Date()}
          />

          <div id="section1" className="pdf-section">
            <HealthReport
              healthScore={aggregatedData.healthScore}
              indicator={aggregatedData.indicator}
              pieChartData={aggregatedData.pieChartData}
              summaryTables={aggregatedData.summaryTables}
              fillableData={fillableData}
              onFillableDataChange={handleFillableDataChange}
            />
          </div>

          <div id="section2" className="pdf-section">
            <RoutineReport
              routineScore={aggregatedData.routineScore}
              indicator={aggregatedData.indicator}
              fillableData={fillableData}
              onFillableDataChange={handleFillableDataChange}
            />
          </div>

          <div id="section3" className="pdf-section">
            <WellBeingReport
              wellbeingScore={aggregatedData.wellbeingScore}
              indicator={aggregatedData.indicator}
              pieChartData={aggregatedData.pieChartData}
              summaryTables={aggregatedData.summaryTables}
              fillableData={fillableData}
              onFillableDataChange={handleFillableDataChange}
            />
          </div>

          <div id="section4" className="pdf-section">
            <BehaviourReport
              behaviourScore={aggregatedData.behaviourScore}
              indicator={aggregatedData.indicator}
              pieChartData={aggregatedData.pieChartData}
              summaryTables={aggregatedData.summaryTables}
              fillableData={fillableData}
              onFillableDataChange={handleFillableDataChange}
            />
          </div>

          <div id="section5" className="pdf-section">
            <ProgressGraphs trendData={aggregatedData.trendData} />
          </div>
          </Box>

          {/* Download Buttons at Bottom */}
          <Box display="flex" gap={2} mt={4} mb={3} justifyContent="center" className="no-print">
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
            >
              Download Report
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadBIRAWOLInjuries}
            >
              Download BIR/AWOL/Injuries
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default ProgressReport;
