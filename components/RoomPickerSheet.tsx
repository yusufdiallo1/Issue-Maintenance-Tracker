"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { useLang } from "@/app/providers";
import { PROPS } from "@/lib/i18n/dictionary";

/**
 * Bottom-sheet room picker: property tabs across the top, room grid below.
 * Whole-property units (al_shaqqa / al_villa, rooms: []) are selected directly
 * via their tab — no room grid, a single "Select" confirms the property.
 */
export function RoomPickerSheet({
  open,
  enter,
  initialProperty,
  selectedRoom,
  roomsByProperty,
  onPick,
  onClose,
}: {
  open: boolean;
  enter: boolean;
  initialProperty: string | null;
  selectedRoom: string | null;
  /** Rooms grouped by property code (from the DB). Falls back to PROPS. */
  roomsByProperty?: Record<string, string[]>;
  onPick: (property: string, room: string) => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const [sel, setSel] = useState(initialProperty ?? PROPS[0].code);
  const prop = PROPS.find((p) => p.code === sel) ?? PROPS[0];
  // Prefer DB rooms; fall back to the bundled constant if not provided.
  const rooms = roomsByProperty?.[sel] ?? prop.rooms;

  if (!open) {
    return (
      <Sheet open={false} enter={false} onClose={onClose}>
        {null}
      </Sheet>
    );
  }

  return (
    <Sheet open={open} enter={enter} onClose={onClose} title={t("pickRoom")}>
      <div className="room-tabs">
        {PROPS.map((p) => (
          <button
            key={p.code}
            className={p.code === sel ? "rt on" : "rt"}
            onClick={() => setSel(p.code)}
          >
            {p[lang]}
          </button>
        ))}
      </div>

      {rooms.length > 0 ? (
        <div className="roomgrid">
          {rooms.map((r) => (
            <button
              key={r}
              className={selectedRoom === r && initialProperty === sel ? "rm on" : "rm"}
              onClick={() => onPick(sel, r)}
            >
              {r}
            </button>
          ))}
        </div>
      ) : (
        // Whole-property unit: no rooms — confirm the property directly.
        <button className="btn gold" onClick={() => onPick(sel, "")}>
          {prop[lang]}
        </button>
      )}
    </Sheet>
  );
}
