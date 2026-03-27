// Sound utility functions for the clinic system
// All sound creation functions are centralized here

export const createBellSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const oscillator3 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator1.connect(filterNode);
  oscillator2.connect(filterNode);
  oscillator3.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(2000, audioContext.currentTime);
  filterNode.Q.setValueAtTime(1, audioContext.currentTime);

  oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.1);
  oscillator1.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2);
  oscillator1.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3);

  oscillator2.frequency.setValueAtTime(1046.50, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(1567.98, audioContext.currentTime + 0.1);
  oscillator2.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2);
  oscillator2.frequency.setValueAtTime(2093.00, audioContext.currentTime + 0.3);

  oscillator3.frequency.setValueAtTime(1567.98, audioContext.currentTime);
  oscillator3.frequency.setValueAtTime(1975.53, audioContext.currentTime + 0.1);
  oscillator3.frequency.setValueAtTime(1760.00, audioContext.currentTime + 0.2);
  oscillator3.frequency.setValueAtTime(2349.32, audioContext.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.6, audioContext.currentTime + 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator3.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
  oscillator3.stop(audioContext.currentTime + 2.5);
};

export const createChimeSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
  oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
  oscillator1.frequency.setValueAtTime(1500, audioContext.currentTime + 0.3);

  oscillator2.frequency.setValueAtTime(1600, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(2000, audioContext.currentTime + 0.1);
  oscillator2.frequency.setValueAtTime(2400, audioContext.currentTime + 0.2);
  oscillator2.frequency.setValueAtTime(3000, audioContext.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
};

export const createNotificationSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(600, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(800, audioContext.currentTime + 0.15);
  oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);

  oscillator2.frequency.setValueAtTime(1200, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(1600, audioContext.currentTime + 0.15);
  oscillator2.frequency.setValueAtTime(2000, audioContext.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
};

export const createCelebrationSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const oscillator3 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  oscillator3.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(523, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
  oscillator1.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
  oscillator1.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3);

  oscillator2.frequency.setValueAtTime(784, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(988, audioContext.currentTime + 0.1);
  oscillator2.frequency.setValueAtTime(1175, audioContext.currentTime + 0.2);
  oscillator2.frequency.setValueAtTime(1568, audioContext.currentTime + 0.3);

  oscillator3.frequency.setValueAtTime(1047, audioContext.currentTime);
  oscillator3.frequency.setValueAtTime(1319, audioContext.currentTime + 0.1);
  oscillator3.frequency.setValueAtTime(1568, audioContext.currentTime + 0.2);
  oscillator3.frequency.setValueAtTime(2093, audioContext.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.7, audioContext.currentTime + 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator3.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
  oscillator3.stop(audioContext.currentTime + 2.5);
};

export const createSoftMelodySound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator1.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(1500, audioContext.currentTime);

  oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(523, audioContext.currentTime + 0.3);
  oscillator1.frequency.setValueAtTime(659, audioContext.currentTime + 0.6);
  oscillator1.frequency.setValueAtTime(784, audioContext.currentTime + 0.9);
  oscillator1.frequency.setValueAtTime(880, audioContext.currentTime + 1.2);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
};

export const createCrystalSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
  oscillator1.frequency.setValueAtTime(1500, audioContext.currentTime + 0.2);

  oscillator2.frequency.setValueAtTime(2000, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(2400, audioContext.currentTime + 0.1);
  oscillator2.frequency.setValueAtTime(3000, audioContext.currentTime + 0.2);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
};

export const createMagicSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const oscillator3 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  oscillator3.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
  oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
  oscillator1.frequency.setValueAtTime(1500, audioContext.currentTime + 0.3);

  oscillator2.frequency.setValueAtTime(1600, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(2000, audioContext.currentTime + 0.1);
  oscillator2.frequency.setValueAtTime(2400, audioContext.currentTime + 0.2);
  oscillator2.frequency.setValueAtTime(3000, audioContext.currentTime + 0.3);

  oscillator3.frequency.setValueAtTime(3200, audioContext.currentTime);
  oscillator3.frequency.setValueAtTime(4000, audioContext.currentTime + 0.1);
  oscillator3.frequency.setValueAtTime(4800, audioContext.currentTime + 0.2);
  oscillator3.frequency.setValueAtTime(6000, audioContext.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator3.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
  oscillator3.stop(audioContext.currentTime + 2.5);
};

export const createUpliftingSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(554, audioContext.currentTime + 0.2);
  oscillator1.frequency.setValueAtTime(659, audioContext.currentTime + 0.4);
  oscillator1.frequency.setValueAtTime(880, audioContext.currentTime + 0.6);
  oscillator1.frequency.setValueAtTime(1109, audioContext.currentTime + 0.8);
  oscillator1.frequency.setValueAtTime(1319, audioContext.currentTime + 1.0);

  oscillator2.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(1109, audioContext.currentTime + 0.2);
  oscillator2.frequency.setValueAtTime(1319, audioContext.currentTime + 0.4);
  oscillator2.frequency.setValueAtTime(1760, audioContext.currentTime + 0.6);
  oscillator2.frequency.setValueAtTime(2217, audioContext.currentTime + 0.8);
  oscillator2.frequency.setValueAtTime(2637, audioContext.currentTime + 1.0);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.6, audioContext.currentTime + 1.0);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
};

export const createGentle1Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator1.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(600, audioContext.currentTime);

  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(450, audioContext.currentTime + 0.2);
  oscillator1.frequency.setValueAtTime(500, audioContext.currentTime + 0.4);
  oscillator1.frequency.setValueAtTime(450, audioContext.currentTime + 0.6);
  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime + 0.8);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 1.0);
};

