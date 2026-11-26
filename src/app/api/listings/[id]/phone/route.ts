import { NextResponse } from "next/server";
import { z } from "zod";
import { getListingContactInfo, recordPhoneReveal } from "@/db/queries/listing-actions";
import { consumeRateLimit, extractClientIp, hashIp } from "@/lib/rate-limit";
import { log } from "@/lib/log";

const idSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
  }

  const ipHash = hashIp(extractClientIp(request));
  const limit = await consumeRateLimit({
    key: `phone:${ipHash}`,
    limit: 30,
    windowSeconds: 3600,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Překročili jste limit zobrazení telefonních čísel. Zkuste to prosím později." },
      { status: 429 },
    );
  }

  try {
    const info = await getListingContactInfo(id);
    if (!info || !info.phonePublic) {
      return NextResponse.json({ error: "Telefonní číslo není k dispozici." }, { status: 404 });
    }

    await recordPhoneReveal(info.id);
    return NextResponse.json({ phone: info.phonePublic });
  } catch (error) {
    log.error("phone_reveal_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Telefon se nepodařilo načíst." }, { status: 500 });
  }
}
