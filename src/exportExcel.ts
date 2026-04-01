import * as XLSX from 'xlsx';
import type { ExportHeader, MaintenanceRecord } from './types';
import { getExportRows, getImageEntries, getTodayLocal } from './utils';

export function exportExcel(records: MaintenanceRecord[], header: ExportHeader, fileBase: string) {
  const workbook = XLSX.utils.book_new();
  const reportRows = [
    [header.title || 'Solar Street Light Maintenance Report'],
    [header.subtitle || ''],
    [`Date: ${header.date || getTodayLocal()}`],
    [],
    ['S.No', 'Maintenance Date', 'Agency', 'District', 'Block', 'Panchayat', 'Ward', 'Pole Name', 'IMEI No', 'CMS Status', 'Agency Remarks', 'Agency Status', 'Photo Count'],
    ...getExportRows(records),
  ];
  const imageRows = [
    ['S.No', 'Photo Name', 'Agency', 'Pole Name', 'Agency Remarks'],
    ...getImageEntries(records).map((entry) => [
      entry.record.serialNumber,
      entry.photo.name,
      entry.record.agency,
      entry.record.poleName || 'N/A',
      entry.record.remarks || 'N/A',
    ]),
  ];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(reportRows), 'Maintenance Report');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(imageRows), 'Image Register');
  XLSX.writeFile(workbook, `${fileBase}.xlsx`);
}
