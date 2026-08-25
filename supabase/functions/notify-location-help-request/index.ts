import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type LocationHelpRecord = {
  id: string;
  created_at?: string;
  user_id: string;
  user_email?: string | null;
  user_display_name?: string | null;
  status?: string;
  report_text: string;
  matched_facility_id?: string | null;
  matched_facility_name?: string | null;
  device_lat?: number | null;
  device_lng?: number | null;
  device_accuracy_meters?: number | null;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: LocationHelpRecord;
  requestId?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function buildEmailContent(record: LocationHelpRecord, inboxUrl: string) {
  const employee =
    record.user_display_name || record.user_email || "Unknown employee";
  const facility = record.matched_facility_name || "No facility matched";
  const created = record.created_at
    ? new Date(record.created_at).toLocaleString("en-US", {
        timeZone: "America/Edmonton",
      })
    : "Unknown time";

  const subject = `[PEL] Location help request — ${employee}`;

  const text = [
    "New location troubleshoot request",
    "",
    `Employee: ${employee}`,
    record.user_email ? `Email: ${record.user_email}` : null,
    `Facility: ${facility}`,
    `Submitted: ${created}`,
    `Request ID: ${record.id}`,
    "",
    "Diagnostic report:",
    record.report_text,
    "",
    `Open admin inbox: ${inboxUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const coords =
    record.device_lat != null && record.device_lng != null
      ? `${record.device_lat.toFixed(6)}, ${record.device_lng.toFixed(6)}${
          record.device_accuracy_meters != null
            ? ` (±${Math.round(record.device_accuracy_meters)} m)`
            : ""
        }`
      : "Not available";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2 style="margin: 0 0 12px;">New location troubleshoot request</h2>
      <table style="border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Employee</strong></td><td>${escapeHtml(employee)}</td></tr>
        ${
          record.user_email
            ? `<tr><td style="padding: 4px 12px 4px 0;"><strong>Email</strong></td><td>${escapeHtml(record.user_email)}</td></tr>`
            : ""
        }
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Facility</strong></td><td>${escapeHtml(facility)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Submitted</strong></td><td>${escapeHtml(created)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Coordinates</strong></td><td>${escapeHtml(coords)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Request ID</strong></td><td>${escapeHtml(record.id)}</td></tr>
      </table>
      <h3 style="margin: 16px 0 8px;">Diagnostic report</h3>
      <pre style="background: #f4f6f8; padding: 12px; border-radius: 6px; white-space: pre-wrap; font-size: 13px;">${escapeHtml(record.report_text)}</pre>
      <p style="margin-top: 20px;">
        <a href="${escapeHtml(inboxUrl)}" style="display: inline-block; background: #1976d2; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">
          Open Location Requests
        </a>
      </p>
    </div>
  `;

  return { subject, text, html };
}

async function sendResendEmail(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : `Resend API error (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase environment is not configured");
    }

    const adminEmails = parseAdminEmails(Deno.env.get("ADMIN_NOTIFY_EMAIL"));
    if (adminEmails.length === 0) {
      throw new Error("ADMIN_NOTIFY_EMAIL is not configured");
    }

    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "PEL Reports <onboarding@resend.dev>";
    const appSiteUrl =
      Deno.env.get("APP_SITE_URL") || "https://pelreports.ca";
    const inboxUrl = `${appSiteUrl.replace(/\/$/, "")}/app/location-requests`;

    const body = (await req.json()) as WebhookPayload;
    let record = body.record;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (!record && body.requestId) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !supabaseAnonKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userError,
      } = await userClient.auth.getUser();

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: row, error: fetchError } = await adminClient
        .from("location_help_requests")
        .select("*")
        .eq("id", body.requestId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!row) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (row.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      record = row as LocationHelpRecord;
    }

    if (!record?.id || !record.report_text) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = buildEmailContent(record, inboxUrl);
    const result = await sendResendEmail({
      from: fromEmail,
      to: adminEmails,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    return new Response(
      JSON.stringify({ ok: true, id: result?.id ?? null }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("notify-location-help-request failed:", error);
    const message =
      error instanceof Error ? error.message : "Notification failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
