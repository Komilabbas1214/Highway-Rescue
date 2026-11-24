/**
 * Highway Rescue — Emergency Dispatch Synthesized Ringtone
 * Robust audio system combining Web Audio API and HTML5 Audio fallback.
 * Automatically unlocks on any user gesture (click/tap/keypress) across the website.
 */

let audioCtx = null;
let ringInterval = null;
let isRingingActive = false;
let isAudioExplicitlyUnlocked = false;
let fallbackAudio = null;

/**
 * Generate a standalone WAV chime Data URI entirely in memory
 * Zero network dependencies, instant load, 100% reliable
 */
const createWavDataUri = (frequency = 960, duration = 0.35) => {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  // RIFF header
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

  // "fmt " chunk
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20;
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // chunk size
  buffer[20] = 1; buffer[21] = 0; // PCM format
  buffer[22] = 1; buffer[23] = 0; // mono
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = sampleRate & 0xff; // byte rate
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;
  buffer[32] = 1; buffer[33] = 0; // block align
  buffer[34] = 8; buffer[35] = 0; // 8-bit

  // "data" chunk
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61;
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  // Sine wave with smooth decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wave = Math.sin(2 * Math.PI * frequency * t);
    const decay = 1 - (i / numSamples) * 0.7; // slight decay
    buffer[44 + i] = Math.floor(128 + 115 * wave * decay);
  }

  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
};

const getFallbackAudio = () => {
  if (!fallbackAudio && typeof window !== 'undefined') {
    try {
      const uri = createWavDataUri(980, 0.35);
      fallbackAudio = new Audio(uri);
      fallbackAudio.volume = 0.95;
    } catch (e) {
      console.warn('[Audio] Fallback audio init error:', e);
    }
  }
  return fallbackAudio;
};

const getAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

/**
 * Unlock AudioContext and HTML5 Audio on user interaction
 */
export const unlockAudio = async () => {
  isAudioExplicitlyUnlocked = true;

  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (err) {
      console.warn('[Audio] Failed to resume AudioContext:', err);
    }
  }

  // Also prime HTML5 Audio element
  const audio = getFallbackAudio();
  if (audio) {
    audio.load();
  }

  return true;
};

export const isAudioUnlocked = () => {
  const ctx = getAudioContext();
  return Boolean(isAudioExplicitlyUnlocked || (ctx && ctx.state === 'running'));
};

/**
 * Play a synthesized melodic tone using Web Audio API
 */
const playChime = (ctx, freq, duration = 0.22, volume = 0.85) => {
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle'; // Richer, more audible tone than sine
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.04);
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
 * Play HTML5 audio fallback beep
 */
const playFallbackBeep = () => {
  const audio = getFallbackAudio();
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
};

/**
 * Start rhythmic repeating dispatch ringtone
 */
export const startRingtone = async () => {
  if (isRingingActive) return;
  isRingingActive = true;

  const ctx = getAudioContext();
  if (ctx && ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch (e) {}
  }

  // Melodic emergency alert pattern: High chime -> Higher chime -> Apex chime
  const ringSequence = () => {
    if (!isRingingActive) return;

    const c = getAudioContext();
    let webAudioPlayed = false;

    if (c && c.state === 'running') {
      try {
        playChime(c, 880, 0.18, 0.85); // A5
        setTimeout(() => {
          if (isRingingActive) playChime(c, 1108.7, 0.22, 0.9); // C#6
        }, 180);
        setTimeout(() => {
          if (isRingingActive) playChime(c, 1318.5, 0.28, 0.95); // E6
        }, 380);
        webAudioPlayed = true;
      } catch (e) {}
    }

    // If Web Audio was blocked by autoplay or not running, use HTML5 Audio fallback
    if (!webAudioPlayed) {
      playFallbackBeep();
      setTimeout(() => {
        if (isRingingActive) playFallbackBeep();
      }, 250);
    }

    // Hardware vibration on mobile devices where supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([300, 150, 300, 150, 300]);
      } catch (e) {}
    }
  };

  // Play immediately, then repeat every 1.5 seconds
  ringSequence();
  ringInterval = setInterval(ringSequence, 1500);
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

  if (fallbackAudio) {
    try {
      fallbackAudio.pause();
      fallbackAudio.currentTime = 0;
    } catch (e) {}
  }

  // Cancel any active vibration
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch (e) {}
  }
};

export const isRinging = () => isRingingActive;

// Register automatic global unlock on any user gesture across the application
if (typeof window !== 'undefined') {
  const autoUnlockHandler = () => {
    unlockAudio();
    // Do not remove listener immediately to allow re-resuming if browser suspends tab
  };
  ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown'].forEach((eventName) => {
    window.addEventListener(eventName, autoUnlockHandler, { passive: true });
  });
}

export default {
  unlockAudio,
  isAudioUnlocked,
  startRingtone,
  stopRingtone,
  isRinging,
};
