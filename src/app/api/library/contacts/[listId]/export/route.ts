import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAuthenticatedSession, hasRole } from "@/lib/auth/access";
import { contactsToCsv, getContactList } from "@/services/library";

function safeFileName(name: string) {
  return name.replace(/[^a-z0-9-_ ]/gi, "").trim().replaceAll(" ", "-").slice(0, 60) || "contacts";
}

/** Exports a global contact list as CSV or XLSX for reuse outside the app. */
export async function GET(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!hasAuthenticatedSession(session)) return NextResponse.json({ error: "Your session has expired. Sign in again to export contacts." }, { status: 401 });
  if (!hasRole(session, "ADMIN", "EVENT_MANAGER")) return NextResponse.json({ error: "Only an Admin or Event Manager can export contacts." }, { status: 403 });

  const { listId } = await params;
  const list = await getContactList(listId);
  if (!list) return NextResponse.json({ error: "Contact list not found." }, { status: 404 });

  const format = new URL(request.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const file = safeFileName(list.name);

  if (format === "xlsx") {
    const { utils, write } = await import("xlsx");
    const sheet = utils.json_to_sheet(list.contacts.map((contact) => ({ Name: contact.name, Email: contact.email, Company: contact.company ?? "" })));
    const book = utils.book_new();
    utils.book_append_sheet(book, sheet, "Contacts");
    const buffer = write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${file}.xlsx"`,
        "cache-control": "no-store",
      },
    });
  }

  return new NextResponse(`\uFEFF${contactsToCsv(list.contacts)}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${file}.csv"`,
      "cache-control": "no-store",
    },
  });
}
