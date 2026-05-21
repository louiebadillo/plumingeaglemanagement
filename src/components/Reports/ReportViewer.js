import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Medication as MedicationIcon,
  Bedtime as SleepIcon,
  Restaurant as DietIcon,
  Brush as DentalIcon,
  Build as RoutineIcon,
  Psychology as BehaviorIcon,
  School as SchoolIcon,
  Shower as ShowerIcon,
  Event as AppointmentIcon,
  Warning as BIRIcon,
  ExitToApp as AWOLIcon,
  LocalHospital as InjuryIcon
} from '@mui/icons-material';
import {
  calculateRoutineScore,
  getMedicationAdherenceAveragePercent,
  calculateSchoolScore
} from '../../utils/reportScoring';
import { useSupabase } from '../../context/SupabaseContext';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';
import { formatDateOnly } from '../../utils/dateHelpers';

const ReportViewer = ({ reportId, open, onClose }) => {
  const { userProfile } = useSupabase();
  const [report, setReport] = useState(null);
  const [client, setClient] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInitials, setUserInitials] = useState({});

  const formatUserInitialBase = (firstName, lastName) => {
    const first = String(firstName || '').trim();
    const last = String(lastName || '').trim();
    const f1 = first ? first[0] : '';
    const l3 = last ? last.slice(0, 3) : first.slice(1, 4);
    return `${f1}${l3}`.toUpperCase();
  };

  useEffect(() => {
    if (open && reportId) {
      fetchReportData();
    }
  }, [open, reportId]);

  const fetchUserInitials = async (userIds) => {
    if (!userIds || userIds.length === 0) return {};
    
    try {
      const { supabaseUrl } = getSupabaseConfig();
      const uniqueIds = [...new Set(userIds.filter(id => id))];
      
      if (uniqueIds.length === 0) return {};
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/users?id=in.(${uniqueIds.join(',')})&select=id,first_name,last_name`,
        {
          method: 'GET',
          headers: getSupabaseHeaders()
        }
      );

      if (response.ok) {
        const users = (await response.json()) || [];

        // Stable order so duplicate suffixes don't "flip" between renders.
        users.sort((a, b) => {
          const al = String(a?.last_name || '').toLowerCase();
          const bl = String(b?.last_name || '').toLowerCase();
          if (al !== bl) return al.localeCompare(bl);
          const af = String(a?.first_name || '').toLowerCase();
          const bf = String(b?.first_name || '').toLowerCase();
          if (af !== bf) return af.localeCompare(bf);
          return String(a?.id || '').localeCompare(String(b?.id || ''));
        });

        const initialsMap = {};
        const seenCounts = new Map(); // base -> count assigned so far
        users.forEach((user) => {
          const base = formatUserInitialBase(user?.first_name, user?.last_name);
          const next = (seenCounts.get(base) || 0) + 1;
          seenCounts.set(base, next);
          // First occurrence gets base; later duplicates get base2, base3, ...
          initialsMap[user.id] = next === 1 ? base : `${base}${next}`;
        });
        return initialsMap;
      }
    } catch (error) {
      console.error('Error fetching user initials:', error);
    }
    return {};
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { supabaseUrl } = getSupabaseConfig();
      
      // Fetch report with related data
      const response = await fetch(
        `${supabaseUrl}/rest/v1/daily_reports_v2?id=eq.${reportId}&select=*,clients(*,facilities(*))`,
        {
          method: 'GET',
          headers: getSupabaseHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const reports = await response.json();
      if (reports && reports.length > 0) {
        const reportData = reports[0];
        setReport(reportData);
        setClient(reportData.clients);
        setFacility(reportData.clients?.facilities);
        
        // Extract all user IDs from the report data
        const userIds = [];
        Object.keys(reportData).forEach(key => {
          if (key.endsWith('_updated_by') && reportData[key]) {
            userIds.push(reportData[key]);
          }
        });
        
        // Fetch user initials
        const initials = await fetchUserInitials(userIds);
        setUserInitials(initials);
      } else {
        setError('Report not found');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatReportDate = (dateString) =>
    formatDateOnly(dateString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const calculateScores = () => {
    if (!report) return {};

    // Morning shift scores
    const morningSleep = report.sleep_woke_on_time ? 100 : 0;
    const morningDiet = report.diet_ate_well ? 100 : 0;
    const morningDental = report.dental_hygiene_done ? 100 : 0;
    
    // Afternoon shift scores
    const afternoonSleep = report.afternoon_slept_on_time ? 100 : 0;
    const afternoonDiet = report.afternoon_diet_ate_well ? 100 : 0;
    const afternoonDental = report.afternoon_dental_hygiene_done ? 100 : 0;
    const afternoonShower = report.afternoon_shower_taken ? 100 : 0;
    const afternoonSchoolRaw = calculateSchoolScore(
      report.afternoon_school_supposed_to_go,
      report.afternoon_school_status
    );
    const afternoonSchool = afternoonSchoolRaw != null ? afternoonSchoolRaw : 0;

    // Medication: only required shifts (same as progress analytics)
    const medicationScoreSingle = getMedicationAdherenceAveragePercent(report);

    // Routine: same formula as progress analytics (avg of morning % & afternoon %; nulls omitted)
    const routineScore = calculateRoutineScore(report);

    // Behavioral scores (morning and afternoon)
    const morningBehavior = [
      report.behaviour_observation === 'positive' ? 1 : 0,
      report.behaviour_followed_rules ? 1 : 0,
      report.behaviour_listened ? 1 : 0,
      report.behaviour_control ? 1 : 0
    ];
    const afternoonBehavior = [
      report.afternoon_behaviour_observation === 'positive' ? 1 : 0,
      report.afternoon_behaviour_followed_rules ? 1 : 0,
      report.afternoon_behaviour_listened ? 1 : 0,
      report.afternoon_behaviour_control ? 1 : 0
    ];
    
    const morningBehaviorScore = Math.round((morningBehavior.reduce((sum, score) => sum + score, 0) / morningBehavior.length) * 100);
    const afternoonBehaviorScore = Math.round((afternoonBehavior.reduce((sum, score) => sum + score, 0) / afternoonBehavior.length) * 100);
    const behaviorScore = Math.round((morningBehaviorScore + afternoonBehaviorScore) / 2);

    // Overall scores
    const sleepScore = Math.round((morningSleep + afternoonSleep) / 2);
    const dietScore = Math.round((morningDiet + afternoonDiet) / 2);
    const dentalScore = Math.round((morningDental + afternoonDental) / 2);

    return {
      medication: medicationScoreSingle,
      sleep: sleepScore,
      diet: dietScore,
      dental: dentalScore,
      shower: afternoonShower,
      school: afternoonSchool,
      routine: routineScore,
      behavior: behaviorScore
    };
  };

  const handlePrint = () => {
    const scores = calculateScores();
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Report - ${client?.first_name} ${client?.last_name}</title>
          <style>
            @media print {
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; margin: 20px; padding: 0; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; page-break-inside: avoid; }
            .score { font-weight: bold; }
            .success { color: #2e7d32; }
            .warning { color: #f57c00; }
            .error { color: #d32f2f; }
            .card { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 4px; }
            .grid { display: flex; flex-wrap: wrap; gap: 15px; }
            .grid-item { flex: 1; min-width: 200px; }
            .chip { display: inline-block; padding: 4px 8px; border-radius: 16px; font-size: 12px; font-weight: bold; }
            .chip.success { background-color: #e8f5e8; color: #2e7d32; }
            .chip.warning { background-color: #fff3e0; color: #f57c00; }
            .chip.error { background-color: #ffebee; color: #d32f2f; }
            .incident-card { border-left: 4px solid #f57c00; background-color: #fff8e1; }
            .injury-card { border-left: 4px solid #d32f2f; background-color: #ffebee; }
            .bir-card { border-left: 4px solid #d32f2f; background-color: #ffebee; }
            .appointment-card { border-left: 4px solid #1976d2; background-color: #e3f2fd; }
            .metadata { background-color: #f5f5f5; padding: 15px; border-radius: 4px; }
            h1, h2, h3 { color: #333; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            h2 { font-size: 18px; margin-bottom: 8px; }
            h3 { font-size: 16px; margin-bottom: 6px; }
            .flex { display: flex; align-items: center; gap: 8px; }
            .icon { width: 16px; height: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Report Summary</h1>
            <div class="flex" style="justify-content: center; margin: 10px 0;">
              <span>📋 Client: ${client?.first_name} ${client?.last_name}</span>
              <span>🏠 Room: ${client?.room || 'N/A'}</span>
              <span>🏢 Facility: ${facility?.name}</span>
              <span>📅 Date: ${formatReportDate(report?.report_date)}</span>
            </div>
          </div>
          
          <div class="section">
            <h2>📊 Performance Scores</h2>
            <div class="grid">
              <div class="grid-item">
                <div class="flex">
                  <span>💊 Medication Adherence</span>
                  <span class="chip ${getScoreColor(scores.medication)}">${scores.medication}%</span>
                </div>
              </div>
              <div class="grid-item">
                <div class="flex">
                  <span>😴 Sleep Quality</span>
                  <span class="chip ${getScoreColor(scores.sleep)}">${scores.sleep}%</span>
                </div>
              </div>
              <div class="grid-item">
                <div class="flex">
                  <span>🍽️ Diet & Nutrition</span>
                  <span class="chip ${getScoreColor(scores.diet)}">${scores.diet}%</span>
                </div>
              </div>
              <div class="grid-item">
                <div class="flex">
                  <span>🦷 Dental Hygiene</span>
                  <span class="chip ${getScoreColor(scores.dental)}">${scores.dental}%</span>
                </div>
              </div>
              <div class="grid-item">
                <div class="flex">
                  <span>🚿 Personal Care</span>
                  <span class="chip ${getScoreColor(scores.shower)}">${scores.shower}%</span>
                </div>
              </div>
              <div class="grid-item">
                <div class="flex">
                  <span>🎓 School Attendance</span>
                  <span class="chip ${getScoreColor(scores.school)}">${scores.school}%</span>
                </div>
              </div>
              <div class="grid-item">
                <div class="flex">
                  <span>🔧 Routine Tasks</span>
                  <span class="chip ${getScoreColor(scores.routine)}">${scores.routine}%</span>
                </div>
              </div>
              <div class="grid-item">
                <div class="flex">
                  <span>🧠 Behavioral Score</span>
                  <span class="chip ${getScoreColor(scores.behavior)}">${scores.behavior}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>📋 Shift Details</h2>
            
            <div class="shift-section" style="background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #2c3e50; font-weight: bold;">Morning Shift</h3>
              <div class="fields-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Medication Status:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.medication_status || 'N/A'}</span>
                    ${userInitials[report?.medication_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.medication_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Woke on Time:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.sleep_woke_on_time ? 'Yes' : 'No'}</span>
                    ${userInitials[report?.sleep_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.sleep_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Ate Well:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.diet_ate_well ? 'Yes' : 'No'}</span>
                    ${userInitials[report?.diet_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.diet_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Dental Hygiene:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.dental_hygiene_done ? 'Yes' : 'No'}</span>
                    ${userInitials[report?.dental_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.dental_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Made Bed:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.routine_made_bed || 'N/A'}</span>
                    ${userInitials[report?.routine_made_bed_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.routine_made_bed_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Put Clothes Away:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.routine_put_clothes_away || 'N/A'}</span>
                    ${userInitials[report?.routine_put_clothes_away_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.routine_put_clothes_away_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Cleared Floor:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.routine_cleared_floor || 'N/A'}</span>
                    ${userInitials[report?.routine_cleared_floor_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.routine_cleared_floor_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Washed Dishes:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.routine_washed_dishes || 'N/A'}</span>
                    ${userInitials[report?.routine_washed_dishes_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.routine_washed_dishes_updated_by]}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="shift-section" style="background-color: #fff3e0; padding: 15px; margin: 10px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #2c3e50; font-weight: bold;">Afternoon Shift</h3>
              <div class="fields-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Medication Status (2pm-10pm):</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_medication_status || 'N/A'}</span>
                    ${userInitials[report?.afternoon_medication_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_medication_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Slept on Time:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_slept_on_time ? 'Yes' : 'No'}</span>
                    ${userInitials[report?.afternoon_slept_on_time_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_slept_on_time_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Ate Well:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_diet_ate_well ? 'Yes' : 'No'}</span>
                    ${userInitials[report?.afternoon_diet_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_diet_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Evening Dental Hygiene:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_dental_hygiene_done ? 'Yes' : 'No'}</span>
                    ${userInitials[report?.afternoon_dental_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_dental_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Took Shower:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_shower_taken ? 'Yes' : 'No'}</span>
                    ${userInitials[report?.afternoon_shower_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_shower_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">School Status:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_school_status || 'N/A'}</span>
                    ${userInitials[report?.afternoon_school_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_school_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Made Bed:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_routine_made_bed || 'N/A'}</span>
                    ${userInitials[report?.afternoon_routine_made_bed_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_routine_made_bed_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Put Clothes Away:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_routine_put_clothes_away || 'N/A'}</span>
                    ${userInitials[report?.afternoon_routine_put_clothes_away_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_routine_put_clothes_away_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Cleared Floor:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_routine_cleared_floor || 'N/A'}</span>
                    ${userInitials[report?.afternoon_routine_cleared_floor_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_routine_cleared_floor_updated_by]}</span>` : ''}
                  </div>
                </div>
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Washed Dishes:</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.afternoon_routine_washed_dishes || 'N/A'}</span>
                    ${userInitials[report?.afternoon_routine_washed_dishes_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.afternoon_routine_washed_dishes_updated_by]}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="shift-section" style="background-color: #f3e5f5; padding: 15px; margin: 10px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #2c3e50; font-weight: bold;">Evening Shift</h3>
              <div class="fields-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
                <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Medication Status (10pm-6am):</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 500;">${report?.evening_medication_status || 'N/A'}</span>
                    ${userInitials[report?.evening_medication_updated_by] ? `<span class="initials-chip" style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${userInitials[report?.evening_medication_updated_by]}</span>` : ''}
                  </div>
                </div>
                ${(() => {
                  // Support both old format (awol_incident) and new format (awol_incidents array)
                  const awolIncidents = report?.awol_incidents || (report?.awol_incident ? [{
                    status: report.awol_status,
                    remarks: report.awol_remarks,
                    files: report.awol_files || []
                  }] : []);
                  return awolIncidents.length > 0 ? `
                    <div class="field-item" style="padding: 5px 0; border-bottom: 1px solid #eee;">
                      <span style="color: #666; font-weight: 500;">AWOL Incidents (${awolIncidents.length}):</span>
                      ${awolIncidents.map((awol, idx) => `
                        <div style="margin-top: 8px; padding-left: 16px;">
                          <div style="font-weight: 500;">${awol.status || 'N/A'}</div>
                          ${awol.remarks ? `<div style="color: #666; font-size: 0.9em; margin-top: 4px;">${awol.remarks}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                      <span style="color: #666;">AWOL Incidents:</span>
                      <span style="font-weight: 500;">None</span>
                    </div>
                  `;
                })()}
                ${(() => {
                  // Support both old format (injury_occurred) and new format (injuries array)
                  const injuries = report?.injuries || (report?.injury_occurred ? [{
                    type: report.injury_type,
                    perpetrator: report.injury_perpetrator,
                    remarks: report.injury_remarks,
                    files: report.injury_files || []
                  }] : []);
                  return injuries.length > 0 ? `
                    <div class="field-item" style="padding: 5px 0; border-bottom: 1px solid #eee;">
                      <span style="color: #666; font-weight: 500;">Injuries (${injuries.length}):</span>
                      ${injuries.map((injury, idx) => `
                        <div style="margin-top: 8px; padding-left: 16px;">
                          <div style="font-weight: 500;">${injury.type || 'N/A'}</div>
                          ${injury.perpetrator ? `<div style="color: #666; font-size: 0.9em;">Perpetrator: ${injury.perpetrator}</div>` : ''}
                          ${injury.remarks ? `<div style="color: #666; font-size: 0.9em; margin-top: 4px;">${injury.remarks}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="field-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                      <span style="color: #666;">Injuries:</span>
                      <span style="font-weight: 500;">None</span>
                    </div>
                  `;
                })()}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>⚠️ Incidents & Events</h2>
            ${(() => {
              // Support both old format (awol_incident) and new format (awol_incidents array)
              const awolIncidents = report?.awol_incidents || (report?.awol_incident ? [{
                status: report.awol_status,
                remarks: report.awol_remarks,
                files: report.awol_files || []
              }] : []);
              return awolIncidents.length > 0 ? awolIncidents.map(awol => `
                <div class="card incident-card">
                  <h3>🚨 AWOL Incident</h3>
                  <p><strong>Status:</strong> ${awol.status || 'N/A'}</p>
                  ${awol.remarks ? `<p><strong>Remarks:</strong> ${awol.remarks}</p>` : ''}
                </div>
              `).join('') : '';
            })()}
            
            ${(() => {
              // Support both old format (injury_occurred) and new format (injuries array)
              const injuries = report?.injuries || (report?.injury_occurred ? [{
                type: report.injury_type,
                perpetrator: report.injury_perpetrator,
                remarks: report.injury_remarks,
                files: report.injury_files || []
              }] : []);
              return injuries.length > 0 ? injuries.map(injury => `
                <div class="card injury-card">
                  <h3>🏥 Injury Report</h3>
                  <p><strong>Type:</strong> ${injury.type || 'N/A'}</p>
                  ${injury.perpetrator ? `<p><strong>Perpetrator:</strong> ${injury.perpetrator}</p>` : ''}
                  ${injury.remarks ? `<p><strong>Remarks:</strong> ${injury.remarks}</p>` : ''}
                </div>
              `).join('') : '';
            })()}
            
            ${report?.bir_incidents && Object.keys(report.bir_incidents).length > 0 ? `
              <div class="card bir-card">
                <h3>📋 Behavioral Incident Report (BIR)</h3>
                <p><strong>Incidents:</strong> ${Object.keys(report.bir_incidents).join(', ')}</p>
                ${report.bir_incidents.remarks ? `<p><strong>Remarks:</strong> ${report.bir_incidents.remarks}</p>` : ''}
              </div>
            ` : ''}
            
            ${report?.appointments && report.appointments.length > 0 ? `
              <div class="card appointment-card">
                <h3>📅 Appointments (${report.appointments.length})</h3>
                ${report.appointments.map(apt => `
                  <p>• ${apt.type} - ${apt.nature} (${apt.compliance})</p>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          
          <div class="section">
            <h2>📎 Uploaded Documents</h2>
            ${getUploadedDocumentsList()}
          </div>
          
          <div class="section metadata">
            <h2>📋 Report Information</h2>
            <p><strong>Submitted:</strong> ${formatDateTime(report?.updated_at)} at ${formatTime(report?.updated_at)}</p>
            <p><strong>Status:</strong> ${report?.status}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    handlePrint(); // Use the same print function for download
  };

  const getUploadedDocumentsList = () => {
    const documents = [];
    
    // AWOL files
    if (report?.awol_files && report.awol_files.length > 0) {
      documents.push(...report.awol_files.map(file => ({
        ...file,
        category: 'AWOL Documentation',
        icon: '🚨'
      })));
    }
    
    // Injury files
    if (report?.injury_files && report.injury_files.length > 0) {
      documents.push(...report.injury_files.map(file => ({
        ...file,
        category: 'Injury Documentation',
        icon: '🏥'
      })));
    }
    
    // Appointment files
    if (report?.appointments && report.appointments.length > 0) {
      report.appointments.forEach(appointment => {
        if (appointment.files && appointment.files.length > 0) {
          documents.push(...appointment.files.map(file => ({
            ...file,
            category: 'Appointment Documentation',
            icon: '📅'
          })));
        }
      });
    }
    
    // BIR files
    if (report?.bir_incidents && report.bir_incidents.files && report.bir_incidents.files.length > 0) {
      documents.push(...report.bir_incidents.files.map(file => ({
        ...file,
        category: 'BIR Documentation',
        icon: '📋'
      })));
    }
    
    if (documents.length === 0) {
      return '<p>No documents uploaded for this report.</p>';
    }
    
    return `
      <div class="card">
        ${documents.map(doc => `
          <div class="flex" style="margin: 8px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;">
            <span>${doc.icon}</span>
            <span><strong>${doc.category}:</strong> ${doc.name}</span>
            <span style="margin-left: auto; font-size: 12px; color: #666;">${new Date(doc.uploadedAt).toLocaleDateString()}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  const getUploadedDocumentsListJSX = () => {
    const documents = [];
    
    // AWOL files
    if (report?.awol_files && report.awol_files.length > 0) {
      documents.push(...report.awol_files.map(file => ({
        ...file,
        category: 'AWOL Documentation',
        icon: '🚨'
      })));
    }
    
    // Injury files
    if (report?.injury_files && report.injury_files.length > 0) {
      documents.push(...report.injury_files.map(file => ({
        ...file,
        category: 'Injury Documentation',
        icon: '🏥'
      })));
    }
    
    // Appointment files
    if (report?.appointments && report.appointments.length > 0) {
      report.appointments.forEach(appointment => {
        if (appointment.files && appointment.files.length > 0) {
          documents.push(...appointment.files.map(file => ({
            ...file,
            category: 'Appointment Documentation',
            icon: '📅'
          })));
        }
      });
    }
    
    // BIR files
    if (report?.bir_incidents && report.bir_incidents.files && report.bir_incidents.files.length > 0) {
      documents.push(...report.bir_incidents.files.map(file => ({
        ...file,
        category: 'BIR Documentation',
        icon: '📋'
      })));
    }
    
    if (documents.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary">
          No documents uploaded for this report.
        </Typography>
      );
    }
    
    return (
      <List>
        {documents.map((doc, index) => (
          <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
            <ListItemIcon>
              <Typography variant="h6">{doc.icon}</Typography>
            </ListItemIcon>
            <ListItemText
              primary={`${doc.category}: ${doc.name}`}
              secondary={`Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderFieldWithInitials = (label, value, updatedBy) => {
    const initials = updatedBy ? userInitials[updatedBy] : null;
    return (
      <Grid item xs={12} sm={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="textSecondary">
            {label}:
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight="medium">
              {value || 'N/A'}
            </Typography>
            {initials && (
              <Chip 
                label={initials} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
            )}
          </Box>
        </Box>
      </Grid>
    );
  };

  const renderMorningShift = () => (
    <Card sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Morning Shift
        </Typography>
        
        <Grid container spacing={2}>
          {renderFieldWithInitials(
            'Medication Status', 
            report.medication_status, 
            report.medication_updated_by
          )}
          {renderFieldWithInitials(
            'Woke on Time', 
            report.sleep_woke_on_time ? 'Yes' : 'No', 
            report.sleep_updated_by
          )}
          {renderFieldWithInitials(
            'Ate Well', 
            report.diet_ate_well ? 'Yes' : 'No', 
            report.diet_updated_by
          )}
          {renderFieldWithInitials(
            'Dental Hygiene', 
            report.dental_hygiene_done ? 'Yes' : 'No', 
            report.dental_updated_by
          )}
          {renderFieldWithInitials(
            'Made Bed', 
            report.routine_made_bed, 
            report.routine_made_bed_updated_by
          )}
          {renderFieldWithInitials(
            'Put Clothes Away', 
            report.routine_put_clothes_away, 
            report.routine_put_clothes_away_updated_by
          )}
          {renderFieldWithInitials(
            'Cleared Floor', 
            report.routine_cleared_floor, 
            report.routine_cleared_floor_updated_by
          )}
          {renderFieldWithInitials(
            'Washed Dishes', 
            report.routine_washed_dishes, 
            report.routine_washed_dishes_updated_by
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAfternoonShift = () => (
    <Card sx={{ mb: 2, backgroundColor: '#fff3e0' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Afternoon Shift
        </Typography>
        
        <Grid container spacing={2}>
          {renderFieldWithInitials(
            'Medication Status (2pm-10pm)', 
            report.afternoon_medication_status, 
            report.afternoon_medication_updated_by
          )}
          {renderFieldWithInitials(
            'Slept on Time', 
            report.afternoon_slept_on_time ? 'Yes' : 'No', 
            report.afternoon_slept_on_time_updated_by
          )}
          {renderFieldWithInitials(
            'Ate Well', 
            report.afternoon_diet_ate_well ? 'Yes' : 'No', 
            report.afternoon_diet_updated_by
          )}
          {renderFieldWithInitials(
            'Evening Dental Hygiene', 
            report.afternoon_dental_hygiene_done ? 'Yes' : 'No', 
            report.afternoon_dental_updated_by
          )}
          {renderFieldWithInitials(
            'Took Shower', 
            report.afternoon_shower_taken ? 'Yes' : 'No', 
            report.afternoon_shower_updated_by
          )}
          {renderFieldWithInitials(
            'School Status', 
            report.afternoon_school_status, 
            report.afternoon_school_updated_by
          )}
          {renderFieldWithInitials(
            'Made Bed', 
            report.afternoon_routine_made_bed, 
            report.afternoon_routine_made_bed_updated_by
          )}
          {renderFieldWithInitials(
            'Put Clothes Away', 
            report.afternoon_routine_put_clothes_away, 
            report.afternoon_routine_put_clothes_away_updated_by
          )}
          {renderFieldWithInitials(
            'Cleared Floor', 
            report.afternoon_routine_cleared_floor, 
            report.afternoon_routine_cleared_floor_updated_by
          )}
          {renderFieldWithInitials(
            'Washed Dishes', 
            report.afternoon_routine_washed_dishes, 
            report.afternoon_routine_washed_dishes_updated_by
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderEveningShift = () => (
    <Card sx={{ mb: 2, backgroundColor: '#f3e5f5' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Evening Shift
        </Typography>
        
        <Grid container spacing={2}>
          {renderFieldWithInitials(
            'Medication Status (10pm-6am)', 
            report.evening_medication_status, 
            report.evening_medication_updated_by
          )}
          {(() => {
            // Support both old format (awol_incident) and new format (awol_incidents array)
            const awolIncidents = report?.awol_incidents || (report?.awol_incident ? [{
              status: report.awol_status,
              remarks: report.awol_remarks,
              files: report.awol_files || []
            }] : []);
            return (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    AWOL Incidents ({awolIncidents.length}):
                  </Typography>
                  {awolIncidents.length > 0 ? (
                    awolIncidents.map((awol, idx) => (
                      <Box key={idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #ccc' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {awol.status || 'N/A'}
                        </Typography>
                        {awol.remarks && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {awol.remarks}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      No AWOL incidents
                    </Typography>
                  )}
                </Grid>
              </>
            );
          })()}
          {(() => {
            // Support both old format (injury_occurred) and new format (injuries array)
            const injuries = report?.injuries || (report?.injury_occurred ? [{
              type: report.injury_type,
              perpetrator: report.injury_perpetrator,
              remarks: report.injury_remarks,
              files: report.injury_files || []
            }] : []);
            return (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Injuries ({injuries.length}):
                  </Typography>
                  {injuries.length > 0 ? (
                    injuries.map((injury, idx) => (
                      <Box key={idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #ccc' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {injury.type || 'N/A'}
                        </Typography>
                        {injury.perpetrator && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            Perpetrator: {injury.perpetrator}
                          </Typography>
                        )}
                        {injury.remarks && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {injury.remarks}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      No injuries
                    </Typography>
                  )}
                </Grid>
              </>
            );
          })()}
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress size={24} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading report...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Alert severity="error">
            {error}
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report || !client || !facility) {
    return null;
  }

  const scores = calculateScores();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            Daily Report Summary
          </Typography>
          <Box>
            <Tooltip title="Print Report">
              <IconButton onClick={handlePrint} color="primary">
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download PDF">
              <IconButton onClick={handleDownload} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <div id="report-content">
          {/* Header Section */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
            <Box textAlign="center">
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                Daily Report Summary
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Client
                    </Typography>
                    <Typography variant="h6">
                      {client.first_name} {client.last_name}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Room
                    </Typography>
                    <Typography variant="h6">
                      {client.room || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Facility
                    </Typography>
                    <Typography variant="h6">
                      {facility.name}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Date
                    </Typography>
                    <Typography variant="h6">
                      {formatReportDate(report.report_date)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Performance Scores */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="primary" />
                Performance Scores
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <MedicationIcon color="primary" />
                      <Typography>Medication Adherence</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.medication}%`} 
                      color={getScoreColor(scores.medication)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <SleepIcon color="primary" />
                      <Typography>Sleep Quality</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.sleep}%`} 
                      color={getScoreColor(scores.sleep)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <DietIcon color="primary" />
                      <Typography>Diet & Nutrition</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.diet}%`} 
                      color={getScoreColor(scores.diet)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <DentalIcon color="primary" />
                      <Typography>Dental Hygiene</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.dental}%`} 
                      color={getScoreColor(scores.dental)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <ShowerIcon color="primary" />
                      <Typography>Personal Care</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.shower}%`} 
                      color={getScoreColor(scores.shower)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <SchoolIcon color="primary" />
                      <Typography>School Attendance</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.school}%`} 
                      color={getScoreColor(scores.school)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <RoutineIcon color="primary" />
                      <Typography>Routine Tasks</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.routine}%`} 
                      color={getScoreColor(scores.routine)}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <BehaviorIcon color="primary" />
                      <Typography>Behavioral Score</Typography>
                    </Box>
                    <Chip 
                      label={`${scores.behavior}%`} 
                      color={getScoreColor(scores.behavior)}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Morning Shift */}
          {renderMorningShift()}

          {/* Afternoon Shift */}
          {renderAfternoonShift()}

          {/* Evening Shift */}
          {renderEveningShift()}


          {/* Uploaded Documents */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📎 Uploaded Documents
              </Typography>
              
              {getUploadedDocumentsListJSX()}
            </CardContent>
          </Card>

          {/* Report Metadata */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Submitted:</strong> {formatDateTime(report.updated_at)} at {formatTime(report.updated_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Status:</strong> 
                    <Chip 
                      label={report.status} 
                      color={report.status === 'submitted' ? 'success' : 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print Report
        </Button>
        <Button onClick={handleDownload} variant="contained" startIcon={<DownloadIcon />}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportViewer;
