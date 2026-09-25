// Luxury Editorial HTML Email Templates for Tunmise Aladire Asooke
// Optimized for Gmail, Apple Mail, Outlook, and mobile devices with zero emojis.

import type { Order } from '@/types';

const STORE_NAME = 'Tunmise Aladire Asooke';
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://tunmise-aladire-asooke.vercel.app';
const ATELIER_ADDRESS = 'LKJ Business Hub, NYSC Bus Stop, Igando, Lagos, Nigeria';

function baseEmailWrapper(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8f5; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);">
          
          <!-- Top Terracotta Accent Bar -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #c2410c, #ea580c); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 36px 30px 24px 30px; border-bottom: 1px solid #f4efe6;">
              <a href="${STORE_URL}" style="text-decoration: none; display: inline-block;">
                <span style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #c2410c; font-weight: 700; display: block; margin-bottom: 4px;">Luxury Nigerian Fashion</span>
                <span style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #18181b; letter-spacing: 0.05em; display: block;">Tunmise Aladire</span>
                <span style="font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; color: #71717a; display: block; margin-top: 2px;">Asooke</span>
              </a>
            </td>
          </tr>

          <!-- Dynamic Email Body -->
          <tr>
            <td style="padding: 36px 32px 40px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Brand Footer -->
          <tr>
            <td style="background-color: #faf8f5; padding: 28px 30px; text-align: center; border-top: 1px solid #f4efe6;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #18181b;">${STORE_NAME}</p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #71717a; line-height: 1.5;">
                Physical Atelier: ${ATELIER_ADDRESS}
              </p>
              <p style="margin: 0; font-size: 11px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} ${STORE_NAME}. Handcrafted in Nigeria. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 1. Order Confirmation & Itemized Receipt for Customer ────────────────────

export function getOrderReceiptHtml(order: Order): string {
  const itemsRows = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f4efe6;">
        <td style="padding: 14px 0; vertical-align: top;">
          <strong style="font-size: 14px; color: #18181b; display: block;">${item.product.name}</strong>
          <span style="font-size: 12px; color: #71717a; display: block; margin-top: 2px;">
            Size: ${item.selectedSize} &middot; Color: ${item.selectedColor}
          </span>
        </td>
        <td style="padding: 14px 12px; font-size: 13px; color: #71717a; text-align: center; vertical-align: top;">
          &times; ${item.quantity}
        </td>
        <td style="padding: 14px 0; font-size: 14px; font-weight: 600; color: #18181b; text-align: right; vertical-align: top;">
          &#8358;${(item.product.price * item.quantity).toLocaleString()}
        </td>
      </tr>`
    )
    .join('');

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        Order Confirmed
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 26px; color: #18181b; margin: 14px 0 6px 0;">Thank You for Your Order</h1>
      <p style="margin: 0; font-size: 14px; color: #71717a;">
        Dear ${order.customerInfo.name}, we have received your payment and our atelier has begun preparing your pieces.
      </p>
    </div>

    <!-- Order Metadata Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8f5; border-radius: 12px; padding: 18px 20px; margin-bottom: 26px; font-size: 13px;">
      <tr>
        <td style="padding: 4px 0; color: #71717a; width: 45%;">Order Number:</td>
        <td style="padding: 4px 0; color: #18181b; font-weight: 600; font-family: monospace;">#${order.id.slice(0, 10).toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Payment Reference:</td>
        <td style="padding: 4px 0; color: #18181b; font-weight: 500; font-family: monospace;">${order.paystackRef}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Status:</td>
        <td style="padding: 4px 0; color: #c2410c; font-weight: 700; text-transform: uppercase; font-size: 11px;">Payment Confirmed</td>
      </tr>
    </table>

    <!-- Itemized Items Table -->
    <h3 style="font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #18181b; margin: 0 0 12px 0;">
      Itemized Summary
    </h3>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border-collapse: collapse;">
      ${itemsRows}
      <tr>
        <td colspan="2" style="padding-top: 18px; font-size: 15px; font-weight: 700; color: #18181b;">Total Paid</td>
        <td style="padding-top: 18px; font-size: 18px; font-weight: 700; color: #c2410c; text-align: right;">
          &#8358;${order.total.toLocaleString()}
        </td>
      </tr>
    </table>

    <!-- Delivery Address Details -->
    <div style="background-color: #ffffff; border: 1px solid #f4efe6; border-radius: 12px; padding: 18px; margin-bottom: 28px;">
      <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #71717a;">
        Delivery Destination
      </h4>
      <p style="margin: 0; font-size: 13px; color: #18181b; line-height: 1.6;">
        ${order.customerInfo.name}<br>
        ${order.customerInfo.address}<br>
        ${order.customerInfo.city}, ${order.customerInfo.state}<br>
        Phone: ${order.customerInfo.phone}
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center;">
      <a href="${STORE_URL}/orders" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
        View My Orders
      </a>
    </div>
  `;

  return baseEmailWrapper(`Order Confirmation #${order.id.slice(0, 10).toUpperCase()}`, content);
}

