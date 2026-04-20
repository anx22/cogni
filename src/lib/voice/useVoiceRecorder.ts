import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RecorderStatus = "idle" | "recording" | "transcribing" | "done" | "error";

export interface VoiceRecorderState {
  status: RecorderStatus;
  transcript: string | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  reset: () => void;
}

export function useVoiceRecorder(): VoiceRecorderState {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    stream.current?.getTracks().forEach((t) => t.stop());
    mediaRecorder.current = null;
    stream.current = null;
    chunks.current = [];
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      setTranscript(null);
      chunks.current = [];
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const recorder = new MediaRecorder(s, { mimeType: "audio/webm" });
      mediaRecorder.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          setStatus("idle");
          return;
        }
        setStatus("transcribing");
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const { data, error: fnError } = await supabase.functions.invoke("voice-transcribe", {
            body: { audio_base64: base64 },
          });
          if (fnError || !data?.text) {
            setError(fnError?.message ?? "Transkription fehlgeschlagen");
            setStatus("error");
          } else {
            setTranscript(data.text);
            setStatus("done");
          }
        } catch (err: any) {
          setError(err.message ?? "Transkription fehlgeschlagen");
          setStatus("error");
        }
      };
      recorder.start();
      setStatus("recording");
    } catch (err: any) {
      setError(err.message ?? "Mikrofonzugriff verweigert");
      setStatus("error");
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    cleanup();
    setStatus("idle");
    setTranscript(null);
    setError(null);
  }, [cleanup]);

  const reset = useCallback(() => {
    setStatus("idle");
    setTranscript(null);
    setError(null);
  }, []);

  return { status, transcript, error, start, stop, cancel, reset };
}
