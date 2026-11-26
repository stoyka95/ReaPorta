import { NextResponse } from "next/server";
import { createInquiryRecord, getListingContactInfo } from "@/db/queries/listing-actions";
import { inquirySchema } from "@/features/inquiries/schema";
import { buildInquiryAgentEmail, buildInquiryConfirmationEmail, queueEmail } from "@/lib/email";
import { consumeRateLimit, extractClientIp, hashIp } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/auth/session";
import { log } from "@/lib/log";

export async function POST(request: Request) {
  const ipHash = hashIp(extractClientIp(request));

  // Rate limit: 5 zpráv / hodinu / IP dle AC-4.3
  const limit = await consumeRateLimit({
    key: `inquiry:${ipHash}`,
    limit: 5,
    windowSeconds: 3600,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "Odeslali jste příliš mnoho poptávek během poslední hodiny. Zkuste to prosím později.",
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný formát požadavku." }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return NextResponse.json(
      { error: "Zkontrolujte prosím vyplněné údaje.", fieldErrors },
      { status: 400 },
    );
  }

  try {
    const sessionUser = await getSessionUser(request.headers);
    const listing = await getListingContactInfo(parsed.data.listingId);
    if (!listing) {
      return NextResponse.json({ error: "Vybraná nabídka již neexistuje." }, { status: 404 });
    }

    const inquiry = await createInquiryRecord({
      listingId: listing.id,
      agentId: listing.agentId,
      userId: sessionUser?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
      ipHash,
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const listingUrl = `${appUrl}/nemovitost/${listing.slug}`;

    const agentEmail = buildInquiryAgentEmail({
      listingTitle: listing.title,
      listingUrl,
      senderName: parsed.data.name,
      senderEmail: parsed.data.email,
      senderPhone: parsed.data.phone || null,
      message: parsed.data.message,
    });

    const confirmationEmail = buildInquiryConfirmationEmail({
      listingTitle: listing.title,
      listingUrl,
      senderName: parsed.data.name,
    });

    await Promise.all([
      queueEmail({
        toEmail: listing.emailPublic ?? listing.agentEmail,
        ...agentEmail,
      }),
      queueEmail({
        toEmail: parsed.data.email,
        ...confirmationEmail,
      }),
    ]);

    return NextResponse.json({ id: inquiry.id, status: "ok" }, { status: 201 });
  } catch (error) {
    log.error("create_inquiry_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Poptávku se nepodařilo odeslat. Zkuste to prosím znovu." },
      { status: 500 },
    );
  }
}
