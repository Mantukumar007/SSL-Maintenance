import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExportHeader, MaintenanceRecord } from './types';
import { chunkArray, fitWithinBox, getExportRows, getImageEntries, getTodayLocal } from './utils';

export function exportPdf(records: MaintenanceRecord[], header: ExportHeader, fileBase: string) {
  const orientation = header.orientation;
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Date: ${header.date || getTodayLocal()}`, margin, 32);
  doc.setFontSize(18);
  doc.text(header.title || 'Solar Street Light Maintenance Report', pageWidth / 2, 36, { align: 'center' });
  if (header.subtitle.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(header.subtitle, pageWidth / 2, 54, { align: 'center' });
  }

  autoTable(doc, {
    startY: header.subtitle.trim() ? 72 : 56,
    margin: { left: margin, right: margin },
    head: [[
      'S.No', 'Maintenance Date', 'Agency', 'District', 'Block', 'Panchayat', 'Ward',
      'Pole Name', 'IMEI No', 'CMS Status', 'Agency Remarks', 'Agency Status', 'Photo Count',
    ]],
    body: getExportRows(records),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 4, lineColor: [148, 163, 184], lineWidth: 0.4, overflow: 'linebreak', textColor: [0, 0, 0] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  const imageEntries = getImageEntries(records);
  if (imageEntries.length) {
    const rowsPerPage = orientation === 'portrait' ? 3 : 2;
    const imagesPerPage = rowsPerPage * 3;
    const horizontalGap = 12;
    const verticalGap = 18;
    const cellWidth = (pageWidth - margin * 2 - horizontalGap * 2) / 3;
    const titleHeight = 30;
    const metadataHeight = 54;
    const availableHeight = pageHeight - margin * 2 - titleHeight - verticalGap * (rowsPerPage - 1);
    const cellHeight = availableHeight / rowsPerPage;
    const imageBoxHeight = Math.max(110, cellHeight - metadataHeight);

    chunkArray(imageEntries, imagesPerPage).forEach((pageEntries, pageIndex) => {
      doc.addPage('a4', orientation);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Image Section', margin, margin);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Page ${pageIndex + 1}`, pageWidth - margin, margin, { align: 'right' });

      pageEntries.forEach((entry, index) => {
        const row = Math.floor(index / 3);
        const column = index % 3;
        const x = margin + column * (cellWidth + horizontalGap);
        const y = margin + titleHeight + row * (cellHeight + verticalGap);
        const box = fitWithinBox(entry.photo.width || 0, entry.photo.height || 0, cellWidth - 16, imageBoxHeight - 12);

        doc.setDrawColor(148, 163, 184);
        doc.rect(x, y, cellWidth, cellHeight);
        doc.addImage(
          entry.photo.dataUrl || '',
          entry.photo.type.includes('png') ? 'PNG' : 'JPEG',
          x + (cellWidth - box.width) / 2,
          y + 8 + (imageBoxHeight - box.height) / 2,
          box.width,
          box.height,
        );
        doc.setFontSize(8);
        doc.text(
          [`Agency: ${entry.record.agency}`, `Pole Name: ${entry.record.poleName || 'N/A'}`, `Agency Remarks: ${entry.record.remarks || 'N/A'}`],
          x + 8,
          y + imageBoxHeight + 18,
          { maxWidth: cellWidth - 16 },
        );
      });
    });
  }

  doc.save(`${fileBase}.pdf`);
}
