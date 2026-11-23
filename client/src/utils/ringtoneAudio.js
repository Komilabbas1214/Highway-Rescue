/**
 * Highway Rescue — Emergency Dispatch Synthesized Ringtone
 * Uses the Web Audio API for zero-dependency, self-contained, high-reliability sound generation.
 * Complies with browser autoplay restrictions through explicit user unlock.
 */

let audioCtx = null;
let ringInterval = null;
let isRingingActive = false;
let isAudioExplicitlyUnlocked = false;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

/**
 * Unlock AudioContext on user interaction (e.g., clicking "Enable Sound Alerts")
 */
export const unlockAudio = async () => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    isAudioExplicitlyUnlocked = true;

    // Play a brief, gentle confirmation chime to confirm audio output is working
    playChime(ctx, 880, 0.12, 0.1);
    setTimeout(() => {
      playChime(ctx, 1174, 0.16, 0.1);
    }, 130);

    return true;
  } catch (err) {
    console.warn('[Audio] Failed to unlock audio context:', err);
    return false;
  }
};

export const isAudioUnlocked = () => {
  const ctx = getAudioContext();
  return Boolean(isAudioExplicitlyUnlocked || (ctx && ctx.state === 'running'));
};

/**
 * Play an individual synthesized melodic tone
 */
const playChime = (ctx, freq, duration = 0.2, volume = 0.15) => {
  if (!ctx || ctx.state !== 'running') return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Smooth envelope attack and decay to prevent popping
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Non-critical
  }
};

/**
 * Start rhythmic repeating dispatch ringtone
 */
export const startRingtone = () => {
  if (isRingingActive) return;
  isRingingActive = true;

  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  // Melodic emergency alert pattern: High chime -> Higher chime -> Pulse
  const ringSequence = () => {
    if (!isRingingActive) return;
    const c = getAudioContext();
    if (c) {
      playChime(c, 880, 0.15, 0.2); // A5
      setTimeout(() => {
        if (isRingingActive) playChime(c, 1046.5, 0.2, 0.25); // C6
      }, 160);
      setTimeout(() => {
        if (isRingingActive) playChime(c, 1318.5, 0.25, 0.2); // E6
      }, 340);
    }

    // Hardware vibration on mobile devices where supported
    if (navigator.vibrate) {
      try {
        navigator.vibrate([250, 100, 250]);
      } catch (e) {}
    }
  };

  // Play immediately, then repeat every 1.4 seconds
  ringSequence();
  ringInterval = setInterval(ringSequence, 1400);
};

/**
 * Stop repeating dispatch ringtone immediately
 */
export const stopRingtone = () => {
  isRingingActive = false;
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }

  // Cancel any active vibration
  if (navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch (e) {}
  }
};

export const isRinging = () => isRingingActive;

export default {
  unlockAudio,
  isAudioUnlocked,
  startRingtone,
  stopRingtone,
  isRinging,
};