export const createGentle2Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator1.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(600, audioContext.currentTime);

  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(450, audioContext.currentTime + 0.3);
  oscillator1.frequency.setValueAtTime(500, audioContext.currentTime + 0.6);
  oscillator1.frequency.setValueAtTime(550, audioContext.currentTime + 0.9);
  oscillator1.frequency.setValueAtTime(500, audioContext.currentTime + 1.2);
  oscillator1.frequency.setValueAtTime(450, audioContext.currentTime + 1.5);
  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime + 1.8);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.15);
  gainNode.gain.setValueAtTime(0.35, audioContext.currentTime + 1.0);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.0);
};

export const createGentle3Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator1.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(600, audioContext.currentTime);

  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(420, audioContext.currentTime + 0.3);
  oscillator1.frequency.setValueAtTime(450, audioContext.currentTime + 0.6);
  oscillator1.frequency.setValueAtTime(480, audioContext.currentTime + 0.9);
  oscillator1.frequency.setValueAtTime(500, audioContext.currentTime + 1.2);
  oscillator1.frequency.setValueAtTime(480, audioContext.currentTime + 1.5);
  oscillator1.frequency.setValueAtTime(450, audioContext.currentTime + 1.8);
  oscillator1.frequency.setValueAtTime(420, audioContext.currentTime + 2.1);
  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime + 2.4);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.2);
  gainNode.gain.setValueAtTime(0.35, audioContext.currentTime + 1.0);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 2.0);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 3.0);
};

export const createWhisper1Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(200, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.2);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 1.0);
};

export const createWhisper2Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(180, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(200, audioContext.currentTime + 0.5);
  oscillator1.frequency.setValueAtTime(180, audioContext.currentTime + 1.0);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.3);
  gainNode.gain.setValueAtTime(0.12, audioContext.currentTime + 1.0);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.0);
};

export const createWhisper3Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(160, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(180, audioContext.currentTime + 0.5);
  oscillator1.frequency.setValueAtTime(200, audioContext.currentTime + 1.0);
  oscillator1.frequency.setValueAtTime(180, audioContext.currentTime + 1.5);
  oscillator1.frequency.setValueAtTime(160, audioContext.currentTime + 2.0);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.4);
  gainNode.gain.setValueAtTime(0.12, audioContext.currentTime + 1.0);
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + 2.0);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 3.0);
};

export const createPulse1Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(300, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.3);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.7);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.9);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 1.0);
};

export const createPulse2Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(280, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(320, audioContext.currentTime + 0.5);
  oscillator1.frequency.setValueAtTime(280, audioContext.currentTime + 1.0);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.3);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.7);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.9);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 1.1);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.3);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 1.5);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.7);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.0);
};

