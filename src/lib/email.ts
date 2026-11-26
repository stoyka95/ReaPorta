import { getDb } from "@/db/client";
import { emailOutbox } from "@/db/schema";
import { BRAND } from "@/config/brand";

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface SendEmailInput {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
}

export async function queueEmail(input: SendEmailInput): Promise<{ id: string }> {
  const db = getDb();
  // V dev sandboxu se e-maily ukládají výhradně do tabulky email_outbox (bez Mailpitu a bez reálného SMTP).
  const [row] = await db
    .insert(emailOutbox)
    .values({
      toEmail: input.toEmail,
      subject: input.subject.slice(0, 120),
      html: input.html,
      text: input.text,
      status: "queued",
      attempts: 0,
    })
    .returning({ id: emailOutbox.id });

  return { id: row!.id };
}

export function buildInquiryAgentEmail(params: {
  listingTitle: string;
  listingUrl: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string | null;
  message: string;
}): { subject: string; html: string; text: string } {
  const subject = `Nová poptávka: ${params.listingTitle}`.slice(0, 60);
  const safeTitle = escapeHtml(params.listingTitle);
  const safeSender = escapeHtml(params.senderName);
  const safeEmail = escapeHtml(params.senderEmail);
  const safePhone = params.senderPhone ? escapeHtml(params.senderPhone) : "Neuvedeno";
  const safeMsg = escapeHtml(params.message).replaceAll("\n", "<br/>");

  const html = `<!doctype html><html lang="cs"><body style="font-family:Inter,Arial,sans-serif;background:#F4F4F6;color:#17171E;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:28px;border:1px solid #DDDDE3;">
      <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5B2FC2;font-weight:600;margin:0 0 8px;">${BRAND.name}</p>
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px;">Nová poptávka k vašemu inzerátu</h1>
      <p style="margin:0 0 12px;">Zájemce poslal zprávu k nabídce <strong>${safeTitle}</strong>.</p>
      <p style="margin:0 0 6px;"><strong>Jméno:</strong> ${safeSender}</p>
      <p style="margin:0 0 6px;"><strong>E-mail:</strong> ${safeEmail}</p>
      <p style="margin:0 0 16px;"><strong>Telefon:</strong> ${safePhone}</p>
      <div style="background:#FAFAFB;border:1px solid #EBEBEF;border-radius:12px;padding:14px;margin:0 0 20px;">${safeMsg}</div>
      <a href="${escapeHtml(params.listingUrl)}" style="display:inline-block;background:#6D3FE0;color:#FFFFFF;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">Zobrazit nabídku</a>
    </div>
  </body></html>`;

  const text = `${BRAND.name} — Nová poptávka k nabídce: ${params.listingTitle}\n\nJméno: ${params.senderName}\nE-mail: ${params.senderEmail}\nTelefon: ${params.senderPhone || "Neuvedeno"}\n\nZpráva:\n${params.message}\n\nOdkaz: ${params.listingUrl}`;

  return { subject, html, text };
}

export function buildInquiryConfirmationEmail(params: {
  listingTitle: string;
  listingUrl: string;
  senderName: string;
}): { subject: string; html: string; text: string } {
  const subject = `Potvrzení poptávky — ${BRAND.name}`.slice(0, 60);
  const safeTitle = escapeHtml(params.listingTitle);
  const safeName = escapeHtml(params.senderName);

  const html = `<!doctype html><html lang="cs"><body style="font-family:Inter,Arial,sans-serif;background:#F4F4F6;color:#17171E;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:28px;border:1px solid #DDDDE3;">
      <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5B2FC2;font-weight:600;margin:0 0 8px;">${BRAND.name}</p>
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px;">Zpráva je na cestě</h1>
      <p style="margin:0 0 12px;">Dobrý den, ${safeName},</p>
      <p style="margin:0 0 18px;">vaši poptávku k nemovitosti <strong>${safeTitle}</strong> jsme předali makléři. Ozve se vám co nejdříve.</p>
      <a href="${escapeHtml(params.listingUrl)}" style="display:inline-block;background:#6D3FE0;color:#FFFFFF;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">Otevřít nabídku</a>
    </div>
  </body></html>`;

  const text = `Dobrý den, ${params.senderName},\n\nvaši poptávku k nemovitosti "${params.listingTitle}" jsme předali makléři. Ozve se vám co nejdříve.\n\nOdkaz: ${params.listingUrl}\n\nTým ${BRAND.name}`;

  return { subject, html, text };
}
