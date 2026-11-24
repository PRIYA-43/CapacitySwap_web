import { jsPDF } from 'jspdf';

function valueOrNotProvided(value) {
  if (value == null || value === '') return 'Not provided';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not provided';
  return String(value);
}

function formatDate(value) {
  if (!value) return 'Not provided';
  const date = value.toDate
    ? value.toDate()
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return valueOrNotProvided(value);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(value) {
  const amount = Number(value);
  if (value == null || !Number.isFinite(amount)) return 'Not provided';
  return `INR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function createPdf(title, reference, sections, fileName) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 22;

  const addHeader = () => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(25, 30, 45);
    pdf.text('CapacitySwap', margin, 17);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(90, 98, 112);
    pdf.text('Manufacturing capacity marketplace', pageWidth - margin, 17, {
      align: 'right',
    });
    pdf.setDrawColor(220, 224, 232);
    pdf.line(margin, 21, pageWidth - margin, 21);
  };

  const nextPageIfNeeded = (height) => {
    if (y + height <= pageHeight - 18) return;
    pdf.addPage();
    addHeader();
    y = 29;
  };

  addHeader();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(25, 30, 45);
  pdf.text(title, margin, y + 7);
  y += 14;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(90, 98, 112);
  pdf.text(`Reference: ${valueOrNotProvided(reference)}`, margin, y);
  y += 9;

  for (const section of sections) {
    nextPageIfNeeded(12);
    pdf.setFillColor(244, 246, 249);
    pdf.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(35, 44, 60);
    pdf.text(section.title, margin + 3, y + 5.5);
    y += 12;

    for (const [label, rawValue] of section.fields) {
      const text = `${label}: ${valueOrNotProvided(rawValue)}`;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(45, 50, 60);
      let lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = 4.5;
      while (lines.length) {
        const availableLines = Math.floor((pageHeight - 18 - y) / lineHeight);
        if (availableLines <= 0) {
          pdf.addPage();
          addHeader();
          y = 29;
          continue;
        }

        const pageLines = lines.slice(0, availableLines);
        lines = lines.slice(availableLines);
        pdf.text(pageLines, margin, y);
        y += pageLines.length * lineHeight + (lines.length ? 0 : 2);

        if (lines.length) {
          pdf.addPage();
          addHeader();
          y = 29;
        }
      }
    }

    y += 3;
  }

  const pageCount = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 126, 138);
    pdf.text(
      `CapacitySwap · ${reference} · Page ${page} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 9,
      { align: 'center' }
    );
  }

  pdf.save(fileName);
}

export function downloadRFQPdf(rfq) {
  const rfqId = valueOrNotProvided(rfq.id || rfq.rfqId);
  createPdf('Request for Quotation', rfqId, [
    {
      title: 'RFQ details',
      fields: [
        ['RFQ ID', rfqId],
        ['Title', rfq.title || rfq.rfqTitle],
        ['Status', rfq.status],
        ['Created', formatDate(rfq.createdAt)],
      ],
    },
    {
      title: 'Parties and machine',
      fields: [
        ['Seeker name', rfq.seekerName],
        ['Seeker company', rfq.seekerCompanyName],
        ['Provider name', rfq.providerName],
        ['Provider company', rfq.providerCompanyName],
        ['Machine name', rfq.machineName],
        ['Machine ID', rfq.machineId],
      ],
    },
    {
      title: 'Manufacturing requirement',
      fields: [
        ['Material type', rfq.materialType],
        ['Required quantity', rfq.quantity == null
          ? 'Not provided'
          : `${rfq.quantity} ${rfq.quantityUnit || ''}`.trim()],
        ['Manufacturing location', rfq.location],
        ['Required completion date', formatDate(rfq.completionDate)],
        ['Budget', rfq.budget == null ? 'Not provided' : formatCurrency(rfq.budget)],
        ['Job description', rfq.description],
      ],
    },
  ], `CapacitySwap-RFQ-${rfqId}.pdf`);
}

export function downloadQuotationPdf(quotation) {
  const quotationId = valueOrNotProvided(quotation.quotationId || quotation.id);
  createPdf('Quotation', quotationId, [
    {
      title: 'Quotation references',
      fields: [
        ['Quotation ID', quotationId],
        ['RFQ ID', quotation.rfqId],
        ['RFQ title', quotation.rfqTitle],
        ['Status', quotation.status],
        ['Submission date', formatDate(quotation.createdAt)],
      ],
    },
    {
      title: 'Parties and machine',
      fields: [
        ['Seeker name', quotation.seekerName],
        ['Seeker company', quotation.seekerCompanyName],
        ['Provider name', quotation.providerName],
        ['Provider company', quotation.providerCompanyName],
        ['Machine name', quotation.machineName],
        ['Machine ID', quotation.machineId],
      ],
    },
    {
      title: 'Commercial offer',
      fields: [
        ['Offered price', formatCurrency(quotation.offeredPrice)],
        ['Price type', quotation.priceUnitDetails || quotation.priceUnit],
        ['Estimated delivery duration', quotation.estimatedDelivery ||
          (quotation.deliveryDays ? `${quotation.deliveryDays} days` : '')],
        ['Expected delivery date', formatDate(quotation.deliveryDate)],
        ['Material / manufacturing details', quotation.materialDetails],
        ['Additional terms and conditions', quotation.terms],
        ['Quotation validity', formatDate(quotation.validityDate)],
        ['Provider remarks', quotation.providerRemarks],
      ],
    },
  ], `CapacitySwap-Quotation-${quotationId}.pdf`);
}