export const createPulse3Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(260, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(300, audioContext.currentTime + 0.5);
  oscillator1.frequency.setValueAtTime(340, audioContext.currentTime + 1.0);
  oscillator1.frequency.setValueAtTime(300, audioContext.currentTime + 1.5);
  oscillator1.frequency.setValueAtTime(260, audioContext.currentTime + 2.0);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.3);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.7);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.9);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 1.1);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.3);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 1.5);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.7);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 1.9);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 2.1);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 2.3);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 2.5);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 3.0);
};

export const createFade1Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(350, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(380, audioContext.currentTime + 0.3);
  oscillator1.frequency.setValueAtTime(350, audioContext.currentTime + 0.6);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.35, audioContext.currentTime + 0.3);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.6);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 1.0);
};

export const createFade2Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(330, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(360, audioContext.currentTime + 0.4);
  oscillator1.frequency.setValueAtTime(390, audioContext.currentTime + 0.8);
  oscillator1.frequency.setValueAtTime(360, audioContext.currentTime + 1.2);
  oscillator1.frequency.setValueAtTime(330, audioContext.currentTime + 1.6);

  oscillator2.frequency.setValueAtTime(165, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(180, audioContext.currentTime + 0.4);
  oscillator2.frequency.setValueAtTime(195, audioContext.currentTime + 0.8);
  oscillator2.frequency.setValueAtTime(180, audioContext.currentTime + 1.2);
  oscillator2.frequency.setValueAtTime(165, audioContext.currentTime + 1.6);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.15);
  gainNode.gain.setValueAtTime(0.35, audioContext.currentTime + 0.5);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.0);
  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 1.5);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.0);
  oscillator2.stop(audioContext.currentTime + 2.0);
};

export const createFade3Sound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(320, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(340, audioContext.currentTime + 0.4);
  oscillator1.frequency.setValueAtTime(360, audioContext.currentTime + 0.8);
  oscillator1.frequency.setValueAtTime(380, audioContext.currentTime + 1.2);
  oscillator1.frequency.setValueAtTime(360, audioContext.currentTime + 1.6);
  oscillator1.frequency.setValueAtTime(340, audioContext.currentTime + 2.0);
  oscillator1.frequency.setValueAtTime(320, audioContext.currentTime + 2.4);

  oscillator2.frequency.setValueAtTime(160, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(170, audioContext.currentTime + 0.4);
  oscillator2.frequency.setValueAtTime(180, audioContext.currentTime + 0.8);
  oscillator2.frequency.setValueAtTime(190, audioContext.currentTime + 1.2);
  oscillator2.frequency.setValueAtTime(180, audioContext.currentTime + 1.6);
  oscillator2.frequency.setValueAtTime(170, audioContext.currentTime + 2.0);
  oscillator2.frequency.setValueAtTime(160, audioContext.currentTime + 2.4);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.2);
  gainNode.gain.setValueAtTime(0.35, audioContext.currentTime + 0.5);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.0);
  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 1.5);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 2.0);
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + 2.5);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3.0);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 3.0);
  oscillator2.stop(audioContext.currentTime + 3.0);
};

// Error sound functions
export const createGentleErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator1.connect(filterNode);
  oscillator2.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(1000, audioContext.currentTime);

  oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(392, audioContext.currentTime + 0.3);
  oscillator1.frequency.setValueAtTime(349, audioContext.currentTime + 0.6);
  oscillator1.frequency.setValueAtTime(330, audioContext.currentTime + 0.9);
  oscillator1.frequency.setValueAtTime(294, audioContext.currentTime + 1.2);
  oscillator1.frequency.setValueAtTime(262, audioContext.currentTime + 1.5);

  oscillator2.frequency.setValueAtTime(220, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(196, audioContext.currentTime + 0.3);
  oscillator2.frequency.setValueAtTime(175, audioContext.currentTime + 0.6);
  oscillator2.frequency.setValueAtTime(165, audioContext.currentTime + 0.9);
  oscillator2.frequency.setValueAtTime(147, audioContext.currentTime + 1.2);
  oscillator2.frequency.setValueAtTime(131, audioContext.currentTime + 1.5);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + 0.5);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
};

