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

function renderEmailShell(params: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const logoSvg = `<svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px;"><path d="M6 35V18C6 10.268 12.268 4 20 4s14 6.268 14 14v17h-7.2V18a6.8 6.8 0 1 0-13.6 0v17H6Z" fill="#6D3FE0"/><circle cx="20" cy="24.5" r="4.1" fill="#6D3FE0"/></svg>`;
  const ctaHtml =
    params.ctaLabel && params.ctaUrl
      ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:#6D3FE0;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;font-size:15px;">${escapeHtml(params.ctaLabel)}</a></p>`
      : "";

  return `<!doctype html><html lang="cs"><body style="margin:0;padding:24px;font-family:Inter,Arial,sans-serif;background:#F4F4F6;color:#3E3E4B;">
    <div style="max-width:580px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #DDDDE3;">
      <div style="margin:0 0 20px;display:flex;align-items:center;">
        ${logoSvg}<span style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#17171E;letter-spacing:-0.02em;vertical-align:middle;">${escapeHtml(BRAND.name)}</span>
      </div>
      <h1 style="font-family:Georgia,serif;font-size:24px;line-height:1.25;color:#17171E;margin:0 0 16px;">${escapeHtml(params.heading)}</h1>
      <div style="font-size:15px;line-height:1.6;color:#3E3E4B;">${params.bodyHtml}</div>
      ${ctaHtml}
      <hr style="border:none;border-top:1px solid #EBEBEF;margin:28px 0 16px;" />
      <p style="font-size:12px;color:#6A6A7A;margin:0;">${escapeHtml(BRAND.name)} · ${escapeHtml(BRAND.tagline)} · ${escapeHtml(BRAND.email)}</p>
    </div>
  </body></html>`;
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

export function buildVerificationEmail(params: { name: string; verifyUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Ověřte svůj e-mail — ${BRAND.name}`;
  const bodyHtml = `
    <p style="margin:0 0 12px;">Dobrý den, ${escapeHtml(params.name)},</p>
    <p style="margin:0 0 12px;">děkujeme za registraci na portálu <strong>${escapeHtml(BRAND.name)}</strong>. Pro dokončení registrace a aktivaci účtu prosím potvrďte svou e-mailovou adresu kliknutím na tlačítko níže.</p>
    <p style="margin:12px 0 0;font-size:13px;color:#6A6A7A;">Pokud jste si účet nevytvářeli, tento e-mail můžete bezpečně ignorovat.</p>
  `;
  const html = renderEmailShell({
    heading: "Ověření e-mailové adresy",
    bodyHtml,
    ctaLabel: "Ověřit e-mail",
    ctaUrl: params.verifyUrl,
  });
  const text = `Dobrý den, ${params.name},\n\npro dokončení registrace na ${BRAND.name} potvrďte svou e-mailovou adresu:\n${params.verifyUrl}\n\nTým ${BRAND.name}`;
  return { subject, html, text };
}

export function buildResetPasswordEmail(params: { name: string; resetUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Obnova hesla — ${BRAND.name}`;
  const bodyHtml = `
    <p style="margin:0 0 12px;">Dobrý den, ${escapeHtml(params.name)},</p>
    <p style="margin:0 0 12px;">obdrželi jsme žádost o nastavení nového hesla k vašemu účtu na portálu <strong>${escapeHtml(BRAND.name)}</strong>. Odkaz je jednorázový a má omezenou platnost.</p>
    <p style="margin:12px 0 0;font-size:13px;color:#6A6A7A;">Pokud jste o změnu hesla nežádali, můžete tuto zprávu ignorovat — vaše stávající heslo zůstává v platnosti.</p>
  `;
  const html = renderEmailShell({
    heading: "Nastavení nového hesla",
    bodyHtml,
    ctaLabel: "Nastavit nové heslo",
    ctaUrl: params.resetUrl,
  });
  const text = `Dobrý den, ${params.name},\n\nnové heslo ke svému účtu na ${BRAND.name} nastavíte zde:\n${params.resetUrl}\n\nTým ${BRAND.name}`;
  return { subject, html, text };
}

export function buildSavedSearchAlertEmail(params: {
  userName: string;
  searchName: string;
  searchUrl: string;
  listings: Array<{ title: string; priceText: string; location: string; url: string }>;
}): { subject: string; html: string; text: string } {
  const count = params.listings.length;
  const countWord = count === 1 ? "nová nabídka" : count <= 4 ? "nové nabídky" : "nových nabídek";
  const subject = `${count} ${countWord}: ${params.searchName}`.slice(0, 80);

  const itemsHtml = params.listings
    .map(
      (item) => `
      <div style="border:1px solid #EBEBEF;border-radius:12px;padding:14px 16px;margin:0 0 10px;background:#FAFAFB;">
        <div style="font-weight:700;font-size:16px;color:#6D3FE0;margin:0 0 4px;">${escapeHtml(item.priceText)}</div>
        <a href="${escapeHtml(item.url)}" style="font-weight:600;color:#17171E;text-decoration:none;">${escapeHtml(item.title)}</a>
        <div style="font-size:13px;color:#6A6A7A;margin-top:4px;">${escapeHtml(item.location)}</div>
      </div>`,
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 12px;">Dobrý den, ${escapeHtml(params.userName)},</p>
    <p style="margin:0 0 16px;">pro vaše uložené hledání <strong>${escapeHtml(params.searchName)}</strong> jsme našli nové nabídky:</p>
    ${itemsHtml}
  `;

  const html = renderEmailShell({
    heading: `Nové nabídky pro „${params.searchName}“`,
    bodyHtml,
    ctaLabel: "Zobrazit všechny výsledky",
    ctaUrl: params.searchUrl,
  });

  const textItems = params.listings
    .map((item) => `- ${item.title} (${item.priceText}, ${item.location}): ${item.url}`)
    .join("\n");
  const text = `Dobrý den, ${params.userName},\n\nnové nabídky pro uložené hledání "${params.searchName}":\n\n${textItems}\n\nVšechny výsledky: ${params.searchUrl}`;

  return { subject, html, text };
}

export function buildModerationResultEmail(params: {
  agentName: string;
  listingTitle: string;
  listingUrl: string;
  approved: boolean;
  reason?: string | null;
}): { subject: string; html: string; text: string } {
  const subject = params.approved
    ? `Inzerát schválen: ${params.listingTitle}`.slice(0, 80)
    : `Inzerát vrácen k úpravě: ${params.listingTitle}`.slice(0, 80);

  const bodyHtml = params.approved
    ? `
      <p style="margin:0 0 12px;">Dobrý den, ${escapeHtml(params.agentName)},</p>
      <p style="margin:0 0 12px;">váš inzerát <strong>${escapeHtml(params.listingTitle)}</strong> byl schválen a je nyní zveřejněn na portálu ${escapeHtml(BRAND.name)}.</p>
    `
    : `
      <p style="margin:0 0 12px;">Dobrý den, ${escapeHtml(params.agentName)},</p>
      <p style="margin:0 0 12px;">váš inzerát <strong>${escapeHtml(params.listingTitle)}</strong> nebyl v této podobě schválen ke zveřejnění.</p>
      ${params.reason ? `<div style="background:#FDE8EB;border:1px solid #C42B43;border-radius:12px;padding:12px 14px;color:#17171E;margin:0 0 12px;"><strong>Důvod:</strong> ${escapeHtml(params.reason)}</div>` : ""}
      <p style="margin:0;">Inzerát můžete upravit v dashboardu a odeslat znovu ke schválení.</p>
    `;

  const html = renderEmailShell({
    heading: params.approved ? "Inzerát byl zveřejněn" : "Inzerát vyžaduje úpravu",
    bodyHtml,
    ctaLabel: params.approved ? "Zobrazit inzerát" : "Upravit v dashboardu",
    ctaUrl: params.listingUrl,
  });

  const text = params.approved
    ? `Dobrý den, ${params.agentName},\n\nváš inzerát "${params.listingTitle}" byl schválen a zveřejněn: ${params.listingUrl}`
    : `Dobrý den, ${params.agentName},\n\nváš inzerát "${params.listingTitle}" nebyl schválen.${params.reason ? ` Důvod: ${params.reason}` : ""}\n\nUpravit jej můžete zde: ${params.listingUrl}`;

  return { subject, html, text };
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

  const bodyHtml = `
    <p style="margin:0 0 12px;">Zájemce poslal zprávu k nabídce <strong>${safeTitle}</strong>.</p>
    <p style="margin:0 0 6px;"><strong>Jméno:</strong> ${safeSender}</p>
    <p style="margin:0 0 6px;"><strong>E-mail:</strong> ${safeEmail}</p>
    <p style="margin:0 0 16px;"><strong>Telefon:</strong> ${safePhone}</p>
    <div style="background:#FAFAFB;border:1px solid #EBEBEF;border-radius:12px;padding:14px;">${safeMsg}</div>
  `;

  const html = renderEmailShell({
    heading: "Nová poptávka k vašemu inzerátu",
    bodyHtml,
    ctaLabel: "Zobrazit nabídku",
    ctaUrl: params.listingUrl,
  });

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

  const bodyHtml = `
    <p style="margin:0 0 12px;">Dobrý den, ${safeName},</p>
    <p style="margin:0;">vaši poptávku k nemovitosti <strong>${safeTitle}</strong> jsme předali makléři. Ozve se vám co nejdříve.</p>
  `;

  const html = renderEmailShell({
    heading: "Zpráva je na cestě",
    bodyHtml,
    ctaLabel: "Otevřít nabídku",
    ctaUrl: params.listingUrl,
  });

  const text = `Dobrý den, ${params.senderName},\n\nvaši poptávku k nemovitosti "${params.listingTitle}" jsme předali makléři. Ozve se vám co nejdříve.\n\nOdkaz: ${params.listingUrl}\n\nTým ${BRAND.name}`;

  return { subject, html, text };
}
