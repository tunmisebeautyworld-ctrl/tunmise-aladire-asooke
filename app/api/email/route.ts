import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderReceiptHtml,
  getAdminNewOrderAlertHtml,
  getBespokeCustomerReceiptHtml,
  getBespokeAtelierTicketHtml,
  getOtpVerificationHtml,
  getContactCustomerReceiptHtml,
  getAdminContactAlertHtml,
  getBeadsVipConfirmationHtml,
  getOrderStatusUpdateHtml,
  type BespokeData,
} from '@/lib/emailTemplates';
import type { Order } from '@/types';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'orders@tunmisealadire.ng';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Tunmise Aladire Asooke';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'tunmisebeautyworld@gmail.com';

interface SendBrevoPayload {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
}

async function sendBrevoEmail({ toEmail, toName, subject, htmlContent, replyTo }: SendBrevoPayload) {
  // If Brevo API key is not configured, simulate delivery with server console log
  if (!BREVO_API_KEY) {
    console.log(`[EMAIL SIMULATION] To: ${toEmail} | Subject: "${subject}"`);
    return { success: true, simulated: true };
  }

  const payload: Record<string, unknown> = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [
      {
        email: toEmail,
        name: toName || toEmail,
      },
    ],
    subject,
    htmlContent,
  };

  if (replyTo) {
    payload.replyTo = replyTo;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[BREVO ERROR]', res.status, errorText);
    throw new Error(`Brevo dispatch failed: ${res.statusText}`);
  }

  const data = await res.json();
  return { success: true, messageId: data.messageId };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    switch (type) {
      // ─── 1. Order Confirmation & Admin Atelier Alert ───
      case 'order_confirmation': {
        const order = body.order as Order;
        if (!order || !order.customerInfo?.email) {
          return NextResponse.json({ error: 'Missing order details or email' }, { status: 400 });
        }

        // 1a. Send itemized receipt to customer
        const customerHtml = getOrderReceiptHtml(order);
        await sendBrevoEmail({
          toEmail: order.customerInfo.email,
          toName: order.customerInfo.name,
          subject: `Order Confirmation #${order.id.slice(0, 10).toUpperCase()} - Tunmise Aladire Asooke`,
          htmlContent: customerHtml,
        });

        // 1b. Send atelier dispatch alert to store admin
        const adminHtml = getAdminNewOrderAlertHtml(order);
        await sendBrevoEmail({
          toEmail: ADMIN_EMAIL,
          toName: 'Tunmise Store Admin',
          subject: `New Paid Order #${order.id.slice(0, 8).toUpperCase()} - ₦${order.total.toLocaleString()} from ${order.customerInfo.name}`,
          htmlContent: adminHtml,
        });

        return NextResponse.json({ success: true, message: 'Order emails dispatched successfully' });
      }

      // ─── 2. Bespoke Tailoring Measurements ───
      case 'bespoke_request': {
        const bespoke = body.bespoke as BespokeData;
        if (!bespoke || !bespoke.email) {
          return NextResponse.json({ error: 'Missing bespoke details or email' }, { status: 400 });
        }

        // 2a. Send confirmation to customer
        const customerHtml = getBespokeCustomerReceiptHtml(bespoke);
        await sendBrevoEmail({
          toEmail: bespoke.email,
          toName: bespoke.name,
          subject: `Bespoke Tailoring Request Received: ${bespoke.productName}`,
          htmlContent: customerHtml,
        });

        // 2b. Send technical cutting sheet to atelier admin
        const atelierHtml = getBespokeAtelierTicketHtml(bespoke);
        await sendBrevoEmail({
          toEmail: ADMIN_EMAIL,
          toName: 'Atelier Head Tailor',
          subject: `New Bespoke Cutting Ticket: ${bespoke.name} - ${bespoke.productName}`,
          htmlContent: atelierHtml,
        });

        return NextResponse.json({ success: true, message: 'Bespoke emails dispatched successfully' });
      }

      // ─── 3. Customer Contact Form Inquiries ───
      case 'contact_inquiry': {
        const { name, email, phone, subject, message } = body;
        if (!email || !message) {
          return NextResponse.json({ error: 'Missing email or message' }, { status: 400 });
        }

        // 3a. Acknowledgment to customer
        const customerHtml = getContactCustomerReceiptHtml(name, subject, message);
        await sendBrevoEmail({
          toEmail: email,
          toName: name,
          subject: `Inquiry Received: ${subject} - Tunmise Aladire Asooke`,
          htmlContent: customerHtml,
        });

        // 3b. Alert to store administrator
        const adminHtml = getAdminContactAlertHtml(name, email, phone, subject, message);
        await sendBrevoEmail({
          toEmail: ADMIN_EMAIL,
          toName: 'Tunmise Store Concierge',
          subject: `New Customer Inquiry: ${subject} from ${name}`,
          htmlContent: adminHtml,
          replyTo: { email, name },
        });

        return NextResponse.json({ success: true, message: 'Contact emails dispatched successfully' });
      }

      // ─── 4. OTP / Security Verification ───
      case 'otp_verification': {
        const { name, email, otp } = body;
        if (!email || !otp) {
          return NextResponse.json({ error: 'Missing email or OTP code' }, { status: 400 });
        }

        const otpHtml = getOtpVerificationHtml(name || 'Customer', otp);
        await sendBrevoEmail({
          toEmail: email,
          toName: name || 'Valued Customer',
          subject: `${otp} is your Tunmise Aladire verification code`,
          htmlContent: otpHtml,
        });

        return NextResponse.json({ success: true, message: 'Verification OTP sent' });
      }

      // ─── 5. Beads & Accessories VIP Priority Waitlist ───
      case 'beads_vip_waitlist': {
        const { email } = body;
        if (!email) {
          return NextResponse.json({ error: 'Missing email address' }, { status: 400 });
        }

        const waitlistHtml = getBeadsVipConfirmationHtml(email);
        await sendBrevoEmail({
          toEmail: email,
          subject: 'VIP Early Access Confirmed: Beads & Accessories',
          htmlContent: waitlistHtml,
        });

        return NextResponse.json({ success: true, message: 'VIP Waitlist email dispatched' });
      }

      // ─── 6. Order Status Update Notification ───
      case 'order_status_update': {
        const order = body.order as Order;
        const notes = body.notes as string | undefined;
        if (!order || !order.customerInfo?.email) {
          return NextResponse.json({ error: 'Missing order details or recipient email' }, { status: 400 });
        }

        const statusTitles: Record<Order['status'], string> = {
          pending: 'Received & Verifying',
          confirmed: 'Confirmed & Queued',
          in_production: 'In Atelier Tailoring',
          shipped: 'Dispatched for Delivery',
          delivered: 'Delivered',
          cancelled: 'Cancelled',
        };

        const statusLabel = statusTitles[order.status] || order.status;
        const statusHtml = getOrderStatusUpdateHtml(order, notes);

        await sendBrevoEmail({
          toEmail: order.customerInfo.email,
          toName: order.customerInfo.name,
          subject: `Order Update: #${order.id.slice(0, 8).toUpperCase()} is now ${statusLabel} - Tunmise Aladire Asooke`,
          htmlContent: statusHtml,
        });

        return NextResponse.json({ success: true, message: 'Order status notification dispatched' });
      }

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[EMAIL ROUTE ERROR]', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
