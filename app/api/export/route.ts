// PDF export of all issues (admin only). Uses @react-pdf/renderer — pure JS,
// no headless browser. Returns a downloadable PDF.
import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getCurrentProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { propMeta } from "@/lib/i18n/dictionary";
import { fmtDateTime, type Issue } from "@/lib/issues";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 2, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 9, color: "#666", marginBottom: 14 },
  row: { flexDirection: "row", borderBottom: "1 solid #ddd", paddingVertical: 5 },
  head: { flexDirection: "row", borderBottom: "1.5 solid #333", paddingVertical: 5 },
  c1: { width: "10%" },
  c2: { width: "22%" },
  c3: { width: "14%" },
  c4: { width: "12%" },
  c5: { width: "12%" },
  c6: { width: "30%" },
  b: { fontFamily: "Helvetica-Bold" },
});

export async function GET() {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false });
  const issues = (data ?? []) as Issue[];

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Aurion Maintenance — Issues Export"),
      React.createElement(
        Text,
        { style: styles.sub },
        `${issues.length} issues · generated ${fmtDateTime(new Date().toISOString(), "en")}`,
      ),
      React.createElement(
        View,
        { style: styles.head },
        React.createElement(Text, { style: [styles.c1, styles.b] }, "ID"),
        React.createElement(Text, { style: [styles.c2, styles.b] }, "Property / Room"),
        React.createElement(Text, { style: [styles.c3, styles.b] }, "Type"),
        React.createElement(Text, { style: [styles.c4, styles.b] }, "Urgency"),
        React.createElement(Text, { style: [styles.c5, styles.b] }, "Status"),
        React.createElement(Text, { style: [styles.c6, styles.b] }, "Description"),
      ),
      ...issues.map((i) =>
        React.createElement(
          View,
          { style: styles.row, key: i.id },
          React.createElement(Text, { style: styles.c1 }, `#${i.id}`),
          React.createElement(
            Text,
            { style: styles.c2 },
            `${propMeta(i.property)?.en ?? i.property} ${i.room}`,
          ),
          React.createElement(Text, { style: styles.c3 }, i.type),
          React.createElement(Text, { style: styles.c4 }, i.urgency),
          React.createElement(Text, { style: styles.c5 }, i.status),
          React.createElement(Text, { style: styles.c6 }, i.description || "—"),
        ),
      ),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="aurion-issues.pdf"',
    },
  });
}
