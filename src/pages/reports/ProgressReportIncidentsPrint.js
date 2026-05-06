import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../context/SupabaseContext';

import ReportHeader from '../../components/ProgressReport/ReportHeader';
import BehaviourReport from '../../components/ProgressReport/BehaviourReport';
import { aggregateReportsData } from '../../utils/reportAggregation';

const PRINT_STYLE_ID = 'progress-report-incidents-print-styles';

function replaceInputsWithPlainTextForPrint() {
  const root = document.getElementById('progress-report-content');
  if (!root) return () => {};

  const replacements = [];
  const fields = root.querySelectorAll('textarea, input');
  fields.forEach((field) => {
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
    block.style.padding = computed.padding;
    block.style.margin = '0';
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

export default function ProgressReportIncidentsPrint() {
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
  const [restoreAfterPrint, setRestoreAfterPrint] = useState(null);
  const [incidentsOverview, setIncidentsOverview] = useState('');

  const params = new URLSearchParams(location.search);
  const clientId = params.get('clientId');
  const startStr = params.get('start');
  const endStr = params.get('end');

  const noop = useCallback(() => {}, []);

  useEffect(() => {
    const v = fillableData?.incidentsOverview;
    setIncidentsOverview(typeof v === 'string' ? v : '');
  }, [fillableData?.incidentsOverview]);

  const handleIncidentsOverviewChange = (next) => {
    setIncidentsOverview(next);
    setFillableData((prev) => ({ ...(prev || {}), incidentsOverview: next }));
    try {
      const raw = localStorage.getItem('progressReportData');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.selectedClientId !== clientId) return;
      parsed.fillableData = { ...(parsed.fillableData || {}), incidentsOverview: next };
      parsed._savedAt = Date.now();
      localStorage.setItem('progressReportData', JSON.stringify(parsed));
    } catch {
      // ignore storage errors; still keep local state for printing
    }
  };

  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role !== 'admin') {
      history.replace('/app/dashboard');
    }
  }, [userProfile, authLoading, history]);

  useEffect(() => {
    const existing = document.getElementById(PRINT_STYLE_ID);
    if (!existing) {
      const style = document.createElement('style');
      style.id = PRINT_STYLE_ID;
      style.textContent = `
        @media print {
          @page { size: A4; margin: 10mm; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
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
    const onBeforePrint = () => {
      const restore = replaceInputsWithPlainTextForPrint();
      setRestoreAfterPrint(() => restore);
    };
    const onAfterPrint = () => {
      if (typeof restoreAfterPrint === 'function') restoreAfterPrint();
      setRestoreAfterPrint(null);
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
    // one extra pass after render before print
    const t = window.setTimeout(() => {}, 0);
    return () => window.clearTimeout(t);
  }, [client, aggregatedData, fillableData]);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile || userProfile.role !== 'admin') {
      setLoading(false);
      return;
    }
    if (!clientId || !startStr || !endStr) {
      setError('Missing client or date range. Open incidents print view from Progress Analytics.');
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
        if (!cancelled) setError(e.message || 'Failed to load incidents print view');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userProfile, clientId, startStr, endStr]);

  const handleBackToGenerator = () => {
    const q = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    history.push(`/app/reports/progress${q}`);
  };

  const handlePrint = () => {
    const restore = replaceInputsWithPlainTextForPrint();
    setRestoreAfterPrint(() => restore);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  if (!userProfile || userProfile.role !== 'admin') return null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column" gap={2}>
        <CircularProgress />
        <Typography color="textSecondary">Loading incidents print view…</Typography>
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box className="no-print" display="flex" flexWrap="wrap" gap={2} mb={3} alignItems="center">
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          Print incidents report (BIR / AWOL / Injuries)
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

      <Box id="progress-report-content">
        <ReportHeader
          client={client}
          dateRange={dateRange}
          overallScore={aggregatedData.overallScore}
          indicator={aggregatedData.indicator}
          reportDate={generatedAt}
          dailyReportsCount={reports.length}
          generatedBy={generatedBy}
          generatedAt={generatedAt}
          titleText="BIR, AWOL and Injuries Report"
          showOverall={false}
          overviewLabel="Overview"
          overview={incidentsOverview}
          onOverviewChange={handleIncidentsOverviewChange}
          overviewReadOnly={false}
          compactForPrint
        />

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
          mode="incidents"
        />
      </Box>
    </Box>
  );
}

