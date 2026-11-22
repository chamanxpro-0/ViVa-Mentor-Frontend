// My Documents — resume/syllabus management (E4 + §8 privacy: private, deletable)

"use client";

import { useEffect, useRef, useState } from "react";
import { api, uploadDocument } from "@/lib/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, Upload, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doc {
  id: string;
  type: string;
  fileName: string;
  chunkCount: number;
  pageCount: number;
  createdAt: string;
}

export default function DocumentsView() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const d = await api<{ documents: Doc[] }>("/api/documents");
      setDocs(d.documents);
    } catch {
      setDocs([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onUpload(file: File | undefined, type: "resume" | "syllabus") {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDocument(file, type);
      await load();
      toast({ title: "Demo document saved", description: `${res.document.fileName} metadata saved locally in this browser demo; file contents are not uploaded.` });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      await load();
      toast({ title: "Document deleted", description: "Its local demo metadata was removed." });
    } catch (err) {
      toast({ title: "Delete failed", description: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">My documents</h1>
        <p className="text-sm text-muted-foreground">
          This frontend demo stores document names and basic metadata in your browser only. File contents are not uploaded, extracted, or embedded.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={cn("cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/60", uploading && "opacity-50 pointer-events-none")}>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" disabled={uploading}
            onChange={(e) => onUpload(e.target.files?.[0], "resume")} />
          <Upload className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-sm font-semibold">Upload resume</p>
          <p className="text-xs text-muted-foreground mt-1">PDF · max 8 MB · text-based</p>
        </label>
        <label className={cn("cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/60", uploading && "opacity-50 pointer-events-none")}>
          <input type="file" accept="application/pdf" className="hidden" disabled={uploading}
            onChange={(e) => onUpload(e.target.files?.[0], "syllabus")} />
          <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-sm font-semibold">Upload syllabus</p>
          <p className="text-xs text-muted-foreground mt-1">PDF · max 8 MB · text-based</p>
        </label>
      </div>

      {uploading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Saving document metadata in this browser…
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saved documents</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Private to you — never shared, deletable at any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {docs === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No documents yet. Upload one above, then attach it in session setup.
            </p>
          ) : (
            <div className="divide-y">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.type} · demo metadata ·{" "}
                      saved {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{d.type}</Badge>
                  <Button size="icon" variant="ghost" aria-label="Delete document" onClick={() => remove(d.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