// ─── 2. New Order Alert for Store Admin & Atelier ─────────────────────────────

export function getAdminNewOrderAlertHtml(order: Order): string {
  const itemsText = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-size: 13px;">${item.product.name} (${item.selectedSize} / ${item.selectedColor})</td>
        <td style="padding: 10px; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 0; font-size: 13px; text-align: right; font-weight: 600;">&#8358;${(item.product.price * item.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  const content = `
    <div style="margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        Atelier Dispatch Alert
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 24px; color: #18181b; margin: 12px 0 6px 0;">New Paid Customer Order</h1>
      <p style="margin: 0; font-size: 14px; color: #71717a;">
        A new order has been paid via Paystack and is ready for packing or tailored production.
      </p>
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8f5; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <td style="padding: 4px 0; color: #71717a; width: 35%;">Order ID:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #18181b;">#${order.id.toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Customer:</td>
        <td style="padding: 4px 0; font-weight: 600; color: #18181b;">${order.customerInfo.name} (${order.customerInfo.email})</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Phone Number:</td>
        <td style="padding: 4px 0; font-weight: 600; color: #18181b;">${order.customerInfo.phone}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Destination:</td>
        <td style="padding: 4px 0; color: #18181b;">${order.customerInfo.address}, ${order.customerInfo.city}, ${order.customerInfo.state}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Paystack Ref:</td>
        <td style="padding: 4px 0; font-family: monospace; color: #18181b;">${order.paystackRef}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Total Paid:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #c2410c; font-size: 16px;">&#8358;${order.total.toLocaleString()}</td>
      </tr>
    </table>

    <h3 style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #18181b; margin: 0 0 10px 0;">
      Items to Fulfill
    </h3>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px; border-collapse: collapse;">
      ${itemsText}
    </table>

    <div style="text-align: center;">
      <a href="${STORE_URL}/admin" style="display: inline-block; background-color: #c2410c; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
        Open Admin Dashboard
      </a>
    </div>
  `;

  return baseEmailWrapper(`New Paid Order #${order.id.slice(0, 8).toUpperCase()}`, content);
}

// ─── 3. Bespoke Measurement Confirmation for Customer ─────────────────────────

export interface BespokeData {
  name: string;
  email: string;
  phone: string;
  productName: string;
  bust?: string;
  waist?: string;
  hips?: string;
  height?: string;
  notes?: string;
}

