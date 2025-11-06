"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";
import Textarea from "@/components/ui/Textarea";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const SUMMARY_MAX = 1500;

function formatBytes(bytes?: number | null) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function Step3SummaryFile() {
  const { summary = "", fileName, fileSize, fileType, fileBlob, setPatch } = useAttestationWizard();
  const [value, setValue] = useState<string>(summary || "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce summary writes
  useEffect(() => {
    const h = setTimeout(() => {
      const trimmed = value.slice(0, SUMMARY_MAX);
      setPatch({ summary: trimmed });
    }, 250);
    return () => clearTimeout(h);
  }, [value, setPatch]);

  // Keep local input in sync when store changes externally
  useEffect(() => {
    setValue(summary || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  const clearFile = () => {
    setPatch({ fileBlob: null, fileName: undefined, fileSize: null, fileType: null, fileCid: undefined, fileUrl: undefined });
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSelectFile = (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      // Clear any previous selection to avoid confusion, and show explicit error
      clearFile();
      setError(`"${file.name}" exceeds 5 MB. Please choose a smaller file.`);
      return;
    }
    setError(null);
    setPatch({
      fileBlob: file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || null,
      // Clear any previous upload outputs so submit re-uploads the new file
      fileCid: undefined,
      fileUrl: undefined,
    });
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    onSelectFile(f);
  };

  const onRemove = () => { clearFile(); setError(null); };

  // Drag & drop
  const [dragOver, setDragOver] = useState(false);
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    onSelectFile(f);
  };
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  // If the page is refreshed, drop any stale file metadata (we don't offer re-attach)
  useEffect(() => {
    if (!fileBlob && (fileName || fileSize || fileType)) {
      setPatch({ fileName: undefined, fileSize: null, fileType: null });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = useMemo(() => {
    const name = fileBlob?.name || fileName || "";
    if (!name) return "";
    // middle-ellipsis truncation
    const max = 48;
    if (name.length <= max) return name;
    const head = name.slice(0, 28);
    const tail = name.slice(-16);
    return `${head}…${tail}`;
  }, [fileBlob, fileName]);

  return (
    <div className="flex flex-col gap-12">
      <div className="w-full max-w-[960px] flex flex-col items-center gap-4 mx-auto">
        <div className="text-center text-white text-5xl md:text-7xl font-black leading-[1.04]">
        Tell us more about this action & attach a file.
        </div>
      </div>

      {/* Summary section (same section title styling as Step 2) */}
      <section className="grid gap-2 items-center text-center w-full max-w-[600px] mx-auto">
        <h3 className="text-vulcan-700 text-2xl font-black">Summary</h3>
        <Textarea
          id="summary"
          aria-label="Summary"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe anything you judge relevant to the current action(s)"
          className="min-h-[160px] rounded-lg outline outline-1 outline-vulcan-700 placeholder:text-white/50"
        />
        <div className="text-right text-vulcan-300 text-xs mt-1">{Math.min(value.length, SUMMARY_MAX)} / {SUMMARY_MAX}</div>
      </section>

      {/* Attachments section */}
      <section className="grid gap-4 items-center text-center w-full max-w-[600px] mx-auto pb-4">
        <h3 className="text-vulcan-700 text-2xl font-black">Attachments</h3>
        <p className="text-white/80 text-base">Optionally attach a file relevant to this action. (ex. notes, spreadsheet, photo, etc.)</p>

        {/* File trigger row (whole row opens file chooser). Paperclip on left; trash on right when selected. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          aria-describedby="file-helper"
          className={`relative rr-input text-left pl-12 ${fileBlob ? 'pr-12' : ''} ${dragOver ? 'outline outline-2 outline-orange' : ''}`}
        >
          {/* left icon */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
            <i className="f7-icons">paperclip</i>
          </span>
          <span className={`${fileBlob ? 'text-white' : 'text-white/70'}`}>
            {fileBlob ? displayName : 'Select a file (1 file, 5MB max)'}
          </span>
          {fileBlob && (
            <button
              type="button"
              aria-label="Remove file"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >
              <i className="f7-icons">trash</i>
            </button>
          )}
        </div>
        

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onFileInputChange}
        />
        {error && <div className="text-red-400 text-sm">{error}</div>}
      </section>
    </div>
  );
}
