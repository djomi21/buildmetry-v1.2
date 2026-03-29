// ═══════════════════════════════════════════════════════════
// backend/src/utils/generatePdf.js
//
// Generates PDF documents for Estimates and Invoices.
// Uses PDFKit (pure Node.js, no external tools needed).
//
// INSTALL: npm install pdfkit  (run inside backend/ folder)
// USAGE:  const { generateEstimatePdf, generateInvoicePdf } = require('../utils/generatePdf');
//         const pdfBuffer = await generateEstimatePdf(estimate, company);
// ═══════════════════════════════════════════════════════════

const PDFDocument = require('pdfkit');

// ─── Helpers ───
function fmt(n) {
  return '$' + (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Shared: Draw header with company info ───
function drawHeader(doc, company, docType, docNumber) {
  // Company name
  doc.fontSize(18).font('Helvetica-Bold')
     .text(company.name || company.companyName || 'BuildMetry', 50, 50);

  // Company address
  doc.fontSize(9).font('Helvetica').fillColor('#666666');
  let y = 75;
  if (company.address) { doc.text(company.address, 50, y); y += 12; }
  if (company.phone)   { doc.text(company.phone, 50, y); y += 12; }
  if (company.email)   { doc.text(company.email, 50, y); y += 12; }

  // Document type badge (right side)
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#1B5E9E')
     .text(docType.toUpperCase(), 350, 50, { width: 200, align: 'right' });

  if (docNumber) {
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(`#${docNumber}`, 350, 78, { width: 200, align: 'right' });
  }

  // Horizontal line
  doc.strokeColor('#DDDDDD').lineWidth(0.5)
     .moveTo(50, y + 10).lineTo(560, y + 10).stroke();

  return y + 25;
}

// ─── Shared: Draw customer info and dates ───
function drawCustomerBlock(doc, y, customerName, dates) {
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333')
     .text('BILL TO', 50, y);
  doc.fontSize(11).font('Helvetica').fillColor('#000000')
     .text(customerName || 'Customer', 50, y + 14);

  // Dates on the right
  let dateY = y;
  for (const [label, value] of Object.entries(dates)) {
    if (value) {
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
         .text(label + ':', 400, dateY, { width: 70, align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#000000')
         .text(fmtDate(value), 475, dateY, { width: 85, align: 'right' });
      dateY += 14;
    }
  }

  return Math.max(y + 40, dateY + 10);
}

// ─── Shared: Draw line items table ───
function drawLineItems(doc, y, items) {
  // Table header
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#666666');
  doc.text('DESCRIPTION', 50, y);
  doc.text('TYPE', 300, y, { width: 50 });
  doc.text('QTY', 355, y, { width: 40, align: 'right' });
  doc.text('UNIT PRICE', 400, y, { width: 70, align: 'right' });
  doc.text('TOTAL', 475, y, { width: 85, align: 'right' });

  y += 5;
  doc.strokeColor('#DDDDDD').lineWidth(0.5)
     .moveTo(50, y + 8).lineTo(560, y + 8).stroke();
  y += 16;

  // Line items
  const lineItems = Array.isArray(items) ? items : [];
  for (const item of lineItems) {
    // Check if we need a new page
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    const lineTotal = (item.qty || 0) * (item.unitPrice || 0);

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    doc.text(item.description || item.name || '', 50, y, { width: 245 });
    doc.fontSize(8).fillColor('#888888');
    doc.text(item.isMaterial ? 'Material' : 'Labor', 300, y, { width: 50 });
    doc.fontSize(9).fillColor('#000000');
    doc.text(String(item.qty || 0), 355, y, { width: 40, align: 'right' });
    doc.text(fmt(item.unitPrice || 0), 400, y, { width: 70, align: 'right' });
    doc.font('Helvetica-Bold').text(fmt(lineTotal), 475, y, { width: 85, align: 'right' });

    y += 18;
  }

  // Bottom line
  doc.strokeColor('#DDDDDD').lineWidth(0.5)
     .moveTo(50, y + 4).lineTo(560, y + 4).stroke();

  return y + 14;
}

// ─── Shared: Draw totals block ───
function drawTotals(doc, y, totals) {
  const rows = [
    { label: 'Labor Subtotal', value: fmt(totals.laborTotal) },
    { label: 'Material Subtotal', value: fmt(totals.materialTotal) },
    { label: 'Subtotal', value: fmt(totals.subtotal), bold: true },
  ];

  if (totals.discountAmount > 0) {
    rows.push({ label: `Discount (${totals.discountPercent || 0}%)`, value: `-${fmt(totals.discountAmount)}`, color: '#27864B' });
  }

  rows.push({ label: `Tax (${((totals.taxRate || 0.065) * 100).toFixed(1)}% on materials)`, value: fmt(totals.taxAmount) });
  rows.push({ label: 'TOTAL', value: fmt(totals.total), bold: true, accent: true });

  if (totals.depositAmount > 0) {
    rows.push({ label: 'Deposit', value: `-${fmt(totals.depositAmount)}` });
    rows.push({ label: 'BALANCE DUE', value: fmt(totals.total - totals.depositAmount), bold: true, accent: true });
  }

  for (const row of rows) {
    if (y > 720) { doc.addPage(); y = 50; }

    doc.fontSize(9).font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
       .fillColor(row.accent ? '#1B5E9E' : row.color || '#333333')
       .text(row.label, 350, y, { width: 120, align: 'right' });
    doc.fontSize(row.accent ? 12 : 9).font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
       .fillColor(row.accent ? '#1B5E9E' : row.color || '#000000')
       .text(row.value, 475, y, { width: 85, align: 'right' });

    y += row.accent ? 22 : 16;
  }

  return y;
}

// ─── Shared: Draw footer ───
function drawFooter(doc, company) {
  const footer = company.invoiceFooter || company.footer || '';
  if (footer) {
    doc.fontSize(8).font('Helvetica').fillColor('#999999')
       .text(footer, 50, 740, { width: 510, align: 'center' });
  }
}


// ═══════════════════════════════════════
// Generate Estimate PDF
// ═══════════════════════════════════════
function generateEstimatePdf(estimate, company) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Get line items (handle both .items and .lineItems)
      const items = estimate.items || estimate.lineItems || [];

      // Calculate totals
      const subtotal = items.reduce((s, i) => s + (i.qty || i.quantity || 0) * (i.unitPrice || i.price || i.rate || 0), 0);
      const laborTotal = items.filter(i => !i.isMaterial).reduce((s, i) => s + (i.qty || i.quantity || 0) * (i.unitPrice || i.price || i.rate || 0), 0);
      const materialTotal = subtotal - laborTotal;
      const discountPercent = estimate.discountPercent || estimate.discount || 0;
      const discountAmount = subtotal * (discountPercent / 100);
      const discountedMaterial = materialTotal * (1 - discountPercent / 100);
      const taxRate = estimate.taxRate || 0.065;
      const taxAmount = discountedMaterial * taxRate;
      const total = subtotal - discountAmount + taxAmount;
      const depositAmount = estimate.depositAmount || (estimate.depositPercent ? total * (estimate.depositPercent / 100) : 0);

      // Normalize items for the table
      const normalizedItems = items.map(i => ({
        description: i.description || i.name || '',
        qty: i.qty || i.quantity || 0,
        unitPrice: i.unitPrice || i.price || i.rate || 0,
        isMaterial: Boolean(i.isMaterial),
      }));

      let y = drawHeader(doc, company, 'Estimate', estimate.estimateNumber || estimate.id);
      const customerName = estimate.customer ? (estimate.customer.name || estimate.customer.companyName || '') : (estimate.customerName || '');
      y = drawCustomerBlock(doc, y, customerName, {
        'Date': estimate.createdAt,
        'Valid Until': estimate.validUntil || estimate.expiresAt,
      });
      y = drawLineItems(doc, y, normalizedItems);
      y = drawTotals(doc, y, { subtotal, laborTotal, materialTotal, discountPercent, discountAmount, taxRate, taxAmount, total, depositAmount });
      drawFooter(doc, company);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}


// ═══════════════════════════════════════
// Generate Invoice PDF
// ═══════════════════════════════════════
function generateInvoicePdf(invoice, company) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const items = invoice.items || invoice.lineItems || [];

      const subtotal = items.reduce((s, i) => s + (i.qty || i.quantity || 0) * (i.unitPrice || i.price || i.rate || 0), 0);
      const laborTotal = items.filter(i => !i.isMaterial).reduce((s, i) => s + (i.qty || i.quantity || 0) * (i.unitPrice || i.price || i.rate || 0), 0);
      const materialTotal = subtotal - laborTotal;
      const discountPercent = invoice.discountPercent || invoice.discount || 0;
      const discountAmount = subtotal * (discountPercent / 100);
      const discountedMaterial = materialTotal * (1 - discountPercent / 100);
      const taxRate = invoice.taxRate || 0.065;
      const taxAmount = discountedMaterial * taxRate;
      const total = subtotal - discountAmount + taxAmount;
      const depositAmount = invoice.depositAmount || (invoice.depositPercent ? total * (invoice.depositPercent / 100) : 0);

      const normalizedItems = items.map(i => ({
        description: i.description || i.name || '',
        qty: i.qty || i.quantity || 0,
        unitPrice: i.unitPrice || i.price || i.rate || 0,
        isMaterial: Boolean(i.isMaterial),
      }));

      let y = drawHeader(doc, company, 'Invoice', invoice.invoiceNumber || invoice.id);
      const customerName = invoice.customer ? (invoice.customer.name || invoice.customer.companyName || '') : (invoice.customerName || '');
      y = drawCustomerBlock(doc, y, customerName, {
        'Date': invoice.createdAt,
        'Due Date': invoice.dueDate,
        'Terms': null,  // skip
      });

      // Payment terms text
      if (invoice.paymentTerms) {
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
           .text(`Payment Terms: ${invoice.paymentTerms}`, 400, y - 10, { width: 160, align: 'right' });
      }

      y = drawLineItems(doc, y, normalizedItems);

      // If invoice has change order items, add those as a separate section
      if (invoice.changeOrderItems && invoice.changeOrderItems.length > 0) {
        if (y > 650) { doc.addPage(); y = 50; }
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
           .text('Change Orders', 50, y);
        y += 18;
        y = drawLineItems(doc, y, invoice.changeOrderItems.map(i => ({
          description: i.description || i.name || '',
          qty: i.qty || i.quantity || 0,
          unitPrice: i.unitPrice || i.price || i.rate || 0,
          isMaterial: Boolean(i.isMaterial),
        })));
      }

      y = drawTotals(doc, y, { subtotal, laborTotal, materialTotal, discountPercent, discountAmount, taxRate, taxAmount, total, depositAmount });
      drawFooter(doc, company);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}


module.exports = { generateEstimatePdf, generateInvoicePdf };