export function getBespokeCustomerReceiptHtml(bespoke: BespokeData): string {
  const content = `
    <div style="text-align: center; margin-bottom: 26px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        Bespoke Tailoring Request
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 24px; color: #18181b; margin: 12px 0 6px 0;">Measurements Received</h1>
      <p style="margin: 0; font-size: 14px; color: #71717a;">
        Dear ${bespoke.name}, your custom tailoring request for <strong>${bespoke.productName}</strong> has been logged with our master atelier.
      </p>
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8f5; border-radius: 12px; padding: 18px 20px; margin-bottom: 26px; font-size: 13px;">
      <tr>
        <td style="padding: 4px 0; color: #71717a; width: 40%;">Garment:</td>
        <td style="padding: 4px 0; color: #18181b; font-weight: 600;">${bespoke.productName}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Bust / Chest:</td>
        <td style="padding: 4px 0; color: #18181b;">${bespoke.bust || 'Not specified'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Waist:</td>
        <td style="padding: 4px 0; color: #18181b;">${bespoke.waist || 'Not specified'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Hips:</td>
        <td style="padding: 4px 0; color: #18181b;">${bespoke.hips || 'Not specified'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Height / Length:</td>
        <td style="padding: 4px 0; color: #18181b;">${bespoke.height || 'Standard'}</td>
      </tr>
      ${bespoke.notes ? `
      <tr>
        <td style="padding: 4px 0; color: #71717a; vertical-align: top;">Notes:</td>
        <td style="padding: 4px 0; color: #18181b;">${bespoke.notes}</td>
      </tr>` : ''}
    </table>

    <p style="font-size: 13px; color: #52525b; line-height: 1.6; margin-bottom: 24px;">
      Our head tailor will review your dimensions within 24 hours to confirm pattern alignment. If any adjustments are needed, we will reach out to you via WhatsApp or phone at <strong>${bespoke.phone}</strong>.
    </p>

    <div style="text-align: center;">
      <a href="${STORE_URL}/products" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
        Explore More Collections
      </a>
    </div>
  `;

  return baseEmailWrapper(`Bespoke Tailoring Request: ${bespoke.productName}`, content);
}

// ─── 4. Bespoke Technical Ticket for Atelier ──────────────────────────────────

export function getBespokeAtelierTicketHtml(bespoke: BespokeData): string {
  const content = `
    <div style="margin-bottom: 20px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        Atelier Cutting Ticket
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 22px; color: #18181b; margin: 12px 0 6px 0;">New Bespoke Tailoring Ticket</h1>
      <p style="margin: 0; font-size: 14px; color: #71717a;">
        Customer has submitted custom body dimensions for <strong>${bespoke.productName}</strong>.
      </p>
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8f5; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <td style="padding: 4px 0; color: #71717a; width: 35%;">Client Name:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #18181b;">${bespoke.name}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Phone Number:</td>
        <td style="padding: 4px 0; font-weight: 600; color: #18181b;">${bespoke.phone}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Email:</td>
        <td style="padding: 4px 0; color: #18181b;">${bespoke.email}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Garment:</td>
        <td style="padding: 4px 0; font-weight: 600; color: #c2410c;">${bespoke.productName}</td>
      </tr>
      <tr><td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid #e4e4e7;"></td></tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Bust / Chest:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #18181b;">${bespoke.bust || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Waist:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #18181b;">${bespoke.waist || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Hips:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #18181b;">${bespoke.hips || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Height:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #18181b;">${bespoke.height || 'Standard'}</td>
      </tr>
      ${bespoke.notes ? `
      <tr>
        <td style="padding: 4px 0; color: #71717a; vertical-align: top;">Design Notes:</td>
        <td style="padding: 4px 0; color: #18181b; background-color: #ffffff; padding: 8px; border-radius: 6px;">${bespoke.notes}</td>
      </tr>` : ''}
    </table>

    <div style="text-align: center;">
      <a href="${STORE_URL}/admin" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
        View in Admin
      </a>
    </div>
  `;

  return baseEmailWrapper(`Bespoke Ticket: ${bespoke.name} - ${bespoke.productName}`, content);
}

// ─── 5. OTP / Account Verification Email ──────────────────────────────────────

