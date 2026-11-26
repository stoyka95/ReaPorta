import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwnsListingForUser, AuthError, requireAgent } from "@/lib/auth/session";
import { draftPatchSchema, submitListingValidationSchema } from "@/features/dashboard/schema";
import {
  deleteAgentListingHard,
  getAgentListingForEdit,
  updateAgentListing,
} from "@/db/queries/dashboard";

const uuidSchema = z.string().uuid();

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgent(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
    }
    await assertOwnsListingForUser(user, id);
    const listing = await getAgentListingForEdit(id);
    if (!listing) {
      return NextResponse.json({ error: "Inzerát nebyl nalezen." }, { status: 404 });
    }
    return NextResponse.json({ listing });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Inzerát se nepodařilo načíst." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgent(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
    }
    await assertOwnsListingForUser(user, id);

    const body = await req.json();
    const parsed = draftPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Zkontrolujte prosím vyplněná pole." },
        { status: 400 },
      );
    }

    if (parsed.data.submitForReview) {
      const current = await getAgentListingForEdit(id);
      if (!current) {
        return NextResponse.json({ error: "Inzerát nebyl nalezen." }, { status: 404 });
      }
      const mergedCheck = submitListingValidationSchema.safeParse({
        offerType: parsed.data.offerType ?? current.offerType,
        category: parsed.data.category ?? current.category,
        city: parsed.data.city ?? current.city,
        title: parsed.data.title ?? current.title,
        description: parsed.data.description ?? current.description,
        price: parsed.data.price !== undefined ? parsed.data.price : current.price,
        priceOnRequest: parsed.data.priceOnRequest ?? current.priceOnRequest,
      });
      if (!mergedCheck.success) {
        return NextResponse.json(
          { error: mergedCheck.error.issues[0]?.message ?? "Doplňte prosím povinné údaje." },
          { status: 400 },
        );
      }
    }

    const updated = await updateAgentListing(id, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inzeraty");
    revalidatePath(`/nemovitost/${updated.slug}`);
    revalidatePath("/");
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Změny se nepodařilo uložit." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgent(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
    }
    await assertOwnsListingForUser(user, id);
    await deleteAgentListingHard(id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inzeraty");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Inzerát se nepodařilo smazat." }, { status: 500 });
  }
}
