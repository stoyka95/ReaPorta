import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertOwnsListingForUser, AuthError, requireAgent } from "@/lib/auth/session";
import { bulkActionSchema } from "@/features/dashboard/schema";
import { deleteAgentListingHard, transitionAgentListingStatus } from "@/db/queries/dashboard";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAgent(req.headers);
    const body = await req.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatná hromadná akce." },
        { status: 400 },
      );
    }

    // Ověřit vlastnictví pro KAŽDÝ vybraný inzerát dříve než se cokoliv změní (IDOR obrana)
    for (const id of parsed.data.ids) {
      await assertOwnsListingForUser(user, id);
    }

    for (const id of parsed.data.ids) {
      if (parsed.data.action === "delete") {
        await deleteAgentListingHard(id);
      } else {
        await transitionAgentListingStatus(id, parsed.data.action);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inzeraty");
    revalidatePath("/");
    return NextResponse.json({ ok: true, count: parsed.data.ids.length });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Hromadnou akci se nepodařilo provést." }, { status: 500 });
  }
}