export const createSoftErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(300, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(250, audioContext.currentTime + 0.4);
  oscillator1.frequency.setValueAtTime(200, audioContext.currentTime + 0.8);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
};

export const createSubtleErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(200, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(180, audioContext.currentTime + 0.5);
  oscillator1.frequency.setValueAtTime(160, audioContext.currentTime + 1.0);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.2);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
};

export const createClassicErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
  oscillator1.frequency.setValueAtTime(200, audioContext.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
};

export const createModernErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(600, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(500, audioContext.currentTime + 0.2);
  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime + 0.4);

  oscillator2.frequency.setValueAtTime(300, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(250, audioContext.currentTime + 0.2);
  oscillator2.frequency.setValueAtTime(200, audioContext.currentTime + 0.4);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
  oscillator2.stop(audioContext.currentTime + 2.5);
};

export const createCalmErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator1.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(800, audioContext.currentTime);

  oscillator1.frequency.setValueAtTime(350, audioContext.currentTime);
  oscillator1.frequency.setValueAtTime(320, audioContext.currentTime + 0.4);
  oscillator1.frequency.setValueAtTime(290, audioContext.currentTime + 0.8);
  oscillator1.frequency.setValueAtTime(260, audioContext.currentTime + 1.2);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.15);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
};

export const createMinimalErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(250, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
};

export const createWhisperErrorSound = (audioContext) => {
  const oscillator1 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.frequency.setValueAtTime(150, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 2.5);
};

// Main playSound function that uses the selected sound from localStorage
export const playSound = (type) => {
  const selectedSound = type === "success"
    ? localStorage.getItem("selectedSuccessSound") || "bell"
    : localStorage.getItem("selectedErrorSound") || "gentle";

  console.log('Playing sound:', type, 'using:', selectedSound);
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (type === "success") {
      switch (selectedSound) {
        case "bell":
          createBellSound(audioContext);
          break;
        case "chime":
          createChimeSound(audioContext);
          break;
        case "notification":
          createNotificationSound(audioContext);
          break;
        case "celebration":
          createCelebrationSound(audioContext);
          break;
        case "soft":
          createSoftMelodySound(audioContext);
          break;
        case "crystal":
          createCrystalSound(audioContext);
          break;
        case "magic":
          createMagicSound(audioContext);
          break;
        case "uplifting":
          createUpliftingSound(audioContext);
          break;
        case "gentle1":
          createGentle1Sound(audioContext);
          break;
        case "gentle2":
          createGentle2Sound(audioContext);
          break;
        case "gentle3":
          createGentle3Sound(audioContext);
          break;
        case "whisper1":
          createWhisper1Sound(audioContext);
          break;
        case "whisper2":
          createWhisper2Sound(audioContext);
          break;
        case "whisper3":
          createWhisper3Sound(audioContext);
          break;
        case "pulse1":
          createPulse1Sound(audioContext);
          break;
        case "pulse2":
          createPulse2Sound(audioContext);
          break;
        case "pulse3":
          createPulse3Sound(audioContext);
          break;
        case "fade1":
          createFade1Sound(audioContext);
          break;
        case "fade2":
          createFade2Sound(audioContext);
          break;
        case "fade3":
          createFade3Sound(audioContext);
          break;
        default:
          createBellSound(audioContext);
      }
    } else {
      switch (selectedSound) {
        case "gentle":
          createGentleErrorSound(audioContext);
          break;
        case "soft":
          createSoftErrorSound(audioContext);
          break;
        case "subtle":
          createSubtleErrorSound(audioContext);
          break;
        case "classic":
          createClassicErrorSound(audioContext);
          break;
        case "modern":
          createModernErrorSound(audioContext);
          break;
        case "calm":
          createCalmErrorSound(audioContext);
          break;
        case "minimal":
          createMinimalErrorSound(audioContext);
          break;
        case "whisper":
          createWhisperErrorSound(audioContext);
          break;
        default:
          createGentleErrorSound(audioContext);
      }
    }
  } catch (error) {
    console.log('Audio playback error:', error);
    if (navigator.vibrate) {
      navigator.vibrate(type === "success" ? [100, 50, 100, 50, 100] : [200, 100, 200, 100, 200]);
    }
  }
};