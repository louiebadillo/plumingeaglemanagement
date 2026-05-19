/**
 * Plain-text location report for employees to copy and send to admins.
 */

export function formatLocationReportText(report, { userEmail, userName } = {}) {
  if (!report) {
    return 'PEL Location Report\n(No location check has been run yet.)';
  }

  const lines = [
    'PEL Location Report',
    `Generated: ${new Date().toISOString()}`,
  ];

  if (userName || userEmail) {
    lines.push(`User: ${[userName, userEmail].filter(Boolean).join(' · ')}`);
  }

  if (report.locationAccess) {
    const la = report.locationAccess;
    lines.push('');
    lines.push('Location access (browser / device):');
    lines.push(`  Chrome site permission: ${la.browserPermissionLabel || la.browserPermission || 'unknown'}`);
    lines.push(`  Position received: ${la.positionObtained ? 'Yes' : 'No'}`);
    if (la.errorCode != null || la.errorMessage) {
      lines.push(
        `  Last error: ${[la.errorCode != null ? `code ${la.errorCode}` : null, la.errorMessage]
          .filter(Boolean)
          .join(' — ')}`
      );
    }
    if (la.osLocationHint) {
      lines.push(`  Note: ${la.osLocationHint}`);
    }
  }

  if (report.error) {
    lines.push('');
    lines.push('Error:');
    lines.push(
      `  Stage: ${report.error.stage || 'unknown'}`,
      `  ${report.error.message || report.error.name || 'Location unavailable'}`
    );
  }

  if (report.device) {
    const { lat, lng, accuracyMeters } = report.device;
    lines.push('');
    lines.push('Device location (browser):');
    lines.push(`  Latitude: ${lat}`);
    lines.push(`  Longitude: ${lng}`);
    lines.push(
      `  Accuracy: ${Number.isFinite(accuracyMeters) ? Math.round(accuracyMeters) + ' m' : 'unknown'}`
    );
    lines.push(`  Maps: https://www.google.com/maps?q=${lat},${lng}`);
  }

  lines.push('');
  if (report.bestMatch) {
    lines.push('Detected facility:');
    lines.push(`  ${report.bestMatch.name || report.bestMatch.id}`);
    lines.push(
      `  Distance: ${report.bestMatch.distanceMeters} m (radius ${report.bestMatch.radiusMeters} m)`
    );
  } else {
    lines.push('Detected facility: None (not inside any facility geofence)');
    if (report.nearest) {
      lines.push('');
      lines.push('Nearest facility:');
      lines.push(`  ${report.nearest.name || report.nearest.id}`);
      lines.push(
        `  Distance: ${report.nearest.distanceMeters} m (radius ${report.nearest.radiusMeters} m)`
      );
    }
  }

  const facilityRows = (report.facilities || []).filter((f) => !f.skipped);
  if (facilityRows.length > 0) {
    lines.push('');
    lines.push('All facilities:');
    facilityRows
      .slice()
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
      .forEach((f) => {
        lines.push(
          `  ${f.name || f.id}: ${f.distanceMeters} m / ${f.radiusMeters} m radius — ${
            f.inside ? 'INSIDE' : 'outside'
          }`
        );
      });
  }

  return lines.join('\n');
}
