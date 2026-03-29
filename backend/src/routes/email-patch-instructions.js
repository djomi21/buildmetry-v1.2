// ═══════════════════════════════════════════════════════════
// PATCH FILE FOR: backend/src/routes/email.js
//
// This file shows the CHANGES you need to make to your
// existing email.js route to attach PDFs to emails.
//
// You already have email sending working (Estimate → Send,
// Invoice → Send). This patch adds PDF generation and
// attaches the PDF file to the outgoing email.
//
// STEPS:
//   1. Install pdfkit:  cd backend && npm install pdfkit
//   2. Open backend/src/routes/email.js
//   3. Follow the instructions below
// ═══════════════════════════════════════════════════════════


// ─────────────────────────────────────
// STEP A: Add this import at the TOP of email.js,
// right below your other require() statements:
// ─────────────────────────────────────

const { generateEstimatePdf, generateInvoicePdf } = require('../utils/generatePdf');


// ─────────────────────────────────────
// STEP B: Find your "send estimate email" route.
//
// It probably looks something like this:
//
//   router.post('/send-estimate/:id', async (req, res) => {
//     // ... fetches estimate, builds HTML, sends email ...
//     await transporter.sendMail({ ... });
//   });
//
// REPLACE the sendMail call with the version below
// that generates a PDF and attaches it.
// ─────────────────────────────────────

// Inside your send-estimate route, REPLACE the sendMail section:
// OLD:
//   await transporter.sendMail({
//     from: ...,
//     to: ...,
//     subject: ...,
//     html: ...,
//   });
//
// NEW (copy this):

/*
    // Generate PDF
    const company = await prisma.company.findFirst();
    const pdfBuffer = await generateEstimatePdf(estimate, company || {});

    // Send email WITH PDF attachment
    await transporter.sendMail({
      from: emailFrom,                    // keep your existing from address
      to: recipientEmail,                 // keep your existing to address
      subject: subject,                   // keep your existing subject
      html: htmlContent,                  // keep your existing HTML body
      attachments: [
        {
          filename: `Estimate-${estimate.estimateNumber || estimate.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
*/


// ─────────────────────────────────────
// STEP C: Find your "send invoice email" route.
//
// Same pattern — REPLACE the sendMail call.
// ─────────────────────────────────────

// Inside your send-invoice route, REPLACE the sendMail section:

/*
    // Generate PDF
    const company = await prisma.company.findFirst();
    const pdfBuffer = await generateInvoicePdf(invoice, company || {});

    // Send email WITH PDF attachment
    await transporter.sendMail({
      from: emailFrom,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
*/


// ─────────────────────────────────────
// THAT'S IT for the email patch.
//
// The PDF is generated in memory (no temp files),
// attached to the email, and sent. The customer
// receives the email with a professional PDF attached.
//
// The PDF includes:
//   - Your company name, address, phone, email
//   - Document type (ESTIMATE or INVOICE) with number
//   - Customer name and dates
//   - All line items with labor/material classification
//   - Subtotal, discount, tax (materials only), total
//   - Deposit and balance due
//   - Your company footer text
// ─────────────────────────────────────
