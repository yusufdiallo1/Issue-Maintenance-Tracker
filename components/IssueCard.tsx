"use client";

import { Clock, User } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { useLang } from "@/app/providers";
import { propMeta } from "@/lib/i18n/dictionary";
import {
  ago,
  dueLabelKey,
  isOverdue,
  statusColor,
  tagDisplay,
  thumbColor,
  urgencyColor,
  urgencyLabelKey,
  localizedDescription,
  type Issue,
} from "@/lib/issues";

export function IssueCard({
  issue,
  takerName,
  thumbUrl,
  onOpen,
}: {
  issue: Issue;
  takerName: string | null;
  thumbUrl?: string | null;
  onOpen: (id: number) => void;
}) {
  const { t, lang } = useLang();
  const pm = propMeta(issue.property);
  const overdue = isOverdue(issue);

  return (
    <button className="issue glass" onClick={() => onOpen(issue.id)}>
      <div
        className="thumb"
        style={thumbUrl ? { background: "var(--card2)" } : { background: thumbColor(issue.type) }}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="" className="thumb-img" loading="lazy" decoding="async" />
        ) : (
          <CategoryIcon type={issue.type} />
        )}
      </div>
      <div className="body">
        <div className="l1">
          <span className="statusdot" style={{ background: statusColor(issue.status) }} />
          <span className="room mono">{issue.room || (pm ? pm[lang] : "")}</span>
          {issue.room && <span className="prop">{pm ? pm[lang] : ""}</span>}
          <span className="time mono">{ago(issue.created_at, lang)}</span>
        </div>
        <div className="desc">{localizedDescription(issue, lang).text}</div>
        <div className="l3">
          <span
            className="ubadge"
            style={{
              color: urgencyColor(issue.urgency),
              background: `color-mix(in srgb, ${urgencyColor(issue.urgency)} 16%, transparent)`,
            }}
          >
            {t(urgencyLabelKey(issue.urgency))}
          </span>
          {issue.deadline && (
            <span className={overdue ? "due over" : "due"}>
              <Clock />
              {overdue ? t("overdue") : t(dueLabelKey(issue.deadline))}
            </span>
          )}
          {takerName && (
            <span className="takenby">
              <User />
              {takerName}
            </span>
          )}
          {(issue.tags ?? []).map((tag) => {
            const label = tagDisplay(tag, t, { tagTranslations: issue.tag_translations, lang });
            return label ? (
              <span key={tag} className="tagmini">
                {label}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </button>
  );
}
