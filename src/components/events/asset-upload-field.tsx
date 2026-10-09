/* eslint-disable @next/next/no-img-element -- the field previews uploaded event assets. */
"use client";

import { useId, useState } from "react";
import { Upload, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { Label } from "@/components/ui/field";
import { useFeedback } from "@/components/ui/feedback-provider";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

export function AssetUploadField({
  name,
  kind,
  defaultValue = "",
  label = "Image or banner",
}: {
  name: string;
  kind: "prize" | "award";
  defaultValue?: string;
  label?: string;
}) {
  const { toast } = useFeedback();
  const inputId = useId();
  const [url, setUrl] = useState(defaultValue);
  const [uploaded, setUploaded] = useState(Boolean(defaultValue));
  const [status, setStatus] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  async function upload(file: File) {
    setStatus("Uploading…");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      const response = await fetch("/api/event-assets", { method: "POST", body });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setStatus(payload.error ?? "Upload failed.");
        toast(payload.error ?? "Upload failed.", "error");
        return;
      }
      setUrl(payload.url);
      setUploaded(true);
      setStatus("Uploaded");
      toast("Image uploaded. Save the form to apply it.", "info");
    } catch {
      setStatus("Upload failed. Try again.");
      toast("Upload failed. Try again.", "error");
    }
  }

  function removeImage() {
    setUrl("");
    setUploaded(false);
    setStatus("");
    setFileInputKey((value) => value + 1);
    toast("Image removed from draft.", "info");
  }

  const showingPreview = uploaded && Boolean(url);
  return (
    <div className="space-y-1">
      <Label htmlFor={showingPreview ? undefined : inputId}>{label}</Label>
      {showingPreview ? (
        <div className="relative w-fit rounded-md border border-outline bg-surface p-2">
          <img src={url} alt={`${label} preview`} className="h-28 w-44 rounded-sm object-cover" />
          <IconButton label={`Remove ${label.toLowerCase()}`} tooltip={false} variant="danger" size="icon-sm" className="absolute right-1 top-1 bg-surface" onClick={removeImage}><X aria-hidden="true" /></IconButton>
          <input type="hidden" name={name} value={url} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Input id={inputId} name={name} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Optional image URL" className="min-w-0 flex-1" />
          <label className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky")}>
            <Upload aria-hidden="true" />
            Upload
            <input key={fileInputKey} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          </label>
        </div>
      )}
      <span className="text-xs text-ink-muted">JPG, PNG, or WEBP up to 5 MB{status ? ` · ${status}` : ""}</span>
    </div>
  );
}
