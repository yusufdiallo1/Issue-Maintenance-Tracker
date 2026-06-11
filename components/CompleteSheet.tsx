"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, X, Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { ConfirmDialog } from "./ConfirmDialog";
import { InlineVoice } from "./InlineVoice";
import { useLang } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./Toast";
import { submitCompletion } from "@/app/actions/issues";

type Photo = { id: string; path: string | null; url: string | null; uploading: boolean };

/**
 * Worker completion flow: upload proof photo(s) + a note (text or voice) of what
 * was fixed, confirm, then submit for admin approval (status → pending).
 */
export function CompleteSheet({
  issueId,
  open,
  enter,
  onClose,
  onSubmitted,
}: {
  issueId: number;
  open: boolean;
  enter: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t, lang } = useLang();
  const { show } = useToast();
  const [supabase] = useState(() => createClient());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  const ready = photos.filter((p) => p.path).length > 0;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    for (const file of files.slice(0, 6 - photos.length)) {
      const uid = crypto.randomUUID();
      setPhotos((p) => [
        ...p,
        { id: uid, path: null, url: URL.createObjectURL(file), uploading: true },
      ]);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/proof-${uid}.${ext}`;
      const { error } = await supabase.storage
        .from("issue-photos")
        .upload(path, file, { contentType: file.type || "image/jpeg" });
      if (error) {
        setPhotos((p) => p.filter((x) => x.id !== uid));
        show(t("loadError"), "error");
        continue;
      }
      const { data: signed } = await supabase.storage
        .from("issue-photos")
        .createSignedUrl(path, 3600, { transform: { width: 480, height: 480, resize: "cover" } });
      setPhotos((p) =>
        p.map((x) =>
          x.id === uid ? { ...x, path, url: signed?.signedUrl ?? x.url, uploading: false } : x,
        ),
      );
    }
  }

  function doSubmit() {
    startTransition(async () => {
      const res = await submitCompletion(issueId, {
        proofPaths: photos.filter((p) => p.path).map((p) => p.path as string),
        note: note.trim(),
        lang,
      });
      if (res.ok) {
        show(t("completionSent"), "success");
        setPhotos([]);
        setNote("");
        onSubmitted();
      } else {
        show(res.error === "proof_required" ? t("proofRequired") : t("loadError"), "error");
      }
    });
  }

  return (
    <Sheet open={open} onClose={onClose} enter={enter} title={t("completionTitle")}>
      <label className="section-h" style={{ marginTop: 4 }}>
        {t("completionPhotos")}
      </label>
      <div className="photo-gallery">
        {photos.map((p) => (
          <div key={p.id} className={p.uploading ? "photo-cell uploading" : "photo-cell"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.url && <img src={p.url} alt="" loading="lazy" decoding="async" />}
            {p.uploading && <span className="spin" />}
            {!p.uploading && (
              <button
                className="x"
                onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}
                aria-label="Remove"
              >
                <X />
              </button>
            )}
          </div>
        ))}
        {photos.length < 6 && (
          <button className="photo-add" onClick={() => fileRef.current?.click()}>
            <Camera />
            <span>{t("addPhoto")}</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />

      <label className="section-h">{t("completionNote")}</label>
      <div className="ta-wrap">
        <textarea
          ref={noteRef}
          className={recording ? "ta recording" : "ta"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("completionNote")}
        />
        <InlineVoice
          lang={lang}
          onStart={() => setRecording(true)}
          onInterim={(text) => setNote(text)}
          onFinal={(text) => {
            setRecording(false);
            if (text) setNote(text);
          }}
          onError={() => setRecording(false)}
        />
      </div>

      <button
        className="btn gold"
        style={{ marginTop: 16 }}
        disabled={!ready || pending}
        onClick={() => setConfirm(true)}
      >
        <Check />
        {t("markFixed")}
      </button>

      <ConfirmDialog
        open={confirm}
        title={t("completionSendQ")}
        confirmLabel={t("markFixed")}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          doSubmit();
        }}
      />
    </Sheet>
  );
}
