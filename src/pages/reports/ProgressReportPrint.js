import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../context/SupabaseContext';

import ReportHeader from '../../components/ProgressReport/ReportHeader';
import HealthReport from '../../components/ProgressReport/HealthReport';
import RoutineReport from '../../components/ProgressReport/RoutineReport';
import WellBeingReport from '../../components/ProgressReport/WellBeingReport';
import BehaviourReport from '../../components/ProgressReport/BehaviourReport';
import ProgressGraphs from '../../components/ProgressReport/ProgressGraphs';
import { aggregateReportsData } from '../../utils/reportAggregation';

const PRINT_STYLE_ID = 'progress-report-print-styles';

/** Grow all multiline fields to full content; remove scroll clipping (screen + before print). */
function expandTextareasForPrint() {
  const root = document.getElementById('progress-report-content');
  if (!root) return;

  const unwrapMaxHeight = [
    '.MuiTextField-root',
    '.MuiFormControl-root',
    '.MuiInputBase-root',
    '.MuiOutlinedInput-root',
    '.MuiInputBase-multiline',
  ];
  unwrapMaxHeight.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => {
      if (el.querySelector?.('textarea') || el.classList.contains('MuiInputBase-multiline')) {
        el.style.setProperty('max-height', 'none', 'important');
        el.style.setProperty('height', 'auto', 'important');
        el.style.setProperty('overflow', 'visible', 'important');
      }
    });
  });

  root.querySelectorAll('textarea').forEach((ta) => {
    ta.style.setProperty('max-height', 'none', 'important');
    ta.style.setProperty('overflow', 'hidden', 'important');
    ta.style.setProperty('resize', 'none', 'important');
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight, 24)}px`;
    ta.style.setProperty('overflow', 'visible', 'important');
  });

  root.querySelectorAll('.MuiTableCell-root').forEach((cell) => {
    cell.style.setProperty('overflow', 'visible', 'important');
  });
}

/** Replace input/textarea fields with plain text blocks for printing (no clipping). */
function replaceInputsWithPlainTextForPrint() {
  const root = document.getElementById('progress-report-content');
  if (!root) return () => {};

  const replacements = [];

  // Replace the whole MUI input wrapper (OutlinedInput) when possible so
  // fieldset/legend/adornments don't render weird artifacts (like stray "x").
  const fields = root.querySelectorAll('textarea, input');
  fields.forEach((field) => {
    const isTextArea = field.tagName.toLowerCase() === 'textarea';
    const value = field.value ?? '';
    const wrapper =
      field.closest?.('.MuiOutlinedInput-root') ||
      field.closest?.('.MuiInputBase-root') ||
      field;
    const computed = window.getComputedStyle(wrapper);

    const block = document.createElement('div');
    block.textContent = value;
    block.style.whiteSpace = 'pre-wrap';
    block.style.wordBreak = 'break-word';
    block.style.fontSize = computed.fontSize;
    block.style.lineHeight = computed.lineHeight;
    block.style.fontFamily = computed.fontFamily;
    block.style.color = computed.color;
    block.style.minHeight = isTextArea ? '24px' : computed.height;
    block.style.padding = computed.padding;
    block.style.margin = '0';

    // Keep layout width similar to the field
    block.style.width = computed.width;
    block.style.boxSizing = 'border-box';

    const parent = wrapper.parentNode;
    if (!parent) return;

    replacements.push({ parent, wrapper, block });
    parent.replaceChild(block, wrapper);
  });

  return () => {
    replacements.forEach(({ parent, wrapper, block }) => {
      if (parent && block && parent.contains(block)) {
        parent.replaceChild(wrapper, block);
      }
    });
  };
}

function loadMatchingFillable(clientId, startStr, endStr) {
  try {
    const raw = localStorage.getItem('progressReportData');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.selectedClientId !== clientId) return {};
    const dr = parsed.dateRange;
    if (!dr || dr.startDate == null || dr.endDate == null) return {};
    const s = format(new Date(dr.startDate), 'yyyy-MM-dd');
    const e = format(new Date(dr.endDate), 'yyyy-MM-dd');
    if (s !== startStr || e !== endStr) return {};
    return parsed.fillableData || {};
  } catch {
    return {};
  }
}

function ProgressReportPrint() {
  const history = useHistory();
  const location = useLocation();
  const { userProfile, loading: authLoading } = useSupabase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [reports, setReports] = useState([]);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [fillableData, setFillableData] = useState({});
  const [dateRange, setDateRange] = useState(null);
  const [generatedAt] = useState(() => new Date());

  const params = new URLSearchParams(location.search);
  const clientId = params.get('clientId');
  const startStr = params.get('start');
  const endStr = params.get('end');

  const noop = useCallback(() => {}, []);
  const [restoreAfterPrint, setRestoreAfterPrint] = useState(null);

  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role !== 'admin') {
      history.replace('/app/dashboard');
    }
  }, [userProfile, authLoading, history]);

  useEffect(() => {
    const onBeforePrint = () => {
      expandTextareasForPrint();
      const restore = replaceInputsWithPlainTextForPrint();
      setRestoreAfterPrint(() => restore);
    };
    const onAfterPrint = () => {
      if (typeof restoreAfterPrint === 'function') restoreAfterPrint();
      setRestoreAfterPrint(null);
      // Re-expand in case the browser altered layout during print preview
      expandTextareasForPrint();
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  useLayoutEffect(() => {
    if (!client || !aggregatedData) return undefined;
    expandTextareasForPrint();
    const t = window.setTimeout(expandTextareasForPrint, 50);
    const t2 = window.setTimeout(expandTextareasForPrint, 250);
    const t3 = window.setTimeout(expandTextareasForPrint, 700);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [client, aggregatedData, fillableData]);

  useEffect(() => {
    const title = client
      ? `Print — ${client.first_name} ${client.last_name} (${startStr} to ${endStr})`
      : 'Progress report — print';
    document.title = title;
    return () => {
      document.title = 'PEL Client Management Software';
    };
  }, [client, startStr, endStr]);

  useEffect(() => {
    const existing = document.getElementById(PRINT_STYLE_ID);
    if (!existing) {
      const style = document.createElement('style');
      style.id = PRINT_STYLE_ID;
      style.textContent = `
        /* Full text: no scrollbars, expand vertically (screen preview) */
        .progress-report-print-mode,
        .progress-report-print-mode #progress-report-content {
          overflow-x: visible !important;
        }
        .progress-report-print-mode textarea.MuiInputBase-input,
        .progress-report-print-mode .MuiInputBase-multiline textarea {
          overflow: visible !important;
          overflow-y: visible !important;
          max-height: none !important;
          height: auto !important;
          min-height: 0 !important;
          white-space: pre-wrap !important;
          word-break: break-word;
          resize: none !important;
        }
        .progress-report-print-mode textarea::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .progress-report-print-mode .MuiInputBase-input {
          overflow: visible !important;
          overflow-y: visible !important;
          white-space: pre-wrap !important;
          text-overflow: clip !important;
        }
        .progress-report-print-mode .MuiOutlinedInput-root,
        .progress-report-print-mode .MuiInputBase-multiline {
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
        }
        .progress-report-print-mode .MuiTableCell-root {
          overflow: visible !important;
          word-break: break-word;
          white-space: normal;
        }
        .progress-report-print-mode .MuiTableContainer-root,
        .progress-report-print-mode .MuiPaper-root {
          overflow: visible !important;
        }
        .progress-report-print-mode table {
          width: 100% !important;
          table-layout: fixed;
        }
        .progress-report-print-mode th,
        .progress-report-print-mode td {
          overflow: visible !important;
          word-break: break-word;
        }
        /* Health medication row: prevent horizontal overflow by stacking in print mode */
        .progress-report-print-mode .medication-row {
          flex-wrap: wrap;
        }
        .progress-report-print-mode .medication-row > * {
          flex: 1 1 220px !important;
          min-width: 220px !important;
          max-width: 100% !important;
        }

        @media print {
          @page { size: A4; margin: 10mm; }
          .no-print { display: none !important; }
          /* Larger, more readable PDF text */
          html { font-size: 12pt !important; }
          body { background: #fff !important; }
          .progress-print-root { background: #fff !important; padding: 0 !important; }
          .progress-print-cover {
            break-after: page;
            page-break-after: always;
          }
          .progress-print-section {
            break-before: page;
            page-break-before: always;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .progress-print-section .MuiCard-root {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .progress-report-print-mode textarea.MuiInputBase-input,
          .progress-report-print-mode .MuiInputBase-multiline textarea {
            overflow: visible !important;
            overflow-y: visible !important;
            max-height: none !important;
            height: auto !important;
            min-height: 0 !important;
            white-space: pre-wrap !important;
            word-break: break-word;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .progress-report-print-mode .MuiOutlinedInput-root,
          .progress-report-print-mode .MuiInputBase-multiline {
            max-height: none !important;
            overflow: visible !important;
          }
          .progress-report-print-mode .MuiTableContainer-root,
          .progress-report-print-mode .MuiPaper-root {
            overflow: visible !important;
          }
          .progress-report-print-mode table {
            table-layout: fixed;
          }
          /* If any container tries to scroll, kill it for print */
          .progress-report-print-mode * {
            overflow-x: visible !important;
          }
          .recharts-wrapper,
          .recharts-responsive-container,
          .recharts-surface {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(PRINT_STYLE_ID);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!userProfile || userProfile.role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!clientId || !startStr || !endStr) {
      setError('Missing client or date range. Open print view from Progress Analytics after generating a report.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = new Date(`${startStr}T12:00:00`);
        const endDate = new Date(`${endStr}T12:00:00`);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          throw new Error('Invalid start or end date');
        }
        if (startDate > endDate) {
          throw new Error('Start date must be before end date');
        }

        const dr = { startDate, endDate };
        setDateRange(dr);

        const fillable = loadMatchingFillable(clientId, startStr, endStr);
        if (!cancelled) setFillableData(fillable);

        const { data: clientRow, error: clientErr } = await supabase
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
          .eq('id', clientId)
          .single();

        if (clientErr) throw clientErr;
        if (!clientRow) throw new Error('Client not found');

        const { data: reportsData, error: repErr } = await supabase
          .from('daily_reports_v2')
          .select('*')
          .eq('client_id', clientId)
          .eq('status', 'submitted')
          .gte('report_date', startStr)
          .lte('report_date', endStr)
          .order('report_date');

        if (repErr) throw repErr;

        const rows = reportsData || [];
        const aggregated = aggregateReportsData(rows, dr);

        if (!cancelled) {
          setClient(clientRow);
          setReports(rows);
          setAggregatedData(aggregated);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || 'Failed to load print report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userProfile, clientId, startStr, endStr]);

  const handlePrint = () => {
    // Ensure text blocks are expanded and swapped before invoking print
    expandTextareasForPrint();
    const restore = replaceInputsWithPlainTextForPrint();
    setRestoreAfterPrint(() => restore);
    // Let the browser layout settle before opening print dialog
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const handleBackToGenerator = () => {
    const q = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    history.push(`/app/reports/progress${q}`);
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column" gap={2}>
        <CircularProgress />
        <Typography color="textSecondary">Loading print view…</Typography>
      </Box>
    );
  }

  if (error || !aggregatedData || !client || !dateRange) {
    return (
      <Box sx={{ p: 3, maxWidth: 560, mx: 'auto' }}>
        <Alert severity="error">{error || 'Unable to load report.'}</Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={handleBackToGenerator}>
          Back to Progress Analytics
        </Button>
      </Box>
    );
  }

  const getDisplayName = (profile) => {
    const first =
      profile?.first_name ?? profile?.firstName ?? profile?.given_name ?? profile?.givenName;
    const last =
      profile?.last_name ?? profile?.lastName ?? profile?.family_name ?? profile?.familyName;
    const parts = [first, last].map((s) => (s != null ? String(s).trim() : '')).filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    const full =
      profile?.full_name ?? profile?.fullName ?? profile?.name ?? profile?.display_name ?? profile?.displayName;
    if (typeof full === 'string' && full.trim()) return full.trim();
    return profile?.email || undefined;
  };
  const generatedBy = getDisplayName(userProfile);

  const overviewText =
    typeof fillableData.overview === 'string' ? fillableData.overview : '';

  return (
    <Box
      className="progress-print-root progress-report-print-mode"
      sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto', bgcolor: 'background.default', minHeight: '100vh' }}
    >
      <Box className="no-print" display="flex" flexWrap="wrap" gap={2} mb={3} alignItems="center">
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          Print progress report
        </Typography>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print / Save as PDF
        </Button>
        <Button variant="outlined" onClick={() => window.close()}>
          Close tab
        </Button>
        <Button variant="text" onClick={handleBackToGenerator}>
          Back to generator
        </Button>
      </Box>

      <Alert severity="info" className="no-print" sx={{ mb: 2 }}>
        Fillable fields are edited on Progress Analytics; this page shows saved text when the date range matches. Use{' '}
        <strong>Print / Save as PDF</strong> for best page breaks.
      </Alert>

      <Box id="progress-report-content">
        <Box className="progress-print-cover progress-print-cover--first-page">
          <ReportHeader
            client={client}
            dateRange={dateRange}
            overallScore={aggregatedData.overallScore}
            indicator={aggregatedData.indicator}
            reportDate={generatedAt}
            dailyReportsCount={reports.length}
            generatedBy={generatedBy}
            generatedAt={generatedAt}
            overview={overviewText}
            overviewReadOnly
          />
        </Box>

        <Box className="progress-print-section pdf-section">
          <HealthReport
            healthScore={aggregatedData.healthScore}
            indicator={aggregatedData.indicator}
            pieChartData={aggregatedData.pieChartData}
            summaryTables={aggregatedData.summaryTables}
            fillableData={fillableData}
            onFillableDataChange={noop}
            readOnly
          />
        </Box>

        <Box className="progress-print-section pdf-section">
          <RoutineReport
            routineScore={aggregatedData.routineScore}
            indicator={aggregatedData.indicator}
            routineChores={aggregatedData.routineChores || []}
            fillableData={fillableData}
            onFillableDataChange={noop}
            readOnly
          />
        </Box>

        <Box className="progress-print-section pdf-section">
          <WellBeingReport
            wellbeingScore={aggregatedData.wellbeingScore}
            indicator={aggregatedData.indicator}
            pieChartData={aggregatedData.pieChartData}
            summaryTables={aggregatedData.summaryTables}
            fillableData={fillableData}
            onFillableDataChange={noop}
            readOnly
            isPrint
          />
        </Box>

        <Box className="progress-print-section pdf-section">
          <BehaviourReport
            behaviourScore={aggregatedData.behaviourScore}
            indicator={aggregatedData.indicator}
            pieChartData={aggregatedData.pieChartData}
            summaryTables={aggregatedData.summaryTables}
            birSummary={aggregatedData.birSummary}
            awolSummary={aggregatedData.awolSummary}
            fillableData={fillableData}
            onFillableDataChange={noop}
            readOnly
          />
        </Box>

        <Box className="progress-print-section pdf-section" id="section5">
          <ProgressGraphs
            trendData={aggregatedData.trendData}
            sectionAverages={{
              health: aggregatedData.healthScore,
              routine: aggregatedData.routineScore,
              wellbeing: aggregatedData.wellbeingScore,
              behaviour: aggregatedData.behaviourScore,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ProgressReportPrint;
