import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportData {
    title: string;
    generatedAt: Date;
    hygieneScore: number;
    totalResources: number;
    criticalAlerts: number;
    monthlyCost: number;
    recommendations: string[];
}

/**
 * Generate a PDF report from the dashboard
 */
export async function generateDashboardPDF(
    elementId: string,
    filename = 'consolesensei-report.pdf'
): Promise<void> {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
    }

    // Create canvas from element
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0b14',
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Add header
    pdf.setFillColor(99, 102, 241); // Primary color
    pdf.rect(0, 0, 210, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text('ConsoleSensei Cloud Report', 105, 13, { align: 'center' });

    // Add timestamp
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

    // Add screenshot
    const imgData = canvas.toDataURL('image/png');

    if (imgHeight <= pageHeight - 40) {
        pdf.addImage(imgData, 'PNG', 0, 35, imgWidth, imgHeight);
    } else {
        // Multi-page handling
        let heightLeft = imgHeight;
        let position = 35;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - position);

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
    }

    // Save PDF
    pdf.save(filename);
}

/**
 * Generate a summary PDF report with data
 */
export async function generateSummaryReport(data: ReportData): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Header
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text('ConsoleSensei Cloud', 105, 15, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(data.title, 105, 24, { align: 'center' });

    // Body
    let yPos = 45;

    // Generated date
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${data.generatedAt.toLocaleString()}`, 15, yPos);
    yPos += 15;

    // Stats cards
    pdf.setFillColor(19, 20, 31);
    pdf.setDrawColor(39, 40, 58);

    // Hygiene Score
    pdf.roundedRect(15, yPos, 85, 35, 3, 3, 'FD');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('Cloud Hygiene Score', 20, yPos + 12);
    pdf.setFontSize(28);
    pdf.setTextColor(99, 102, 241);
    pdf.text(`${data.hygieneScore}/100`, 20, yPos + 28);

    // Total Resources
    pdf.setFillColor(19, 20, 31);
    pdf.roundedRect(110, yPos, 85, 35, 3, 3, 'FD');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('Total Resources', 115, yPos + 12);
    pdf.setFontSize(28);
    pdf.setTextColor(99, 102, 241);
    pdf.text(String(data.totalResources), 115, yPos + 28);

    yPos += 45;

    // Critical Alerts
    pdf.setFillColor(19, 20, 31);
    pdf.roundedRect(15, yPos, 85, 35, 3, 3, 'FD');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('Critical Alerts', 20, yPos + 12);
    pdf.setFontSize(28);
    pdf.setTextColor(239, 68, 68); // Red
    pdf.text(String(data.criticalAlerts), 20, yPos + 28);

    // Monthly Cost
    pdf.setFillColor(19, 20, 31);
    pdf.roundedRect(110, yPos, 85, 35, 3, 3, 'FD');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('Est. Monthly Cost', 115, yPos + 12);
    pdf.setFontSize(28);
    pdf.setTextColor(16, 185, 129); // Green
    pdf.text(`$${data.monthlyCost}`, 115, yPos + 28);

    yPos += 50;

    // Recommendations
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text('Recommendations', 15, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    pdf.setTextColor(200, 200, 200);
    data.recommendations.forEach((rec, index) => {
        pdf.text(`${index + 1}. ${rec}`, 20, yPos);
        yPos += 8;
    });

    // Footer
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.text('© ConsoleSensei Cloud - We never ask for your AWS password', 105, 285, { align: 'center' });

    // Save
    pdf.save(`${data.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