export function getOtpVerificationHtml(name: string, otp: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        Security Verification
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 26px; color: #18181b; margin: 14px 0 6px 0;">Verify Your Account</h1>
      <p style="margin: 0; font-size: 14px; color: #71717a;">
        Hello ${name}, welcome to Tunmise Aladire Asooke. Use the one-time verification code below to verify your account.
      </p>
    </div>

    <!-- OTP Code Display Card -->
    <div style="text-align: center; background-color: #faf8f5; border: 1px solid #f4efe6; border-radius: 14px; padding: 26px 20px; margin: 26px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a;">
        One-Time Verification Code
      </p>
      <div style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.3em; color: #c2410c;">
        ${otp}
      </div>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #a1a1aa;">
        This code is valid for 15 minutes. Do not share it with anyone.
      </p>
    </div>

    <p style="font-size: 12px; color: #71717a; text-align: center; line-height: 1.5; margin: 0;">
      If you did not initiate this request, you can safely ignore this email.
    </p>
  `;

  return baseEmailWrapper('Your Tunmise Verification Code', content);
}

// ─── 6. Customer Contact Inquiry Confirmation & Admin Alert ───────────────────

export function getContactCustomerReceiptHtml(name: string, subject: string, message: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        Inquiry Received
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 24px; color: #18181b; margin: 12px 0 6px 0;">We Have Received Your Message</h1>
      <p style="margin: 0; font-size: 14px; color: #71717a;">
        Dear ${name}, thank you for contacting Tunmise Aladire Asooke. Our customer concierge team has received your note.
      </p>
    </div>

    <div style="background-color: #faf8f5; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em;">
        Subject: ${subject}
      </p>
      <p style="margin: 0; font-size: 13px; color: #18181b; line-height: 1.6; font-style: italic;">
        &ldquo;${message}&rdquo;
      </p>
    </div>

    <p style="font-size: 13px; color: #52525b; line-height: 1.6; margin-bottom: 24px; text-align: center;">
      We will respond to your message within 24 hours. For urgent requests or studio consultations, visit our atelier in Lagos or call us during business hours.
    </p>

    <div style="text-align: center;">
      <a href="${STORE_URL}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
        Return to Storefront
      </a>
    </div>
  `;

  return baseEmailWrapper(`Inquiry Received: ${subject}`, content);
}

export function getAdminContactAlertHtml(name: string, email: string, phone: string, subject: string, message: string): string {
  const content = `
    <div style="margin-bottom: 20px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        Customer Support Alert
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 22px; color: #18181b; margin: 12px 0 6px 0;">New Customer Inquiry</h1>
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf8f5; border-radius: 12px; padding: 18px; margin-bottom: 20px; font-size: 13px;">
      <tr>
        <td style="padding: 4px 0; color: #71717a; width: 30%;">Sender Name:</td>
        <td style="padding: 4px 0; font-weight: 700; color: #18181b;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Email Address:</td>
        <td style="padding: 4px 0; font-weight: 600; color: #18181b;">${email}</td>
      </tr>
      ${phone ? `
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Phone Number:</td>
        <td style="padding: 4px 0; color: #18181b;">${phone}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 4px 0; color: #71717a;">Subject:</td>
        <td style="padding: 4px 0; font-weight: 600; color: #c2410c;">${subject}</td>
      </tr>
    </table>

    <div style="background-color: #ffffff; border: 1px solid #f4efe6; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em;">
        Message Body
      </p>
      <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6; white-space: pre-wrap;">${message}</p>
    </div>

    <div style="text-align: center;">
      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background-color: #c2410c; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
        Reply Directly to ${name}
      </a>
    </div>
  `;

  return baseEmailWrapper(`New Inquiry: ${subject} from ${name}`, content);
}

// ─── 7. Beads & Accessories VIP Priority Waitlist Confirmation ────────────────

export function getBeadsVipConfirmationHtml(email: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 26px;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; background-color: rgba(194, 65, 12, 0.08); padding: 5px 12px; border-radius: 20px; display: inline-block;">
        VIP Priority Access Confirmed
      </span>
      <h1 style="font-family: Georgia, serif; font-size: 26px; color: #18181b; margin: 14px 0 6px 0;">Beads & Accessories</h1>
      <p style="margin: 0; font-size: 14px; color: #71717a;">
        Your email <strong>${email}</strong> has been secured for VIP early access.
      </p>
    </div>

    <div style="background-color: #faf8f5; border-radius: 14px; padding: 22px; margin-bottom: 26px; text-align: left;">
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #18181b; line-height: 1.6;">
        Our artisans are finalizing our debut collection of royal coral beads, bridal neckpieces, and heritage adornments.
      </p>
      <p style="margin: 0; font-size: 13px; color: #52525b; line-height: 1.6;">
        You will receive private access to explore and order from the collection <strong>24 hours before the public launch</strong>.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${STORE_URL}/products" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
        Browse Current Collections
      </a>
    </div>
  `;

  return baseEmailWrapper('VIP Early Access: Beads & Accessories', content);
}
