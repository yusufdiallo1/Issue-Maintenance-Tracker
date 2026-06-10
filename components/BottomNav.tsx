"use client";

import { Plus } from "lucide-react";
import type { NavItem } from "./nav-items";
import { useLang } from "@/app/providers";
import type { Key } from "@/lib/i18n/dictionary";

/**
 * Floating frosted bottom pill nav (mobile). The center "+" is the
 * new-report action. Labels hide below 500px (icons-only) via CSS.
 * Hidden entirely at >=860px (sidebar takes over).
 */
export function BottomNav({
  items,
  active,
  onNavigate,
  onAdd,
}: {
  items: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  onAdd: () => void;
}) {
  const { t } = useLang();
  // Insert the add button between the first item and the rest, like the prototype.
  const [first, ...rest] = items;

  return (
    <div className="nav glass">
      <NavTab item={first} active={active} onNavigate={onNavigate} t={t} />
      <button className="tab addtab" onClick={onAdd} aria-label={t("newReport")}>
        <span className="plusbtn">
          <Plus />
        </span>
      </button>
      {rest.map((item) => (
        <NavTab key={item.id} item={item} active={active} onNavigate={onNavigate} t={t} />
      ))}
    </div>
  );
}

function NavTab({
  item,
  active,
  onNavigate,
  t,
}: {
  item: NavItem;
  active: string;
  onNavigate: (id: string) => void;
  t: (key: Key) => string;
}) {
  const { Icon } = item;
  const on = active === item.id;
  return (
    <button
      className={on ? "tab on" : "tab"}
      onClick={() => onNavigate(item.id)}
      aria-current={on ? "page" : undefined}
    >
      <Icon />
      <span className="lbl">{t(item.labelKey)}</span>
    </button>
  );
}
