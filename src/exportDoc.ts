import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ExportHeader, MaintenanceRecord } from './types';
import { base64ToUint8Array, chunkArray, fitWithinBox, getImageEntries, getTodayLocal } from './utils';

export async function exportDoc(records: MaintenanceRecord[], header: ExportHeader, fileBase: string) {
  const orientation = header.orientation;
  const imagesPerPage = orientation === 'portrait' ? 9 : 6;
  const imageWidth = orientation === 'portrait' ? 150 : 190;
  const imageHeight = orientation === 'portrait' ? 105 : 120;
  const imageEntries = getImageEntries(records);

  const reportTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '94A3B8' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '94A3B8' },
      left: { style: BorderStyle.SINGLE, size: 2, color: '94A3B8' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '94A3B8' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ['S.No', 'Maintenance Date', 'Agency', 'District', 'Block', 'Panchayat', 'Ward', 'Pole Name', 'IMEI No', 'CMS Status', 'Agency Remarks', 'Agency Status', 'Photo Count'].map(
          (value) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, bold: true })] })] }),
        ),
      }),
      ...records.map(
        (record) =>
          new TableRow({
            children: [
              String(record.serialNumber), record.date, record.agency, record.district, record.block, record.panchayat,
              record.ward, record.poleName || 'N/A', record.imeiNo || 'N/A', record.cmsStatus,
              record.remarks || 'N/A', record.status, String(record.photos.length),
            ].map((value) => new TableCell({ children: [new Paragraph(value)] })),
          }),
      ),
    ],
  });

  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: `Date: ${header.date || getTodayLocal()}`, alignment: AlignmentType.LEFT }),
    new Paragraph({ text: header.title || 'Solar Street Light Maintenance Report', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
  ];
  if (header.subtitle.trim()) children.push(new Paragraph({ text: header.subtitle, alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ text: '' }), reportTable);

  chunkArray(imageEntries, imagesPerPage).forEach((pageEntries, pageIndex) => {
    children.push(new Paragraph({ text: 'Image Section', heading: HeadingLevel.HEADING_2, pageBreakBefore: pageIndex > 0 }));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
          insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
        },
        rows: chunkArray(pageEntries, 3).map((entries) => {
          const cells = entries.map(
            (entry) =>
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new ImageRun({ type: entry.photo.type.includes('png') ? 'png' : 'jpg', data: base64ToUint8Array(entry.photo.dataUrl || ''), transformation: fitWithinBox(entry.photo.width || 0, entry.photo.height || 0, imageWidth, imageHeight) })],
                  }),
                  new Paragraph({ children: [new TextRun({ text: `Agency: ${entry.record.agency}`, bold: true })] }),
                  new Paragraph(`Pole Name: ${entry.record.poleName || 'N/A'}`),
                  new Paragraph(`Agency Remarks: ${entry.record.remarks || 'N/A'}`),
                ],
              }),
          );
          while (cells.length < 3) cells.push(new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph('')] }));
          return new TableRow({ children: cells });
        }),
      }),
    );
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 }, size: { orientation: orientation === 'portrait' ? PageOrientation.PORTRAIT : PageOrientation.LANDSCAPE } } },
      children,
    }],
  });

  saveAs(await Packer.toBlob(doc), `${fileBase}.docx`);
}
