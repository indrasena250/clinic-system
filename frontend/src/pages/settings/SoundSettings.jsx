import { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  Divider,
  Chip,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { VolumeUp, PlayArrow, Stop } from "@mui/icons-material";

const SoundSettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedSuccessSound, setSelectedSuccessSound] = useState(() => {
    return localStorage.getItem("selectedSuccessSound") || "chime";
  });
  const [selectedErrorSound, setSelectedErrorSound] = useState(() => {
    return localStorage.getItem("selectedErrorSound") || "gentle";
  });
  const [playingSound, setPlayingSound] = useState(null);
  const [success, setSuccess] = useState("");

  // Sound options with descriptions
  const successSounds = [
    { id: "chime", name: "Success Chime", description: "Pleasant ascending chime" },
    { id: "notification", name: "Notification", description: "Modern notification sound" },
    { id: "celebration", name: "Celebration", description: "Joyful celebration sound" },
    { id: "soft", name: "Soft Melody", description: "Gentle melodic tone" },
    { id: "crystal", name: "Crystal", description: "Clear crystal-like sound" },
    { id: "magic", name: "Magic", description: "Magical sparkling sound" },
    { id: "uplifting", name: "Uplifting", description: "Motivational uplifting tone" },
    { id: "gentle1", name: "Gentle 1s", description: "Soft 1-second gentle tone" },
    { id: "gentle2", name: "Gentle 2s", description: "Soft 2-second gentle tone" },
    { id: "gentle3", name: "Gentle 3s", description: "Soft 3-second gentle tone" },
    { id: "whisper1", name: "Whisper 1s", description: "Barely audible 1-second whisper" },
    { id: "whisper2", name: "Whisper 2s", description: "Barely audible 2-second whisper" },
    { id: "whisper3", name: "Whisper 3s", description: "Barely audible 3-second whisper" },
    { id: "pulse1", name: "Pulse 1s", description: "Gentle pulsing 1-second tone" },
    { id: "pulse2", name: "Pulse 2s", description: "Gentle pulsing 2-second tone" },
    { id: "pulse3", name: "Pulse 3s", description: "Gentle pulsing 3-second tone" },
    { id: "fade1", name: "Fade 1s", description: "Soft fading 1-second tone" },
    { id: "fade2", name: "Fade 2s", description: "Soft fading 2-second tone" },
    { id: "fade3", name: "Fade 3s", description: "Soft fading 3-second tone" }
  ];

  const errorSounds = [
    { id: "gentle", name: "Gentle Descend", description: "Soft descending melody" },
    { id: "soft", name: "Soft Alert", description: "Gentle warning tone" },
    { id: "subtle", name: "Subtle", description: "Very subtle notification" },
    { id: "classic", name: "Classic Error", description: "Traditional error sound" },
    { id: "modern", name: "Modern Alert", description: "Contemporary alert" },
    { id: "calm", name: "Calm Warning", description: "Calm but noticeable" },
    { id: "minimal", name: "Minimal", description: "Minimalist tone" },
    { id: "whisper", name: "Whisper", description: "Barely audible whisper" }
  ];

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("selectedSuccessSound", selectedSuccessSound);
    localStorage.setItem("selectedErrorSound", selectedErrorSound);
    setSuccess("Sound preferences saved successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Play sound preview
  const playSoundPreview = (type, soundId) => {
    if (playingSound) {
      stopSoundPreview();
      return;
    }

    setPlayingSound(`${type}-${soundId}`);
    playSound(type, soundId, true); // true for preview mode

    // Auto-stop after 2.5 seconds
    setTimeout(() => {
      setPlayingSound(null);
    }, 2500);
  };

  const stopSoundPreview = () => {
    setPlayingSound(null);
    // Stop any currently playing audio context
    try {
      if (window.currentAudioContext) {
        window.currentAudioContext.close();
        window.currentAudioContext = null;
      }
    } catch (error) {
      console.log('Error stopping sound:', error);
    }
  };

  // Enhanced playSound function with multiple sound options
  const playSound = (type, soundId, isPreview = false) => {
    console.log('Playing sound:', type, soundId, isPreview ? '(preview)' : '');
    try {
      // Use Web Audio API for better compatibility
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      window.currentAudioContext = audioContext;

      // Resume audio context if it's suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (type === "success") {
        switch (soundId) {
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
        switch (soundId) {
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
      // Fallback: try vibration
      if (navigator.vibrate) {
        navigator.vibrate(type === "success" ? [100, 50, 100] : [200, 100, 200]);
      }
    }
  };

  // Success sound implementations
  const createBellSound = (audioContext) => {
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

  const createChimeSound = (audioContext) => {
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

  const createNotificationSound = (audioContext) => {
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

  const createCelebrationSound = (audioContext) => {
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

  const createSoftMelodySound = (audioContext) => {
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

  const createCrystalSound = (audioContext) => {
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

  const createMagicSound = (audioContext) => {
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

  const createUpliftingSound = (audioContext) => {
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

  const createGentle1Sound = (audioContext) => {
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

  const createGentle2Sound = (audioContext) => {
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

  const createGentle3Sound = (audioContext) => {
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

  const createWhisper1Sound = (audioContext) => {
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

  const createWhisper2Sound = (audioContext) => {
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

  const createWhisper3Sound = (audioContext) => {
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

  const createPulse1Sound = (audioContext) => {
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

  const createPulse2Sound = (audioContext) => {
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

  const createPulse3Sound = (audioContext) => {
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

  const createFade1Sound = (audioContext) => {
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

  const createFade2Sound = (audioContext) => {
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

  const createFade3Sound = (audioContext) => {
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

  // Error sound implementations
  const createGentleErrorSound = (audioContext) => {
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

  const createSoftErrorSound = (audioContext) => {
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

  const createSubtleErrorSound = (audioContext) => {
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

  const createClassicErrorSound = (audioContext) => {
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

  const createModernErrorSound = (audioContext) => {
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

  const createCalmErrorSound = (audioContext) => {
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

  const createMinimalErrorSound = (audioContext) => {
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

  const createWhisperErrorSound = (audioContext) => {
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

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        pt: 4,
        px: 2,
        pb: 4
      }}
    >
      <Paper
        elevation={12}
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(to bottom right, #ffffff 0%, #f8f9ff 100%)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          mb={1}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center"
          }}
        >
          <VolumeUp sx={{ mr: 1, verticalAlign: "middle" }} />
          Sound Settings
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          mb={3}
          textAlign="center"
        >
          Choose your preferred sounds for patient addition feedback
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Success Sounds */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 2,
                background: "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)",
                border: "1px solid rgba(76, 175, 80, 0.2)"
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2} color="success.main">
                ✓ Success Sounds
              </Typography>

              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedSuccessSound}
                  onChange={(e) => setSelectedSuccessSound(e.target.value)}
                >
                  {successSounds.map((sound) => (
                    <Box key={sound.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <FormControlLabel
                        value={sound.id}
                        control={<Radio color="success" />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {sound.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {sound.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={playingSound === `success-${sound.id}` ? <Stop /> : <PlayArrow />}
                        onClick={() => playSoundPreview("success", sound.id)}
                        sx={{ ml: 1, minWidth: "auto" }}
                      >
                        {playingSound === `success-${sound.id}` ? "Stop" : "Play"}
                      </Button>
                    </Box>
                  ))}
                </RadioGroup>
              </FormControl>
            </Card>
          </Grid>

          {/* Error Sounds */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 2,
                background: "linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(255, 87, 34, 0.1) 100%)",
                border: "1px solid rgba(244, 67, 54, 0.2)"
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2} color="error.main">
                ✗ Error Sounds
              </Typography>

              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedErrorSound}
                  onChange={(e) => setSelectedErrorSound(e.target.value)}
                >
                  {errorSounds.map((sound) => (
                    <Box key={sound.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <FormControlLabel
                        value={sound.id}
                        control={<Radio color="error" />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {sound.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {sound.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={playingSound === `error-${sound.id}` ? <Stop /> : <PlayArrow />}
                        onClick={() => playSoundPreview("error", sound.id)}
                        sx={{ ml: 1, minWidth: "auto" }}
                      >
                        {playingSound === `error-${sound.id}` ? "Stop" : "Play"}
                      </Button>
                    </Box>
                  ))}
                </RadioGroup>
              </FormControl>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={saveSettings}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
              '&:hover': {
                boxShadow: "0 12px 32px rgba(102, 126, 234, 0.4)",
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Save Sound Preferences
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          Click the play buttons to preview sounds before saving
        </Typography>
      </Paper>
    </Box>
  );
};

export default SoundSettings;