// Export utilities for generating reports in PDF and CSV formats

export interface ExportData {
    title: string;
    subtitle?: string;
    date: string;
    data: Record<string, unknown>[];
    columns: { key: string; header: string; width?: number }[];
}

// CSV Export
export function exportToCSV(
    data: Record<string, unknown>[],
    columns: { key: string; header: string }[],
    filename: string
): void {
    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const value = row[col.key];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value ?? '');
            if (stringValue.includes(',') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    downloadFile(csv, `${filename}.csv`, 'text/csv');
}

// JSON Export
export function exportToJSON(
    data: Record<string, unknown>[],
    filename: string
): void {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
}

// Simple PDF-like text export (for demo - real PDF would need a library)
export function exportToReport(exportData: ExportData): void {
    const { title, subtitle, date, data, columns } = exportData;

    let content = `${title}\n`;
    content += `${'='.repeat(title.length)}\n\n`;

    if (subtitle) {
        content += `${subtitle}\n\n`;
    }

    content += `Generated: ${date}\n\n`;
    content += '-'.repeat(60) + '\n\n';

    // Header row
    content += columns.map(col => col.header.padEnd(col.width || 15)).join('') + '\n';
    content += '-'.repeat(60) + '\n';

    // Data rows
    data.forEach(row => {
        content += columns.map(col => {
            const value = String(row[col.key] ?? '');
            return value.padEnd(col.width || 15);
        }).join('') + '\n';
    });

    content += '\n' + '-'.repeat(60) + '\n';
    content += `Total Records: ${data.length}\n`;

    downloadFile(content, `${title.toLowerCase().replace(/\s+/g, '-')}-report.txt`, 'text/plain');
}

// Download helper
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Pre-built export functions for common reports
export function exportCostReport(costs: Record<string, unknown>[]): void {
    exportToCSV(costs, [
        { key: 'service', header: 'Service' },
        { key: 'cost', header: 'Cost ($)' },
        { key: 'change', header: 'Change (%)' },
        { key: 'usage', header: 'Usage' },
    ], 'cost-report');
}

export function exportSecurityReport(findings: Record<string, unknown>[]): void {
    exportToCSV(findings, [
        { key: 'title', header: 'Finding' },
        { key: 'severity', header: 'Severity' },
        { key: 'resource', header: 'Resource' },
        { key: 'status', header: 'Status' },
        { key: 'discoveredAt', header: 'Discovered' },
    ], 'security-report');
}

export function exportActivityLog(activities: Record<string, unknown>[]): void {
    exportToCSV(activities, [
        { key: 'timestamp', header: 'Time' },
        { key: 'type', header: 'Type' },
        { key: 'action', header: 'Action' },
        { key: 'user', header: 'User' },
        { key: 'description', header: 'Description' },
    ], 'activity-log');
}

export function exportTeamReport(members: Record<string, unknown>[]): void {
    exportToCSV(members, [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'status', header: 'Status' },
        { key: 'joinedAt', header: 'Joined' },
    ], 'team-report');
}

export function exportBudgetReport(budgets: Record<string, unknown>[]): void {
    exportToCSV(budgets, [
        { key: 'name', header: 'Budget' },
        { key: 'amount', header: 'Amount ($)' },
        { key: 'spent', header: 'Spent ($)' },
        { key: 'percentage', header: 'Used (%)' },
        { key: 'period', header: 'Period' },
    ], 'budget-report');
}
