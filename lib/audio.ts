// Web Audio API Disaster & Alert Sound Synthesizer
// Zero external assets needed, works in all modern browsers.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playAudioAlert(
  type: "toggle" | "success" | "warning" | "alarm" | "beacon",
  enabled: boolean = true
) {
  if (!enabled || typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === "toggle") {
      // Pleasant confirmation tone (D5 -> A5)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "success") {
      // Harmonic success triad (C5 -> E5 -> G5)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      gainNode.gain.setValueAtTime(0.14, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "warning") {
      // Urgent double beep (A5)
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(880, now + 0.15);
      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.setValueAtTime(0.01, now + 0.1);
      gainNode.gain.setValueAtTime(0.18, now + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.3);
    } else if (type === "alarm") {
      // High-low emergency siren sweep
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.linearRampToValueAtTime(980, now + 0.2);
      osc.frequency.linearRampToValueAtTime(750, now + 0.4);
      osc.frequency.linearRampToValueAtTime(980, now + 0.6);
      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.75);
    } else if (type === "beacon") {
      // Critical SOS Pulse (3 quick high beeps)
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const pulseGain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1046.5, now + i * 0.12);
        pulseGain.gain.setValueAtTime(0.16, now + i * 0.12);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.08);
        osc.connect(pulseGain);
        pulseGain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.08);
      }
    }
  } catch {
    // Non-fatal if audio context is blocked
  }
}
