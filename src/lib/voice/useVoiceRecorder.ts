import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RecorderStatus = "idle" | "recording" | "transcribing" | "done" | "error";

const VISUALIZER_BINS = 8;

export interface VoiceRecorderState {
  status: RecorderStatus;
  transcript: string | null;
  error: string | null;
  /** Frequenz-Bins 0..1, Länge = 8. Aktualisiert via rAF während recording. */
  levels: number[];
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  reset: () => void;
}

const ZERO_LEVELS = Array.from({ length: VISUALIZER_BINS }, () => 0);

export function useVoiceRecorder(): VoiceRecorderState {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(ZERO_LEVELS);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const rafId = useRef<number | null>(null);

  const stopVisualizer = useCallback(() => {
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    analyser.current?.disconnect();
    analyser.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    setLevels(ZERO_LEVELS);
  }, []);

  const startVisualizer = useCallback((s: MediaStream) => {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(s);
      const node = ctx.createAnalyser();
      node.fftSize = 64; // 32 Bins → wir aggregieren auf 8
      node.smoothingTimeConstant = 0.7;
      source.connect(node);
      audioCtx.current = ctx;
      analyser.current = node;

      const buf = new Uint8Array(node.frequencyBinCount);
      const stride = Math.floor(node.frequencyBinCount / VISUALIZER_BINS);

      const tick = () => {
        if (!analyser.current) return;
        analyser.current.getByteFrequencyData(buf);
        const next = new Array<number>(VISUALIZER_BINS);
        for (let i = 0; i < VISUALIZER_BINS; i++) {
          let sum = 0;
          for (let j = 0; j < stride; j++) sum += buf[i * stride + j];
          next[i] = Math.min(1, (sum / (stride * 255)) * 1.6);
        }
        setLevels(next);
        rafId.current = requestAnimationFrame(tick);
      };
      rafId.current = requestAnimationFrame(tick);
    } catch {
      // Visualizer ist optional — Aufnahme läuft ohne weiter.
    }
  }, []);

  const cleanup = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    stream.current?.getTracks().forEach((t) => t.stop());
    mediaRecorder.current = null;
    stream.current = null;
    chunks.current = [];
    stopVisualizer();
  }, [stopVisualizer]);

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
        stopVisualizer();
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
      startVisualizer(s);
    } catch (err: any) {
      setError(err.message ?? "Mikrofonzugriff verweigert");
      setStatus("error");
    }
  }, [startVisualizer, stopVisualizer]);

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

  return { status, transcript, error, levels, start, stop, cancel, reset };
}
