"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, X, Check, Sparkles, ChevronRight } from "lucide-react";
import { RoomPickerSheet } from "./RoomPickerSheet";
import { InlineVoice } from "./InlineVoice";
import { CategoryIcon } from "./CategoryIcon";
import { useLang } from "@/app/providers";
import { propMeta, TYPES, URG, TAGS } from "@/lib/i18n/dictionary";
import { urgencyColor } from "@/lib/issues";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./Toast";
import { uuid, enqueue, compressImage } from "@/lib/outbox";
import { useOnline } from "@/lib/useOnline";
import { createReport } from "@/app/actions/issues";

type Urgency = "urgent" | "soon" | "wait";
type TagOption = { id: string; label: string };
type Photo = {
  id: string;
  path: string | null;
  url: string | null;
  uploading: boolean;
  // Kept for the OFFLINE path: the raw file to compress + upload on sync.
  file?: File;
};

const MAX_PHOTOS = 10;
const MIN_PHOTOS = 2;
type AiFlags = Partial<Record<"desc" | "urg" | "other", boolean>>;

function AiBadge({ label }: { label: string }) {
  return (
    <span className="aibadge">
      <Sparkles />
      {label}
    </span>
  );
}

export function AddReportScreen({
  onViewReports,
  roomsByProperty,
}: {
  onViewReports: () => void;
  roomsByProperty?: Record<string, string[]>;
}) {
  const { t, lang } = useLang();
  const { show } = useToast();
  const online = useOnline();
  const [supabase] = useState(() => createClient());

  const [desc, setDesc] = useState("");
  const [roomProp, setRoomProp] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [urg, setUrg] = useState<Urgency | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<TagOption[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ai, setAi] = useState<AiFlags>({});

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEnter, setSheetEnter] = useState(false);
  const [sent, setSent] = useState<{ ticket: number; prop: string; room: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  // Voice: the raw transcript caption ("You said: …") + a mic-denied note.
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const fixedTags: TagOption[] = TAGS.map((g) => ({ id: g.id, label: t(g.k) }));
  const allTags: TagOption[] = [...fixedTags, ...customTags];

  // A photo "counts" once uploaded (online) or held as a file (offline).
  const readyPhotos = photos.filter((p) => p.path || p.file);
  const uploadedCount = readyPhotos.length;
  const canSend =
    !!roomProp &&
    !!type &&
    !!urg &&
    (type !== "other" || otherText.trim().length > 0) &&
    uploadedCount >= MIN_PHOTOS;
  const aiLabel = t("aiFilled");

  // ---------------- photos (instant, multi, up to 10) ----------------
  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      show(t("loadError"), "error");
      return;
    }

    const slots = MAX_PHOTOS - photos.length;
    for (const file of files.slice(0, slots)) {
      const uid = uuid();
      const localUrl = URL.createObjectURL(file);
      // Offline: keep the file locally; it's compressed + uploaded on sync.
      if (!online) {
        setPhotos((prev) => [
          ...prev,
          { id: uid, path: null, url: localUrl, uploading: false, file },
        ]);
        continue;
      }
      setPhotos((prev) => [...prev, { id: uid, path: null, url: localUrl, uploading: true }]);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      // Unique path (UUID) so two same-size shots in the same ms never collide.
      const path = `${user.id}/${uid}.${ext}`;
      const { error } = await supabase.storage
        .from("issue-photos")
        .upload(path, file, { contentType: file.type || "image/jpeg" });
      if (error) {
        setPhotos((prev) => prev.filter((p) => p.id !== uid));
        show(t("loadError"), "error");
        continue;
      }
      const { data: signed } = await supabase.storage
        .from("issue-photos")
        .createSignedUrl(path, 3600);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === uid ? { ...p, path, url: signed?.signedUrl ?? localUrl, uploading: false } : p,
        ),
      );
    }
  }

  async function removePhoto(id: string) {
    const photo = photos.find((p) => p.id === id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (photo?.path) await supabase.storage.from("issue-photos").remove([photo.path]);
  }

  // ---------------- tags ----------------
  function toggleTag(id: string) {
    setTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function commitCustomTag() {
    const label = newTag.trim();
    if (label) {
      const id = `custom_${Date.now()}`;
      setCustomTags((prev) => [...prev, { id, label }]);
      setTags((prev) => [...prev, id]);
    }
    setNewTag("");
    setAddingTag(false);
  }

  // ---------------- submit ----------------
  function submit() {
    if (!canSend || !roomProp || !type || !urg) return;
    const baseDesc = (type === "other" ? otherText : desc).trim();
    const labelById = new Map(customTags.map((c) => [c.id, c.label]));
    const tagValues = tags.map((id) => (labelById.has(id) ? `custom:${labelById.get(id)}` : id));
    const payload = {
      property: roomProp,
      room: room ?? "",
      type,
      urgency: urg,
      description: baseDesc,
      descriptionAr: "",
      tags: tagValues,
      lang,
    };

    // OFFLINE: compress the held files into the outbox; the create op uploads
    // them + creates the issue on reconnect. Show the success screen now.
    if (!online) {
      startTransition(async () => {
        const blobs = await Promise.all(
          photos.filter((p) => p.file).map((p) => compressImage(p.file as File)),
        );
        await enqueue({ id: uuid(), kind: "create", payload, photos: blobs });
        show(t("queuedOffline"), "info");
        setSent({ ticket: 0, prop: roomProp, room: room ?? "" });
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await createReport({
          ...payload,
          photoPaths: photos.filter((p) => p.path).map((p) => p.path as string),
        });
        if (res.ok) {
          show(t("saved"), "success");
          setSent({ ticket: res.id, prop: roomProp, room: room ?? "" });
        } else {
          show(t("loadError"), "error");
        }
      } catch {
        show(t("loadError"), "error");
      }
    });
  }

  // ---------------- success ----------------
  if (sent) {
    const pm = propMeta(sent.prop);
    return (
      <div className="screen success">
        <div className="successring">
          <Check />
        </div>
        <h1>{t("done")}</h1>
        <p>{t("doneSub")}</p>
        <div className="ticket">
          {t("ticket")} #{String(sent.ticket).padStart(4, "0")} · {pm ? pm[lang] : sent.prop}{" "}
          {sent.room}
        </div>
        <button className="btn gold" style={{ maxWidth: 240 }} onClick={onViewReports}>
          {t("goToMine")}
        </button>
      </div>
    );
  }

  const openRoomSheet = () => {
    setSheetEnter(true);
    setSheetOpen(true);
  };

  return (
    <div className="screen">
      <h1 className="title">{t("reportTitle")}</h1>
      <p className="sub">{t("reportSub")}</p>

      {/* 1) property / room — chosen manually, never auto */}
      <div className="field">
        <div className="section-h" style={{ margin: "0 4px 9px" }}>
          {t("roomLabel")}
        </div>
        <div className="inset-group">
          <button className="formrow" onClick={openRoomSheet}>
            <span className="rl">{t("propertyWord")}</span>
            <span className={roomProp ? "rv" : "rv placeholder"}>
              {roomProp ? (propMeta(roomProp)?.[lang] ?? "") : t("chooseWord")}
            </span>
            <span className="rchev">
              <ChevronRight />
            </span>
          </button>
          <button className="formrow" onClick={openRoomSheet}>
            <span className="rl">{t("roomWord")}</span>
            <span className={room ? "rv" : "rv placeholder"}>{room ? room : t("chooseWord")}</span>
            <span className="rchev">
              <ChevronRight />
            </span>
          </button>
        </div>
      </div>

      {/* 2) problem — cinematic voice (waveform) OR type; AI only polishes wording */}
      <div className="field">
        <label>
          {t("descLabel")} {ai.desc && <AiBadge label={aiLabel} />}
        </label>

        {/* Small inline mic: tap to record; Groq Whisper transcribes + enhances. */}
        <div className="ta-wrap">
          <textarea
            ref={descRef}
            className={ai.desc ? "ta justfilled" : "ta"}
            placeholder={t("descPh")}
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value);
              setAi((a) => ({ ...a, desc: false }));
            }}
          />
          <InlineVoice
            lang={lang}
            onFinal={(text) => {
              setVoiceNote(null);
              if (text) {
                setDesc(text);
                setAi((a) => ({ ...a, desc: true }));
                // Nicety: focus + cursor to end so the user can edit (never required).
                requestAnimationFrame(() => {
                  const el = descRef.current;
                  if (el) {
                    el.focus();
                    el.setSelectionRange(text.length, text.length);
                  }
                });
              }
            }}
            onError={(kind) =>
              setVoiceNote(kind === "denied" ? t("voiceDenied") : t("voiceFailed"))
            }
          />
        </div>
        {voiceNote && <p className="voice-note">{voiceNote}</p>}
      </div>

      {/* 3) type */}
      <div className="field">
        <label>{t("typeLabel")}</label>
        <div className="optgrid">
          {TYPES.map((ty) => (
            <button
              key={ty.id}
              className={type === ty.id ? "opt sel" : "opt"}
              onClick={() => setType(ty.id)}
            >
              <CategoryIcon type={ty.id} />
              <span className="t">{t(ty.k)}</span>
            </button>
          ))}
        </div>
        {type === "other" && (
          <div style={{ marginTop: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                margin: "0 4px 7px",
                color: "var(--text)",
              }}
            >
              {t("otherLabel")} {ai.other && <AiBadge label={aiLabel} />}
            </label>
            <input
              className={ai.other ? "inset-input justfilled" : "inset-input"}
              value={otherText}
              placeholder={t("otherPh")}
              onChange={(e) => {
                setOtherText(e.target.value);
                setAi((a) => ({ ...a, other: false }));
              }}
            />
          </div>
        )}
      </div>

      {/* 4) images — required, minimum 2 */}
      <div className="field">
        <label>
          {t("addPhoto")} ({uploadedCount}/{MAX_PHOTOS})
          {uploadedCount < MIN_PHOTOS && (
            <span style={{ color: "var(--u-urgent)", marginInlineStart: 8, fontSize: 12 }}>
              {t("min2photos")}
            </span>
          )}
        </label>
        <div className="photo-gallery">
          {photos.map((p) => (
            <div key={p.id} className={p.uploading ? "photo-cell uploading" : "photo-cell"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.url && <img src={p.url} alt="" />}
              {p.uploading && <span className="spin" />}
              {!p.uploading && (
                <button className="x" onClick={() => removePhoto(p.id)} aria-label="Remove">
                  <X />
                </button>
              )}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button className="photo-add" onClick={() => fileRef.current?.click()}>
              <Camera />
              <span>{t("addPhoto")}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickPhotos} />
      </div>

      {/* 5) urgency (AI may pre-fill) */}
      <div className="field">
        <label>
          {t("urgencyLabel")} {ai.urg && <AiBadge label={aiLabel} />}
        </label>
        <div className={ai.urg ? "urg justfilled" : "urg"}>
          {URG.map((u) => (
            <button
              key={u.id}
              className={urg === u.id ? "ub sel" : "ub"}
              data-u={u.id}
              onClick={() => {
                setUrg(u.id as Urgency);
                setAi((a) => ({ ...a, urg: false }));
              }}
            >
              <span className="dot" style={{ background: urgencyColor(u.id as Urgency) }} />
              {t(u.k)}
            </button>
          ))}
        </div>
      </div>

      {/* tags */}
      <div className="field">
        <label>{t("tagsLabel")}</label>
        <div className="chips">
          {allTags.map((g) => (
            <button
              key={g.id}
              className={tags.includes(g.id) ? "chip sel" : "chip"}
              onClick={() => toggleTag(g.id)}
            >
              {g.label}
            </button>
          ))}
          {addingTag ? (
            <input
              className="chip chip-input"
              autoFocus
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCustomTag();
                if (e.key === "Escape") {
                  setNewTag("");
                  setAddingTag(false);
                }
              }}
              onBlur={commitCustomTag}
              placeholder="…"
            />
          ) : (
            <button className="chip add" onClick={() => setAddingTag(true)}>
              {t("addTag")}
            </button>
          )}
        </div>
      </div>

      <button className="btn gold" disabled={!canSend || pending} onClick={submit}>
        <Check />
        {t("send")}
      </button>

      <RoomPickerSheet
        open={sheetOpen}
        enter={sheetEnter}
        initialProperty={roomProp}
        selectedRoom={room}
        roomsByProperty={roomsByProperty}
        onPick={(p, r) => {
          setRoomProp(p);
          setRoom(r);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
