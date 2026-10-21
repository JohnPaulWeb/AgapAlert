import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

// ==============================================================================
// AgapAlert: Gmail SMTP Email Notification Backend
// Sends flood/disaster alert emails to all registered user emails.
//
// Environment Variables Required:
//   GMAIL_USER        – Your Gmail address (e.g. agapalert.system@gmail.com)
//   GMAIL_APP_PASSWORD – Gmail App Password (NOT your login password)
//                        Generate at: https://myaccount.google.com/apppasswords
// ==============================================================================

// In-memory subscriber registry (in production, use Supabase profiles table)
let emailSubscribers: string[] = [];

// Gmail SMTP Transporter
function createGmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn(
      "[AgapAlert Email] GMAIL_USER or GMAIL_APP_PASSWORD not set. Email sending will be simulated."
    );
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/**
 * POST /api/notifications/email
 *
 * Body:
 *   action: "subscribe" | "unsubscribe" | "broadcast"
 *
 * For "subscribe" / "unsubscribe":
 *   email: string
 *
 * For "broadcast":
 *   subject: string
 *   alertTitle: string
 *   alertArea: string
 *   alertDescription: string
 *   severity: string
 *   emails?: string[]   (optional override; if omitted, sends to all subscribers)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── Subscribe a new email ──
    if (action === "subscribe") {
      const { email } = body;
      if (!email || !email.includes("@")) {
        return NextResponse.json(
          { error: "A valid email address is required." },
          { status: 400 }
        );
      }
      const normalized = email.trim().toLowerCase();
      if (!emailSubscribers.includes(normalized)) {
        emailSubscribers.push(normalized);
      }
      return NextResponse.json({
        success: true,
        message: `${normalized} subscribed to AgapAlert email notifications.`,
        totalSubscribers: emailSubscribers.length,
      });
    }

    // ── Unsubscribe an email ──
    if (action === "unsubscribe") {
      const { email } = body;
      if (!email) {
        return NextResponse.json(
          { error: "Email is required to unsubscribe." },
          { status: 400 }
        );
      }
      const normalized = email.trim().toLowerCase();
      emailSubscribers = emailSubscribers.filter((e) => e !== normalized);
      return NextResponse.json({
        success: true,
        message: `${normalized} unsubscribed from AgapAlert notifications.`,
        totalSubscribers: emailSubscribers.length,
      });
    }

    // ── Broadcast alert email to all subscribers ──
    if (action === "broadcast") {
      const {
        subject,
        alertTitle,
        alertArea,
        alertDescription,
        severity = "high",
        emails,
      } = body;

      if (!alertTitle || !alertDescription) {
        return NextResponse.json(
          { error: "alertTitle and alertDescription are required." },
          { status: 400 }
        );
      }

      const recipients: string[] = emails || emailSubscribers;

      if (recipients.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No subscribers to notify. Broadcast skipped.",
          sent: 0,
          simulated: true,
        });
      }

      const transporter = createGmailTransporter();
      const severityColors: Record<string, string> = {
        critical: "#EF4444",
        high: "#F97316",
        watch: "#EAB308",
        advisory: "#3B82F6",
        normal: "#10B981",
      };
      const sevColor = severityColors[severity] || "#F97316";
      const sevUpper = severity.toUpperCase();
      const timestamp = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        dateStyle: "full",
        timeStyle: "short",
      });

      // Premium HTML email template matching AgapAlert dark theme
      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#050B14;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" style="width:100%;background-color:#050B14;" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" style="max-width:580px;width:100%;background-color:#0A1424;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;" cellpadding="0" cellspacing="0">

        <!-- Header Banner -->
        <tr><td style="background:linear-gradient(135deg,#7F1D1D 0%,#450a0a 100%);padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td>
                <span style="font-size:9px;font-weight:900;color:#FECACA;letter-spacing:1.5px;text-transform:uppercase;">⚠️ DISASTER ALERT NOTIFICATION</span>
                <h1 style="margin:6px 0 0 0;font-size:20px;font-weight:900;color:#FFFFFF;">AGAP<span style="color:#06B6D4;">ALERT</span></h1>
                <p style="margin:4px 0 0 0;font-size:11px;color:#FDA4AF;">Real-Time Flood Early Warning System — Pangasinan DRRMO</p>
              </td>
              <td align="right" valign="top">
                <span style="display:inline-block;background:${sevColor};color:#fff;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:900;letter-spacing:0.5px;">${sevUpper}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Alert Content -->
        <tr><td style="padding:24px;">
          <table role="presentation" style="width:100%;background-color:#0E1A2E;border:1px solid rgba(255,255,255,0.1);border-left:4px solid ${sevColor};border-radius:12px;" cellpadding="0" cellspacing="0">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0;font-size:10px;font-weight:900;color:${sevColor};letter-spacing:1px;text-transform:uppercase;">🔴 ${sevUpper} SEVERITY ALERT</p>
              <h2 style="margin:8px 0;font-size:17px;font-weight:900;color:#F8FAFC;line-height:1.35;">${alertTitle}</h2>
              <p style="margin:0 0 10px 0;font-size:12px;color:#94A3B8;">📍 Affected Area: <strong style="color:#F8FAFC;">${alertArea || "Santa Barbara, Pangasinan"}</strong></p>
              <p style="margin:0;font-size:13px;color:#CBD5E1;line-height:1.6;">${alertDescription}</p>
            </td></tr>
          </table>

          <!-- Action Cards -->
          <table role="presentation" style="width:100%;margin-top:16px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;padding-right:6px;">
                <table role="presentation" style="width:100%;background-color:#0E1A2E;border:1px solid rgba(6,182,212,0.25);border-radius:10px;" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:14px;">
                    <p style="margin:0;font-size:9px;font-weight:900;color:#06B6D4;letter-spacing:0.8px;">EVACUATION HOTLINE</p>
                    <p style="margin:6px 0 0 0;font-size:15px;font-weight:900;color:#F8FAFC;">(075) 518-2024</p>
                    <p style="margin:3px 0 0 0;font-size:10px;color:#64748B;">Santa Barbara MDRRMO</p>
                  </td></tr>
                </table>
              </td>
              <td style="width:50%;padding-left:6px;">
                <table role="presentation" style="width:100%;background-color:#0E1A2E;border:1px solid rgba(244,63,94,0.25);border-radius:10px;" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:14px;">
                    <p style="margin:0;font-size:9px;font-weight:900;color:#F43F5E;letter-spacing:0.8px;">EMERGENCY</p>
                    <p style="margin:6px 0 0 0;font-size:15px;font-weight:900;color:#F8FAFC;">911</p>
                    <p style="margin:3px 0 0 0;font-size:10px;color:#64748B;">National Emergency Hotline</p>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 24px;background-color:#050B14;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-size:10px;color:#475569;text-align:center;">
            📡 Sent: ${timestamp} (Philippine Standard Time)<br/>
            This is an automated alert from <strong>AgapAlert</strong> Disaster Warning System.<br/>
            Reply STOP to unsubscribe from future email alerts.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const emailSubject =
        subject ||
        `🚨 AgapAlert [${sevUpper}]: ${alertTitle}`;

      const results: { email: string; status: string; error?: string }[] = [];

      for (const recipient of recipients) {
        try {
          if (transporter) {
            await transporter.sendMail({
              from: `"AgapAlert Disaster Warning" <${process.env.GMAIL_USER}>`,
              to: recipient,
              subject: emailSubject,
              html: htmlBody,
              text: `AgapAlert [${sevUpper}]: ${alertTitle}\n\nArea: ${alertArea}\n\n${alertDescription}\n\nEvacuation Hotline: (075) 518-2024\nEmergency: 911\n\nSent: ${timestamp}`,
            });
            results.push({ email: recipient, status: "sent" });
          } else {
            // Simulated mode when Gmail credentials are not configured
            results.push({ email: recipient, status: "simulated" });
          }
        } catch (err: any) {
          results.push({
            email: recipient,
            status: "failed",
            error: err?.message || "Unknown error",
          });
        }
      }

      const sent = results.filter((r) => r.status === "sent").length;
      const simulated = results.filter((r) => r.status === "simulated").length;
      const failed = results.filter((r) => r.status === "failed").length;

      return NextResponse.json({
        success: true,
        message: `Broadcast complete. Sent: ${sent}, Simulated: ${simulated}, Failed: ${failed}`,
        sent,
        simulated,
        failed,
        totalRecipients: recipients.length,
        results,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "subscribe", "unsubscribe", or "broadcast".' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Email notification service error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/email
 * Returns the current list of subscribers and service status.
 */
export async function GET() {
  const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  return NextResponse.json({
    success: true,
    service: hasGmail ? "gmail_live" : "simulated",
    gmailUser: process.env.GMAIL_USER
      ? process.env.GMAIL_USER.replace(/(.{3}).*(@.*)/, "$1***$2")
      : null,
    subscriberCount: emailSubscribers.length,
    subscribers: emailSubscribers,
    timestamp: new Date().toISOString(),
  });
}
