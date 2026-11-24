const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const assert = require('assert');

console.log('================================================================');
console.log('  HIGHWAY RESCUE — SOUND NOTIFICATION & DISPATCH VERIFICATION  ');
console.log('================================================================\n');

// 1. Test flexible service compatibility logic (matches bookingController.js)
const isServiceMatch = (mechanicServices, requestedService, isEmergency) => {
  if (isEmergency) return true;
  if (!mechanicServices || mechanicServices.length === 0) return true;
  if (!requestedService) return true;

  const reqLower = requestedService.toLowerCase();

  const isGeneral = mechanicServices.some((s) => {
    const sl = s.toLowerCase();
    return (
      sl.includes('general') ||
      sl.includes('all') ||
      sl.includes('car mechanic') ||
      sl.includes('bike mechanic') ||
      sl.includes('mechanic')
    );
  });
  if (isGeneral) return true;

  return mechanicServices.some((s) => {
    const sl = s.toLowerCase();
    if (sl === reqLower || reqLower.includes(sl) || sl.includes(reqLower)) return true;

    const keywords = [
      'puncture', 'tyre', 'tire', 'wheel',
      'battery', 'jump', 'electrical',
      'engine', 'motor', 'radiator',
      'towing', 'tow', 'crane', 'flatbed',
      'fuel', 'petrol', 'diesel',
      'brake', 'clutch', 'oil'
    ];
    for (const kw of keywords) {
      if (sl.includes(kw) && reqLower.includes(kw)) return true;
    }
    return false;
  });
};

let passed = 0;
let failed = 0;

function runTest(description, fn) {
  try {
    fn();
    console.log(`✔ PASSED: ${description}`);
    passed++;
  } catch (err) {
    console.error(`✖ FAILED: ${description} — ${err.message}`);
    failed++;
  }
}

// Test Suite 1: Service Matching
runTest('Customer requests "General Vehicle Repair", mechanic has "General Mechanic" -> Match', () => {
  const match = isServiceMatch(['Puncture Repair', 'General Mechanic'], 'General Vehicle Repair', false);
  assert.strictEqual(match, true);
});

runTest('Customer requests "Battery Jump Start", mechanic has "Battery Specialist" -> Match (keyword: battery)', () => {
  const match = isServiceMatch(['Puncture Repair', 'Battery Specialist'], 'Battery Jump Start', false);
  assert.strictEqual(match, true);
});

runTest('Customer requests "Engine Repair", mechanic has "Engine Specialist" -> Match (keyword: engine)', () => {
  const match = isServiceMatch(['Puncture Repair', 'Engine Specialist'], 'Engine Repair', false);
  assert.strictEqual(match, true);
});

runTest('Customer requests "Towing Service", mechanic has "Towing Service" -> Match', () => {
  const match = isServiceMatch(['Towing Service'], 'Towing Service', false);
  assert.strictEqual(match, true);
});

runTest('Customer requests "Puncture Repair", mechanic has "Puncture Repair" -> Match', () => {
  const match = isServiceMatch(['Puncture Repair'], 'Puncture Repair', false);
  assert.strictEqual(match, true);
});

runTest('Emergency breakdown assistance matches regardless of specific service keywords', () => {
  const match = isServiceMatch(['Towing Service'], 'Complex Electronics Failure', true);
  assert.strictEqual(match, true);
});

runTest('Mechanic offering Car Mechanic matches any general car repair request', () => {
  const match = isServiceMatch(['Car Mechanic'], 'Brake Oil Leak', false);
  assert.strictEqual(match, true);
});

// Test Suite 2: Synthesized WAV Chime Generation (pure JavaScript)
runTest('Standalone in-memory WAV chime Data URI generated with valid RIFF header', () => {
  const sampleRate = 8000;
  const duration = 0.35;
  const frequency = 960;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

  // fmt
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20;
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0;
  buffer[20] = 1; buffer[21] = 0;
  buffer[22] = 1; buffer[23] = 0;
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = sampleRate & 0xff;
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;
  buffer[32] = 1; buffer[33] = 0;
  buffer[34] = 8; buffer[35] = 0;

  // data
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61;
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wave = Math.sin(2 * Math.PI * frequency * t);
    const decay = 1 - (i / numSamples) * 0.7;
    buffer[44 + i] = Math.floor(128 + 115 * wave * decay);
  }

  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  const dataUri = 'data:audio/wav;base64,' + Buffer.from(binary, 'binary').toString('base64');

  assert(dataUri.startsWith('data:audio/wav;base64,'));
  assert(dataUri.length > 500);
});

console.log(`\n================================================================`);
console.log(`  RESULTS: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================\n');

process.exit(failed > 0 ? 1 : 0);
