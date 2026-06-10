import { createElement } from "react";
import { typeIcon } from "@/lib/issues";

/** Renders the lucide icon for an issue category. Avoids assigning a component
 *  to a local variable during render (which the React Compiler lint forbids). */
export function CategoryIcon({ type }: { type: string }) {
  return createElement(typeIcon(type));
}
