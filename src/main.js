import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const UP = new THREE.Vector3(0, 1, 0);
const CONFIG = {
  arenaLimit: 34,
  playerHeight: 1.74,
  playerRadius: 0.58,
  gravity: 26,
  jumpVelocity: 8.8,
  walkSpeed: 8.4,
  sprintSpeed: 11.8,
  aimSpeed: 6.4,
  bulletRange: 120,
  touchLookSensitivity: 0.0019,
  touchLookDeadzone: 0.4,
  stepAssistHeight: 0.48,
  vaultBoost: 5.6,
  thirdPersonDistance: 6.8,
  thirdPersonHeight: 0.36,
  thirdPersonShoulder: 1.18,
};

const ENEMY_TYPES = {
  skirmisher: {
    label: "Bouncecap Sprout",
    health: 74,
    speed: 7.2,
    radius: 0.62,
    hoverHeight: 0.02,
    eyeHeight: 1.12,
    preferredRange: 1.25,
    retreatRange: 0.45,
    fireInterval: 0.82,
    attackRange: 1.52,
    damage: 12,
    score: 100,
    cores: 2,
    scale: 0.9,
    skinColor: 0xf6dfb9,
    shellColor: 0xff9538,
    clothColor: 0xff9538,
    armorColor: 0xe8751c,
    trimColor: 0xfff3d0,
    coreColor: 0xffbf6a,
    weaponColor: 0x8d5123,
    critColor: 0x382615,
    melee: true,
  },
  striker: {
    label: "Zipcap Hopper",
    health: 58,
    speed: 9.1,
    radius: 0.58,
    hoverHeight: 0.02,
    eyeHeight: 1.08,
    preferredRange: 1.15,
    retreatRange: 0.35,
    fireInterval: 0.6,
    attackRange: 1.48,
    damage: 11,
    score: 125,
    cores: 3,
    scale: 0.84,
    skinColor: 0xf2dbb2,
    shellColor: 0xff8d2d,
    clothColor: 0xff8d2d,
    armorColor: 0xea6d18,
    trimColor: 0xfff0cf,
    coreColor: 0xffce74,
    weaponColor: 0x98551f,
    critColor: 0x362313,
    melee: true,
  },
  bruiser: {
    label: "Pomcap Brute",
    health: 166,
    speed: 4.9,
    radius: 0.92,
    hoverHeight: 0.03,
    eyeHeight: 1.42,
    preferredRange: 1.45,
    retreatRange: 0.4,
    fireInterval: 1.18,
    attackRange: 1.86,
    damage: 19,
    score: 180,
    cores: 4,
    scale: 1.28,
    skinColor: 0xf6e1ba,
    shellColor: 0xff7e24,
    clothColor: 0xff7e24,
    armorColor: 0xc95d1b,
    trimColor: 0xffedc2,
    coreColor: 0xffb860,
    weaponColor: 0x81491e,
    critColor: 0x3b2716,
    melee: true,
  },
  boss: {
    label: "Sunspore Archmage",
    health: 1280,
    speed: 3.35,
    radius: 1.18,
    hoverHeight: 0.06,
    eyeHeight: 2.28,
    preferredRange: 11.5,
    retreatRange: 5.8,
    fireInterval: 1.28,
    projectileSpeed: 19,
    projectileCount: 3,
    spread: 0.19,
    damage: 14,
    score: 1550,
    cores: 18,
    scale: 1.7,
    skinColor: 0xf9e3ba,
    shellColor: 0xff8a2f,
    clothColor: 0xff8a2f,
    armorColor: 0xd15e2e,
    trimColor: 0xffeab8,
    coreColor: 0xffd273,
    weaponColor: 0x8c4f30,
    critColor: 0x3f2819,
    magic: true,
    boss: true,
  },
};

const WEAPON_DEFS = {
  rifle: {
    label: "SOLAR VEIL RIFLE",
    magSize: 30,
    fireInterval: 0.11,
    reloadTime: 1.26,
    damage: 13,
    critDamage: 18,
    crosshairBase: 7,
    explosive: false,
    tracerColor: 0x8ef9ff,
    aimTracerColor: 0xd6ffff,
    fov: 69,
    hipFov: 82,
    accent: 0x345978,
    body: 0xd8e2ec,
    grip: 0x161c24,
  },
  lance: {
    label: "THUNDER HOWL SHOTGUN",
    magSize: 7,
    fireInterval: 0.58,
    reloadTime: 1.12,
    damage: 10,
    critDamage: 15,
    pelletCount: 12,
    spread: 0.098,
    effectiveRange: 13,
    maxRange: 28,
    crosshairBase: 13,
    explosive: false,
    tracerColor: 0xffb65b,
    aimTracerColor: 0xffe1af,
    fov: 67,
    hipFov: 82,
    accent: 0xff8d3a,
    body: 0xfff1d5,
    grip: 0x6b4223,
  },
};

const GRENADE_CONFIG = {
  max: 4,
  cooldown: 0.52,
  fuse: 1.35,
  damage: 138,
  radius: 4.2,
};

const PROGRESSION_KEY = "sunstrike-progress";
const UPGRADE_KEYS = ["damage", "reload", "shield", "mobility"];

const ui = {
  overlay: document.querySelector("#overlay"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlaySubtitle: document.querySelector("#overlay-subtitle"),
  overlayNote: document.querySelector("#overlay-note"),
  startButton: document.querySelector("#start-button"),
  wave: document.querySelector("#wave-value"),
  score: document.querySelector("#score-value"),
  best: document.querySelector("#best-value"),
  hudCores: document.querySelector("#hud-cores-value"),
  announcer: document.querySelector("#announcer"),
  objective: document.querySelector("#objective"),
  bossHud: document.querySelector("#boss-hud"),
  bossName: document.querySelector("#boss-name"),
  bossHealthText: document.querySelector("#boss-health-text"),
  bossBar: document.querySelector("#boss-bar"),
  playerVitals: document.querySelector("#player-vitals"),
  playerVitalsText: document.querySelector("#player-vitals-text"),
  playerVitalsHealth: document.querySelector("#player-vitals-health"),
  playerVitalsShield: document.querySelector("#player-vitals-shield"),
  healthBar: document.querySelector("#health-bar"),
  shieldBar: document.querySelector("#shield-bar"),
  healthText: document.querySelector("#health-text"),
  shieldText: document.querySelector("#shield-text"),
  weaponLabel: document.querySelector("#weapon-label"),
  ammo: document.querySelector("#ammo-value"),
  ammoMax: document.querySelector("#ammo-max-value"),
  reloadState: document.querySelector("#reload-state"),
  weaponSlotRifle: document.querySelector("#weapon-slot-rifle"),
  weaponSlotLance: document.querySelector("#weapon-slot-lance"),
  grenadeCount: document.querySelector("#grenade-count"),
  combo: document.querySelector("#combo-value"),
  statusNote: document.querySelector("#status-note"),
  pauseButton: document.querySelector("#pause-button"),
  minimap: document.querySelector("#minimap"),
  minimapLabel: document.querySelector("#minimap-label"),
  coresTotal: document.querySelector("#cores-total"),
  upgradeDamage: document.querySelector("#upgrade-damage"),
  upgradeReload: document.querySelector("#upgrade-reload"),
  upgradeShield: document.querySelector("#upgrade-shield"),
  upgradeMobility: document.querySelector("#upgrade-mobility"),
  upgradeDamageLevel: document.querySelector("#upgrade-damage-level"),
  upgradeReloadLevel: document.querySelector("#upgrade-reload-level"),
  upgradeShieldLevel: document.querySelector("#upgrade-shield-level"),
  upgradeMobilityLevel: document.querySelector("#upgrade-mobility-level"),
  upgradeDamageCost: document.querySelector("#upgrade-damage-cost"),
  upgradeReloadCost: document.querySelector("#upgrade-reload-cost"),
  upgradeShieldCost: document.querySelector("#upgrade-shield-cost"),
  upgradeMobilityCost: document.querySelector("#upgrade-mobility-cost"),
  crosshair: document.querySelector("#crosshair"),
  hitmarker: document.querySelector("#hitmarker"),
  damageVignette: document.querySelector("#damage-vignette"),
  damageFlash: document.querySelector("#damage-flash"),
  damageDirection: document.querySelector("#damage-direction"),
  mobileControls: document.querySelector("#mobile-controls"),
  movePad: document.querySelector("#move-pad"),
  moveKnob: document.querySelector("#move-knob"),
  lookPad: document.querySelector("#look-pad"),
  mobileFire: document.querySelector("#mobile-fire"),
  mobileAim: document.querySelector("#mobile-aim"),
  mobileJump: document.querySelector("#mobile-jump"),
  mobileReload: document.querySelector("#mobile-reload"),
  mobileSwap: document.querySelector("#mobile-swap"),
  mobileGrenade: document.querySelector("#mobile-grenade"),
  debugHud: document.querySelector("#debug-hud"),
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function midiToFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function removeFromArray(list, item) {
  const index = list.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

function wrapAngle(value) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function makeGlowTexture(inner, outer) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCanvasTexture(draw, { size = 1024, repeatX = 1, repeatY = 1 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

class AudioSystem {
  constructor() {
    this.context = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.musicFilter = null;
    this.musicReady = false;
    this.music = {
      nextStepTime: 0,
      step: 0,
      stepDuration: 0.25,
      targetGain: 0.11,
    };
    this.musicDrone = null;
    this.musicOrchestra = null;
  }

  unlock() {
    if (!this.context) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        return;
      }
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.38;
      this.master.connect(this.context.destination);

      this.sfxBus = this.context.createGain();
      this.sfxBus.gain.value = 1;
      this.sfxBus.connect(this.master);

      this.musicBus = this.context.createGain();
      this.musicBus.gain.value = 0.0001;
      this.musicFilter = this.context.createBiquadFilter();
      this.musicFilter.type = "lowpass";
      this.musicFilter.frequency.value = 1600;
      this.musicBus.connect(this.musicFilter);
      this.musicFilter.connect(this.master);
      this.initMusic();
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }

  initMusic() {
    if (!this.context || !this.musicBus || this.musicReady) {
      return;
    }

    this.musicReady = true;
    this.music.nextStepTime = this.context.currentTime + 0.08;
    this.music.step = 0;

    const droneFilter = this.context.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 260;

    const subGain = this.context.createGain();
    subGain.gain.value = 0.0001;
    const shimmerGain = this.context.createGain();
    shimmerGain.gain.value = 0.0001;

    const subOscA = this.context.createOscillator();
    subOscA.type = "sawtooth";
    subOscA.frequency.value = midiToFrequency(45);

    const subOscB = this.context.createOscillator();
    subOscB.type = "triangle";
    subOscB.frequency.value = midiToFrequency(57);

    const shimmerOsc = this.context.createOscillator();
    shimmerOsc.type = "square";
    shimmerOsc.frequency.value = midiToFrequency(69);

    subOscA.connect(subGain);
    subOscB.connect(subGain);
    subGain.connect(droneFilter);
    droneFilter.connect(this.musicBus);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.musicBus);

    subOscA.start();
    subOscB.start();
    shimmerOsc.start();

    this.musicDrone = {
      subOscA,
      subOscB,
      shimmerOsc,
      subGain,
      shimmerGain,
      filter: droneFilter,
    };

    const orchestraFilter = this.context.createBiquadFilter();
    orchestraFilter.type = "lowpass";
    orchestraFilter.frequency.value = 1800;

    const anthemGain = this.context.createGain();
    anthemGain.gain.value = 0.0001;
    const choirGain = this.context.createGain();
    choirGain.gain.value = 0.0001;

    const anthemOscA = this.context.createOscillator();
    anthemOscA.type = "sawtooth";
    anthemOscA.frequency.value = midiToFrequency(57);

    const anthemOscB = this.context.createOscillator();
    anthemOscB.type = "triangle";
    anthemOscB.frequency.value = midiToFrequency(64);

    const choirOsc = this.context.createOscillator();
    choirOsc.type = "sine";
    choirOsc.frequency.value = midiToFrequency(69);

    anthemOscA.connect(anthemGain);
    anthemOscB.connect(anthemGain);
    anthemGain.connect(orchestraFilter);
    orchestraFilter.connect(this.musicBus);

    choirOsc.connect(choirGain);
    choirGain.connect(orchestraFilter);

    anthemOscA.start();
    anthemOscB.start();
    choirOsc.start();

    this.musicOrchestra = {
      anthemOscA,
      anthemOscB,
      choirOsc,
      anthemGain,
      choirGain,
      filter: orchestraFilter,
    };
  }

  getSfxDestination() {
    return this.sfxBus || this.master;
  }

  pulse({
    frequency = 440,
    type = "sine",
    duration = 0.08,
    startGain = 0.2,
    endGain = 0.0001,
    slideTo = null,
    when = null,
    destination = null,
  }) {
    if (!this.context || !this.master) {
      return;
    }

    const now = when ?? this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(startGain, now);
    gain.gain.exponentialRampToValueAtTime(endGain, now + duration);
    osc.connect(gain);
    gain.connect(destination || this.getSfxDestination());
    osc.start(now);
    osc.stop(now + duration);
  }

  noise(duration = 0.07, startGain = 0.08, when = null, destination = null, filterType = "highpass", filterFrequency = 700) {
    if (!this.context || !this.master) {
      return;
    }

    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }

    const src = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const now = when ?? this.context.currentTime;

    src.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    gain.gain.setValueAtTime(startGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(destination || this.getSfxDestination());
    src.start(now);
    src.stop(now + duration);
  }

  shot(weaponId = "rifle") {
    const now = this.context?.currentTime ?? null;
    if (weaponId === "lance") {
      this.pulse({ frequency: 118, slideTo: 42, duration: 0.18, startGain: 0.28, type: "sawtooth", when: now });
      this.pulse({ frequency: 210, slideTo: 74, duration: 0.11, startGain: 0.15, type: "triangle", when: now });
      this.pulse({ frequency: 980, slideTo: 310, duration: 0.05, startGain: 0.11, type: "square", when: now });
      this.noise(0.11, 0.13, now, null, "bandpass", 1650);
      this.noise(0.18, 0.045, now ? now + 0.02 : null, null, "lowpass", 720);
      return;
    }

    this.pulse({ frequency: 540, slideTo: 180, duration: 0.06, startGain: 0.09, type: "square", when: now });
    this.pulse({ frequency: 240, slideTo: 120, duration: 0.08, startGain: 0.06, type: "triangle", when: now });
    this.noise(0.045, 0.05, now, null, "highpass", 2200);
  }

  reload(weaponId = "rifle") {
    if (weaponId === "rifle") {
      this.pulse({ frequency: 420, slideTo: 160, duration: 0.16, startGain: 0.08, type: "triangle" });
      this.pulse({ frequency: 220, slideTo: 540, duration: 0.13, startGain: 0.06, type: "sine" });
      return;
    }

    this.pulse({ frequency: 540, slideTo: 220, duration: 0.11, startGain: 0.08, type: "triangle" });
    this.pulse({ frequency: 360, slideTo: 640, duration: 0.09, startGain: 0.05, type: "sine" });
  }

  pump() {
    this.pulse({ frequency: 240, slideTo: 110, duration: 0.08, startGain: 0.08, type: "triangle" });
    this.noise(0.05, 0.03, null, null, "bandpass", 2100);
    this.pulse({ frequency: 620, slideTo: 360, duration: 0.04, startGain: 0.03, type: "square" });
  }

  hit() {
    this.pulse({ frequency: 920, slideTo: 680, duration: 0.045, startGain: 0.07, type: "square" });
  }

  crit() {
    this.pulse({ frequency: 1180, slideTo: 820, duration: 0.065, startGain: 0.1, type: "square" });
    this.pulse({ frequency: 660, slideTo: 460, duration: 0.08, startGain: 0.06, type: "triangle" });
  }

  enemyDown() {
    this.pulse({ frequency: 240, slideTo: 70, duration: 0.18, startGain: 0.1, type: "sawtooth" });
    this.noise(0.1, 0.06);
  }

  bossDown() {
    this.pulse({ frequency: 160, slideTo: 42, duration: 0.4, startGain: 0.16, type: "sawtooth" });
    this.pulse({ frequency: 420, slideTo: 120, duration: 0.3, startGain: 0.1, type: "triangle" });
    this.noise(0.2, 0.08);
  }

  bossIncoming() {
    this.pulse({ frequency: 210, slideTo: 96, duration: 0.34, startGain: 0.18, type: "sawtooth" });
    this.pulse({ frequency: 460, slideTo: 180, duration: 0.4, startGain: 0.12, type: "square" });
    this.noise(0.16, 0.055, null, null, "bandpass", 980);
  }

  kick(when, gain = 0.18) {
    this.pulse({
      frequency: 56,
      slideTo: 28,
      duration: 0.24,
      startGain: gain,
      type: "sine",
      when,
      destination: this.musicBus,
    });
    this.pulse({
      frequency: 112,
      slideTo: 62,
      duration: 0.09,
      startGain: gain * 0.22,
      type: "triangle",
      when,
      destination: this.musicBus,
    });
  }

  grandHit(when, gain = 0.09, boss = false) {
    this.pulse({
      frequency: boss ? 82 : 74,
      slideTo: 34,
      duration: boss ? 0.48 : 0.38,
      startGain: gain * 1.15,
      type: "sawtooth",
      when,
      destination: this.musicBus,
    });
    this.pulse({
      frequency: boss ? 392 : 330,
      slideTo: boss ? 494 : 392,
      duration: 0.34,
      startGain: gain * 0.46,
      type: "triangle",
      when,
      destination: this.musicBus,
    });
    this.noise(
      boss ? 0.24 : 0.18,
      gain * 0.2,
      when,
      this.musicBus,
      "bandpass",
      boss ? 1400 : 1100,
    );
  }

  enemyShot() {
    this.pulse({ frequency: 300, slideTo: 520, duration: 0.09, startGain: 0.05, type: "triangle" });
  }

  playerHit() {
    this.pulse({ frequency: 180, slideTo: 120, duration: 0.16, startGain: 0.09, type: "sawtooth" });
    this.noise(0.09, 0.04);
  }

  waveClear() {
    this.pulse({ frequency: 420, slideTo: 840, duration: 0.18, startGain: 0.06, type: "triangle" });
    this.pulse({ frequency: 530, slideTo: 1020, duration: 0.22, startGain: 0.05, type: "sine" });
  }

  scheduleMusicNote({
    note,
    when,
    duration,
    gain = 0.05,
    type = "triangle",
    destination = null,
    slideTo = null,
  }) {
    this.pulse({
      frequency: midiToFrequency(note),
      when,
      duration,
      startGain: gain,
      endGain: 0.0001,
      type,
      slideTo: slideTo ? midiToFrequency(slideTo) : null,
      destination: destination || this.musicBus,
    });
  }

  scheduleMusicStep(step, when, state, stepDuration) {
    if (!this.musicBus) {
      return;
    }

    const progression = state.boss
      ? [
          [45, 48, 52, 57],
          [43, 46, 50, 55],
          [41, 45, 48, 53],
          [46, 50, 53, 58],
        ]
      : [
          [45, 48, 52, 57],
          [41, 45, 48, 53],
          [36, 40, 43, 48],
          [43, 47, 50, 55],
        ];
    const chord = progression[Math.floor(step / 4) % progression.length];
    const arpPattern = state.boss
      ? [0, 2, 1, 3, 2, 1, 0, 2, 1, 3, 2, 1, 0, 2, 1, 3]
      : [0, 2, 1, 2, 0, 2, 1, 3, 0, 2, 1, 2, 0, 2, 1, 3];
    const bassSteps = state.boss ? [0, 3, 4, 7, 8, 11, 12, 15] : [0, 4, 8, 12];
    const snareSteps = state.boss ? [2, 6, 10, 14] : [4, 12];

    if (step % 4 === 0) {
      this.kick(when, state.boss ? 0.24 : 0.16 + state.intensity * 0.07);
    } else if (state.boss && step % 2 === 0) {
      this.kick(when, 0.12);
    }

    if (step % 8 === 0) {
      this.grandHit(when, state.boss ? 0.14 : 0.08 + state.intensity * 0.035, state.boss);
    }

    if (step % 8 === 0) {
      this.scheduleMusicNote({
        note: chord[0] - 12,
        when,
        duration: stepDuration * 7.4,
        gain: state.boss ? 0.074 : 0.056,
        type: "sine",
      });
      this.scheduleMusicNote({
        note: chord[2],
        when,
        duration: stepDuration * 6.2,
        gain: state.boss ? 0.042 : 0.032,
        type: "triangle",
      });
      this.scheduleMusicNote({
        note: chord[3] + (state.boss ? 12 : 7),
        when,
        duration: stepDuration * (state.boss ? 7.8 : 7.2),
        gain: state.boss ? 0.06 : 0.038 + state.intensity * 0.02,
        type: state.boss ? "sawtooth" : "triangle",
      });
    }

    if (bassSteps.includes(step % 16)) {
      this.scheduleMusicNote({
        note: chord[0] - 12,
        when,
        duration: stepDuration * (state.boss ? 1.35 : 1.7),
        gain: state.boss ? 0.12 : 0.092,
        type: state.boss ? "sawtooth" : "triangle",
        slideTo: chord[0] - 24,
      });
    }

    const arpNote = chord[arpPattern[step % arpPattern.length]];
    this.scheduleMusicNote({
      note: arpNote + (state.boss ? 12 : 0),
      when,
      duration: stepDuration * 0.9,
      gain: 0.052 + state.intensity * 0.03,
      type: state.boss ? "square" : "triangle",
    });

    if (state.intensity > 0.45 || state.boss) {
      this.scheduleMusicNote({
        note: chord[(step + 1) % chord.length] + (state.boss ? 19 : 12),
        when,
        duration: stepDuration * 1.35,
        gain: state.boss ? 0.064 : 0.026 + state.intensity * 0.026,
        type: state.boss ? "sawtooth" : "sine",
      });
    }

    if (state.intensity > 0.25 || state.boss) {
      this.noise(
        stepDuration * 0.22,
        state.boss ? 0.032 : 0.022,
        when,
        this.musicBus,
        "bandpass",
        state.boss ? 5200 : 4200,
      );
    }

    if (snareSteps.includes(step % 16)) {
      this.noise(
        stepDuration * 0.38,
        state.boss ? 0.05 : 0.038,
        when,
        this.musicBus,
        "highpass",
        1800,
      );
    }
  }

  updateMusic(state) {
    if (!this.context || !this.musicBus || !this.musicReady) {
      return;
    }

    const now = this.context.currentTime;
    const paused = !state.started || state.gameOver || state.paused;
    const bpm = state.boss ? 148 : state.intensity > 0.72 ? 136 : state.intensity > 0.3 ? 124 : 112;
    const stepDuration = 60 / bpm / 4;
    const targetGain = paused ? 0.008 : state.boss ? 0.38 : 0.19 + state.intensity * 0.16;
    const targetFilter = paused ? 1200 : state.boss ? 3600 : 2100 + state.intensity * 1600;

    this.music.stepDuration = stepDuration;
    this.music.targetGain = targetGain;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, now);
    this.musicBus.gain.linearRampToValueAtTime(targetGain, now + 0.24);

    this.musicFilter.frequency.cancelScheduledValues(now);
    this.musicFilter.frequency.setValueAtTime(this.musicFilter.frequency.value, now);
    this.musicFilter.frequency.linearRampToValueAtTime(targetFilter, now + 0.3);

    if (this.musicDrone) {
      const rootProgression = state.boss ? [45, 43, 48, 50] : [45, 43, 50, 48];
      const root = rootProgression[(state.wave + Math.floor(this.music.step / 4)) % rootProgression.length];
      const droneBase = paused ? 0.0001 : state.boss ? 0.115 : 0.065 + state.intensity * 0.05;
      const shimmerBase = paused ? 0.0001 : state.boss ? 0.052 : 0.022 + state.intensity * 0.024;

      this.musicDrone.subOscA.frequency.cancelScheduledValues(now);
      this.musicDrone.subOscA.frequency.linearRampToValueAtTime(midiToFrequency(root - 12), now + 0.4);
      this.musicDrone.subOscB.frequency.cancelScheduledValues(now);
      this.musicDrone.subOscB.frequency.linearRampToValueAtTime(midiToFrequency(root), now + 0.4);
      this.musicDrone.shimmerOsc.frequency.cancelScheduledValues(now);
      this.musicDrone.shimmerOsc.frequency.linearRampToValueAtTime(midiToFrequency(root + (state.boss ? 19 : 12)), now + 0.4);

      this.musicDrone.subGain.gain.cancelScheduledValues(now);
      this.musicDrone.subGain.gain.setValueAtTime(this.musicDrone.subGain.gain.value, now);
      this.musicDrone.subGain.gain.linearRampToValueAtTime(droneBase, now + 0.28);

      this.musicDrone.shimmerGain.gain.cancelScheduledValues(now);
      this.musicDrone.shimmerGain.gain.setValueAtTime(this.musicDrone.shimmerGain.gain.value, now);
      this.musicDrone.shimmerGain.gain.linearRampToValueAtTime(shimmerBase, now + 0.28);

      this.musicDrone.filter.frequency.cancelScheduledValues(now);
      this.musicDrone.filter.frequency.setValueAtTime(this.musicDrone.filter.frequency.value, now);
      this.musicDrone.filter.frequency.linearRampToValueAtTime(
        paused ? 220 : state.boss ? 520 : 280 + state.intensity * 220,
        now + 0.32,
      );
    }

    if (this.musicOrchestra) {
      const rootProgression = state.boss ? [57, 55, 60, 62] : [57, 55, 62, 60];
      const root = rootProgression[(state.wave + Math.floor(this.music.step / 4)) % rootProgression.length];
      const anthemBase = paused ? 0.0001 : state.boss ? 0.06 : 0.026 + state.intensity * 0.036;
      const choirBase = paused ? 0.0001 : state.boss ? 0.04 : 0.012 + state.intensity * 0.024;

      this.musicOrchestra.anthemOscA.frequency.cancelScheduledValues(now);
      this.musicOrchestra.anthemOscA.frequency.linearRampToValueAtTime(midiToFrequency(root), now + 0.42);
      this.musicOrchestra.anthemOscB.frequency.cancelScheduledValues(now);
      this.musicOrchestra.anthemOscB.frequency.linearRampToValueAtTime(midiToFrequency(root + 7), now + 0.42);
      this.musicOrchestra.choirOsc.frequency.cancelScheduledValues(now);
      this.musicOrchestra.choirOsc.frequency.linearRampToValueAtTime(midiToFrequency(root + (state.boss ? 14 : 12)), now + 0.42);

      this.musicOrchestra.anthemGain.gain.cancelScheduledValues(now);
      this.musicOrchestra.anthemGain.gain.setValueAtTime(this.musicOrchestra.anthemGain.gain.value, now);
      this.musicOrchestra.anthemGain.gain.linearRampToValueAtTime(anthemBase, now + 0.32);

      this.musicOrchestra.choirGain.gain.cancelScheduledValues(now);
      this.musicOrchestra.choirGain.gain.setValueAtTime(this.musicOrchestra.choirGain.gain.value, now);
      this.musicOrchestra.choirGain.gain.linearRampToValueAtTime(choirBase, now + 0.32);

      this.musicOrchestra.filter.frequency.cancelScheduledValues(now);
      this.musicOrchestra.filter.frequency.setValueAtTime(this.musicOrchestra.filter.frequency.value, now);
      this.musicOrchestra.filter.frequency.linearRampToValueAtTime(
        paused ? 900 : state.boss ? 2600 : 1800 + state.intensity * 900,
        now + 0.36,
      );
    }

    if (this.music.nextStepTime < now) {
      this.music.nextStepTime = now + 0.04;
    }

    while (this.music.nextStepTime < now + 0.32) {
      this.scheduleMusicStep(this.music.step, this.music.nextStepTime, state, stepDuration);
      this.music.nextStepTime += stepDuration;
      this.music.step = (this.music.step + 1) % 16;
    }
  }
}

class Enemy {
  constructor(game, typeName, spawnPosition) {
    this.game = game;
    this.typeName = typeName;
    this.type = ENEMY_TYPES[typeName];
    this.health = this.type.health;
    this.maxHealth = this.type.health;
    this.radius = this.type.radius;
    this.hoverTime = rand(0, Math.PI * 2);
    this.fireCooldown = rand(0.35, 0.8);
    this.alive = true;
    this.recoil = 0;
    this.hitFlash = 0;
    this.moveBlend = 0;
    this.hitMeshes = [];
    this.group = new THREE.Group();
    this.group.position.copy(spawnPosition);
    this.group.position.y = 0;
    this.buildMesh();
    this.game.scene.add(this.group);
  }

  buildMesh() {
    const { scale, skinColor, clothColor, armorColor, trimColor, coreColor, weaponColor, critColor } = this.type;
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.86,
      metalness: 0.02,
    });
    const capMaterial = new THREE.MeshStandardMaterial({
      color: clothColor,
      emissive: armorColor,
      emissiveIntensity: this.type.boss ? 0.18 : 0.08,
      roughness: 0.54,
      metalness: 0.08,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: trimColor,
      emissive: trimColor,
      emissiveIntensity: 0.16,
      roughness: 0.22,
      metalness: 0.04,
    });
    const limbMaterial = new THREE.MeshStandardMaterial({
      color: weaponColor,
      roughness: 0.74,
      metalness: 0.04,
    });
    const magicMaterial = new THREE.MeshStandardMaterial({
      color: coreColor,
      emissive: coreColor,
      emissiveIntensity: this.type.boss ? 1.25 : 0.54,
      roughness: 0.08,
      metalness: 0.04,
    });
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: critColor,
      emissive: critColor,
      emissiveIntensity: 0.16,
      roughness: 0.7,
      metalness: 0,
    });

    this.bodyPivot = new THREE.Group();
    this.bodyPivot.position.y = this.type.hoverHeight;
    this.group.add(this.bodyPivot);

    this.torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24 * scale, 0.34 * scale, this.type.boss ? 1.54 * scale : 1.02 * scale, 14),
      stemMaterial,
    );
    this.torso.position.y = this.type.boss ? 1.08 * scale : 0.92 * scale;

    this.chest = new THREE.Mesh(new THREE.SphereGeometry((this.type.boss ? 0.58 : 0.42) * scale, 18, 18), stemMaterial);
    this.chest.position.set(0, this.type.boss ? 1.42 * scale : 1.14 * scale, 0.04 * scale);
    this.chest.scale.set(1.06, 0.92, 0.88);

    const belly = new THREE.Mesh(
      new THREE.SphereGeometry((this.type.boss ? 0.34 : 0.28) * scale, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xffefdd,
        roughness: 0.88,
        metalness: 0,
      }),
    );
    belly.position.set(0, this.type.boss ? 1.06 * scale : 0.92 * scale, -0.16 * scale);
    belly.scale.set(1, 0.74, 0.42);

    this.head = new THREE.Mesh(
      new THREE.SphereGeometry((this.type.boss ? 0.9 : this.typeName === "bruiser" ? 0.72 : 0.58) * scale, 22, 18),
      capMaterial,
    );
    this.head.position.set(0, this.type.boss ? 2.08 * scale : 1.72 * scale, 0);
    this.head.scale.set(1.28, this.type.boss ? 0.82 : 0.72, 1.28);

    const capRim = new THREE.Mesh(
      new THREE.TorusGeometry((this.type.boss ? 0.92 : 0.7) * scale, 0.11 * scale, 12, 26),
      capMaterial,
    );
    capRim.position.set(0, this.type.boss ? 1.88 * scale : 1.56 * scale, 0.02 * scale);
    capRim.rotation.x = Math.PI / 2;

    const gills = new THREE.Mesh(
      new THREE.CylinderGeometry((this.type.boss ? 0.62 : 0.48) * scale, (this.type.boss ? 0.72 : 0.56) * scale, 0.14 * scale, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfff6e7,
        roughness: 0.9,
        metalness: 0,
      }),
    );
    gills.position.set(0, this.type.boss ? 1.86 * scale : 1.5 * scale, 0.02 * scale);

    const spotCount = this.type.boss ? 8 : this.typeName === "bruiser" ? 6 : 4;
    for (let i = 0; i < spotCount; i += 1) {
      const spot = new THREE.Mesh(
        new THREE.SphereGeometry(rand(0.08, 0.18) * scale, 10, 10),
        trimMaterial,
      );
      const angle = (Math.PI * 2 * i) / spotCount;
      const radius = rand(0.14, 0.42) * scale;
      spot.position.set(Math.cos(angle) * radius, this.head.position.y + rand(0.06, 0.24) * scale, Math.sin(angle) * radius);
      spot.scale.y = rand(0.4, 0.75);
      this.bodyPivot.add(spot);
    }

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.06 * scale, 10, 10), eyeMaterial);
    leftEye.position.set(-0.16 * scale, this.type.boss ? 1.72 * scale : 1.42 * scale, -0.42 * scale);
    const rightEye = leftEye.clone();
    rightEye.position.x *= -1;
    const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 10, 10), trimMaterial);
    leftCheek.position.set(-0.22 * scale, this.type.boss ? 1.58 * scale : 1.3 * scale, -0.36 * scale);
    const rightCheek = leftCheek.clone();
    rightCheek.position.x *= -1;

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(0.34 * scale, this.type.boss ? 1.48 * scale : 1.18 * scale, -0.04 * scale);
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(-0.34 * scale, this.type.boss ? 1.48 * scale : 1.18 * scale, -0.04 * scale);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.1 * scale, 0.54 * scale, 10), stemMaterial);
    leftArm.position.y = -0.28 * scale;
    leftArm.rotation.z = -0.22;
    const rightArm = leftArm.clone();
    rightArm.rotation.z = 0.22;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale, 10, 10), limbMaterial);
    leftHand.position.set(0, -0.56 * scale, 0.02 * scale);
    const rightHand = leftHand.clone();
    this.leftArmPivot.add(leftArm, leftHand);
    this.rightArmPivot.add(rightArm, rightHand);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(0.18 * scale, 0.5 * scale, -0.08 * scale);
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(-0.18 * scale, 0.5 * scale, -0.08 * scale);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.14 * scale, 0.52 * scale, 10), stemMaterial);
    leftLeg.position.y = -0.24 * scale;
    const rightLeg = leftLeg.clone();
    const leftFoot = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 12, 12), limbMaterial);
    leftFoot.position.set(0.02 * scale, -0.54 * scale, -0.08 * scale);
    leftFoot.scale.set(1.18, 0.64, 1.36);
    const rightFoot = leftFoot.clone();
    rightFoot.position.x *= -1;
    this.leftLegPivot.add(leftLeg, leftFoot);
    this.rightLegPivot.add(rightLeg, rightFoot);

    this.bodyPivot.add(
      this.torso,
      this.chest,
      belly,
      this.head,
      capRim,
      gills,
      leftEye,
      rightEye,
      leftCheek,
      rightCheek,
      this.leftArmPivot,
      this.rightArmPivot,
      this.leftLegPivot,
      this.rightLegPivot,
    );

    if (this.type.boss) {
      this.robe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.98 * scale, 0.62 * scale, 1.72 * scale, 16),
        new THREE.MeshStandardMaterial({
          color: armorColor,
          emissive: coreColor,
          emissiveIntensity: 0.08,
          roughness: 0.54,
          metalness: 0.06,
          transparent: true,
          opacity: 0.92,
        }),
      );
      this.robe.position.y = 1.18 * scale;
      this.robe.scale.z = 0.84;
      this.bodyPivot.add(this.robe);

      const mantle = new THREE.Mesh(new THREE.TorusGeometry(0.64 * scale, 0.08 * scale, 10, 28), trimMaterial);
      mantle.position.y = 1.82 * scale;
      mantle.rotation.x = Math.PI / 2;
      this.bodyPivot.add(mantle);

      this.staffCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.2 * scale, 0), magicMaterial);
      this.staffCrystal.position.set(0, -1.34 * scale, 0.04 * scale);

      this.staffRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.3 * scale, 0.035 * scale, 8, 22),
        new THREE.MeshBasicMaterial({
          color: coreColor,
          transparent: true,
          opacity: 0.82,
        }),
      );
      this.staffRing.position.set(0, -1.22 * scale, 0.04 * scale);
      this.staffRing.rotation.x = Math.PI / 2;

      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 1.7 * scale, 10), limbMaterial);
      staff.position.y = -0.82 * scale;
      staff.rotation.z = 0.08;
      this.rightArmPivot.add(staff, this.staffRing, this.staffCrystal);

      const focusOrb = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 12, 12), magicMaterial);
      focusOrb.position.y = -0.62 * scale;
      this.leftArmPivot.add(focusOrb);
      this.focusOrb = focusOrb;

      this.bossHalo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.game.glowTextures.orange,
          color: coreColor,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.62,
        }),
      );
      this.bossHalo.position.y = 2.74 * scale;
      this.bossHalo.scale.setScalar(2.24 * scale);
      this.bodyPivot.add(this.bossHalo);
    } else {
      const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * scale, 0.04 * scale, 0.86 * scale, 8), limbMaterial);
      haft.position.y = -0.54 * scale;
      this.rightArmPivot.add(haft);

      if (this.typeName === "bruiser") {
        this.weaponHead = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 12, 12), trimMaterial);
        this.weaponHead.position.set(0.04 * scale, -0.98 * scale, 0.08 * scale);
        this.weaponHead.scale.set(1.2, 0.84, 1.2);
      } else if (this.typeName === "striker") {
        this.weaponHead = new THREE.Mesh(new THREE.ConeGeometry(0.12 * scale, 0.42 * scale, 8), trimMaterial);
        this.weaponHead.position.set(0.02 * scale, -0.98 * scale, 0.08 * scale);
        this.weaponHead.rotation.z = 0.22;
      } else {
        this.weaponHead = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 0.28 * scale, 0.18 * scale), trimMaterial);
        this.weaponHead.position.set(0.02 * scale, -0.9 * scale, 0.08 * scale);
      }
      this.rightArmPivot.add(this.weaponHead);
    }

    this.weaponTip = new THREE.Object3D();
    this.weaponTip.position.set(0, this.type.boss ? -1.42 * scale : -0.96 * scale, 0.08 * scale);
    this.rightArmPivot.add(this.weaponTip);

    this.registerHitMesh(this.torso, false);
    this.registerHitMesh(this.chest, false);
    this.registerHitMesh(this.head, true);
    if (this.weaponHead) {
      this.registerHitMesh(this.weaponHead, false);
    }
    if (this.staffCrystal) {
      this.registerHitMesh(this.staffCrystal, false);
    }

    this.group.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }

  registerHitMesh(mesh, crit) {
    mesh.userData.enemy = this;
    mesh.userData.crit = crit;
    this.hitMeshes.push(mesh);
    this.game.enemyRaycastMeshes.push(mesh);
  }

  getEyePosition() {
    if (this.head) {
      return this.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.04 * this.type.scale, 0.04 * this.type.scale));
    }
    return this.group.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, this.type.eyeHeight, 0));
  }

  getWeaponPosition() {
    if (this.weaponTip) {
      return this.weaponTip.getWorldPosition(new THREE.Vector3());
    }
    return this.getEyePosition();
  }

  hasLineOfSight() {
    const origin = this.getEyePosition();
    const target = this.game.getPlayerEyePosition();
    const direction = target.clone().sub(origin);
    const distance = direction.length();
    direction.normalize();
    const raycaster = new THREE.Raycaster(origin, direction, 0, Math.max(distance - 0.55, 0));
    return raycaster.intersectObjects(this.game.environmentRaycastMeshes, false).length === 0;
  }

  update(dt) {
    if (!this.alive) {
      return;
    }

    const playerPosition = this.game.playerObject.position;
    const playerEye = this.game.getPlayerEyePosition();
    this.hoverTime += dt * (1.8 + this.type.scale * 0.25);
    this.recoil = THREE.MathUtils.damp(this.recoil, 0, 9, dt);
    this.hitFlash = THREE.MathUtils.damp(this.hitFlash, 0, 8, dt);

    const toPlayer = playerPosition.clone().sub(this.group.position);
    toPlayer.y = 0;
    const distance = Math.max(0.0001, toPlayer.length());
    const verticalGap = Math.abs(playerEye.y - this.getEyePosition().y);
    toPlayer.normalize();
    const canSeePlayer = this.hasLineOfSight();
    const strafe = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).multiplyScalar(Math.sin(this.hoverTime * 1.4 + this.type.scale) > 0 ? 1 : -1);
    const desired = new THREE.Vector3();

    if (this.type.melee) {
      if (distance > this.type.attackRange * 0.62) {
        desired.add(toPlayer);
      } else {
        desired.addScaledVector(strafe, this.typeName === "striker" ? 0.65 : 0.3);
      }
      if (!canSeePlayer) {
        desired.addScaledVector(toPlayer, 1.1);
      }
    } else {
      if (distance > this.type.preferredRange) {
        desired.add(toPlayer);
      }
      if (distance < this.type.retreatRange) {
        desired.addScaledVector(toPlayer, -1.3);
      } else {
        desired.addScaledVector(strafe, 0.78);
      }
      if (!canSeePlayer) {
        desired.addScaledVector(toPlayer, 0.95);
      }
    }

    let moveAmount = 0;
    if (desired.lengthSq() > 0.001) {
      const pressureBoost = this.type.melee ? clamp((7.2 - distance) / 7.2, 0, 1) : 0;
      const moveSpeed = this.type.speed * (1 + pressureBoost * 0.38 + (this.typeName === "striker" ? 0.12 : 0));
      desired.normalize().multiplyScalar(moveSpeed * dt);
      const previous = this.group.position.clone();
      const next = this.group.position.clone().add(desired);
      this.game.resolveCircleCollisions(next, this.radius);

      for (const other of this.game.enemies) {
        if (other === this || !other.alive) {
          continue;
        }
        const dx = next.x - other.group.position.x;
        const dz = next.z - other.group.position.z;
        const minDist = this.radius + other.radius + 0.22;
        const distSq = dx * dx + dz * dz;
        if (distSq > 0 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const push = (minDist - dist) * 0.5;
          next.x += (dx / dist) * push;
          next.z += (dz / dist) * push;
        }
      }

      this.group.position.x = next.x;
      this.group.position.z = next.z;
      moveAmount = previous.distanceTo(next) / Math.max(this.type.speed * dt, 0.001);
    }
    this.moveBlend = THREE.MathUtils.damp(this.moveBlend, clamp(moveAmount, 0, 1), 8, dt);

    this.group.lookAt(playerPosition.x, this.type.eyeHeight * 0.72, playerPosition.z);

    const gaitSpeed = this.type.boss ? 3.2 : 8.8;
    const gait = this.hoverTime * gaitSpeed;
    const legSwing = Math.sin(gait) * 0.58 * this.moveBlend;
    const armSwing = Math.sin(gait + Math.PI) * 0.42 * this.moveBlend;
    const bob = Math.abs(Math.sin(gait * 0.5)) * 0.08 * this.moveBlend;
    const attackBlend = clamp(this.recoil, 0, 1);

    this.bodyPivot.position.y = this.type.hoverHeight + bob;
    this.bodyPivot.rotation.z = Math.sin(this.hoverTime * 1.8) * 0.04 + this.hitFlash * 0.05;
    this.bodyPivot.rotation.x = (this.type.boss ? -0.08 : 0.03) + this.hitFlash * 0.06;
    this.bodyPivot.scale.setScalar(1 + this.hitFlash * 0.04);

    this.leftLegPivot.rotation.x = legSwing;
    this.rightLegPivot.rotation.x = -legSwing;
    this.leftArmPivot.rotation.x = this.type.boss ? -0.28 + Math.sin(this.hoverTime * 2.2) * 0.08 : armSwing;
    this.rightArmPivot.rotation.x = this.type.boss ? -0.52 - attackBlend * 0.34 : -armSwing - attackBlend * 0.95;
    this.leftArmPivot.rotation.z = this.type.boss ? 0.14 : 0.06;
    this.rightArmPivot.rotation.z = this.type.boss ? -0.16 : -0.12;
    this.head.rotation.y = Math.sin(this.hoverTime * 0.75) * 0.08;
    this.head.rotation.x = this.type.boss ? 0.12 : 0.05;
    this.head.scale.set(
      0.92 + this.hitFlash * 0.03,
      1.04 + this.hitFlash * 0.03,
      0.9 + this.hitFlash * 0.03,
    );

    if (this.robe) {
      this.robe.rotation.y += dt * 0.2;
      this.robe.scale.x = 1 + Math.sin(this.hoverTime * 1.6) * 0.02;
      this.robe.scale.z = 0.92 + Math.cos(this.hoverTime * 1.4) * 0.02;
    }
    if (this.staffRing) {
      this.staffRing.rotation.z += dt * 1.8;
      this.staffRing.rotation.y += dt * 2.2;
      this.staffRing.material.opacity = 0.52 + attackBlend * 0.22 + Math.sin(this.hoverTime * 3.8) * 0.08;
    }
    if (this.staffCrystal) {
      this.staffCrystal.rotation.y += dt * 1.8;
      this.staffCrystal.rotation.z += dt * 0.8;
      this.staffCrystal.material.emissiveIntensity = 0.9 + attackBlend * 0.8 + Math.sin(this.hoverTime * 5.2) * 0.16;
    }
    if (this.focusOrb) {
      this.focusOrb.scale.setScalar(0.9 + Math.sin(this.hoverTime * 4.2) * 0.08 + attackBlend * 0.08);
    }
    if (this.bossHalo) {
      this.bossHalo.material.opacity = 0.42 + Math.sin(this.hoverTime * 2.4) * 0.1 + attackBlend * 0.18;
      this.bossHalo.scale.setScalar((1.75 + Math.sin(this.hoverTime * 2.1) * 0.1) * this.type.scale);
    }

    this.fireCooldown -= dt;
    if (this.type.melee) {
      if (distance < this.type.attackRange && verticalGap < 1.18 && this.fireCooldown <= 0 && canSeePlayer) {
        this.performMeleeAttack();
      }
      return;
    }

    if (distance < 22 && verticalGap < 4.8 && this.fireCooldown <= 0 && canSeePlayer) {
      this.fire();
    }
  }

  performMeleeAttack() {
    this.fireCooldown = this.type.fireInterval * rand(0.88, 1.16);
    this.recoil = 1.1;
    this.game.audio.enemyShot();
    this.game.spawnImpact(this.getWeaponPosition(), this.type.trimColor, this.typeName === "bruiser" ? 10 : 6, 4);
    this.game.damagePlayer(this.type.damage, this.group.position);
  }

  fire() {
    const origin = this.getWeaponPosition();
    const target = this.game.getPlayerEyePosition().clone();
    const targetOffset = clamp(this.group.position.distanceTo(this.game.playerObject.position) / 24, 0.08, 0.18);
    target.x += rand(-targetOffset, targetOffset);
    target.y += rand(-targetOffset * 0.45, targetOffset * 0.45);
    target.z += rand(-targetOffset, targetOffset);
    const baseDirection = target.sub(origin).normalize();
    const projectileCount = this.type.projectileCount || 1;
    for (let i = 0; i < projectileCount; i += 1) {
      const direction = baseDirection.clone();
      if (projectileCount > 1) {
        const spread = this.type.spread || 0.08;
        const t = projectileCount === 1 ? 0 : i / (projectileCount - 1);
        direction.applyAxisAngle(UP, (t - 0.5) * spread);
        direction.y += (t - 0.5) * spread * 0.35;
        direction.normalize();
      }
      this.game.spawnEnemyBolt(origin, direction, this.type);
    }
    this.game.spawnMagicBurst(origin, this.type.coreColor, 0.55);
    this.game.audio.enemyShot();
    this.fireCooldown = this.type.fireInterval * rand(0.88, 1.12);
    this.recoil = 1;
  }

  takeDamage(amount, hitPoint, crit) {
    if (!this.alive) {
      return;
    }

    this.health -= amount;
    this.hitFlash = crit ? 1 : 0.6;
    this.recoil = 0.9;
    this.game.spawnImpact(hitPoint, crit ? 0xfff0b5 : this.type.trimColor, crit ? 12 : 8, crit ? 8 : 5);
    if (crit) {
      this.game.audio.crit();
      this.game.showAnnouncement("CRITICAL HIT", 0.32, "#fff2af");
    } else {
      this.game.audio.hit();
    }

    if (this.health <= 0) {
      this.destroy(true);
    }
  }

  destroy(scored = false) {
    if (!this.alive) {
      return;
    }

    this.alive = false;
    for (const mesh of this.hitMeshes) {
      removeFromArray(this.game.enemyRaycastMeshes, mesh);
    }
    this.game.scene.remove(this.group);
    removeFromArray(this.game.enemies, this);
    if (this.game.bossEnemy === this) {
      this.game.bossEnemy = null;
    }

    const burstPoint = this.group.position.clone().add(new THREE.Vector3(0, this.type.eyeHeight * 0.45, 0));
    this.game.spawnExplosion(burstPoint, this.type.coreColor, this.type.boss ? 28 : 18, this.type.scale);
    if (this.type.boss) {
      this.game.audio.bossDown();
    } else {
      this.game.audio.enemyDown();
    }
    if (scored) {
      this.game.onEnemyKilled(this);
    }
  }
}

class Game {
  constructor() {
    this.canvas = document.querySelector("#game");
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x86d7ff);
    this.scene.fog = new THREE.Fog(0x90dbff, 82, 232);
    this.isTouchDevice =
      window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      "ontouchstart" in window;
    this.lowSpecMode = this.isTouchDevice || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    this.useComposer = !this.lowSpecMode;
    this.renderPixelRatio = Math.min(window.devicePixelRatio || 1, this.lowSpecMode ? 1.1 : 1.75);
    const { width: viewportWidth, height: viewportHeight } = this.updateViewportMetrics();

    this.camera = new THREE.PerspectiveCamera(82, viewportWidth / viewportHeight, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.lowSpecMode,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.canvas.tabIndex = 0;
    this.renderer.setPixelRatio(this.renderPixelRatio);
    this.renderer.setSize(viewportWidth, viewportHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.lowSpecMode ? 1 : 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.lowSpecMode ? THREE.BasicShadowMap : THREE.PCFShadowMap;

    this.controls = this.createDesktopControls();
    this.playerObject = new THREE.Group();
    this.cameraPitchPivot = new THREE.Group();
    this.cameraPitchPivot.add(this.camera);
    this.playerObject.add(this.cameraPitchPivot);
    this.scene.add(this.playerObject);

    this.composer = null;
    this.bloomPass = null;
    if (this.useComposer) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.setPixelRatio(this.renderPixelRatio);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(viewportWidth, viewportHeight),
        0.08,
        0.12,
        1.08,
      );
      this.composer.addPass(this.bloomPass);
    }

    this.audio = new AudioSystem();
    document.body.classList.toggle("touch-mode", this.isTouchDevice);
    this.minimapContext = ui.minimap.getContext("2d");
    this.minimapRefreshTimer = 0;
    this.glowTextures = {
      cyan: makeGlowTexture("rgba(255,255,255,0.95)", "rgba(70, 226, 255, 0)"),
      orange: makeGlowTexture("rgba(255,245,214,0.96)", "rgba(255, 177, 86, 0)"),
      sun: makeGlowTexture("rgba(255,255,255,0.96)", "rgba(255, 234, 162, 0)"),
      smoke: makeGlowTexture("rgba(255,255,255,0.44)", "rgba(255,255,255,0)"),
    };
    this.worldMaterials = this.createWorldMaterials();

    this.environmentRaycastMeshes = [];
    this.cameraCollisionMeshes = [];
    this.enemyRaycastMeshes = [];
    this.collisionVolumes = [];
    this.walkSurfaces = [];
    this.enemies = [];
    this.projectiles = [];
    this.grenades = [];
    this.effects = [];
    this.spawnPads = [];
    this.clouds = [];
    this.decorAnimations = [];

    this.keys = {};
    this.mouseDown = false;
    this.aimDownSights = false;
    this.lookAngles = {
      yaw: 0,
      pitch: 0,
    };
    this.viewRecoil = {
      pitch: 0,
      yaw: 0,
      roll: 0,
    };
    this.mobileInput = {
      move: { active: false, id: null, x: 0, y: 0 },
      look: { active: false, id: null, lastX: 0, lastY: 0, dx: 0, dy: 0 },
      jumpQueued: false,
    };
    this.debugBuild = "2026-03-14-movefix-e";
    this.debugInfo = {
      inputX: 0,
      inputZ: 0,
      desiredX: 0,
      desiredZ: 0,
      blocked: false,
      fallback: false,
      groundY: CONFIG.playerHeight,
    };
    this.menuOrbit = 0;
    this.viewportMode = viewportWidth >= viewportHeight ? "landscape" : "portrait";
    this.time = 0;
    this.started = false;
    this.gameOver = false;
    this.wave = 0;
    this.score = 0;
    this.bestScore = Number(localStorage.getItem("sunstrike-best-score") || 0);
    this.waitingForNextWave = false;
    this.intermission = 1.4;
    this.spawnQueue = [];
    this.hitmarkerTimer = 0;
    this.crosshairKick = 0;
    this.announcement = { text: "", time: 0, color: "#ffffff" };
    this.damageFeedback = {
      flash: 0,
      direction: 0,
      angle: 0,
    };
    this.reloadTimer = 0;
    this.reloadTotal = 0;
    this.fireCooldown = 0;
    this.weaponRecoil = 0;
    this.weaponKick = 0;
    this.muzzleTimer = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.bossEnemy = null;
    this.progression = this.loadProgression();
    this.activeWeaponId = "rifle";
    this.weaponState = {
      rifle: { ammo: WEAPON_DEFS.rifle.magSize },
      lance: { ammo: WEAPON_DEFS.lance.magSize },
    };
    this.grenadeState = {
      ammo: GRENADE_CONFIG.max,
      cooldown: 0,
    };

    this.player = {
      velocity: new THREE.Vector3(),
      onGround: true,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      moveBlend: 0,
      groundHeight: CONFIG.playerHeight,
      vaultCooldown: 0,
      lastDamageTime: -10,
      damagePulse: 0,
      stuckTime: 0,
    };

    this.applyProgressionBonuses();

    this.buildWorld();
    this.buildWeapon();
    this.bindEvents();
    this.updateUI(true);
    this.setOverlay(
      "SUNSTRIKE ARENA",
      "강한 햇빛이 쏟아지는 훈련 구역에서 드론 웨이브를 돌파하세요.",
      "버튼을 누르면 마우스가 잠기고 FPS 조작이 시작됩니다.",
      "미션 시작",
    );
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  loadProgression() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESSION_KEY) || "{}");
      return {
        cores: Number(raw.cores || 0),
        damage: Number(raw.damage || 0),
        reload: Number(raw.reload || 0),
        shield: Number(raw.shield || 0),
        mobility: Number(raw.mobility || 0),
      };
    } catch {
      return {
        cores: 0,
        damage: 0,
        reload: 0,
        shield: 0,
        mobility: 0,
      };
    }
  }

  saveProgression() {
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(this.progression));
  }

  getUpgradeCost(key) {
    const level = this.progression[key] || 0;
    return 4 + level * 4 + level * level;
  }

  applyProgressionBonuses() {
    this.damageMultiplier = 1 + this.progression.damage * 0.12;
    this.reloadMultiplier = Math.max(0.62, 1 - this.progression.reload * 0.08);
    this.mobilityMultiplier = 1 + this.progression.mobility * 0.05;
    this.player.maxShield = 50 + this.progression.shield * 10;
    this.player.shield = clamp(this.player.shield || this.player.maxShield, 0, this.player.maxShield);
  }

  purchaseUpgrade(key) {
    const cost = this.getUpgradeCost(key);
    if (this.progression.cores < cost) {
      this.showAnnouncement("NOT ENOUGH CORES", 0.9, "#ffd8a0");
      return;
    }

    this.progression.cores -= cost;
    this.progression[key] += 1;
    this.saveProgression();
    this.applyProgressionBonuses();
    this.showAnnouncement("UPGRADE PURCHASED", 0.9, "#9bfff0");
    ui.statusNote.textContent = "업그레이드가 저장되었습니다. 다음 웨이브부터 즉시 반영됩니다.";
    this.updateUI(true);
  }

  getActiveWeapon() {
    return WEAPON_DEFS[this.activeWeaponId];
  }

  getActiveWeaponState() {
    return this.weaponState[this.activeWeaponId];
  }

  resetWeaponState() {
    this.weaponState.rifle.ammo = WEAPON_DEFS.rifle.magSize;
    this.weaponState.lance.ammo = WEAPON_DEFS.lance.magSize;
    this.grenadeState.ammo = GRENADE_CONFIG.max;
    this.grenadeState.cooldown = 0;
    this.activeWeaponId = "rifle";
    this.applyWeaponVisuals();
  }

  applyWeaponVisuals() {
    if (!this.weaponMaterials) {
      return;
    }

    const weapon = this.getActiveWeapon();
    this.weaponMaterials.body.color.setHex(weapon.body);
    this.weaponMaterials.body.emissive.setHex(weapon.accent);
    this.weaponMaterials.accent.color.setHex(weapon.accent);
    this.weaponMaterials.accent.emissive.setHex(weapon.accent);
    this.weaponMaterials.grip.color.setHex(weapon.grip);
    this.muzzleFlash.material.color.setHex(weapon.tracerColor);
    if (this.shotgunMuzzleFlash) {
      this.shotgunMuzzleFlash.material.color.setHex(WEAPON_DEFS.rifle.tracerColor);
    }
    if (this.cannonMuzzleFlash) {
      this.cannonMuzzleFlash.material.color.setHex(WEAPON_DEFS.lance.tracerColor);
    }
    if (this.playerShotgunGroup && this.playerCannonGroup) {
      this.playerShotgunGroup.visible = this.activeWeaponId === "rifle";
      this.playerCannonGroup.visible = this.activeWeaponId === "lance";
    }
  }

  setActiveWeapon(weaponId) {
    if (!WEAPON_DEFS[weaponId] || this.reloadTimer > 0 || this.activeWeaponId === weaponId) {
      return;
    }

    this.activeWeaponId = weaponId;
    this.fireCooldown = Math.min(this.fireCooldown, 0.08);
    this.applyWeaponVisuals();
    this.showAnnouncement(WEAPON_DEFS[weaponId].label, 0.72, weaponId === "lance" ? "#ffe0a3" : "#86f2ff");
  }

  toggleWeapon() {
    this.setActiveWeapon(this.activeWeaponId === "rifle" ? "lance" : "rifle");
  }

  createDesktopControls() {
    const controls = new EventTarget();
    controls.isLocked = false;
    controls.lock = () => {
      if (this.isTouchDevice) {
        return;
      }
      const target = this.canvas;
      if (target.requestPointerLock) {
        target.requestPointerLock();
      }
    };
    controls.unlock = () => {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
    return controls;
  }

  throwGrenade() {
    if (!this.isGameplayActive() || this.gameOver) {
      return;
    }
    if (this.grenadeState.ammo <= 0 || this.grenadeState.cooldown > 0) {
      return;
    }

    const start = this.getPlayerEyePosition();
    const forward = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.14, 0),
      new THREE.MeshStandardMaterial({
        color: 0x3b4c31,
        emissive: 0x98ff77,
        emissiveIntensity: 0.18,
        roughness: 0.52,
        metalness: 0.18,
      }),
    );
    mesh.position.copy(start).addScaledVector(forward, 0.72);
    mesh.position.y -= 0.08;
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.grenades.push({
      mesh,
      velocity: forward.multiplyScalar(11.4).add(new THREE.Vector3(0, 4.8, 0)),
      fuse: GRENADE_CONFIG.fuse,
      bounces: 0,
      spin: new THREE.Vector3(rand(-8, 8), rand(-10, 10), rand(-8, 8)),
    });
    this.grenadeState.ammo -= 1;
    this.grenadeState.cooldown = GRENADE_CONFIG.cooldown;
    this.weaponKick = Math.max(this.weaponKick, 0.32);
    this.audio.pulse({ frequency: 320, slideTo: 190, duration: 0.12, startGain: 0.08, type: "triangle" });
    ui.statusNote.textContent = "수류탄 투척. 버섯 무리가 몰릴 때 바닥으로 굴려 넣으세요.";
  }

  isGameplayActive() {
    if (!this.started || this.gameOver) {
      return false;
    }

    return ui.overlay.classList.contains("hidden");
  }

  resetTouchLookState() {
    this.mobileInput.look.active = false;
    this.mobileInput.look.id = null;
    this.mobileInput.look.lastX = 0;
    this.mobileInput.look.lastY = 0;
    this.mobileInput.look.dx = 0;
    this.mobileInput.look.dy = 0;
  }

  resetMobileInteractionState(recenterView = false) {
    if (ui.movePad && this.mobileInput.move.id !== null && ui.movePad.hasPointerCapture?.(this.mobileInput.move.id)) {
      ui.movePad.releasePointerCapture(this.mobileInput.move.id);
    }
    if (ui.lookPad && this.mobileInput.look.id !== null && ui.lookPad.hasPointerCapture?.(this.mobileInput.look.id)) {
      ui.lookPad.releasePointerCapture(this.mobileInput.look.id);
    }

    this.mobileInput.move.active = false;
    this.mobileInput.move.id = null;
    this.mobileInput.move.x = 0;
    this.mobileInput.move.y = 0;
    this.mobileInput.jumpQueued = false;
    this.resetTouchLookState();
    this.mouseDown = false;
    this.aimDownSights = false;

    if (ui.moveKnob) {
      ui.moveKnob.style.transform = "translate(-50%, -50%)";
    }

    if (recenterView) {
      this.lookAngles.pitch = 0;
      this.viewRecoil.pitch = 0;
      this.viewRecoil.yaw = 0;
      this.viewRecoil.roll = 0;
      this.applyViewRotation();
    }
  }

  syncLookAnglesFromView() {
    this.lookAngles.yaw = wrapAngle(this.playerObject.rotation.y + this.viewRecoil.yaw);
    const pitchObject = this.cameraPitchPivot || this.camera.parent || this.camera;
    this.lookAngles.pitch = clamp(pitchObject.rotation.x + this.viewRecoil.pitch, -1.08, 1.08);
  }

  applyViewRotation() {
    this.playerObject.rotation.y = wrapAngle(this.lookAngles.yaw - this.viewRecoil.yaw);
    const pitchObject = this.cameraPitchPivot || this.camera.parent || this.camera;
    pitchObject.rotation.x = clamp(this.lookAngles.pitch - this.viewRecoil.pitch, -1.08, 1.08);
    this.camera.up.set(0, 1, 0);
    this.camera.quaternion.identity();
  }

  startOrResume() {
    this.audio.unlock();
    this.resetMobileInteractionState();
    if (!this.started || this.gameOver) {
      this.resetRun();
    }
    this.snapThirdPersonCamera();
    this.canvas.focus({ preventScroll: true });

    if (this.isTouchDevice) {
      ui.overlay.classList.add("hidden");
      ui.objective.textContent = "터치 조이스틱으로 이동하고 LOOK 패드로 시점을 조절하세요.";
      return;
    }

    ui.overlay.classList.add("hidden");
    this.controls.lock();
  }

  pauseGame() {
    this.resetMobileInteractionState();

    if (this.isTouchDevice) {
      if (!this.started) {
        return;
      }
      this.setOverlay(
        "PAUSED",
        "터치 입력을 잠시 멈췄습니다. 업그레이드를 확인하고 다시 복귀할 수 있습니다.",
        "다시 시작 버튼을 누르면 현재 웨이브에서 이어집니다.",
        "Resume",
      );
      return;
    }

    if (this.controls.isLocked) {
      this.controls.unlock();
    }
  }

  bindTouchControls() {
    if (!this.isTouchDevice) {
      return;
    }

    const updateMovePad = (event) => {
      const rect = ui.movePad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const maxRadius = rect.width * 0.28;
      const distance = Math.min(Math.hypot(dx, dy), maxRadius);
      const angle = Math.atan2(dy, dx);
      const knobX = Math.cos(angle) * distance;
      const knobY = Math.sin(angle) * distance;
      ui.moveKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
      this.mobileInput.move.x = clamp(knobX / maxRadius, -1, 1);
      this.mobileInput.move.y = clamp(knobY / maxRadius, -1, 1);
    };

    ui.movePad.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.audio.unlock();
      this.mobileInput.move.active = true;
      this.mobileInput.move.id = event.pointerId;
      ui.movePad.setPointerCapture(event.pointerId);
      updateMovePad(event);
    });

    ui.movePad.addEventListener("pointermove", (event) => {
      if (this.mobileInput.move.active && this.mobileInput.move.id === event.pointerId) {
        updateMovePad(event);
      }
    });

    const clearMove = (event) => {
      if (this.mobileInput.move.id !== event.pointerId) {
        return;
      }
      this.mobileInput.move.active = false;
      this.mobileInput.move.id = null;
      this.mobileInput.move.x = 0;
      this.mobileInput.move.y = 0;
      ui.moveKnob.style.transform = "translate(-50%, -50%)";
    };

    ui.movePad.addEventListener("pointerup", clearMove);
    ui.movePad.addEventListener("pointercancel", clearMove);

    ui.lookPad.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.audio.unlock();
      this.resetTouchLookState();
      this.mobileInput.look.active = true;
      this.mobileInput.look.id = event.pointerId;
      this.mobileInput.look.lastX = event.clientX;
      this.mobileInput.look.lastY = event.clientY;
      ui.lookPad.setPointerCapture(event.pointerId);
    });

    ui.lookPad.addEventListener("pointermove", (event) => {
      if (!this.mobileInput.look.active || this.mobileInput.look.id !== event.pointerId) {
        return;
      }
      this.mobileInput.look.dx += event.clientX - this.mobileInput.look.lastX;
      this.mobileInput.look.dy += event.clientY - this.mobileInput.look.lastY;
      this.mobileInput.look.lastX = event.clientX;
      this.mobileInput.look.lastY = event.clientY;
    });

    const clearLook = (event) => {
      if (this.mobileInput.look.id !== event.pointerId) {
        return;
      }
      this.mobileInput.look.active = false;
      this.mobileInput.look.id = null;
      this.mobileInput.look.dx = 0;
      this.mobileInput.look.dy = 0;
    };

    ui.lookPad.addEventListener("pointerup", clearLook);
    ui.lookPad.addEventListener("pointercancel", clearLook);

    const bindHold = (element, onValue) => {
      element.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.audio.unlock();
        onValue(true);
      });
      const release = () => onValue(false);
      element.addEventListener("pointerup", release);
      element.addEventListener("pointercancel", release);
      element.addEventListener("pointerleave", release);
    };

    bindHold(ui.mobileFire, (value) => {
      this.mouseDown = value;
    });
    bindHold(ui.mobileAim, (value) => {
      this.aimDownSights = value;
    });

    ui.mobileJump.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.audio.unlock();
      this.mobileInput.jumpQueued = true;
    });
    ui.mobileReload.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.audio.unlock();
      this.startReload();
    });
    ui.mobileSwap.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.audio.unlock();
      this.toggleWeapon();
    });
    ui.mobileGrenade.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.audio.unlock();
      this.throwGrenade();
    });
  }

  bindEvents() {
    const handleResize = () => this.onResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", () => {
      requestAnimationFrame(() => this.onResize());
      setTimeout(() => this.onResize(), 120);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }

    document.addEventListener("pointerlockchange", () => {
      if (this.isTouchDevice) {
        return;
      }
      const locked = document.pointerLockElement === this.canvas;
      if (this.controls.isLocked === locked) {
        return;
      }
      this.controls.isLocked = locked;
      this.controls.dispatchEvent(new Event(locked ? "lock" : "unlock"));
    });
    document.addEventListener("mousemove", (event) => {
      if (this.isTouchDevice || !this.controls.isLocked) {
        return;
      }
      this.lookAngles.yaw = wrapAngle(this.lookAngles.yaw - event.movementX * 0.00215);
      this.lookAngles.pitch = clamp(this.lookAngles.pitch - event.movementY * 0.00165, -1.08, 1.08);
    });

    window.addEventListener("keydown", (event) => {
      this.keys[event.code] = true;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === "KeyR") {
        this.startReload();
      }
      if (event.code === "KeyQ") {
        this.toggleWeapon();
      }
      if (event.code === "Digit1") {
        this.setActiveWeapon("rifle");
      }
      if (event.code === "Digit2") {
        this.setActiveWeapon("lance");
      }
      if (event.code === "Digit3") {
        this.throwGrenade();
      }
      if (event.code === "KeyG") {
        this.throwGrenade();
      }
      if (event.code === "Escape" && this.controls.isLocked) {
        this.controls.unlock();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys[event.code] = false;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("blur", () => {
      this.keys = {};
      this.resetMobileInteractionState();
    });

    document.addEventListener("mousedown", (event) => {
      if (this.isTouchDevice) {
        return;
      }
      if (event.button === 0) {
        this.mouseDown = true;
      }
      if (event.button === 2) {
        this.aimDownSights = true;
      }
    });

    document.addEventListener("mouseup", (event) => {
      if (this.isTouchDevice) {
        return;
      }
      if (event.button === 0) {
        this.mouseDown = false;
      }
      if (event.button === 2) {
        this.aimDownSights = false;
      }
    });

    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
    document.addEventListener("pointerdown", () => this.audio.unlock(), { passive: true });

    ui.startButton.addEventListener("click", () => this.startOrResume());
    ui.pauseButton.addEventListener("click", () => this.pauseGame());
    ui.upgradeDamage.addEventListener("click", () => this.purchaseUpgrade("damage"));
    ui.upgradeReload.addEventListener("click", () => this.purchaseUpgrade("reload"));
    ui.upgradeShield.addEventListener("click", () => this.purchaseUpgrade("shield"));
    ui.upgradeMobility.addEventListener("click", () => this.purchaseUpgrade("mobility"));

    this.controls.addEventListener("lock", () => {
      this.mouseDown = false;
      this.aimDownSights = false;
      this.resetTouchLookState();
      this.syncLookAnglesFromView();
      ui.overlay.classList.add("hidden");
      if (!this.started) {
        this.resetRun();
      }
      ui.objective.textContent = "적 드론을 제거하고 다음 웨이브를 준비하세요.";
    });

    this.controls.addEventListener("unlock", () => {
      this.mouseDown = false;
      this.aimDownSights = false;
      this.resetTouchLookState();
      this.syncLookAnglesFromView();

      if (this.gameOver) {
        this.setOverlay(
          "MISSION FAILED",
          `최종 점수 ${this.score.toString().padStart(6, "0")}점. 다시 투입해서 기록을 넘겨보세요.`,
          "다시 시작 버튼을 누르면 전장을 초기화하고 즉시 재도전합니다.",
          "다시 시작",
        );
        return;
      }

      if (this.started) {
        this.setOverlay(
          "PAUSED",
          "마우스 잠금이 해제되었습니다. 호흡을 정리한 뒤 다시 전장으로 복귀하세요.",
          "재개 버튼을 누르면 동일한 시점에서 이어집니다.",
          "재개",
        );
      }
    });

    this.bindTouchControls();
  }

  setOverlay(title, subtitle, note, buttonLabel) {
    if (this.isTouchDevice) {
      this.resetMobileInteractionState();
    }
    ui.overlayTitle.textContent = title;
    ui.overlaySubtitle.textContent = subtitle;
    ui.overlayNote.textContent = note;
    ui.startButton.textContent = buttonLabel;
    ui.overlay.classList.remove("hidden");
  }

  updateViewportMetrics() {
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.round(viewport?.width || window.innerWidth || 1));
    const height = Math.max(1, Math.round(viewport?.height || window.innerHeight || 1));
    document.documentElement.style.setProperty("--app-width", `${width}px`);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    return { width, height };
  }

  onResize() {
    const { width, height } = this.updateViewportMetrics();
    const nextViewportMode = width >= height ? "landscape" : "portrait";
    if (this.isTouchDevice && nextViewportMode !== this.viewportMode) {
      this.viewportMode = nextViewportMode;
      this.resetMobileInteractionState(true);
    } else {
      this.viewportMode = nextViewportMode;
    }
    this.renderPixelRatio = Math.min(window.devicePixelRatio || 1, this.lowSpecMode ? 1.1 : 1.75);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.renderPixelRatio);
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setPixelRatio(this.renderPixelRatio);
      this.composer.setSize(width, height);
    }
  }

  createWorldMaterials() {
    const maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const finishTexture = (texture) => {
      texture.anisotropy = maxAnisotropy;
      return texture;
    };

    const groundMap = finishTexture(
      makeCanvasTexture((ctx, size) => {
        ctx.fillStyle = "#dbe8ef";
        ctx.fillRect(0, 0, size, size);

        const tile = size / 10;
        for (let y = 0; y < 10; y += 1) {
          for (let x = 0; x < 10; x += 1) {
            const lightness = 225 + ((x + y) % 3) * 4 + Math.floor(Math.random() * 8);
            ctx.fillStyle = `rgb(${lightness}, ${lightness + 8}, ${lightness + 12})`;
            ctx.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
          }
        }

        ctx.strokeStyle = "rgba(120, 145, 162, 0.35)";
        ctx.lineWidth = 3;
        for (let i = 0; i <= 10; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * tile, 0);
          ctx.lineTo(i * tile, size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * tile);
          ctx.lineTo(size, i * tile);
          ctx.stroke();
        }

        for (let i = 0; i < 2500; i += 1) {
          const alpha = Math.random() * 0.06;
          ctx.fillStyle = `rgba(70, 84, 96, ${alpha})`;
          ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
        }
      }, { repeatX: 10, repeatY: 10 }),
    );

    const platformMap = finishTexture(
      makeCanvasTexture((ctx, size) => {
        ctx.fillStyle = "#edf4f7";
        ctx.fillRect(0, 0, size, size);

        const stripe = size / 16;
        for (let i = 0; i < 16; i += 1) {
          ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.22)" : "rgba(160, 178, 190, 0.08)";
          ctx.fillRect(0, i * stripe, size, stripe);
        }

        ctx.strokeStyle = "rgba(122, 216, 255, 0.18)";
        ctx.lineWidth = 8;
        ctx.strokeRect(28, 28, size - 56, size - 56);

        for (let i = 0; i < 1200; i += 1) {
          const alpha = Math.random() * 0.04;
          ctx.fillStyle = `rgba(80, 96, 110, ${alpha})`;
          ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
        }
      }, { repeatX: 4, repeatY: 4 }),
    );

    const wallMap = finishTexture(
      makeCanvasTexture((ctx, size) => {
        ctx.fillStyle = "#f4f8fa";
        ctx.fillRect(0, 0, size, size);

        const panel = size / 6;
        for (let i = 0; i < 6; i += 1) {
          ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.24)" : "rgba(185, 204, 216, 0.16)";
          ctx.fillRect(i * panel + 8, 0, panel - 16, size);
        }

        ctx.strokeStyle = "rgba(122, 216, 255, 0.18)";
        ctx.lineWidth = 6;
        for (let i = 0; i <= 6; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * panel, 0);
          ctx.lineTo(i * panel, size);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(255, 199, 115, 0.14)";
        ctx.fillRect(size * 0.12, size * 0.14, size * 0.76, size * 0.05);
        ctx.fillRect(size * 0.12, size * 0.81, size * 0.76, size * 0.05);
      }, { repeatX: 3, repeatY: 1.6 }),
    );

    const woodMap = finishTexture(
      makeCanvasTexture((ctx, size) => {
        ctx.fillStyle = "#9f7d57";
        ctx.fillRect(0, 0, size, size);
        const plank = size / 10;
        for (let i = 0; i < 10; i += 1) {
          const tone = 128 + Math.floor(Math.random() * 28);
          ctx.fillStyle = `rgb(${tone + 20}, ${tone + 4}, ${tone - 12})`;
          ctx.fillRect(0, i * plank, size, plank - 2);
        }
        for (let i = 0; i < 1400; i += 1) {
          const alpha = Math.random() * 0.08;
          ctx.fillStyle = `rgba(60, 38, 20, ${alpha})`;
          ctx.fillRect(Math.random() * size, Math.random() * size, size * 0.08, 1);
        }
      }, { repeatX: 2, repeatY: 2 }),
    );

    const solarMap = finishTexture(
      makeCanvasTexture((ctx, size) => {
        ctx.fillStyle = "#17314c";
        ctx.fillRect(0, 0, size, size);
        const cell = size / 8;
        ctx.strokeStyle = "rgba(130, 214, 255, 0.34)";
        ctx.lineWidth = 4;
        for (let i = 0; i <= 8; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * cell);
          ctx.lineTo(size, i * cell);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(size * 0.06, size * 0.06, size * 0.88, size * 0.16);
      }, { repeatX: 1, repeatY: 1 }),
    );

    return {
      ground: new THREE.MeshStandardMaterial({
        color: 0xe6eef2,
        map: groundMap,
        roughness: 0.9,
        metalness: 0.04,
      }),
      platform: new THREE.MeshStandardMaterial({
        color: 0xfafdfd,
        map: platformMap,
        roughness: 0.62,
        metalness: 0.12,
      }),
      wall: new THREE.MeshStandardMaterial({
        color: 0xf5fbff,
        map: wallMap,
        emissive: 0x84dfff,
        emissiveIntensity: 0.05,
        roughness: 0.46,
        metalness: 0.18,
      }),
      warmWall: new THREE.MeshStandardMaterial({
        color: 0xfff2de,
        map: wallMap,
        emissive: 0xffcc90,
        emissiveIntensity: 0.05,
        roughness: 0.44,
        metalness: 0.14,
      }),
      trimMetal: new THREE.MeshStandardMaterial({
        color: 0xccedf7,
        emissive: 0x78ebff,
        emissiveIntensity: 0.12,
        roughness: 0.22,
        metalness: 0.86,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x91efff,
        roughness: 0.08,
        metalness: 0.18,
        transmission: 0.48,
        transparent: true,
        opacity: 0.92,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: 0xb58d62,
        map: woodMap,
        roughness: 0.78,
        metalness: 0.04,
      }),
      planter: new THREE.MeshStandardMaterial({
        color: 0xf0f6f8,
        map: platformMap,
        roughness: 0.56,
        metalness: 0.08,
      }),
      foliage: new THREE.MeshStandardMaterial({
        color: 0x42c684,
        emissive: 0x1eb37c,
        emissiveIntensity: 0.08,
        roughness: 0.74,
        metalness: 0.04,
      }),
      solar: new THREE.MeshStandardMaterial({
        color: 0x17314c,
        map: solarMap,
        roughness: 0.18,
        metalness: 0.76,
      }),
      canopy: new THREE.MeshStandardMaterial({
        color: 0xe8ffff,
        emissive: 0x84efff,
        emissiveIntensity: 0.18,
        roughness: 0.24,
        metalness: 0.4,
        transparent: true,
        opacity: 0.78,
      }),
    };
  }

  buildWorld() {
    const hemi = new THREE.HemisphereLight(0xeafcff, 0x7ab0d0, 2.4);
    hemi.position.set(0, 30, 0);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff1be, 2.7);
    sun.position.set(18, 28, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.lowSpecMode ? 1024 : 1536, this.lowSpecMode ? 1024 : 1536);
    sun.shadow.camera.left = -62;
    sun.shadow.camera.right = 62;
    sun.shadow.camera.top = 62;
    sun.shadow.camera.bottom = -62;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 132;
    sun.shadow.bias = -0.00015;
    this.scene.add(sun);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(150, 32, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          topColor: { value: new THREE.Color(0x9fe3ff) },
          bottomColor: { value: new THREE.Color(0xf8f5dd) },
          horizonColor: { value: new THREE.Color(0x86d7ff) },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform vec3 horizonColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y * 0.5 + 0.5;
            vec3 gradient = mix(bottomColor, horizonColor, smoothstep(0.0, 0.48, h));
            gradient = mix(gradient, topColor, smoothstep(0.48, 1.0, h));
            gl_FragColor = vec4(gradient, 1.0);
          }
        `,
      }),
    );
    this.scene.add(sky);

    this.sunSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.sun,
        color: 0xffdf9b,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.sunSprite.scale.set(18, 18, 1);
    this.sunSprite.position.set(-26, 34, -40);
    this.scene.add(this.sunSprite);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(170, 170),
      this.worldMaterials.ground,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.environmentRaycastMeshes.push(ground);

    const promenadeRing = new THREE.Mesh(
      new THREE.RingGeometry(40.8, 50.5, 8, 1),
      this.worldMaterials.platform,
    );
    promenadeRing.rotation.x = -Math.PI / 2;
    promenadeRing.position.y = 0.02;
    promenadeRing.receiveShadow = true;
    this.scene.add(promenadeRing);

    const arenaPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(38.5, 38.5, 1.8, 8),
      this.worldMaterials.platform,
    );
    arenaPlate.position.y = -0.72;
    arenaPlate.receiveShadow = true;
    arenaPlate.castShadow = true;
    this.scene.add(arenaPlate);

    const arenaTrim = new THREE.Mesh(
      new THREE.TorusGeometry(38.7, 0.18, 14, 64),
      this.worldMaterials.trimMetal,
    );
    arenaTrim.rotation.x = Math.PI / 2;
    arenaTrim.position.y = 0.18;
    this.scene.add(arenaTrim);

    this.addFloorStripe(0, 0, 27, 1.1, 0x9cecff);
    this.addFloorStripe(0, 0, 1.1, 27, 0x9cecff);
    this.addFloorStripe(-21.5, 0, 7.2, 0.72, 0xffd37f);
    this.addFloorStripe(21.5, 0, 7.2, 0.72, 0xffd37f);
    this.addFloorStripe(0, -21.5, 0.72, 7.2, 0xffd37f);
    this.addFloorStripe(0, 21.5, 0.72, 7.2, 0xffd37f);

    this.addCollidableBox({ x: -34, y: 2.4, z: -18, w: 2.4, h: 4.8, d: 28, material: this.worldMaterials.wall });
    this.addCollidableBox({ x: -34, y: 2.4, z: 18, w: 2.4, h: 4.8, d: 28, material: this.worldMaterials.wall });
    this.addCollidableBox({ x: 34, y: 2.4, z: -18, w: 2.4, h: 4.8, d: 28, material: this.worldMaterials.wall });
    this.addCollidableBox({ x: 34, y: 2.4, z: 18, w: 2.4, h: 4.8, d: 28, material: this.worldMaterials.wall });
    this.addCollidableBox({ x: -18, y: 2.4, z: -34, w: 28, h: 4.8, d: 2.4, material: this.worldMaterials.wall });
    this.addCollidableBox({ x: 18, y: 2.4, z: -34, w: 28, h: 4.8, d: 2.4, material: this.worldMaterials.wall });
    this.addCollidableBox({ x: -18, y: 2.4, z: 34, w: 28, h: 4.8, d: 2.4, material: this.worldMaterials.wall });
    this.addCollidableBox({ x: 18, y: 2.4, z: 34, w: 28, h: 4.8, d: 2.4, material: this.worldMaterials.wall });

    this.addReflectPool(-26, -26);
    this.addReflectPool(26, -26);
    this.addReflectPool(-26, 26);
    this.addReflectPool(26, 26);

    this.createSpawnPad(new THREE.Vector3(-28.5, 0.12, -28.5));
    this.createSpawnPad(new THREE.Vector3(28.5, 0.12, -28.5));
    this.createSpawnPad(new THREE.Vector3(-28.5, 0.12, 28.5));
    this.createSpawnPad(new THREE.Vector3(28.5, 0.12, 28.5));
    this.createSpawnPad(new THREE.Vector3(0, 0.12, -31.5));
    this.createSpawnPad(new THREE.Vector3(0, 0.12, 31.5));

    this.addSolarCanopy(-29, -4, Math.PI / 2);
    this.addSolarCanopy(-29, 9, Math.PI / 2);
    this.addSolarCanopy(29, -9, -Math.PI / 2);
    this.addSolarCanopy(29, 4, -Math.PI / 2);
    this.addPergola(-4, -29, 0);
    this.addPergola(4, 29, Math.PI);
    this.addCrystalGarden(-30, -8, 0x72fff0);
    this.addCrystalGarden(30, 8, 0xffd884);

    this.addHeroBillboard(-34.8, 6.6, 0, Math.PI / 2, 0x72fff0, "SOLAR");
    this.addHeroBillboard(34.8, 6.6, 0, -Math.PI / 2, 0xffd884, "BASTION");
    this.addHeroBillboard(0, 6.6, -34.8, 0, 0x72fff0, "ATRIUM");
    this.addHeroBillboard(0, 6.6, 34.8, Math.PI, 0xffd884, "SKYRIDGE");

    this.addWallDressings();
    this.addSunspireBastionArena();

    this.addMountains();
    this.addCloud(-36, 20, -48, 5.8);
    this.addCloud(-10, 24, -58, 4.5);
    this.addCloud(24, 18, -42, 5.2);
    this.addCloud(46, 23, -55, 6.2);
  }

  addFloorStripe(x, z, w, d, color) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.06, d),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.18,
        roughness: 0.2,
        metalness: 0.55,
      }),
    );
    stripe.position.set(x, 0.03, z);
    stripe.receiveShadow = true;
    this.scene.add(stripe);
  }

  addReflectPool(x, z) {
    const border = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.26, 24),
      this.worldMaterials.planter,
    );
    border.position.set(x, 0.13, z);
    border.castShadow = true;
    border.receiveShadow = true;
    this.scene.add(border);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(2.45, 2.45, 0.16, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x90f0ff,
        roughness: 0.1,
        metalness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        transmission: 0.35,
        opacity: 0.9,
        transparent: true,
      }),
    );
    water.position.set(x, 0.14, z);
    this.scene.add(water);
    this.decorAnimations.push((time) => {
      water.position.y = 0.14 + Math.sin(time * 2 + x) * 0.03;
    });
  }

  addPalmTree(x, z, scale) {
    const group = new THREE.Group();

    const trunkMaterial = this.worldMaterials.wood;
    const frondMaterial = this.worldMaterials.foliage;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, 5.3 * scale, 10), trunkMaterial);
    trunk.position.y = 2.65 * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    for (let i = 0; i < 6; i += 1) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.02 * scale, 2.7 * scale), frondMaterial);
      const angle = (Math.PI * 2 * i) / 6;
      leaf.position.set(Math.cos(angle) * 0.4 * scale, 5.2 * scale, Math.sin(angle) * 0.4 * scale);
      leaf.rotation.y = angle;
      leaf.rotation.x = rand(-0.18, -0.5);
      leaf.castShadow = true;
      group.add(leaf);
      this.decorAnimations.push((time) => {
        leaf.rotation.z = Math.sin(time * 1.6 + angle + x * 0.1) * 0.18;
      });
    }

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  addBanner(x, y, z, rotationY, color) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf9feff,
      emissive: color,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.38,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 7), mat);
    banner.position.set(x, y, z);
    banner.rotation.y = rotationY;
    this.scene.add(banner);
    this.decorAnimations.push((time) => {
      banner.rotation.z = Math.sin(time * 1.8 + x * 0.05 + z * 0.05) * 0.05;
      banner.material.opacity = 0.82 + Math.sin(time * 3 + x) * 0.08;
    });
  }

  addPeripheralArchitecture() {
    this.addPergola(0, -30, 0);
    this.addPergola(0, 30, Math.PI);
    this.addPergola(-30, 0, Math.PI / 2);
    this.addPergola(30, 0, -Math.PI / 2);

    this.addSolarCanopy(-30, -24, Math.PI / 4);
    this.addSolarCanopy(30, -24, -Math.PI / 4);
    this.addSolarCanopy(-30, 24, Math.PI * 0.75);
    this.addSolarCanopy(30, 24, -Math.PI * 0.75);

    this.addPlanterBox(-20, -18, 5.4, 2);
    this.addPlanterBox(20, -18, 5.4, 2);
    this.addPlanterBox(-20, 18, 5.4, 2);
    this.addPlanterBox(20, 18, 5.4, 2);
    this.addPlanterBox(-18, -20, 2, 5.4);
    this.addPlanterBox(18, -20, 2, 5.4);
    this.addPlanterBox(-18, 20, 2, 5.4);
    this.addPlanterBox(18, 20, 2, 5.4);
  }

  addWallDressings() {
    const edge = CONFIG.arenaLimit - 0.98;
    const placements = [
      { x: -edge, z: -20, rotationY: Math.PI / 2 },
      { x: -edge, z: 0, rotationY: Math.PI / 2 },
      { x: -edge, z: 20, rotationY: Math.PI / 2 },
      { x: edge, z: -20, rotationY: -Math.PI / 2 },
      { x: edge, z: 0, rotationY: -Math.PI / 2 },
      { x: edge, z: 20, rotationY: -Math.PI / 2 },
      { x: -20, z: -edge, rotationY: 0 },
      { x: 0, z: -edge, rotationY: 0 },
      { x: 20, z: -edge, rotationY: 0 },
      { x: -20, z: edge, rotationY: Math.PI },
      { x: 0, z: edge, rotationY: Math.PI },
      { x: 20, z: edge, rotationY: Math.PI },
    ];

    for (const placement of placements) {
      const group = new THREE.Group();
      group.position.set(placement.x, 0, placement.z);
      group.rotation.y = placement.rotationY;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.5, 0.18), this.worldMaterials.trimMetal);
      frame.position.y = 2.35;
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.6), this.worldMaterials.glass);
      inner.position.set(0, 2.28, 0.12);

      const lightBar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.1), this.worldMaterials.trimMetal);
      lightBar.position.set(0, 3.82, 0.18);

      group.add(frame, inner, lightBar);
      this.scene.add(group);
    }
  }

  addOpenFestivalArena() {
    this.addCentralReactor();
    this.addOverheadTransitLine();
    this.addHeroBillboard(-42, 10.4, -20, Math.PI / 4, 0x72fff0, "SUNBURST");
    this.addHeroBillboard(42, 10.4, -20, -Math.PI / 4, 0xffd884, "ARENA");
    this.addHeroBillboard(-42, 10.4, 20, Math.PI * 0.75, 0xffd884, "SKY RUN");
    this.addHeroBillboard(42, 10.4, 20, -Math.PI * 0.75, 0x72fff0, "OPEN FIRE");
    this.addNeonGateway(0, -38.5, 0, 0x72fff0);
    this.addNeonGateway(0, 38.5, Math.PI, 0xffd884);
    this.addNeonGateway(-38.5, 0, Math.PI / 2, 0x72fff0);
    this.addNeonGateway(38.5, 0, -Math.PI / 2, 0xffd884);
    this.addSolarCanopy(-28, -24, Math.PI / 4);
    this.addSolarCanopy(28, -24, -Math.PI / 4);
    this.addSolarCanopy(-28, 24, Math.PI * 0.75);
    this.addSolarCanopy(28, 24, -Math.PI * 0.75);
    this.addPergola(0, -29, 0);
    this.addPergola(0, 29, Math.PI);
    this.addObservationDeck(0, -43, 0);
    this.addObservationDeck(0, 43, Math.PI);
    this.addObservationDeck(-43, 0, Math.PI / 2);
    this.addObservationDeck(43, 0, -Math.PI / 2);
    this.addCrystalGarden(-33, -33, 0x72fff0);
    this.addCrystalGarden(33, -33, 0xffd884);
    this.addCrystalGarden(-33, 33, 0xffd884);
    this.addCrystalGarden(33, 33, 0x72fff0);
    this.addFloatingHalo(18, 12.6, 0x72fff0, 0.32);
    this.addFloatingHalo(26, 14.2, 0xffd884, -0.24);
    this.addPlanterBox(-22, -18, 5.8, 2.2);
    this.addPlanterBox(22, -18, 5.8, 2.2);
    this.addPlanterBox(-22, 18, 5.8, 2.2);
    this.addPlanterBox(22, 18, 5.8, 2.2);
    this.addPlanterBox(-18, -22, 2.2, 5.8);
    this.addPlanterBox(18, -22, 2.2, 5.8);
    this.addPlanterBox(-18, 22, 2.2, 5.8);
    this.addPlanterBox(18, 22, 2.2, 5.8);
    this.addPeripheralArchitecture();

    this.addFloorStripe(0, 0, 22, 0.9, 0x86f2ff);
    this.addFloorStripe(0, 0, 0.9, 22, 0x86f2ff);
    this.addFloorStripe(-17.2, 0, 6.4, 0.58, 0xffd37f);
    this.addFloorStripe(17.2, 0, 6.4, 0.58, 0xffd37f);
    this.addFloorStripe(0, -17.2, 0.58, 6.4, 0xffd37f);
    this.addFloorStripe(0, 17.2, 0.58, 6.4, 0xffd37f);

    const openCoverBlocks = [
      { x: 0, z: -13.5, w: 8.8, d: 1.9, h: 1.52, accent: 0x72fff0 },
      { x: 0, z: 13.5, w: 8.8, d: 1.9, h: 1.52, accent: 0xffd884 },
      { x: -13.5, z: 0, w: 1.9, d: 8.8, h: 1.52, accent: 0xffd884 },
      { x: 13.5, z: 0, w: 1.9, d: 8.8, h: 1.52, accent: 0x72fff0 },
      { x: -19.5, z: -19.5, w: 4.8, d: 2.1, h: 1.36, accent: 0x72fff0 },
      { x: 19.5, z: -19.5, w: 4.8, d: 2.1, h: 1.36, accent: 0xffd884 },
      { x: -19.5, z: 19.5, w: 4.8, d: 2.1, h: 1.36, accent: 0xffd884 },
      { x: 19.5, z: 19.5, w: 4.8, d: 2.1, h: 1.36, accent: 0x72fff0 },
    ];
    openCoverBlocks.forEach((block) => this.addOpenCoverBlock(block.x, block.z, block.w, block.d, block.h, block.accent));

    const flankNodes = [
      { x: -22.2, z: -7.8, w: 3.2, d: 1.6, h: 1.44, accent: 0x72fff0 },
      { x: 22.2, z: 7.8, w: 3.2, d: 1.6, h: 1.44, accent: 0xffd884 },
      { x: -7.8, z: 22.2, w: 1.6, d: 3.2, h: 1.44, accent: 0xffd884 },
      { x: 7.8, z: -22.2, w: 1.6, d: 3.2, h: 1.44, accent: 0x72fff0 },
    ];
    flankNodes.forEach((node) => this.addCoverNode(node.x, node.z, node.w, node.d, node.h, node.accent));

    this.addTraversalRoutes();
    this.addExpandedOuterLanes();
  }

  addOpenCoverBlock(x, z, w, d, h, accent) {
    const block = this.addCollidableBox({
      x,
      y: h * 0.5,
      z,
      w,
      h,
      d,
      material: this.worldMaterials.planter,
    });
    block.material = this.worldMaterials.planter;

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, 0.12, d + 0.16),
      this.worldMaterials.trimMetal,
    );
    cap.position.set(x, h + 0.08, z);
    cap.castShadow = true;
    this.scene.add(cap);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(w - 0.44, 0.26), 0.08, Math.max(d - 0.44, 0.26)),
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.5,
        roughness: 0.18,
        metalness: 0.48,
      }),
    );
    glow.position.set(x, h + 0.16, z);
    this.scene.add(glow);
  }

  addRaisedPad(x, z, w, d, height, accent, material = this.worldMaterials.platform) {
    const pad = this.addCollidableBox({
      x,
      y: height * 0.5,
      z,
      w,
      h: height,
      d,
      material,
    });
    pad.material = material;
    this.addWalkSurfaceRect(x, z, Math.max(0.24, w - 0.12), Math.max(0.24, d - 0.12), height);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.18, 0.12, d + 0.18),
      this.worldMaterials.trimMetal,
    );
    cap.position.set(x, height + 0.08, z);
    cap.castShadow = true;
    cap.receiveShadow = true;
    this.scene.add(cap);

    const inlay = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.28, w - 0.58), 0.06, Math.max(0.28, d - 0.58)),
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.4,
        roughness: 0.18,
        metalness: 0.46,
      }),
    );
    inlay.position.set(x, height + 0.15, z);
    inlay.receiveShadow = true;
    this.scene.add(inlay);
  }

  addSunspireBastionArena() {
    this.addCentralReactor();
    this.addFloatingHalo(31, 10.8, 0x72fff0, 0.18);
    this.addFloatingHalo(23, 13.6, 0xffd884, -0.12);
    this.addObservationDeck(-43, -15, Math.PI / 2);
    this.addObservationDeck(43, 15, -Math.PI / 2);
    this.addNeonGateway(-31, -31, Math.PI / 4, 0x72fff0);
    this.addNeonGateway(31, 31, -Math.PI * 0.75, 0xffd884);
    this.addHeroBillboard(-40, 10.6, -16, Math.PI / 4, 0x72fff0, "SUNSPIRE");
    this.addHeroBillboard(40, 10.6, 16, -Math.PI * 0.75, 0xffd884, "BASTION");

    this.addRaisedPad(0, 0, 18.4, 18.4, 0.42, 0x86f2ff);
    this.addRaisedPad(0, -15.2, 6.2, 10.8, 0.42, 0xffd884, this.worldMaterials.warmWall);
    this.addRaisedPad(0, 15.2, 6.2, 10.8, 0.42, 0x72fff0, this.worldMaterials.platform);
    this.addRaisedPad(-15.2, 0, 10.8, 6.2, 0.42, 0xffd884, this.worldMaterials.warmWall);
    this.addRaisedPad(15.2, 0, 10.8, 6.2, 0.42, 0x72fff0, this.worldMaterials.platform);

    this.addRaisedPad(-23.5, -18.2, 8.2, 6.4, 0.42, 0x72fff0);
    this.addRaisedPad(23.5, 18.2, 8.2, 6.4, 0.42, 0xffd884, this.worldMaterials.warmWall);
    this.addRaisedPad(-23.5, 18.2, 6.6, 8.2, 0.42, 0xffd884, this.worldMaterials.warmWall);
    this.addRaisedPad(23.5, -18.2, 6.6, 8.2, 0.42, 0x72fff0);

    this.addTransitCar(-24.5, 6.5, "z", 0x72fff0);
    this.addTransitCar(24.5, -6.5, "z", 0xffd884);
    this.addTransitCar(-8.2, 24.5, "x", 0xffd884);
    this.addTransitCar(8.2, -24.5, "x", 0x72fff0);

    this.addCoverNode(-8.8, -8.8, 3.2, 1.9, 1.5, 0x72fff0);
    this.addCoverNode(8.8, -8.8, 3.2, 1.9, 1.5, 0xffd884);
    this.addCoverNode(-8.8, 8.8, 3.2, 1.9, 1.5, 0xffd884);
    this.addCoverNode(8.8, 8.8, 3.2, 1.9, 1.5, 0x72fff0);
    this.addCoverNode(-20.5, -2.5, 4.4, 1.9, 1.62, 0x72fff0);
    this.addCoverNode(20.5, 2.5, 4.4, 1.9, 1.62, 0xffd884);
    this.addCoverNode(-2.5, 20.5, 1.9, 4.4, 1.62, 0xffd884);
    this.addCoverNode(2.5, -20.5, 1.9, 4.4, 1.62, 0x72fff0);

    this.addPlanterBox(-14.5, -26.8, 8.4, 2.2);
    this.addPlanterBox(14.5, 26.8, 8.4, 2.2);
    this.addPlanterBox(-26.8, 14.5, 2.2, 8.4);
    this.addPlanterBox(26.8, -14.5, 2.2, 8.4);

    this.addVaultFence(-4.8, 24.8, 4.2, 0.34, 0.92, 0x72fff0);
    this.addVaultFence(4.8, -24.8, 4.2, 0.34, 0.92, 0xffd884);
    this.addVaultFence(-24.8, -4.8, 0.34, 4.2, 0.92, 0xffd884);
    this.addVaultFence(24.8, 4.8, 0.34, 4.2, 0.92, 0x72fff0);

    this.addStairTerrace(-10.2, 0, "east", 0x72fff0);
    this.addStairTerrace(10.2, 0, "west", 0xffd884);
    this.addStairTerrace(-27.8, 18.2, "east", 0x72fff0);
    this.addStairTerrace(27.8, -18.2, "west", 0xffd884);

    this.addFloorStripe(0, 0, 24, 0.82, 0x86f2ff);
    this.addFloorStripe(0, 0, 0.82, 24, 0xffd884);
    this.addFloorStripe(-16.2, -16.2, 7.2, 0.56, 0x72fff0);
    this.addFloorStripe(16.2, 16.2, 7.2, 0.56, 0xffd884);
    this.addFloorStripe(-16.2, 16.2, 0.56, 7.2, 0xffd884);
    this.addFloorStripe(16.2, -16.2, 0.56, 7.2, 0x72fff0);
  }

  addArenaCoverRoutes() {
    this.addTransitCar(-16.2, 0, "x", 0x72fff0);
    this.addTransitCar(16.2, 0, "x", 0xffd884);

    const coverNodes = [
      { x: -11.2, z: -11.2, w: 3.2, d: 1.9, h: 1.85, accent: 0x72fff0 },
      { x: 11.2, z: -11.2, w: 3.2, d: 1.9, h: 1.85, accent: 0xffd884 },
      { x: -11.2, z: 11.2, w: 3.2, d: 1.9, h: 1.85, accent: 0xffd884 },
      { x: 11.2, z: 11.2, w: 3.2, d: 1.9, h: 1.85, accent: 0x72fff0 },
      { x: 0, z: -12.8, w: 4.8, d: 1.8, h: 1.7, accent: 0x72fff0 },
      { x: 0, z: 12.8, w: 4.8, d: 1.8, h: 1.7, accent: 0xffd884 },
    ];

    for (const node of coverNodes) {
      this.addCoverNode(node.x, node.z, node.w, node.d, node.h, node.accent);
    }
  }

  addWalkSurfaceRect(x, z, w, d, height) {
    this.walkSurfaces.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      height,
    });
  }

  addVaultFence(x, z, w, d, h, accent) {
    const fence = this.addCollidableBox({
      x,
      y: h * 0.5,
      z,
      w,
      h,
      d,
      material: this.worldMaterials.trimMetal.clone(),
      vaultable: true,
    });
    fence.material.color.setHex(0xf9fbfc);
    fence.material.emissive.setHex(accent);
    fence.material.emissiveIntensity = 0.18;

    const lightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(w, 0.18), 0.06, Math.max(d, 0.18)),
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.58,
        roughness: 0.2,
        metalness: 0.42,
      }),
    );
    lightStrip.position.set(x, h + 0.05, z);
    this.scene.add(lightStrip);
  }

  addStairTerrace(x, z, side, accent) {
    const deckWidth = 4.2;
    const deckDepth = 3.8;
    const deckHeight = 1.44;
    const steps = 4;
    const stepWidth = 0.78;
    const stepHeight = deckHeight / steps;

    const deck = this.addCollidableBox({
      x,
      y: deckHeight * 0.5,
      z,
      w: deckWidth,
      h: deckHeight,
      d: deckDepth,
      material: this.worldMaterials.platform,
    });
    deck.material = this.worldMaterials.platform;
    this.addWalkSurfaceRect(x, z, deckWidth - 0.1, deckDepth - 0.1, deckHeight);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(deckWidth + 0.18, 0.12, deckDepth + 0.18),
      this.worldMaterials.trimMetal,
    );
    cap.position.set(x, deckHeight + 0.08, z);
    cap.castShadow = true;
    this.scene.add(cap);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(deckWidth * 0.7, 0.08, 0.14),
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.48,
        roughness: 0.22,
        metalness: 0.46,
      }),
    );
    sign.position.set(x, 0.08, z);
    this.scene.add(sign);

    for (let i = 0; i < steps; i += 1) {
      const height = stepHeight * (i + 1);
      const offset = stepWidth * (steps - i - 0.5);
      const stepX = side === "east" ? x + deckWidth * 0.5 + offset : x - deckWidth * 0.5 - offset;
      const step = this.addCollidableBox({
        x: stepX,
        y: height * 0.5,
        z,
        w: stepWidth,
        h: height,
        d: deckDepth - 0.18,
        material: this.worldMaterials.warmWall,
      });
      step.material = this.worldMaterials.warmWall;
      this.addWalkSurfaceRect(stepX, z, stepWidth - 0.06, deckDepth - 0.26, height);
    }

    const railX = side === "east" ? x - deckWidth * 0.5 - 0.08 : x + deckWidth * 0.5 + 0.08;
    for (const railZ of [-deckDepth * 0.5 + 0.28, deckDepth * 0.5 - 0.28]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1, deckDepth + steps * stepWidth * 0.78),
        this.worldMaterials.trimMetal,
      );
      rail.position.set(railX, 0.5, z + railZ * 0.12);
      rail.castShadow = true;
      this.scene.add(rail);
    }
  }

  addTraversalRoutes() {
    this.addStairTerrace(-17.2, 7.8, "east", 0x72fff0);
    this.addStairTerrace(17.2, -7.8, "west", 0xffd884);

    this.addVaultFence(-5.2, 5.4, 3.4, 0.34, 0.92, 0x72fff0);
    this.addVaultFence(5.2, -5.4, 3.4, 0.34, 0.92, 0xffd884);
    this.addVaultFence(-6.4, -4.2, 0.34, 3.2, 0.92, 0xffd884);
    this.addVaultFence(6.4, 4.2, 0.34, 3.2, 0.92, 0x72fff0);
  }

  addExpandedOuterLanes() {
    this.addTransitCar(0, -24.5, "z", 0x72fff0);
    this.addTransitCar(0, 24.5, "z", 0xffd884);
    this.addCoverNode(-24.8, 0, 4.8, 2.2, 2.1, 0x72fff0);
    this.addCoverNode(24.8, 0, 4.8, 2.2, 2.1, 0xffd884);
    this.addCoverNode(-21.5, -21.5, 4.2, 2.1, 1.9, 0x72fff0);
    this.addCoverNode(21.5, 21.5, 4.2, 2.1, 1.9, 0xffd884);
    this.addCoverNode(-21.5, 21.5, 4.2, 2.1, 1.9, 0xffd884);
    this.addCoverNode(21.5, -21.5, 4.2, 2.1, 1.9, 0x72fff0);
    this.addStairTerrace(-25.4, -16.8, "east", 0x72fff0);
    this.addStairTerrace(25.4, 16.8, "west", 0xffd884);
    this.addVaultFence(-17.8, 22.8, 4.2, 0.34, 0.92, 0x72fff0);
    this.addVaultFence(17.8, -22.8, 4.2, 0.34, 0.92, 0xffd884);
    this.addVaultFence(-22.8, -17.8, 0.34, 4.2, 0.92, 0xffd884);
    this.addVaultFence(22.8, 17.8, 0.34, 4.2, 0.92, 0x72fff0);
  }

  addSpectacleRing() {
    this.addNeonGateway(0, -38.5, 0, 0x72fff0);
    this.addNeonGateway(0, 38.5, Math.PI, 0xffd884);
    this.addNeonGateway(-38.5, 0, Math.PI / 2, 0x72fff0);
    this.addNeonGateway(38.5, 0, -Math.PI / 2, 0xffd884);

    this.addCrystalGarden(-33, -33, 0x72fff0);
    this.addCrystalGarden(33, -33, 0xffd884);
    this.addCrystalGarden(-33, 33, 0xffd884);
    this.addCrystalGarden(33, 33, 0x72fff0);

    this.addFloatingHalo(18, 12.6, 0x72fff0, 0.32);
    this.addFloatingHalo(26, 14.2, 0xffd884, -0.24);
  }

  addNeonGateway(x, z, rotationY, accent) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 6.8, 0.72), this.worldMaterials.trimMetal);
      pillar.position.set(side * 3.6, 3.4, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);

      const inset = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 5.8, 0.12),
        new THREE.MeshStandardMaterial({
          color: accent,
          emissive: accent,
          emissiveIntensity: 0.7,
          roughness: 0.18,
          metalness: 0.56,
        }),
      );
      inset.position.set(side * 3.34, 3.3, 0.38);
      group.add(inset);
    }

    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.2, 14, 36, Math.PI), this.worldMaterials.trimMetal);
    arch.position.y = 6.1;
    arch.rotation.z = Math.PI;
    group.add(arch);

    const archGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.orange,
        color: accent,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    archGlow.position.set(0, 5.8, 0);
    archGlow.scale.set(7.6, 3.6, 1);
    group.add(archGlow);
    this.decorAnimations.push((time) => {
      arch.rotation.y = Math.sin(time * 0.8 + x * 0.02 + z * 0.02) * 0.08;
      archGlow.material.opacity = 0.28 + Math.sin(time * 2.4 + x * 0.1) * 0.08;
    });

    this.scene.add(group);
  }

  addCrystalGarden(x, z, accent) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    for (let i = 0; i < 6; i += 1) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(rand(0.36, 0.92), 0),
        new THREE.MeshStandardMaterial({
          color: 0xf7fdff,
          emissive: accent,
          emissiveIntensity: 0.32,
          roughness: 0.12,
          metalness: 0.08,
          transparent: true,
          opacity: 0.94,
        }),
      );
      crystal.position.set(rand(-1.8, 1.8), rand(1.2, 3.4), rand(-1.8, 1.8));
      crystal.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
      const baseY = crystal.position.y;
      const baseRotY = crystal.rotation.y;
      crystal.castShadow = true;
      group.add(crystal);
      this.decorAnimations.push((time) => {
        crystal.rotation.y = baseRotY + time * 0.22;
        crystal.position.y = baseY + Math.sin(time * 1.6 + i + x * 0.05) * 0.08;
      });
    }

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.4, 0.42, 18),
      this.worldMaterials.planter,
    );
    base.position.y = 0.2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    this.scene.add(group);
  }

  addFloatingHalo(radius, y, accent, speed) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.14, 12, 72),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.28,
      }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = y;
    this.scene.add(halo);
    this.decorAnimations.push((time) => {
      halo.rotation.z = time * speed;
      halo.material.opacity = 0.2 + Math.sin(time * 1.8 + radius) * 0.06;
    });
  }

  addSkylineSetpieces() {
    this.addCentralReactor();
    this.addObservationDeck(0, -43, 0);
    this.addObservationDeck(0, 43, Math.PI);
    this.addObservationDeck(-43, 0, Math.PI / 2);
    this.addObservationDeck(43, 0, -Math.PI / 2);
    this.addHeroBillboard(-42, 10.4, -20, Math.PI / 4, 0x72fff0, "SOL GATE");
    this.addHeroBillboard(42, 10.4, -20, -Math.PI / 4, 0xffd884, "AURORA");
    this.addHeroBillboard(-42, 10.4, 20, Math.PI * 0.75, 0xffd884, "SKYLINE");
    this.addHeroBillboard(42, 10.4, 20, -Math.PI * 0.75, 0x72fff0, "CORE RUN");
    this.addOverheadTransitLine();
  }

  addArenaRoof() {
    const trussMaterial = this.worldMaterials.trimMetal;
    const roofMaterial = this.worldMaterials.warmWall;
    const skylightMaterial = this.worldMaterials.canopy.clone();
    skylightMaterial.opacity = 0.62;
    skylightMaterial.emissiveIntensity = 0.24;

    const trussLines = [
      { x: 0, z: -27, w: 68, d: 0.26 },
      { x: 0, z: 27, w: 68, d: 0.26 },
      { x: -27, z: 0, w: 0.26, d: 68 },
      { x: 27, z: 0, w: 0.26, d: 68 },
      { x: 0, z: -10.8, w: 58, d: 0.22 },
      { x: 0, z: 10.8, w: 58, d: 0.22 },
      { x: -10.8, z: 0, w: 0.22, d: 58 },
      { x: 10.8, z: 0, w: 0.22, d: 58 },
    ];

    for (const line of trussLines) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(line.w, 0.2, line.d), trussMaterial);
      beam.position.set(line.x, 11.6, line.z);
      beam.castShadow = true;
      this.scene.add(beam);
    }

    const roofBays = [
      { x: -17, z: -17, w: 16, d: 16 },
      { x: 17, z: -17, w: 16, d: 16 },
      { x: -17, z: 17, w: 16, d: 16 },
      { x: 17, z: 17, w: 16, d: 16 },
      { x: 0, z: -24, w: 12, d: 12 },
      { x: 0, z: 24, w: 12, d: 12 },
      { x: -24, z: 0, w: 12, d: 12 },
      { x: 24, z: 0, w: 12, d: 12 },
    ];

    for (const bay of roofBays) {
      this.addRoofBay(bay.x, bay.z, bay.w, bay.d, roofMaterial, skylightMaterial);
    }

    this.addServiceDuct(-18, 10.7, 0, 18, "z");
    this.addServiceDuct(18, 10.7, 0, 18, "z");
    this.addServiceDuct(0, 10.7, -18, 18, "x");
    this.addServiceDuct(0, 10.7, 18, 18, "x");
    this.addRoofAccessRoutes();

    const lampPositions = [
      [-16, -8],
      [0, -8],
      [16, -8],
      [-16, 8],
      [0, 8],
      [16, 8],
      [-8, -16],
      [8, -16],
      [-8, 16],
      [8, 16],
    ];
    for (const [x, z] of lampPositions) {
      this.addHangingLamp(x, z);
    }
  }

  addRoofBay(x, z, w, d, roofMaterial, skylightMaterial) {
    const shell = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), roofMaterial);
    shell.position.set(x, 11.4, z);
    shell.castShadow = true;
    shell.receiveShadow = true;
    this.scene.add(shell);
    this.addWalkSurfaceRect(x, z, w - 0.42, d - 0.42, 11.51);

    const opening = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.58, d * 0.58),
      skylightMaterial,
    );
    opening.rotation.x = -Math.PI / 2;
    opening.position.set(x, 11.3, z);
    this.scene.add(opening);

    for (const side of [-1, 1]) {
      const ribA = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.12, 0.18), this.worldMaterials.trimMetal);
      ribA.position.set(x, 11.48, z + side * d * 0.22);
      this.scene.add(ribA);

      const ribB = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, d * 0.9), this.worldMaterials.trimMetal);
      ribB.position.set(x + side * w * 0.22, 11.48, z);
      this.scene.add(ribB);
    }
  }

  addRoofAccessRoutes() {
    this.addRoofAccessTower(-30.5, -10.5, "east", 0x72fff0);
    this.addRoofAccessTower(30.5, 10.5, "west", 0xffd884);
  }

  addRoofAccessTower(x, z, side, accent) {
    const heights = [1.2, 2.4, 3.6, 4.8, 6, 7.2, 8.4, 9.6, 10.8, 11.4];
    const deckWidth = 3.2;
    const deckDepth = 3;
    const signMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.42,
      roughness: 0.18,
      metalness: 0.48,
    });

    heights.forEach((height, index) => {
      const shift = index * 1.08;
      const deckX = side === "east" ? x + shift : x - shift;
      const deck = this.addCollidableBox({
        x: deckX,
        y: height - 0.22,
        z,
        w: deckWidth,
        h: 0.44,
        d: deckDepth,
        material: this.worldMaterials.platform,
      });
      deck.material = this.worldMaterials.platform;
      this.addWalkSurfaceRect(deckX, z, deckWidth - 0.08, deckDepth - 0.08, height);

      const edgeLight = new THREE.Mesh(
        new THREE.BoxGeometry(deckWidth * 0.92, 0.08, 0.14),
        signMaterial,
      );
      edgeLight.position.set(deckX, height + 0.05, z + deckDepth * 0.42);
      this.scene.add(edgeLight);
    });
  }

  addServiceDuct(x, y, z, length, axis) {
    const horizontal = axis === "x";
    const duct = new THREE.Mesh(
      new THREE.BoxGeometry(horizontal ? length : 1.25, 1.15, horizontal ? 1.25 : length),
      this.worldMaterials.wall,
    );
    duct.position.set(x, y, z);
    duct.castShadow = true;
    this.scene.add(duct);

    for (const offset of [-1, 1]) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, length, 10),
        this.worldMaterials.trimMetal,
      );
      pipe.rotation.z = horizontal ? Math.PI / 2 : 0;
      pipe.position.set(x + (horizontal ? 0 : offset * 0.5), y - 0.8, z + (horizontal ? offset * 0.5 : 0));
      this.scene.add(pipe);
    }
  }

  addHangingLamp(x, z) {
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.6, 8),
      this.worldMaterials.trimMetal,
    );
    cable.position.set(x, 10.2, z);
    this.scene.add(cable);

    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.62, 0.42, 12),
      this.worldMaterials.warmWall,
    );
    lamp.position.set(x, 8.8, z);
    lamp.castShadow = true;
    this.scene.add(lamp);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.sun,
        color: 0xffefb8,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.position.set(x, 8.5, z);
    glow.scale.set(2.8, 2.8, 1);
    this.scene.add(glow);

    this.decorAnimations.push((time) => {
      glow.material.opacity = 0.22 + Math.sin(time * 2.8 + x * 0.12 + z * 0.08) * 0.05;
    });
  }

  addCoverNode(x, z, w, d, h, accent) {
    const body = this.addCollidableBox({
      x,
      y: h * 0.5,
      z,
      w,
      h,
      d,
      material: this.worldMaterials.planter,
    });
    body.material = this.worldMaterials.planter;

    const topTrim = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.1, 0.12, d + 0.1),
      this.worldMaterials.trimMetal,
    );
    topTrim.position.set(x, h + 0.08, z);
    topTrim.castShadow = true;
    this.scene.add(topTrim);

    const glassFin = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.22, w * 0.08), 0.86, Math.max(0.22, d * 0.4)),
      this.worldMaterials.canopy,
    );
    glassFin.position.set(x, h + 0.47, z);
    glassFin.castShadow = true;
    this.scene.add(glassFin);

    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w * (d > w ? 0.72 : 0.18), 0.1, d * (d > w ? 0.14 : 0.72)),
        new THREE.MeshStandardMaterial({
          color: accent,
          emissive: accent,
          emissiveIntensity: 0.42,
          roughness: 0.2,
          metalness: 0.58,
        }),
      );
      strip.position.set(
        x + (w > d ? 0 : side * (w * 0.32)),
        0.06,
        z + (w > d ? side * (d * 0.32) : 0),
      );
      strip.receiveShadow = true;
      this.scene.add(strip);
    }
  }

  addTransitCar(x, z, axis, accent) {
    const horizontal = axis === "x";
    const bodyW = horizontal ? 6.4 : 2.8;
    const bodyD = horizontal ? 2.8 : 6.4;
    const bodyH = 2.2;

    const body = this.addCollidableBox({
      x,
      y: bodyH * 0.5,
      z,
      w: bodyW,
      h: bodyH,
      d: bodyD,
      material: this.worldMaterials.warmWall,
    });
    body.material = this.worldMaterials.warmWall;

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW * 0.88, 0.18, bodyD * 0.88),
      this.worldMaterials.canopy,
    );
    roof.position.set(x, bodyH + 0.22, z);
    roof.castShadow = true;
    this.scene.add(roof);

    const noseA = new THREE.Mesh(
      new THREE.BoxGeometry(horizontal ? 0.55 : bodyW * 0.7, 1.4, horizontal ? bodyD * 0.7 : 0.55),
      this.worldMaterials.trimMetal,
    );
    noseA.position.set(
      x + (horizontal ? bodyW * 0.5 : 0),
      1.1,
      z + (horizontal ? 0 : bodyD * 0.5),
    );
    const noseB = noseA.clone();
    noseB.position.set(
      x - (horizontal ? bodyW * 0.5 : 0),
      1.1,
      z - (horizontal ? 0 : bodyD * 0.5),
    );
    this.scene.add(noseA, noseB);

    for (let i = -1; i <= 1; i += 1) {
      const windowPanel = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? 1.4 : 2.1, 0.72, horizontal ? 2.05 : 1.4),
        this.worldMaterials.glass,
      );
      windowPanel.position.set(
        x + (horizontal ? i * 1.75 : 0),
        1.55,
        z + (horizontal ? 0 : i * 1.75),
      );
      this.scene.add(windowPanel);
    }

    const lightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(horizontal ? bodyW * 0.7 : 0.18, 0.08, horizontal ? 0.18 : bodyD * 0.7),
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.6,
      }),
    );
    lightStrip.position.set(x, 0.08, z);
    this.scene.add(lightStrip);
  }

  addCentralReactor() {
    const group = new THREE.Group();
    const coreMaterial = this.worldMaterials.glass.clone();
    coreMaterial.emissive = new THREE.Color(0x72fff0);
    coreMaterial.emissiveIntensity = 0.12;

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.4, 5.6, 8),
      coreMaterial,
    );
    core.position.y = 5.2;
    core.castShadow = true;
    group.add(core);

    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 7.2, 10),
      this.worldMaterials.trimMetal,
    );
    spine.position.y = 5.2;
    group.add(spine);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.1, 12, 32),
      this.worldMaterials.trimMetal,
    );
    ringA.position.y = 4.2;
    ringA.rotation.x = Math.PI / 2;
    const ringB = ringA.clone();
    ringB.position.y = 6.15;
    group.add(ringA, ringB);

    for (const [px, pz] of [
      [-1.9, 0],
      [1.9, 0],
      [0, -1.9],
      [0, 1.9],
    ]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.8, 1.3), this.worldMaterials.canopy);
      fin.position.set(px, 4.8, pz);
      fin.lookAt(px * 3, 4.8, pz * 3);
      group.add(fin);
    }

    this.decorAnimations.push((time) => {
      ringA.rotation.z = time * 0.35;
      ringB.rotation.z = -time * 0.45;
      core.material.emissiveIntensity = 0.12 + Math.sin(time * 2.2) * 0.04;
      core.scale.y = 1 + Math.sin(time * 2.1) * 0.02;
    });

    this.scene.add(group);
  }

  addObservationDeck(x, z, rotationY) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    for (const side of [-1, 1]) {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.3, 8.2, 1.3), this.worldMaterials.wall);
      tower.position.set(side * 4.2, 4.1, 0);
      tower.castShadow = true;
      tower.receiveShadow = true;
      group.add(tower);
    }

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 2.6), this.worldMaterials.platform);
    bridge.position.set(0, 6.5, 0);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    group.add(bridge);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.14, 2.2), this.worldMaterials.canopy);
    canopy.position.set(0, 8.1, 0);
    group.add(canopy);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 0.22), this.worldMaterials.trimMetal);
    sign.position.set(0, 7.5, 1.26);
    group.add(sign);

    this.scene.add(group);
  }

  addHeroBillboard(x, y, z, rotationY, accent, label) {
    const panelTexture = makeCanvasTexture((ctx, size) => {
      ctx.fillStyle = "#10233a";
      ctx.fillRect(0, 0, size, size);
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#5bd8ff");
      ctx.fillStyle = grad;
      ctx.fillRect(size * 0.08, size * 0.12, size * 0.84, size * 0.12);
      ctx.fillRect(size * 0.08, size * 0.76, size * 0.84, size * 0.06);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = size * 0.028;
      ctx.strokeRect(size * 0.06, size * 0.08, size * 0.88, size * 0.84);
      ctx.fillStyle = "#f4fbff";
      ctx.font = `700 ${Math.floor(size * 0.14)}px Orbitron, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, size * 0.5, size * 0.54);
    }, { size: 512 });

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: panelTexture,
      emissive: accent,
      emissiveIntensity: 0.34,
      roughness: 0.18,
      metalness: 0.48,
      transparent: true,
      opacity: 0.94,
    });

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.2), material);
    panel.position.set(x, y, z);
    panel.rotation.y = rotationY;
    this.scene.add(panel);
  }

  addOverheadTransitLine() {
    const railMaterial = this.worldMaterials.trimMetal;

    for (const axis of ["x", "z"]) {
      for (const offset of [-1.1, 1.1]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(axis === "x" ? 96 : 0.16, 0.12, axis === "x" ? 0.16 : 96),
          railMaterial,
        );
        rail.position.set(axis === "x" ? 0 : offset, 10.2, axis === "x" ? offset : 0);
        this.scene.add(rail);
      }
    }

    for (const [x, z] of [
      [-30, -30],
      [30, -30],
      [-30, 30],
      [30, 30],
    ]) {
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.42, 10.2, 0.42), railMaterial);
      mast.position.set(x, 5.1, z);
      mast.castShadow = true;
      this.scene.add(mast);
    }

    const podA = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.15, 1.45), this.worldMaterials.wall);
    const podB = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.15, 2.5), this.worldMaterials.warmWall);
    podA.position.set(-26, 9.4, -1.1);
    podB.position.set(1.1, 9.4, 26);
    this.scene.add(podA, podB);

    this.decorAnimations.push((time) => {
      podA.position.x = Math.sin(time * 0.22) * 32;
      podB.position.z = Math.cos(time * 0.2) * 32;
    });
  }

  addPergola(x, z, rotationY) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    const pillarPositions = [
      [-3, 3],
      [3, 3],
      [-3, -3],
      [3, -3],
    ];

    for (const [px, pz] of pillarPositions) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4.6, 0.42), this.worldMaterials.warmWall);
      pillar.position.set(px, 2.3, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
    }

    const beamA = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 0.42), this.worldMaterials.trimMetal);
    beamA.position.set(0, 4.52, 3);
    const beamB = beamA.clone();
    beamB.position.z = -3;
    const beamC = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 6.4), this.worldMaterials.trimMetal);
    beamC.position.set(3, 4.52, 0);
    const beamD = beamC.clone();
    beamD.position.x = -3;
    group.add(beamA, beamB, beamC, beamD);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 6.2), this.worldMaterials.canopy);
    roof.position.y = 4.72;
    group.add(roof);

    for (let i = -2; i <= 2; i += 1) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.1, 0.18), this.worldMaterials.wood);
      slat.position.set(0, 4.9, i * 1.2);
      group.add(slat);
    }

    this.addBench(group, -1.8, 0, Math.PI / 2);
    this.addBench(group, 1.8, 0, -Math.PI / 2);
    this.scene.add(group);
  }

  addSolarCanopy(x, z, rotationY) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    for (const side of [-1, 1]) {
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.34, 5.6, 0.34), this.worldMaterials.trimMetal);
      mast.position.set(side * 1.6, 2.8, 0);
      mast.castShadow = true;
      mast.receiveShadow = true;
      group.add(mast);
    }

    const arm = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 0.28), this.worldMaterials.trimMetal);
    arm.position.set(0, 5.2, 0);
    group.add(arm);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 2.8), this.worldMaterials.solar);
    panel.position.set(0, 5.05, -0.3);
    panel.rotation.x = -0.36;
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    this.scene.add(group);
  }

  addPlanterBox(x, z, w, d) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const planter = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), this.worldMaterials.planter);
    planter.position.y = 0.5;
    planter.castShadow = true;
    planter.receiveShadow = true;
    group.add(planter);

    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.4, 0.12, d - 0.4),
      new THREE.MeshStandardMaterial({ color: 0x66533c, roughness: 1, metalness: 0 }),
    );
    soil.position.y = 1.02;
    group.add(soil);

    const plantCount = Math.max(3, Math.round((w + d) * 0.7));
    for (let i = 0; i < plantCount; i += 1) {
      const plant = new THREE.Mesh(
        new THREE.ConeGeometry(rand(0.18, 0.42), rand(1.2, 2.2), 6),
        this.worldMaterials.foliage,
      );
      plant.position.set(rand(-w * 0.35, w * 0.35), rand(1.5, 2.2), rand(-d * 0.35, d * 0.35));
      plant.castShadow = true;
      group.add(plant);
    }

    this.scene.add(group);
  }

  addBench(parent, x, z, rotationY) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.42), this.worldMaterials.wood);
    seat.position.set(0, 0.65, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.36), this.worldMaterials.wood);
    back.position.set(0, 1.1, -0.14);
    back.rotation.x = -0.32;

    for (const side of [-1, 1]) {
      const legFront = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), this.worldMaterials.trimMetal);
      legFront.position.set(side * 0.72, 0.3, 0.14);
      const legBack = legFront.clone();
      legBack.position.z = -0.14;
      group.add(legFront, legBack);
    }

    group.add(seat, back);
    parent.add(group);
  }

  addMountains() {
    for (let i = 0; i < 12; i += 1) {
      const radius = 52 + i * 5.5;
      const angle = (Math.PI * 2 * i) / 12;
      const height = rand(10, 22);
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(rand(4, 8), height, 8),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x7ebad3 : 0x96c8dd,
          roughness: 1,
          metalness: 0.02,
        }),
      );
      mountain.position.set(Math.cos(angle) * radius, height * 0.5 - 1.2, Math.sin(angle) * radius - 6);
      mountain.rotation.y = rand(0, Math.PI * 2);
      this.scene.add(mountain);
    }
  }

  addCloud(x, y, z, scale) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });

    for (let i = 0; i < 5; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(rand(1.6, 2.6) * scale * 0.28, 14, 14), material);
      puff.position.set(rand(-2.4, 2.4), rand(-0.5, 0.5), rand(-0.8, 0.8));
      group.add(puff);
    }

    group.position.set(x, y, z);
    this.clouds.push({ group, speed: rand(0.35, 0.65), baseY: y });
    this.scene.add(group);
  }

  createSpawnPad(position) {
    const group = new THREE.Group();
    group.position.copy(position);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.2, 24),
      new THREE.MeshStandardMaterial({
        color: 0xeffcff,
        emissive: 0x6befff,
        emissiveIntensity: 0.12,
        roughness: 0.28,
        metalness: 0.7,
      }),
    );
    base.receiveShadow = true;
    base.castShadow = true;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.08, 12, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x72fff0,
        emissiveIntensity: 0.85,
        roughness: 0.18,
        metalness: 0.8,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.16;

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.cyan,
        color: 0x72fff0,
        opacity: 0.66,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.scale.set(4.4, 4.4, 1);
    glow.position.y = 0.3;

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.48, 4.6, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x7df7ff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    beam.position.y = 2.2;

    group.add(base, ring, glow, beam);
    this.spawnPads.push({ group, ring, glow, beam });
    this.scene.add(group);
  }

  addCollidableBox({
    x,
    y,
    z,
    w,
    h,
    d,
    color,
    material = null,
    emissive = 0x000000,
    emissiveIntensity = 0,
    collidable = true,
    vaultable = false,
  }) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material ||
        new THREE.MeshStandardMaterial({
          color,
          emissive,
          emissiveIntensity,
          roughness: 0.48,
          metalness: 0.15,
        }),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (collidable) {
      const collider = {
        minX: x - w / 2 - 0.02,
        maxX: x + w / 2 + 0.02,
        minZ: z - d / 2 - 0.02,
        maxZ: z + d / 2 + 0.02,
        topY: y + h / 2,
        height: h,
        width: w,
        depth: d,
        vaultable,
      };
      this.environmentRaycastMeshes.push(mesh);
      this.cameraCollisionMeshes.push(mesh);
      this.collisionVolumes.push(collider);
      mesh.userData.collider = collider;
    }
    return mesh;
  }

  buildPlayerAvatar() {
    this.playerAvatar = new THREE.Group();
    this.playerAvatar.position.set(0, -CONFIG.playerHeight, 0);
    this.playerObject.add(this.playerAvatar);

    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x18314a,
      emissive: 0x2a5672,
      emissiveIntensity: 0.08,
      roughness: 0.62,
      metalness: 0.18,
    });
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8f5ff,
      emissive: 0x5adeff,
      emissiveIntensity: 0.12,
      roughness: 0.22,
      metalness: 0.82,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb56f,
      emissive: 0xff9d56,
      emissiveIntensity: 0.2,
      roughness: 0.26,
      metalness: 0.42,
    });
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdcc0,
      roughness: 0.64,
      metalness: 0.02,
    });

    this.playerBodyPivot = new THREE.Group();
    this.playerAvatar.add(this.playerBodyPivot);

    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.36), suitMaterial);
    hips.position.y = 0.92;

    this.playerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.86, 0.42), suitMaterial);
    this.playerTorso.position.y = 1.42;

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.58, 0.48), armorMaterial);
    chest.position.set(0, 1.52, 0.04);

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.66, 0.22), trimMaterial);
    backpack.position.set(0, 1.42, 0.28);

    this.playerHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMaterial);
    this.playerHead.position.set(0, 2.08, -0.02);
    this.playerHead.scale.set(0.92, 1.02, 0.92);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.16, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0x18283d,
        emissive: 0x63e7ff,
        emissiveIntensity: 0.28,
        roughness: 0.16,
        metalness: 0.84,
      }),
    );
    visor.position.set(0, 2.06, -0.16);

    const shoulderLeft = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), armorMaterial);
    shoulderLeft.position.set(0.4, 1.64, 0.02);
    const shoulderRight = shoulderLeft.clone();
    shoulderRight.position.x *= -1;

    this.playerLeftArmPivot = new THREE.Group();
    this.playerLeftArmPivot.position.set(0.38, 1.58, 0.02);
    this.playerRightArmPivot = new THREE.Group();
    this.playerRightArmPivot.position.set(-0.38, 1.58, 0.02);

    const armGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.74, 10);
    const leftArm = new THREE.Mesh(armGeometry, suitMaterial);
    leftArm.position.y = -0.36;
    const rightArm = new THREE.Mesh(armGeometry, suitMaterial);
    rightArm.position.y = -0.36;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skinMaterial);
    leftHand.position.y = -0.74;
    const rightHand = leftHand.clone();
    this.playerLeftArmPivot.add(leftArm, leftHand);
    this.playerRightArmPivot.add(rightArm, rightHand);

    this.playerLeftLegPivot = new THREE.Group();
    this.playerLeftLegPivot.position.set(0.16, 0.8, 0.02);
    this.playerRightLegPivot = new THREE.Group();
    this.playerRightLegPivot.position.set(-0.16, 0.8, 0.02);

    const legGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.86, 10);
    const leftLeg = new THREE.Mesh(legGeometry, suitMaterial);
    leftLeg.position.y = -0.42;
    const rightLeg = new THREE.Mesh(legGeometry, suitMaterial);
    rightLeg.position.y = -0.42;
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.34), trimMaterial);
    leftBoot.position.set(0, -0.84, -0.08);
    const rightBoot = leftBoot.clone();
    this.playerLeftLegPivot.add(leftLeg, leftBoot);
    this.playerRightLegPivot.add(rightLeg, rightBoot);

    this.playerHeadAnchor = new THREE.Object3D();
    this.playerHeadAnchor.position.set(0, 1.68, -0.02);

    this.playerWeaponPivot = new THREE.Group();
    this.playerWeaponPivot.position.set(-0.22, 1.28, -0.22);
    this.playerWeaponPivot.rotation.set(-0.2, 0.08, -0.08);

    this.playerShotgunGroup = new THREE.Group();
    const lightGunShellMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2f5f8,
      emissive: 0x53789d,
      emissiveIntensity: 0.08,
      roughness: 0.24,
      metalness: 0.74,
    });
    const lightGunTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f141b,
      emissive: 0x243749,
      emissiveIntensity: 0.1,
      roughness: 0.34,
      metalness: 0.82,
    });
    const safetyOrangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8b3d,
      emissive: 0xff8b3d,
      emissiveIntensity: 0.26,
      roughness: 0.2,
      metalness: 0.44,
    });
    const receiverCore = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 1.06), this.weaponMaterials.body);
    receiverCore.position.set(0, 0.02, -0.08);
    const receiverShell = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 1.2), lightGunShellMaterial);
    receiverShell.position.set(0, 0.1, -0.16);
    const sidePanelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.62), lightGunShellMaterial);
    sidePanelLeft.position.set(0.18, 0.06, -0.28);
    const sidePanelRight = sidePanelLeft.clone();
    sidePanelRight.position.x *= -1;
    const barrelHousing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.82), this.weaponMaterials.accent);
    barrelHousing.position.set(0.02, 0.05, -0.98);
    const barrelShroud = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.56), lightGunShellMaterial);
    barrelShroud.position.set(0.02, 0.08, -0.84);
    const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.28), lightGunTrimMaterial);
    muzzleBrake.position.set(0.02, 0.06, -1.52);
    const underBarrelLamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.34), safetyOrangeMaterial);
    underBarrelLamp.position.set(0.02, -0.08, -1.04);
    const underRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.02), lightGunTrimMaterial);
    underRail.position.set(0.02, -0.02, -0.74);
    this.playerShotgunPump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.48), lightGunTrimMaterial);
    this.playerShotgunPump.position.set(0.02, 0.16, -0.76);
    const slideCap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), safetyOrangeMaterial);
    slideCap.position.set(0, 0.04, -0.02);
    this.playerShotgunPump.add(slideCap);
    const magWell = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.24), this.weaponMaterials.body);
    magWell.position.set(-0.04, -0.02, 0.02);
    this.playerRifleMagazine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.28), this.weaponMaterials.grip);
    this.playerRifleMagazine.position.set(-0.08, -0.18, -0.18);
    this.playerRifleMagazine.rotation.z = 0.16;
    const rearGrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.18), this.weaponMaterials.grip);
    rearGrip.position.set(0.03, -0.2, 0.24);
    rearGrip.rotation.z = -0.16;
    const triggerGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.016, 8, 20, Math.PI),
      lightGunTrimMaterial,
    );
    triggerGuard.position.set(0.03, -0.08, 0.15);
    triggerGuard.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    const stockBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.46), this.weaponMaterials.accent);
    stockBody.position.set(-0.05, 0.03, 0.52);
    stockBody.rotation.y = -0.08;
    const stockBrace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.34), lightGunShellMaterial);
    stockBrace.position.set(-0.02, 0.14, 0.72);
    const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.14), this.weaponMaterials.grip);
    stockPad.position.set(-0.08, 0.04, 0.92);
    const sightRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.84), lightGunTrimMaterial);
    sightRail.position.set(0, 0.24, -0.34);
    const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.36), armorMaterial);
    opticBase.position.set(0, 0.32, -0.2);
    const opticLens = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.28), this.weaponMaterials.accent);
    opticLens.position.set(0, 0.34, -0.3);
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), safetyOrangeMaterial);
    frontSight.position.set(0.02, 0.22, -1.32);
    this.playerRifleLaser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.01, 7.8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xff3048,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    this.playerRifleLaser.rotation.x = Math.PI / 2;
    this.playerRifleLaser.position.set(0.02, -0.06, -5.44);
    this.playerRifleLaser.renderOrder = 4;
    const slideWingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.28), safetyOrangeMaterial);
    slideWingLeft.position.set(0.12, 0.18, -0.54);
    const slideWingRight = slideWingLeft.clone();
    slideWingRight.position.x *= -1;
    const ejectionPort = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.18), lightGunTrimMaterial);
    ejectionPort.position.set(-0.17, 0.08, -0.14);
    for (let i = 0; i < 2; i += 1) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.16), safetyOrangeMaterial);
      vent.position.set(0.11, 0.06, -0.96 + i * 0.18);
      this.playerShotgunGroup.add(vent);
      const mirrorVent = vent.clone();
      mirrorVent.position.x *= -1;
      this.playerShotgunGroup.add(mirrorVent);
    }
    this.playerMuzzleShotgun = new THREE.Object3D();
    this.playerMuzzleShotgun.position.set(0.02, 0.06, -1.72);
    this.shotgunMuzzleFlash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.orange,
        color: 0xffd798,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.shotgunMuzzleFlash.position.set(0.02, 0.06, -1.66);
    this.shotgunMuzzleFlash.scale.set(0.65, 0.65, 1);
    this.playerShotgunGroup.add(
      receiverCore,
      receiverShell,
      sidePanelLeft,
      sidePanelRight,
      barrelHousing,
      barrelShroud,
      muzzleBrake,
      underBarrelLamp,
      underRail,
      this.playerShotgunPump,
      magWell,
      this.playerRifleMagazine,
      rearGrip,
      triggerGuard,
      stockBody,
      stockBrace,
      stockPad,
      sightRail,
      opticBase,
      opticLens,
      frontSight,
      this.playerRifleLaser,
      slideWingLeft,
      slideWingRight,
      ejectionPort,
      this.playerMuzzleShotgun,
      this.shotgunMuzzleFlash,
    );
    this.playerShotgunGroup.scale.set(1.12, 1.08, 1.28);
    this.playerShotgunGroup.position.set(-0.04, 0.05, -0.08);

    this.playerCannonGroup = new THREE.Group();
    const cannonBody = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 1.18), this.weaponMaterials.body);
    cannonBody.position.set(0, 0.03, -0.02);
    const cannonBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1.4), this.weaponMaterials.accent);
    cannonBarrel.position.set(0.03, 0.05, -1.02);
    this.playerCannonCoil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 10, 24), this.weaponMaterials.accent);
    this.playerCannonCoil.position.set(0, 0.05, -0.6);
    this.playerCannonCoil.rotation.y = Math.PI / 2;
    this.playerCannonCoil.scale.set(0.9, 0.55, 0.9);
    const cannonStock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.48), this.weaponMaterials.grip);
    cannonStock.position.set(-0.03, -0.01, 0.58);
    const cannonGrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.18), this.weaponMaterials.grip);
    cannonGrip.position.set(0.04, -0.2, 0.28);
    cannonGrip.rotation.z = -0.12;
    const shotgunTubeB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.1), this.weaponMaterials.accent);
    shotgunTubeB.position.set(0.02, -0.08, -0.86);
    this.playerLancePump = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.34), this.weaponMaterials.grip);
    this.playerLancePump.position.set(0.02, -0.02, -0.72);
    const shotgunShellRack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.44), armorMaterial);
    shotgunShellRack.position.set(0.18, 0, -0.22);
    for (let i = 0; i < 3; i += 1) {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 10), trimMaterial);
      shell.rotation.z = Math.PI / 2;
      shell.position.set(0.18, 0.02 + i * 0.02, -0.36 + i * 0.14);
      this.playerCannonGroup.add(shell);
    }
    this.playerMuzzleCannon = new THREE.Object3D();
    this.playerMuzzleCannon.position.set(0.02, 0.05, -1.68);
    this.cannonMuzzleFlash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.orange,
        color: 0xffbf7b,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.cannonMuzzleFlash.position.set(0.02, 0.05, -1.6);
    this.cannonMuzzleFlash.scale.set(0.9, 0.9, 1);
    this.playerCannonGroup.add(
      cannonBody,
      cannonBarrel,
      this.playerCannonCoil,
      cannonStock,
      cannonGrip,
      shotgunTubeB,
      this.playerLancePump,
      shotgunShellRack,
      this.playerMuzzleCannon,
      this.cannonMuzzleFlash,
    );
    this.playerCannonGroup.scale.set(1.08, 1.08, 1.14);

    this.playerWeaponPivot.add(this.playerShotgunGroup, this.playerCannonGroup);

    this.playerBodyPivot.add(
      hips,
      this.playerTorso,
      chest,
      backpack,
      this.playerHead,
      visor,
      shoulderLeft,
      shoulderRight,
      this.playerLeftArmPivot,
      this.playerRightArmPivot,
      this.playerLeftLegPivot,
      this.playerRightLegPivot,
      this.playerHeadAnchor,
      this.playerWeaponPivot,
    );
  }

  buildWeapon() {
    this.weaponGroup = new THREE.Group();
    this.weaponPivot = new THREE.Group();
    this.weaponGroup.position.set(0.42, -0.42, -0.82);
    this.weaponPivot.position.set(0, 0, 0);
    this.weaponGroup.add(this.weaponPivot);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8e2ec,
      emissive: 0x3b607f,
      emissiveIntensity: 0.08,
      roughness: 0.26,
      metalness: 0.78,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x121821,
      emissive: 0x2e475d,
      emissiveIntensity: 0.14,
      roughness: 0.26,
      metalness: 0.88,
    });
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x181e26,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.54,
      metalness: 0.16,
    });
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2f5f8,
      emissive: 0x425f7c,
      emissiveIntensity: 0.08,
      roughness: 0.2,
      metalness: 0.72,
    });
    const safetyOrangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8b3d,
      emissive: 0xff8b3d,
      emissiveIntensity: 0.22,
      roughness: 0.2,
      metalness: 0.44,
    });
    this.weaponMaterials = {
      body: bodyMaterial,
      accent: accentMaterial,
      grip: gripMaterial,
    };

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 1.12), bodyMaterial);
    receiver.position.set(0, 0.02, -0.12);

    const receiverShell = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 1.22), shellMaterial);
    receiverShell.position.set(0, 0.11, -0.18);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.98), accentMaterial);
    barrel.position.set(0.02, 0.06, -1.02);

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.58), shellMaterial);
    shroud.position.set(0.02, 0.09, -0.82);

    const underTube = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.04), accentMaterial);
    underTube.position.set(0.02, -0.03, -0.8);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.34), safetyOrangeMaterial);
    lamp.position.set(0.02, -0.09, -1.08);

    const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.44), gripMaterial);
    magazine.position.set(-0.16, -0.06, -0.16);
    magazine.rotation.z = 0.14;

    const magWell = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.24), bodyMaterial);
    magWell.position.set(-0.05, -0.02, 0.02);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.5), accentMaterial);
    pump.position.set(0.02, 0.16, -0.76);
    const slideCap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), safetyOrangeMaterial);
    slideCap.position.set(0, 0.04, -0.04);
    pump.add(slideCap);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.52), accentMaterial);
    stock.position.set(-0.06, 0.02, 0.56);
    stock.rotation.y = -0.08;

    const stockCap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.16), gripMaterial);
    stockCap.position.set(-0.09, 0.02, 0.86);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.18), gripMaterial);
    grip.position.set(0.04, -0.22, 0.24);
    grip.rotation.z = -0.16;

    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.86), accentMaterial);
    sightBase.position.set(0, 0.24, -0.34);

    const sightRing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.34), shellMaterial);
    sightRing.position.set(0, 0.33, -0.22);

    const opticLens = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.24), accentMaterial);
    opticLens.position.set(0, 0.34, -0.32);

    const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.26), accentMaterial);
    muzzleBrake.position.set(0.02, 0.06, -1.54);

    const sidePlateLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.62), shellMaterial);
    sidePlateLeft.position.set(0.2, 0.05, -0.26);
    const sidePlateRight = sidePlateLeft.clone();
    sidePlateRight.position.x *= -1;

    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), safetyOrangeMaterial);
    frontSight.position.set(0.02, 0.21, -1.3);

    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0.02, 0.06, -1.72);

    this.muzzleFlash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.orange,
        color: 0xffdf9b,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.muzzleFlash.position.set(0.02, 0.06, -1.66);
    this.muzzleFlash.scale.set(0.45, 0.45, 1);

    this.weaponPivot.add(
      receiver,
      receiverShell,
      barrel,
      shroud,
      underTube,
      lamp,
      magazine,
      magWell,
      pump,
      stock,
      stockCap,
      grip,
      sightBase,
      sightRing,
      opticLens,
      muzzleBrake,
      sidePlateLeft,
      sidePlateRight,
      frontSight,
      this.muzzle,
      this.muzzleFlash,
    );
    this.camera.add(this.weaponGroup);

    const handMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe0c4,
      roughness: 0.56,
      metalness: 0.02,
    });

    const handLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.18), handMaterial);
    handLeft.position.set(0.2, -0.18, -0.34);
    handLeft.rotation.z = 0.28;

    const handRight = handLeft.clone();
    handRight.position.set(-0.16, -0.21, 0.16);
    handRight.rotation.z = -0.28;
    this.weaponPivot.add(handLeft, handRight);
    this.buildPlayerAvatar();
    this.applyWeaponVisuals();
  }

  resetRun() {
    for (const enemy of [...this.enemies]) {
      enemy.destroy(false);
    }

    for (const grenade of this.grenades) {
      this.scene.remove(grenade.mesh);
    }
    this.grenades.length = 0;

    for (const projectile of this.projectiles) {
      this.scene.remove(projectile.mesh);
    }
    this.projectiles.length = 0;

    for (const effect of this.effects) {
      this.scene.remove(effect.object);
    }
    this.effects.length = 0;

    this.player.velocity.set(0, 0, 0);
    const spawnData = this.findSafePlayerSpawn();
    this.playerObject.position.copy(spawnData.position);
    this.resolveCircleCollisions(this.playerObject.position, CONFIG.playerRadius);
    this.lookAngles.yaw = spawnData.yaw;
    this.lookAngles.pitch = 0;
    this.resetTouchLookState();
    this.viewRecoil.pitch = 0;
    this.viewRecoil.yaw = 0;
    this.viewRecoil.roll = 0;
    this.applyViewRotation();
    this.player.health = this.player.maxHealth;
    this.applyProgressionBonuses();
    this.player.shield = this.player.maxShield;
    this.player.onGround = true;
    this.player.groundHeight = this.playerObject.position.y;
    this.player.vaultCooldown = 0;
    this.player.lastDamageTime = -10;
    this.player.damagePulse = 0;
    this.player.stuckTime = 0;
    this.damageFeedback.flash = 0;
    this.damageFeedback.direction = 0;
    this.damageFeedback.angle = 0;
    this.resetWeaponState();

    this.applyViewRotation();
    this.snapThirdPersonCamera();
    this.started = true;
    this.gameOver = false;
    this.wave = 0;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.waitingForNextWave = true;
    this.intermission = 1.25;
    this.spawnQueue = [];
    this.bossEnemy = null;
    this.fireCooldown = 0;
    this.reloadTimer = 0;
    this.reloadTotal = 0;
    this.weaponRecoil = 0;
    this.weaponKick = 0;
    this.showAnnouncement("MISSION START", 1.5, "#86f2ff");
    ui.objective.textContent = "첫 웨이브가 곧 시작됩니다. 중앙 라인을 넓게 쓰고 스폰 패드를 확인하세요.";
    ui.statusNote.textContent = "밝은 엄폐물 사이를 활용해 드론 투사체를 끊어낼 수 있습니다.";
    this.updateUI(true);
  }

  getWeaponOrigin() {
    if (this.activeWeaponId === "lance" && this.playerMuzzleCannon) {
      return this.playerMuzzleCannon.getWorldPosition(new THREE.Vector3());
    }
    if (this.playerMuzzleShotgun) {
      return this.playerMuzzleShotgun.getWorldPosition(new THREE.Vector3());
    }
    return this.muzzle.getWorldPosition(new THREE.Vector3());
  }

  snapThirdPersonCamera() {
    this.camera.position.set(CONFIG.thirdPersonShoulder, CONFIG.thirdPersonHeight, CONFIG.thirdPersonDistance);
    this.camera.rotation.set(0, 0, 0);
  }

  updateThirdPersonCamera(dt) {
    if (!this.started || !this.camera.parent) {
      return;
    }

    const aimBlend = this.aimDownSights ? 1 : 0;
    const desiredLocal = new THREE.Vector3(
      THREE.MathUtils.lerp(CONFIG.thirdPersonShoulder, 0.64, aimBlend),
      THREE.MathUtils.lerp(CONFIG.thirdPersonHeight, 0.16, aimBlend) + this.weaponKick * 0.03,
      THREE.MathUtils.lerp(CONFIG.thirdPersonDistance, 4.4, aimBlend) + this.weaponRecoil * 0.16,
    );

    const pitchObject = this.camera.parent;
    pitchObject.updateWorldMatrix(true, false);
    const anchorWorld = this.getPlayerEyePosition().clone().add(new THREE.Vector3(0, 0.08, 0));
    const desiredWorld = desiredLocal.clone().applyMatrix4(pitchObject.matrixWorld);
    const travel = desiredWorld.clone().sub(anchorWorld);
    const distance = travel.length();
    let resolvedWorld = desiredWorld;

    if (distance > 0.0001) {
      const direction = travel.clone().normalize();
      const raycaster = new THREE.Raycaster(anchorWorld, direction, 0, distance);
      const hits = raycaster.intersectObjects(this.cameraCollisionMeshes, false);
      if (hits.length > 0) {
        resolvedWorld = anchorWorld.clone().addScaledVector(direction, Math.max(0.9, hits[0].distance - 0.24));
      }
    }

    const resolvedLocal = pitchObject.worldToLocal(resolvedWorld.clone());
    const smooth = 1 - Math.exp(-dt * 12);
    this.camera.position.lerp(resolvedLocal, smooth);
  }

  updatePlayerAvatar(dt) {
    if (!this.playerAvatar) {
      return;
    }

    this.playerAvatar.visible = this.started;
    if (!this.started) {
      return;
    }

    const move = this.player.moveBlend;
    const gait = this.time * (this.player.onGround ? 8.2 : 5.2);
    const legSwing = Math.sin(gait) * 0.84 * move;
    const armSwing = Math.sin(gait + Math.PI) * 0.22 * move;
    const bob = Math.abs(Math.cos(gait * 0.5)) * 0.08 * move;
    const aimBlend = this.aimDownSights ? 1 : 0;
    const isLance = this.activeWeaponId === "lance";
    const rifleReloading = !isLance && this.reloadTimer > 0 && this.reloadTotal > 0;
    const reloadAlpha = rifleReloading ? clamp(1 - this.reloadTimer / Math.max(this.reloadTotal, 0.0001), 0, 1) : 0;
    const reloadReach = rifleReloading ? Math.sin(reloadAlpha * Math.PI) : 0;
    const reloadStage = rifleReloading
      ? reloadAlpha < 0.52
        ? Math.sin((reloadAlpha / 0.52) * Math.PI * 0.5)
        : Math.cos(((reloadAlpha - 0.52) / 0.48) * Math.PI * 0.5)
      : 0;
    const reloadAccent = rifleReloading ? Math.sin(reloadAlpha * Math.PI) : 0;

    this.playerBodyPivot.position.y = THREE.MathUtils.damp(this.playerBodyPivot.position.y, bob, 10, dt);
    this.playerBodyPivot.rotation.z = THREE.MathUtils.damp(
      this.playerBodyPivot.rotation.z,
      clamp(this.player.velocity.x / CONFIG.sprintSpeed, -1, 1) * 0.12,
      8,
      dt,
    );
    this.playerTorso.rotation.x = THREE.MathUtils.damp(
      this.playerTorso.rotation.x,
      -0.08 - this.weaponRecoil * 0.06 + move * 0.04,
      10,
      dt,
    );
    this.playerHead.rotation.x = THREE.MathUtils.damp(this.playerHead.rotation.x, this.lookAngles.pitch * 0.18, 10, dt);
    this.playerHead.rotation.y = THREE.MathUtils.damp(
      this.playerHead.rotation.y,
      clamp(this.weaponKick * 0.08, -0.12, 0.12),
      10,
      dt,
    );
    this.playerLeftArmPivot.position.x = THREE.MathUtils.damp(
      this.playerLeftArmPivot.position.x,
      0.38 + reloadReach * 0.08,
      10,
      dt,
    );
    this.playerLeftArmPivot.position.y = THREE.MathUtils.damp(
      this.playerLeftArmPivot.position.y,
      1.58 - reloadReach * 0.04,
      10,
      dt,
    );
    this.playerRightArmPivot.position.x = THREE.MathUtils.damp(
      this.playerRightArmPivot.position.x,
      -0.38 + reloadReach * 0.02,
      10,
      dt,
    );
    this.playerRightArmPivot.position.y = THREE.MathUtils.damp(
      this.playerRightArmPivot.position.y,
      1.58 - reloadReach * 0.02,
      10,
      dt,
    );

    this.playerLeftLegPivot.rotation.x = legSwing;
    this.playerRightLegPivot.rotation.x = -legSwing;
    this.playerLeftArmPivot.rotation.x = THREE.MathUtils.damp(
      this.playerLeftArmPivot.rotation.x,
      -0.72 + armSwing * 0.34 - aimBlend * 0.14 - reloadReach * 0.44,
      12,
      dt,
    );
    this.playerRightArmPivot.rotation.x = THREE.MathUtils.damp(
      this.playerRightArmPivot.rotation.x,
      -1.16 - this.weaponRecoil * 0.16 - armSwing * 0.15 + reloadReach * 0.18,
      12,
      dt,
    );
    this.playerLeftArmPivot.rotation.z = THREE.MathUtils.damp(
      this.playerLeftArmPivot.rotation.z,
      0.2 + reloadReach * 0.46,
      12,
      dt,
    );
    this.playerRightArmPivot.rotation.z = THREE.MathUtils.damp(
      this.playerRightArmPivot.rotation.z,
      -0.42 + (isLance ? -0.08 : 0) - reloadReach * 0.12,
      12,
      dt,
    );

    this.playerWeaponPivot.position.x = THREE.MathUtils.damp(
      this.playerWeaponPivot.position.x,
      (isLance ? -0.14 : -0.22) + reloadReach * 0.06,
      12,
      dt,
    );
    this.playerWeaponPivot.position.y = THREE.MathUtils.damp(
      this.playerWeaponPivot.position.y,
      1.28 - bob * 0.18 + this.weaponKick * 0.03 - reloadReach * 0.12,
      12,
      dt,
    );
    this.playerWeaponPivot.position.z = THREE.MathUtils.damp(
      this.playerWeaponPivot.position.z,
      THREE.MathUtils.lerp(-0.22, -0.08, aimBlend) + reloadReach * 0.08,
      12,
      dt,
    );
    this.playerWeaponPivot.rotation.x = THREE.MathUtils.damp(
      this.playerWeaponPivot.rotation.x,
      (isLance ? -0.1 : -0.2) - this.weaponRecoil * 0.08 + reloadReach * 0.12,
      12,
      dt,
    );
    this.playerWeaponPivot.rotation.y = THREE.MathUtils.damp(
      this.playerWeaponPivot.rotation.y,
      (isLance ? 0.14 : 0.08) + reloadReach * 0.1,
      12,
      dt,
    );
    this.playerWeaponPivot.rotation.z = THREE.MathUtils.damp(
      this.playerWeaponPivot.rotation.z,
      (isLance ? -0.14 : -0.08) + reloadReach * 0.08,
      12,
      dt,
    );

    if (this.playerRifleMagazine) {
      this.playerRifleMagazine.position.set(
        -0.08 + reloadStage * 0.14,
        -0.18 - reloadStage * 0.36 + reloadAccent * 0.12,
        -0.18 + reloadStage * 0.28,
      );
      this.playerRifleMagazine.rotation.set(
        -reloadStage * 0.92 + reloadAccent * 0.18,
        reloadStage * 0.22,
        0.16 + reloadStage * 0.54,
      );
    }
    if (this.playerShotgunPump) {
      this.playerShotgunPump.position.z = -0.76 + (isLance ? 0 : this.weaponRecoil * 0.24);
      this.playerShotgunPump.position.y = 0.16 - (isLance ? 0 : this.weaponRecoil * 0.03);
      this.playerShotgunPump.rotation.x = isLance ? 0 : -this.weaponRecoil * 0.08;
    }
    if (this.playerLancePump) {
      this.playerLancePump.position.z = -0.72 + (isLance ? this.weaponRecoil * 0.2 : 0);
    }
    if (this.playerRifleLaser) {
      this.playerRifleLaser.visible = !isLance;
      this.playerRifleLaser.material.opacity = !isLance
        ? (this.aimDownSights ? 0.38 : 0.24) * (1 - reloadReach * 0.82)
        : 0;
      this.playerRifleLaser.scale.set(
        this.aimDownSights ? 0.92 : 1,
        1 + this.weaponRecoil * 0.08,
        this.aimDownSights ? 1.08 : 1,
      );
    }
    if (this.playerCannonCoil) {
      this.playerCannonCoil.rotation.z += dt * 4.2;
    }

    if (this.shotgunMuzzleFlash) {
      this.shotgunMuzzleFlash.material.opacity = this.activeWeaponId === "rifle" && this.muzzleTimer > 0 ? this.muzzleTimer * 14 : 0;
      this.shotgunMuzzleFlash.scale.setScalar(0.7 + this.muzzleTimer * 7.4);
    }
    if (this.cannonMuzzleFlash) {
      this.cannonMuzzleFlash.material.opacity = this.activeWeaponId === "lance" && this.muzzleTimer > 0 ? this.muzzleTimer * 12 : 0;
      this.cannonMuzzleFlash.scale.setScalar(0.95 + this.muzzleTimer * 8.2);
    }
  }

  getGroundHeightAt(position, currentEyeY = this.playerObject.position.y) {
    let highestOffset = 0;
    const currentOffset = currentEyeY - CONFIG.playerHeight;

    for (const surface of this.walkSurfaces) {
      if (
        position.x < surface.minX ||
        position.x > surface.maxX ||
        position.z < surface.minZ ||
        position.z > surface.maxZ
      ) {
        continue;
      }

      const stepUp = surface.height - currentOffset;
      const canStepUp = this.player.onGround && stepUp <= CONFIG.stepAssistHeight;
      const canLandFromAbove = currentEyeY >= CONFIG.playerHeight + surface.height - 0.24 && this.player.velocity.y <= 0.6;

      if ((canStepUp || canLandFromAbove) && surface.height > highestOffset) {
        highestOffset = surface.height;
      }
    }

    return CONFIG.playerHeight + highestOffset;
  }

  tryVault(direction) {
    if (!this.player.onGround || this.player.vaultCooldown > 0 || direction.lengthSq() < 0.12) {
      return null;
    }

    const moveDir = direction.clone().normalize();
    const probe = this.playerObject.position.clone().addScaledVector(moveDir, CONFIG.playerRadius + 0.7);

    for (const obstacle of this.collisionVolumes) {
      if (
        !obstacle.vaultable ||
        probe.x < obstacle.minX - 0.15 ||
        probe.x > obstacle.maxX + 0.15 ||
        probe.z < obstacle.minZ - 0.15 ||
        probe.z > obstacle.maxZ + 0.15
      ) {
        continue;
      }

      const target = this.playerObject.position.clone();
      const clearance = CONFIG.playerRadius + 0.14;
      if (Math.abs(moveDir.x) > Math.abs(moveDir.z)) {
        target.x = moveDir.x > 0 ? obstacle.maxX + clearance : obstacle.minX - clearance;
        target.z += moveDir.z * (obstacle.depth * 0.5 + 0.4);
      } else {
        target.z = moveDir.z > 0 ? obstacle.maxZ + clearance : obstacle.minZ - clearance;
        target.x += moveDir.x * (obstacle.width * 0.5 + 0.4);
      }

      this.resolveCircleCollisions(target, CONFIG.playerRadius, obstacle, 0);
      target.y = this.playerObject.position.y + clamp(obstacle.height * 0.42, 0.45, 0.72);
      this.player.vaultCooldown = 0.42;
      this.showAnnouncement("VAULT", 0.24, "#fff0b7");
      return target;
    }

    return null;
  }

  resolveCircleCollisions(position, radius, ignoredVolume = null, allowedTopHeight = -Infinity) {
    for (const obstacle of this.collisionVolumes) {
      if (obstacle === ignoredVolume) {
        continue;
      }
      if (allowedTopHeight >= obstacle.topY - 0.04) {
        continue;
      }

      const closestX = clamp(position.x, obstacle.minX, obstacle.maxX);
      const closestZ = clamp(position.z, obstacle.minZ, obstacle.maxZ);
      let dx = position.x - closestX;
      let dz = position.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq === 0) {
          const left = Math.abs(position.x - obstacle.minX);
          const right = Math.abs(obstacle.maxX - position.x);
          const top = Math.abs(position.z - obstacle.minZ);
          const bottom = Math.abs(obstacle.maxZ - position.z);
          const min = Math.min(left, right, top, bottom);

          if (min === left) {
            position.x = obstacle.minX - radius;
          } else if (min === right) {
            position.x = obstacle.maxX + radius;
          } else if (min === top) {
            position.z = obstacle.minZ - radius;
          } else {
            position.z = obstacle.maxZ + radius;
          }
        } else {
          const dist = Math.sqrt(distSq);
          const push = radius - dist;
          dx /= dist;
          dz /= dist;
          position.x += dx * push;
          position.z += dz * push;
        }
      }
    }

    const limit = CONFIG.arenaLimit - radius;
    position.x = clamp(position.x, -limit, limit);
    position.z = clamp(position.z, -limit, limit);
  }

  isPositionClear(position, radius, allowedTopHeight = -Infinity, ignoredVolume = null) {
    const limit = CONFIG.arenaLimit - radius;
    if (position.x < -limit || position.x > limit || position.z < -limit || position.z > limit) {
      return false;
    }

    for (const obstacle of this.collisionVolumes) {
      if (obstacle === ignoredVolume) {
        continue;
      }
      if (allowedTopHeight >= obstacle.topY - 0.04) {
        continue;
      }

      const closestX = clamp(position.x, obstacle.minX, obstacle.maxX);
      const closestZ = clamp(position.z, obstacle.minZ, obstacle.maxZ);
      const dx = position.x - closestX;
      const dz = position.z - closestZ;
      if (dx * dx + dz * dz < radius * radius - 0.0001) {
        return false;
      }
    }

    return true;
  }

  getThirdPersonSpawnClearance(position, yaw) {
    const anchor = position.clone().add(new THREE.Vector3(0, 0.08, 0));
    const desiredOffset = new THREE.Vector3(CONFIG.thirdPersonShoulder, CONFIG.thirdPersonHeight, CONFIG.thirdPersonDistance);
    desiredOffset.applyAxisAngle(UP, yaw);
    const distance = desiredOffset.length();
    if (distance < 0.0001) {
      return 0;
    }

    const raycaster = new THREE.Raycaster(anchor, desiredOffset.clone().normalize(), 0, distance);
    const hits = raycaster.intersectObjects(this.cameraCollisionMeshes, false);
    return hits.length > 0 ? hits[0].distance : distance;
  }

  findSafePlayerSpawn() {
    const baseCandidates = [
      new THREE.Vector2(8.4, 16.4),
      new THREE.Vector2(-8.4, 16.4),
      new THREE.Vector2(8.4, -16.4),
      new THREE.Vector2(-8.4, -16.4),
      new THREE.Vector2(0, 18.6),
      new THREE.Vector2(0, -18.6),
      new THREE.Vector2(18.6, 0),
      new THREE.Vector2(-18.6, 0),
    ];

    let bestCandidate = null;
    let bestScore = -Infinity;
    const evaluateCandidate = (x, z, preferred) => {
      const candidate = new THREE.Vector3(x, CONFIG.playerHeight, z);
      const groundY = this.getGroundHeightAt(candidate, CONFIG.playerHeight);
      candidate.y = groundY;
      const allowedTopHeight = groundY - CONFIG.playerHeight;
      if (!this.isPositionClear(candidate, CONFIG.playerRadius, allowedTopHeight)) {
        return;
      }

      const toCenter = new THREE.Vector3(-candidate.x, 0, -candidate.z);
      if (toCenter.lengthSq() < 0.0001) {
        toCenter.set(0, 0, -1);
      } else {
        toCenter.normalize();
      }

      const yaw = Math.atan2(-toCenter.x, -toCenter.z);
      const cameraClearance = this.getThirdPersonSpawnClearance(candidate, yaw);
      const preferredOffset = preferred.distanceTo(new THREE.Vector2(x, z));
      const score = cameraClearance * 1.35 - preferredOffset * 0.08;
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = { position: candidate, yaw };
      }
    };

    for (const preferred of baseCandidates) {
      evaluateCandidate(preferred.x, preferred.y, preferred);
      for (let radius = 1.8; radius <= 6.6; radius += 1.6) {
        for (let i = 0; i < 10; i += 1) {
          const angle = (Math.PI * 2 * i) / 10;
          evaluateCandidate(
            preferred.x + Math.cos(angle) * radius,
            preferred.y + Math.sin(angle) * radius,
            preferred,
          );
        }
      }
    }

    if (bestCandidate) {
      return bestCandidate;
    }

    const fallback = new THREE.Vector3(8.4, CONFIG.playerHeight, 16.4);
    fallback.y = this.getGroundHeightAt(fallback, CONFIG.playerHeight);
    this.resolveCircleCollisions(fallback, CONFIG.playerRadius);
    return { position: fallback, yaw: 0 };
  }

  findNearbyRecoveryPosition(origin, moveDirection) {
    const forward = moveDirection.clone();
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
    const candidateDirections = [
      forward,
      right,
      right.clone().negate(),
      forward.clone().negate(),
      forward.clone().add(right).normalize(),
      forward.clone().sub(right).normalize(),
    ];

    for (const distance of [0.42, 0.74, 1.08]) {
      for (const direction of candidateDirections) {
        const candidate = origin.clone().addScaledVector(direction, distance);
        const groundY = this.getGroundHeightAt(candidate, Math.max(origin.y, candidate.y));
        candidate.y = groundY;
        if (this.isPositionClear(candidate, CONFIG.playerRadius, groundY - CONFIG.playerHeight)) {
          return candidate;
        }
      }
    }

    return null;
  }

  getPlayerEyePosition() {
    if (this.playerHeadAnchor) {
      return this.playerHeadAnchor.getWorldPosition(new THREE.Vector3());
    }
    return new THREE.Vector3(
      this.playerObject.position.x,
      this.playerObject.position.y,
      this.playerObject.position.z,
    );
  }

  queueWave() {
    this.wave += 1;
    this.spawnQueue = [];
    const isBossWave = this.wave >= 3 && this.wave % 3 === 0;
    const totalEnemies = isBossWave ? Math.min(6 + this.wave, 14) : Math.min(8 + this.wave * 2, 22);
    const bruiserCount = Math.max(0, Math.floor(this.wave / 2));
    const strikerCount = Math.max(1, Math.floor((this.wave + 1) / 2));
    const roster = [];

    if (isBossWave) {
      roster.push("boss");
    }

    for (let i = 0; i < bruiserCount; i += 1) {
      roster.push("bruiser");
    }
    for (let i = 0; i < strikerCount; i += 1) {
      roster.push("striker");
    }
    while (roster.length < totalEnemies + (isBossWave ? 2 : 0)) {
      roster.push("skirmisher");
    }

    roster.forEach((type, index) => {
      const pad = this.spawnPads[index % this.spawnPads.length];
      const jitter = new THREE.Vector3(rand(-1.2, 1.2), 0, rand(-1.2, 1.2));
      const delay = type === "boss" ? 0.25 : (isBossWave ? 0.95 : 0.18) + index * (isBossWave ? 0.24 : 0.17);
      this.spawnQueue.push({
        type,
        delay,
        position: pad.group.position.clone().add(jitter),
      });
    });

    if (isBossWave) {
      this.showAnnouncement(`BOSS WAVE ${this.wave}`, 2.2, "#ffe3a2");
      this.audio.bossIncoming();
      ui.objective.textContent = `웨이브 ${this.wave}. Aurora Overseer가 투입됩니다. 보스 코어와 주변 에스코트를 분리해서 처리하세요.`;
      ui.statusNote.textContent = "보스는 큰 탄막을 쏘므로 측면 이동과 ADS 랜스 헤드샷이 특히 중요합니다.";
    } else {
      this.showAnnouncement(`WAVE ${this.wave}`, 1.8, "#7efaff");
      ui.objective.textContent = `웨이브 ${this.wave}. 스폰 패드 라인을 확인하고 드론이 엄폐물 뒤로 들어오기 전에 정리하세요.`;
      ui.statusNote.textContent =
        this.wave >= 4
          ? "브루저 드론은 체력이 높으니 중앙 눈 코어에 연속 헤드샷을 노리세요."
          : "스커미셔와 스트라이커는 빠르게 측면으로 흐르니 첫 탄을 화면 중앙에 정렬하는 게 중요합니다.";
    }
    if (isBossWave) {
      ui.objective.textContent = `WAVE ${this.wave}. The Sunspore Archmage is entering the arena. Break the mushroom swarm and dodge the spell spores.`;
      ui.statusNote.textContent = "Boss casting soon. Weave through cover, then punish the archmage with shotgun bursts.";
    } else {
      ui.objective.textContent = `WAVE ${this.wave}. Mushroom critters are rushing the lanes. Hold the center and crush the melee swarm.`;
      ui.statusNote.textContent =
        this.wave >= 4
          ? "Heavy pomcaps are joining the push. Thin them with rifle fire and grenades before the front line reaches you."
          : "Zipcaps bounce faster than the rest. Keep your aim centered and blast them before they flank.";
    }
  }

  spawnEnemy(type, position) {
    const enemy = new Enemy(this, type, position);
    this.enemies.push(enemy);
    if (enemy.type.boss) {
      this.bossEnemy = enemy;
      this.showAnnouncement(enemy.type.label.toUpperCase(), 1.8, "#ffe7a3");
      ui.objective.textContent = `BOSS WAVE ${this.wave}. Break the mushroom escort and bring down the Sunspore Archmage.`;
      ui.statusNote.textContent = "Boss active. Keep moving between spell volleys, then dump shotgun blasts into the archmage.";
    }
  }

  spawnEnemyBolt(origin, direction, type) {
    const mesh = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(type.scale * 0.12, 10, 10),
      new THREE.MeshStandardMaterial({
        color: type.coreColor,
        emissive: type.coreColor,
        emissiveIntensity: 1,
        roughness: 0.12,
        metalness: 0.02,
      }),
    );
    const aura = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.orange,
        color: type.coreColor,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.74,
      }),
    );
    aura.scale.setScalar(type.scale * 0.5);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(type.scale * 0.19, type.scale * 0.026, 8, 18),
      new THREE.MeshBasicMaterial({
        color: type.trimColor,
        transparent: true,
        opacity: 0.78,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(core, aura, ring);
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      velocity: direction.clone().multiplyScalar(type.projectileSpeed),
      damage: type.damage,
      life: 4.2,
      color: type.coreColor,
      ring,
      aura,
      auraBaseScale: type.scale * 0.5,
      hitRadius: type.magic ? 0.9 : 0.65,
      magic: Boolean(type.magic),
    });
  }

  spawnImpact(position, color, count = 8, speed = 5) {
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(rand(0.028, 0.06), 0),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 1,
        }),
      );
      mesh.position.copy(position);
      this.scene.add(mesh);
      const velocity = new THREE.Vector3(rand(-1, 1), rand(0.2, 1.3), rand(-1, 1))
        .normalize()
        .multiplyScalar(rand(speed * 0.4, speed));
      const total = rand(0.2, 0.35);
      this.effects.push({
        object: mesh,
        velocity,
        gravity: 10,
        life: total,
        total,
        spin: new THREE.Vector3(rand(-12, 12), rand(-12, 12), rand(-12, 12)),
      });
    }
  }

  spawnExplosion(position, color, count, scale) {
    this.spawnImpact(position, color, count, 7.5 * scale);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.orange,
        color,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.position.copy(position);
    glow.scale.setScalar(1.6 * scale);
    this.scene.add(glow);
    this.effects.push({
      object: glow,
      velocity: new THREE.Vector3(),
      gravity: 0,
      life: 0.24,
      total: 0.24,
      scaleBoost: 3.4 * scale,
      sprite: true,
    });
  }

  spawnMagicBurst(position, color, scale = 1) {
    this.spawnImpact(position, color, Math.round(12 * scale), 5.8 * scale);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.38 * scale, 0.045 * scale, 8, 24),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.82,
      }),
    );
    ring.position.copy(position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    this.effects.push({
      object: ring,
      velocity: new THREE.Vector3(),
      gravity: 0,
      life: 0.24,
      total: 0.24,
      scaleBoost: 1.8 * scale,
      sprite: true,
      spin: new THREE.Vector3(0, 6, 0),
    });
  }

  damageEnemiesInRadius(position, radius, damage, ignoreEnemy = null) {
    let hitCount = 0;
    for (const enemy of [...this.enemies]) {
      if (!enemy.alive || enemy === ignoreEnemy) {
        continue;
      }
      const enemyCenter = enemy.group.position.clone().add(new THREE.Vector3(0, enemy.type.eyeHeight * 0.45, 0));
      const reach = radius + enemy.radius * 0.5;
      const distance = enemyCenter.distanceTo(position);
      if (distance > reach) {
        continue;
      }
      const falloff = 1 - clamp(distance / reach, 0, 1) * 0.72;
      enemy.takeDamage(damage * Math.max(0.32, falloff), enemyCenter, false);
      hitCount += 1;
    }
    if (hitCount > 0) {
      this.hitmarkerTimer = 0.14;
    }
    return hitCount;
  }

  spawnTracer(start, end, color = 0xfff5c7) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.scene.add(line);
    this.effects.push({
      object: line,
      velocity: new THREE.Vector3(),
      gravity: 0,
      life: 0.06,
      total: 0.06,
      line: true,
    });
  }

  spawnShotgunBlast(origin, direction, color) {
    const right = new THREE.Vector3().crossVectors(direction, UP);
    if (right.lengthSq() < 0.0001) {
      right.set(1, 0, 0);
    } else {
      right.normalize();
    }
    const localUp = new THREE.Vector3().crossVectors(right, direction).normalize();
    const flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowTextures.orange,
        color,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    flash.position.copy(origin).addScaledVector(direction, 0.18);
    flash.scale.setScalar(0.95);
    this.scene.add(flash);
    this.effects.push({
      object: flash,
      velocity: new THREE.Vector3(),
      gravity: 0,
      life: 0.07,
      total: 0.07,
      scaleBoost: 3.6,
      sprite: true,
    });

    const shockwave = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.26, 24),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      }),
    );
    shockwave.position.copy(origin).addScaledVector(direction, 0.12);
    shockwave.lookAt(origin.clone().add(direction));
    this.scene.add(shockwave);
    this.effects.push({
      object: shockwave,
      velocity: direction.clone().multiplyScalar(2.2),
      gravity: 0,
      life: 0.09,
      total: 0.09,
      scaleBoost: 3.2,
      sprite: true,
    });

    for (let i = 0; i < 8; i += 1) {
      const total = rand(0.08, 0.14);
      const spark = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
        }),
      );
      spark.position.copy(origin);
      this.scene.add(spark);
      const velocity = direction
        .clone()
        .add(new THREE.Vector3(rand(-0.35, 0.35), rand(-0.16, 0.18), rand(-0.35, 0.35)))
        .normalize()
        .multiplyScalar(rand(7.2, 12));
      this.effects.push({
        object: spark,
        velocity,
        gravity: 7.2,
        life: total,
        total,
        spin: new THREE.Vector3(rand(-16, 16), rand(-16, 16), rand(-16, 16)),
      });
    }

    for (let i = 0; i < 5; i += 1) {
      const smoke = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.glowTextures.smoke,
          color: 0xffffff,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        }),
      );
      smoke.position.copy(origin).addScaledVector(direction, 0.1 + i * 0.08);
      smoke.scale.setScalar(0.86 + i * 0.22);
      this.scene.add(smoke);
      this.effects.push({
        object: smoke,
        velocity: direction
          .clone()
          .multiplyScalar(1.8 + i * 0.42)
          .add(new THREE.Vector3(rand(-0.28, 0.28), rand(0.22, 0.56), rand(-0.28, 0.28))),
        gravity: 0,
        life: 0.34 + i * 0.06,
        total: 0.34 + i * 0.06,
        scaleBoost: 2.3,
        sprite: true,
      });
    }

    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.16, 10),
      new THREE.MeshStandardMaterial({
        color: 0xdba35a,
        emissive: 0xffc66f,
        emissiveIntensity: 0.1,
        roughness: 0.24,
        metalness: 0.72,
      }),
    );
    shell.rotation.z = Math.PI / 2;
    shell.position
      .copy(origin)
      .addScaledVector(right, 0.14)
      .addScaledVector(localUp, 0.05)
      .addScaledVector(direction, -0.18);
    this.scene.add(shell);
    const ejection = right
      .clone()
      .multiplyScalar(2.6)
      .add(localUp.multiplyScalar(1.8))
      .add(direction.clone().multiplyScalar(-0.7));
    this.effects.push({
      object: shell,
      velocity: ejection,
      gravity: 9.5,
      life: 0.62,
      total: 0.62,
      spin: new THREE.Vector3(rand(12, 22), rand(10, 18), rand(-18, 18)),
    });
  }

  setDamageFeedback(sourcePosition = null) {
    this.damageFeedback.flash = 1;
    this.damageFeedback.direction = 1;

    if (!sourcePosition) {
      return;
    }

    const sourceDir = sourcePosition.clone().sub(this.playerObject.position);
    sourceDir.y = 0;
    if (sourceDir.lengthSq() <= 0.0001) {
      return;
    }
    sourceDir.normalize();

    const forward = this.camera.getWorldDirection(new THREE.Vector3());
    forward.y = 0;
    if (forward.lengthSq() <= 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
    this.damageFeedback.angle = Math.atan2(right.dot(sourceDir), forward.dot(sourceDir));
  }

  damagePlayer(amount, sourcePosition = null) {
    if (this.gameOver) {
      return;
    }

    this.player.lastDamageTime = this.time;
    let remaining = amount;
    if (this.player.shield > 0) {
      const shieldUsed = Math.min(this.player.shield, remaining);
      this.player.shield -= shieldUsed;
      remaining -= shieldUsed;
    }
    if (remaining > 0) {
      this.player.health -= remaining;
    }

    this.audio.playerHit();
    this.showAnnouncement("INCOMING", 0.3, "#ffb3bb");
    this.player.damagePulse = 1;
    this.setDamageFeedback(sourcePosition);
    this.weaponKick = Math.max(this.weaponKick, 0.38);
    this.weaponRecoil = Math.max(this.weaponRecoil, 0.42);
    this.crosshairKick = Math.max(this.crosshairKick, 0.45);
    ui.statusNote.textContent = "피격 중입니다. 엄폐물 뒤로 빠지거나 점프로 궤적을 끊으세요.";

    if (this.player.health <= 0) {
      this.player.health = 0;
      this.onGameOver();
    }
  }

  onEnemyKilled(enemy) {
    this.comboTimer = 4;
    this.combo = clamp(this.combo + 1, 1, 8);
    this.score += enemy.type.score * this.combo;
    this.progression.cores += enemy.type.cores || 0;
    this.saveProgression();
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("sunstrike-best-score", String(this.bestScore));
    }
    if (enemy.type.boss) {
      this.showAnnouncement("BOSS DOWN", 1.8, "#fff0b5");
      ui.statusNote.textContent = "보스를 제거했습니다. 잠깐의 공백 동안 업그레이드와 리로드를 정비하세요.";
    } else {
      ui.statusNote.textContent =
        enemy.typeName === "bruiser"
          ? "브루저 제거 완료. 다시 중앙 라인을 넓게 먹으며 스폰 포인트를 확인하세요."
          : "타겟 다운. 콤보가 유지되는 동안 다음 드론을 빠르게 물어주세요.";
    }
  }

  onGameOver() {
    this.gameOver = true;
    this.started = true;
    this.showAnnouncement("MISSION FAILED", 1.6, "#ff8f9d");
    ui.objective.textContent = "재도전을 준비하세요. 첫 웨이브 진입 각을 더 넓게 잡으면 안정적입니다.";
    if (this.isTouchDevice) {
      this.setOverlay(
        "MISSION FAILED",
        `최종 점수 ${this.score.toString().padStart(6, "0")}점. 업그레이드를 정비하고 다시 도전하세요.`,
        "다시 시작 버튼을 누르면 전장을 초기화하고 즉시 재도전합니다.",
        "Restart",
      );
      return;
    }

    this.controls.unlock();
  }

  startReload() {
    const weapon = this.getActiveWeapon();
    const weaponState = this.getActiveWeaponState();
    if (this.reloadTimer > 0 || weaponState.ammo === weapon.magSize || this.gameOver) {
      return;
    }

    this.reloadTotal = weapon.reloadTime * this.reloadMultiplier;
    this.reloadTimer = this.reloadTotal;
    this.mouseDown = false;
    this.audio.reload(this.activeWeaponId);
    ui.statusNote.textContent = "리로드 중입니다. 좌우 무빙으로 시선을 끊으며 장전을 마치세요.";
  }

  completeReload() {
    const weapon = this.getActiveWeapon();
    this.getActiveWeaponState().ammo = weapon.magSize;
    this.reloadTotal = 0;
    if (this.activeWeaponId === "lance") {
      this.audio.pump();
    }
    ui.statusNote.textContent = "탄창 재정렬 완료. 화면 중앙 기준으로 정확하게 다시 진입하세요.";
  }

  fireWeapon() {
    if (!this.isGameplayActive() || this.gameOver || this.reloadTimer > 0) {
      return;
    }
    const weapon = this.getActiveWeapon();
    const weaponState = this.getActiveWeaponState();
    if (weaponState.ammo <= 0) {
      this.startReload();
      return;
    }
    if (this.fireCooldown > 0) {
      return;
    }

    this.fireCooldown = weapon.fireInterval;
    weaponState.ammo -= 1;
    this.crosshairKick = weapon.pelletCount ? 1.62 : 0.92;
    this.weaponRecoil = weapon.pelletCount ? 1.46 : 0.72;
    this.weaponKick = weapon.pelletCount ? 1.34 : 0.7;
    this.muzzleTimer = weapon.pelletCount ? 0.085 : 0.06;
    this.audio.shot(this.activeWeaponId);

    const recoilPitch = weapon.pelletCount ? 0.082 : 0.026;
    const recoilYaw = weapon.pelletCount ? rand(-0.022, 0.022) : rand(-0.007, 0.007);
    const recoilRoll = weapon.pelletCount ? rand(-0.018, 0.018) : rand(-0.005, 0.005);
    this.viewRecoil.pitch = clamp(this.viewRecoil.pitch + recoilPitch, 0, weapon.pelletCount ? 0.2 : 0.1);
    this.viewRecoil.yaw = clamp(this.viewRecoil.yaw + recoilYaw, -0.08, 0.08);
    this.viewRecoil.roll = clamp(this.viewRecoil.roll + recoilRoll, -0.08, 0.08);
    this.applyViewRotation();

    const muzzleWorld = this.getWeaponOrigin();
    const baseRaycaster = new THREE.Raycaster();
    baseRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    baseRaycaster.far = weapon.maxRange || CONFIG.bulletRange;
    const allTargets = [...this.enemyRaycastMeshes, ...this.environmentRaycastMeshes];

    let hitPoint = baseRaycaster.ray.origin.clone().add(baseRaycaster.ray.direction.clone().multiplyScalar(baseRaycaster.far));
    let hitEnemy = null;
    let crit = false;
    const intersections = baseRaycaster.intersectObjects(allTargets, false);

    if (intersections.length > 0) {
      const hit = intersections[0];
      hitPoint = hit.point.clone();
      if (hit.object.userData.enemy) {
        hitEnemy = hit.object.userData.enemy;
        crit = Boolean(hit.object.userData.crit);
      }
    }

    const shotDirection = hitPoint.clone().sub(muzzleWorld);
    if (shotDirection.lengthSq() < 0.0001) {
      shotDirection.copy(baseRaycaster.ray.direction);
    } else {
      shotDirection.normalize();
    }
    const muzzleRay = new THREE.Raycaster(muzzleWorld, shotDirection, 0, weapon.maxRange || CONFIG.bulletRange);
    const muzzleHits = muzzleRay.intersectObjects(allTargets, false);
    if (muzzleHits.length > 0) {
      const muzzleHit = muzzleHits[0];
      hitPoint = muzzleHit.point.clone();
      if (muzzleHit.object.userData.enemy) {
        hitEnemy = muzzleHit.object.userData.enemy;
        crit = Boolean(muzzleHit.object.userData.crit);
      } else {
        hitEnemy = null;
        crit = false;
        this.spawnImpact(hitPoint, 0xffffff, 7, 5);
      }
    }

    if (weapon.explosive) {
      this.spawnTracer(
        muzzleWorld,
        hitPoint,
        this.aimDownSights ? weapon.aimTracerColor : weapon.tracerColor,
      );
      const directDamage = weapon.damage * this.damageMultiplier;
      if (hitEnemy) {
        hitEnemy.takeDamage(directDamage, hitPoint, false);
        this.hitmarkerTimer = 0.14;
      }
      this.spawnExplosion(hitPoint, weapon.tracerColor, 22, 1.04);
      this.damageEnemiesInRadius(hitPoint, weapon.splashRadius, weapon.splashDamage * this.damageMultiplier, hitEnemy);
      this.audio.pulse({ frequency: 110, slideTo: 42, duration: 0.16, startGain: 0.08, type: "sawtooth" });
    } else if (weapon.pelletCount) {
      this.spawnShotgunBlast(muzzleWorld, shotDirection, this.aimDownSights ? weapon.aimTracerColor : weapon.tracerColor);
      const enemyHits = new Map();
      const visibleTracers = Math.min(4, weapon.pelletCount);

      for (let i = 0; i < weapon.pelletCount; i += 1) {
        const direction = baseRaycaster.ray.direction.clone();
        const spread = (this.aimDownSights ? weapon.spread * 0.58 : weapon.spread) * (i === 0 ? 0.3 : 1);
        const right = new THREE.Vector3().crossVectors(direction, UP);
        if (right.lengthSq() < 0.0001) {
          right.set(1, 0, 0);
        } else {
          right.normalize();
        }
        direction.addScaledVector(right, rand(-spread, spread));
        direction.y += rand(-spread * 0.42, spread * 0.42);
        direction.applyAxisAngle(UP, rand(-spread, spread) * 0.5);
        direction.normalize();

        const pelletAimPoint = baseRaycaster.ray.origin.clone().add(direction.clone().multiplyScalar(weapon.maxRange));
        const pelletDirection = pelletAimPoint.sub(muzzleWorld).normalize();
        const pelletRay = new THREE.Raycaster(muzzleWorld, pelletDirection, 0, weapon.maxRange);
        const pelletHits = pelletRay.intersectObjects(allTargets, false);
        let pelletPoint = pelletRay.ray.origin.clone().add(pelletDirection.clone().multiplyScalar(weapon.maxRange));

        if (pelletHits.length > 0) {
          const pelletHit = pelletHits[0];
          pelletPoint = pelletHit.point.clone();
          if (pelletHit.object.userData.enemy) {
            const enemy = pelletHit.object.userData.enemy;
            const isCrit = Boolean(pelletHit.object.userData.crit);
            const distanceToHit = pelletRay.ray.origin.distanceTo(pelletPoint);
            const falloff = distanceToHit <= weapon.effectiveRange
              ? 1
              : clamp(
                1 - (distanceToHit - weapon.effectiveRange) / Math.max(weapon.maxRange - weapon.effectiveRange, 0.001),
                0.32,
                1,
              );
            const pelletDamage = (isCrit ? weapon.critDamage : weapon.damage) * this.damageMultiplier * falloff;
            const prev = enemyHits.get(enemy) || { damage: 0, crit: false, point: pelletPoint };
            prev.damage += pelletDamage;
            prev.crit = prev.crit || isCrit;
            prev.point = pelletPoint;
            enemyHits.set(enemy, prev);
          } else if (i < 2) {
            this.spawnImpact(pelletPoint, 0xfff6dd, 5, 3.8);
          }
        }

        if (i < visibleTracers) {
          this.spawnTracer(muzzleWorld, pelletPoint, this.aimDownSights ? weapon.aimTracerColor : weapon.tracerColor);
        }
      }

      if (enemyHits.size > 0) {
        for (const [enemy, data] of enemyHits.entries()) {
          enemy.takeDamage(data.damage, data.point, data.crit);
        }
        this.hitmarkerTimer = 0.14;
      }
    } else if (hitEnemy) {
      this.spawnTracer(
        muzzleWorld,
        hitPoint,
        this.aimDownSights ? weapon.aimTracerColor : weapon.tracerColor,
      );
      const damage = (crit ? weapon.critDamage : weapon.damage) * this.damageMultiplier;
      hitEnemy.takeDamage(damage, hitPoint, crit);
      this.hitmarkerTimer = 0.14;
    } else {
      this.spawnTracer(
        muzzleWorld,
        hitPoint,
        this.aimDownSights ? weapon.aimTracerColor : weapon.tracerColor,
      );
    }

    if (weaponState.ammo <= 0) {
      this.startReload();
    }
  }

  showAnnouncement(text, duration, color) {
    this.announcement.text = text;
    this.announcement.time = duration;
    this.announcement.color = color;
  }

  updateMenuCamera(dt) {
    this.menuOrbit += dt * 0.18;
    this.playerObject.rotation.set(0, 0, 0);
    this.cameraPitchPivot.rotation.set(0, 0, 0);
    this.camera.up.set(0, 1, 0);
    this.camera.quaternion.identity();
    this.camera.position.set(Math.cos(this.menuOrbit) * 30, 11.5 + Math.sin(this.menuOrbit * 0.7) * 1.2, Math.sin(this.menuOrbit) * 30);
    this.camera.lookAt(0, 3.6, 0);
  }

  updateMovement(dt) {
    const currentPosition = this.playerObject.position.clone();
    const inputX =
      ((this.keys.KeyD || this.keys.ArrowRight) ? 1 : 0) -
      ((this.keys.KeyA || this.keys.ArrowLeft) ? 1 : 0) +
      (this.isTouchDevice ? this.mobileInput.move.x : 0);
    const inputZ =
      ((this.keys.KeyW || this.keys.ArrowUp) ? 1 : 0) -
      ((this.keys.KeyS || this.keys.ArrowDown) ? 1 : 0) +
      (this.isTouchDevice ? -this.mobileInput.move.y : 0);

    const input = new THREE.Vector2(inputX, inputZ);
    if (input.lengthSq() > 1) {
      input.normalize();
    }

    const yaw = this.playerObject.rotation.y;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
    const desired = new THREE.Vector3();
    desired.addScaledVector(forward, input.y);
    desired.addScaledVector(right, input.x);
    if (desired.lengthSq() > 1) {
      desired.normalize();
    }

    const wantsSprint =
      this.keys.ShiftLeft ||
      this.keys.ShiftRight ||
      (this.isTouchDevice && input.lengthSq() > 0.64 && input.y > 0.2);
    const targetSpeed = this.aimDownSights
      ? CONFIG.aimSpeed
      : wantsSprint && input.y > 0
        ? CONFIG.sprintSpeed
        : CONFIG.walkSpeed;

    desired.multiplyScalar(targetSpeed * this.mobilityMultiplier);

    const accel = this.player.onGround ? 18 : 8;
    this.player.velocity.x = THREE.MathUtils.damp(this.player.velocity.x, desired.x, accel, dt);
    this.player.velocity.z = THREE.MathUtils.damp(this.player.velocity.z, desired.z, accel, dt);

    const jumpPressed = this.keys.Space || this.mobileInput.jumpQueued;
    let vaultTarget = null;
    if (jumpPressed) {
      vaultTarget = this.tryVault(desired.lengthSq() > 0.04 ? desired : forward);
    }

    if (vaultTarget) {
      this.player.velocity.y = Math.max(this.player.velocity.y, CONFIG.vaultBoost);
      this.player.onGround = false;
    } else if (jumpPressed && this.player.onGround) {
      this.player.velocity.y = CONFIG.jumpVelocity;
      this.player.onGround = false;
    }
    this.mobileInput.jumpQueued = false;

    this.player.velocity.y -= CONFIG.gravity * dt;

    const next = vaultTarget
      ? vaultTarget
      : this.playerObject.position.clone().addScaledVector(this.player.velocity, dt);
    const proposedHorizontal = new THREE.Vector2(next.x - currentPosition.x, next.z - currentPosition.z);
    const allowedTopHeight = Math.max(
      0,
      this.getGroundHeightAt(next, Math.max(this.playerObject.position.y, next.y)) - CONFIG.playerHeight,
    );
    this.resolveCircleCollisions(next, CONFIG.playerRadius, null, allowedTopHeight);
    const resolvedHorizontal = new THREE.Vector2(next.x - currentPosition.x, next.z - currentPosition.z);
    const blockedByCollision =
      !vaultTarget &&
      input.lengthSq() > 0.02 &&
      proposedHorizontal.lengthSq() > 0.00002 &&
      resolvedHorizontal.lengthSq() < proposedHorizontal.lengthSq() * 0.1;

    let usedFallback = false;
    if (blockedByCollision) {
      const recovery = this.findNearbyRecoveryPosition(currentPosition, desired);
      if (recovery) {
        next.copy(recovery);
        this.player.velocity.x = desired.x * 0.52;
        this.player.velocity.z = desired.z * 0.52;
        usedFallback = true;
      } else {
        const fallback = currentPosition.clone().addScaledVector(desired, dt * 0.58);
        const fallbackGround = this.getGroundHeightAt(fallback, Math.max(currentPosition.y, fallback.y));
        fallback.y = fallbackGround;
        const limit = CONFIG.arenaLimit - CONFIG.playerRadius;
        fallback.x = clamp(fallback.x, -limit, limit);
        fallback.z = clamp(fallback.z, -limit, limit);
        next.copy(fallback);
        this.player.velocity.x = desired.x * 0.58;
        this.player.velocity.z = desired.z * 0.58;
        usedFallback = true;
      }
    }

    const groundY = this.getGroundHeightAt(next, Math.max(this.playerObject.position.y, next.y));
    if (next.y <= groundY + 0.08) {
      next.y = groundY;
      this.player.velocity.y = 0;
      this.player.onGround = true;
    } else {
      this.player.onGround = false;
    }

    this.player.groundHeight = groundY;
    this.player.vaultCooldown = Math.max(0, this.player.vaultCooldown - dt);

    this.playerObject.position.copy(next);
    const horizontalSpeed = new THREE.Vector2(this.player.velocity.x, this.player.velocity.z).length() / CONFIG.sprintSpeed;
    this.player.moveBlend = THREE.MathUtils.damp(this.player.moveBlend, horizontalSpeed, 10, dt);
    this.debugInfo.inputX = input.x;
    this.debugInfo.inputZ = input.y;
    this.debugInfo.desiredX = desired.x;
    this.debugInfo.desiredZ = desired.z;
    this.debugInfo.blocked = blockedByCollision;
    this.debugInfo.fallback = usedFallback;
    this.debugInfo.groundY = groundY;
  }

  updateTouchLook() {
    if (!this.isTouchDevice || !this.isGameplayActive()) {
      return;
    }

    const look = this.mobileInput.look;
    if (look.dx === 0 && look.dy === 0) {
      return;
    }

    const dx = clamp(look.dx, -42, 42);
    const dy = clamp(look.dy, -42, 42);
    if (Math.abs(dx) < CONFIG.touchLookDeadzone && Math.abs(dy) < CONFIG.touchLookDeadzone) {
      look.dx = 0;
      look.dy = 0;
      return;
    }

    this.lookAngles.yaw = wrapAngle(this.lookAngles.yaw - dx * CONFIG.touchLookSensitivity);
    this.lookAngles.pitch = clamp(
      this.lookAngles.pitch - dy * CONFIG.touchLookSensitivity * 0.72,
      -1.08,
      1.08,
    );
    look.dx = 0;
    look.dy = 0;
  }

  updateCombat(dt) {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.grenadeState.cooldown = Math.max(0, this.grenadeState.cooldown - dt);
    this.crosshairKick = THREE.MathUtils.damp(this.crosshairKick, 0, 12, dt);
    this.weaponRecoil = THREE.MathUtils.damp(this.weaponRecoil, 0, 14, dt);
    this.weaponKick = THREE.MathUtils.damp(this.weaponKick, 0, 9, dt);
    this.viewRecoil.pitch = THREE.MathUtils.damp(this.viewRecoil.pitch, 0, 18, dt);
    this.viewRecoil.yaw = THREE.MathUtils.damp(this.viewRecoil.yaw, 0, 14, dt);
    this.viewRecoil.roll = THREE.MathUtils.damp(this.viewRecoil.roll, 0, 16, dt);
    this.hitmarkerTimer = Math.max(0, this.hitmarkerTimer - dt);
    this.muzzleTimer = Math.max(0, this.muzzleTimer - dt);
    this.player.damagePulse = THREE.MathUtils.damp(this.player.damagePulse || 0, 0, 8, dt);
    this.damageFeedback.flash = THREE.MathUtils.damp(this.damageFeedback.flash || 0, 0, 10, dt);
    this.damageFeedback.direction = THREE.MathUtils.damp(this.damageFeedback.direction || 0, 0, 7, dt);

    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.completeReload();
      }
    } else if (this.mouseDown) {
      this.fireWeapon();
    }

    if (this.time - this.player.lastDamageTime > 4 && this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 18 * dt);
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    const weapon = this.getActiveWeapon();
    const targetWeaponFov = this.aimDownSights ? weapon.fov : weapon.hipFov;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetWeaponFov, 8, dt);
    this.camera.updateProjectionMatrix();
    this.applyViewRotation();
  }

  updateWeapon(dt) {
    if (!this.weaponGroup) {
      return;
    }

    this.weaponGroup.visible = false;
    this.muzzleFlash.material.opacity = 0;
    this.updatePlayerAvatar(dt);
  }

  explodeGrenade(grenade, index, position = grenade.mesh.position.clone()) {
    this.scene.remove(grenade.mesh);
    this.grenades.splice(index, 1);
    this.spawnExplosion(position, 0xa7ff6d, 26, 1.2);
    this.damageEnemiesInRadius(position, GRENADE_CONFIG.radius, GRENADE_CONFIG.damage * this.damageMultiplier);
    this.audio.pulse({ frequency: 96, slideTo: 34, duration: 0.2, startGain: 0.1, type: "sawtooth" });
  }

  updateGrenades(dt) {
    for (let i = this.grenades.length - 1; i >= 0; i -= 1) {
      const grenade = this.grenades[i];
      const previous = grenade.mesh.position.clone();

      grenade.fuse -= dt;
      grenade.velocity.y -= CONFIG.gravity * 0.72 * dt;
      grenade.mesh.position.addScaledVector(grenade.velocity, dt);
      grenade.mesh.rotation.x += grenade.spin.x * dt;
      grenade.mesh.rotation.y += grenade.spin.y * dt;
      grenade.mesh.rotation.z += grenade.spin.z * dt;

      const travel = grenade.mesh.position.clone().sub(previous);
      const distance = travel.length();
      if (distance > 0.0001) {
        const raycaster = new THREE.Raycaster(previous, travel.normalize(), 0, distance + 0.04);
        const wallHits = raycaster.intersectObjects(this.environmentRaycastMeshes, false);
        if (wallHits.length > 0) {
          const hit = wallHits[0];
          grenade.mesh.position.copy(hit.point);
          if (hit.face) {
            const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
            grenade.mesh.position.addScaledVector(normal, 0.12);
            grenade.velocity.reflect(normal).multiplyScalar(0.46);
          } else {
            grenade.velocity.x *= -0.46;
            grenade.velocity.z *= -0.46;
          }
          grenade.bounces += 1;
        }
      }

      if (grenade.mesh.position.y <= 0.18) {
        grenade.mesh.position.y = 0.18;
        grenade.velocity.y = Math.abs(grenade.velocity.y) * 0.36;
        grenade.velocity.x *= 0.82;
        grenade.velocity.z *= 0.82;
        grenade.bounces += 1;
      }

      if (grenade.fuse <= 0 || (grenade.bounces > 4 && grenade.velocity.lengthSq() < 5)) {
        this.explodeGrenade(grenade, i);
      }
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      if (projectile.ring) {
        projectile.ring.rotation.z += dt * 6;
        projectile.ring.rotation.y += dt * 4;
      }
      if (projectile.aura) {
        projectile.aura.material.opacity = 0.56 + Math.sin(this.time * 12 + i) * 0.16;
        projectile.aura.scale.setScalar(
          projectile.auraBaseScale + Math.sin(this.time * 9 + i) * 0.04 + (projectile.magic ? 0.1 : 0),
        );
      }
      const previous = projectile.mesh.position.clone();
      projectile.mesh.position.addScaledVector(projectile.velocity, dt);
      projectile.life -= dt;

      const direction = projectile.velocity.clone().normalize();
      const distance = previous.distanceTo(projectile.mesh.position);
      const raycaster = new THREE.Raycaster(previous, direction, 0, distance);
      const wallHits = raycaster.intersectObjects(this.environmentRaycastMeshes, false);

      if (wallHits.length > 0) {
        if (projectile.magic) {
          this.spawnMagicBurst(wallHits[0].point, projectile.color, 0.75);
        } else {
          this.spawnImpact(wallHits[0].point, projectile.color, 6, 4);
        }
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      const eye = this.getPlayerEyePosition();
      if (projectile.mesh.position.distanceTo(eye) < (projectile.hitRadius || 0.65)) {
        this.damagePlayer(projectile.damage, projectile.mesh.position);
        if (projectile.magic) {
          this.spawnMagicBurst(projectile.mesh.position, projectile.color, 0.9);
        } else {
          this.spawnImpact(projectile.mesh.position, projectile.color, 8, 5);
        }
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (
        projectile.life <= 0 ||
        Math.abs(projectile.mesh.position.x) > 60 ||
        Math.abs(projectile.mesh.position.z) > 60
      ) {
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const effect = this.effects[i];
      effect.life -= dt;

      if (effect.velocity.lengthSq() > 0) {
        effect.velocity.y -= effect.gravity * dt;
        effect.object.position.addScaledVector(effect.velocity, dt);
      }

      if (effect.spin) {
        effect.object.rotation.x += effect.spin.x * dt;
        effect.object.rotation.y += effect.spin.y * dt;
        effect.object.rotation.z += effect.spin.z * dt;
      }

      const alpha = Math.max(effect.life / effect.total, 0);
      if (effect.object.material) {
        effect.object.material.opacity = alpha;
      }
      if (effect.sprite) {
        const scale = 1 + (1 - alpha) * effect.scaleBoost;
        effect.object.scale.setScalar(scale);
      }

      if (effect.life <= 0) {
        this.scene.remove(effect.object);
        this.effects.splice(i, 1);
      }
    }
  }

  updateWaveState(dt) {
    if (this.spawnQueue.length > 0) {
      this.spawnQueue[0].delay -= dt;
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].delay <= 0) {
        const carry = this.spawnQueue[0].delay;
        const entry = this.spawnQueue.shift();
        this.spawnEnemy(entry.type, entry.position);
        if (this.spawnQueue.length > 0) {
          this.spawnQueue[0].delay += carry;
        }
      }
      return;
    }

    if (this.enemies.length === 0) {
      if (!this.waitingForNextWave) {
        this.waitingForNextWave = true;
        this.intermission = 2.05;
        if (this.wave > 0) {
          this.audio.waveClear();
          this.showAnnouncement("WAVE CLEAR", 1.2, "#b6fff4");
          ui.objective.textContent = "전장 정리 완료. 다음 웨이브 준비 중...";
        }
      } else {
        this.intermission -= dt;
        if (this.intermission <= 0) {
          this.waitingForNextWave = false;
          this.queueWave();
        }
      }
    }
  }

  updateAmbient(dt) {
    this.time += dt;

    this.sunSprite.material.opacity = 0.82 + Math.sin(this.time * 0.6) * 0.08;
    this.sunSprite.scale.setScalar(18 + Math.sin(this.time * 0.45) * 1.2);

    for (const cloud of this.clouds) {
      cloud.group.position.x += cloud.speed * dt;
      cloud.group.position.y = cloud.baseY + Math.sin(this.time * 0.5 + cloud.group.position.z) * 0.4;
      if (cloud.group.position.x > 54) {
        cloud.group.position.x = -54;
      }
    }

    for (let i = 0; i < this.spawnPads.length; i += 1) {
      const pad = this.spawnPads[i];
      const pulse = 0.8 + Math.sin(this.time * 3.2 + i) * 0.22 + (this.waitingForNextWave ? 0.06 : 0);
      pad.ring.scale.setScalar(pulse);
      pad.glow.material.opacity = 0.48 + Math.sin(this.time * 3.6 + i) * 0.12;
      pad.beam.scale.y = 0.9 + Math.sin(this.time * 2.2 + i) * 0.08;
      pad.beam.material.opacity = 0.14 + Math.sin(this.time * 4 + i) * 0.04;
    }

    for (const animate of this.decorAnimations) {
      animate(this.time);
    }

    if (this.announcement.time > 0) {
      this.announcement.time -= dt;
    }

    const intensity = clamp(
      (this.enemies.length * 1.18 + this.spawnQueue.length * 0.34 + (this.bossEnemy ? 6 : 0)) / 12,
      0,
      1,
    );
    const audioRunning = Boolean(this.audio.context && this.audio.context.state === "running");
    this.audio.updateMusic({
      started: this.started || audioRunning,
      gameOver: this.gameOver,
      paused: this.started && !this.isGameplayActive(),
      boss: Boolean(this.bossEnemy),
      intensity: this.started ? intensity : 0.34,
      wave: Math.max(this.wave, 1),
    });
  }

  updateMinimap() {
    if (!this.minimapContext) {
      return;
    }

    const ctx = this.minimapContext;
    const size = ui.minimap.width;
    const center = size * 0.5;
    const scale = size / (CONFIG.arenaLimit * 2.4);

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#081625";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(134, 242, 255, 0.16)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const t = (size / 4) * i;
      ctx.beginPath();
      ctx.moveTo(t, 0);
      ctx.lineTo(t, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, t);
      ctx.lineTo(size, t);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.strokeRect(12, 12, size - 24, size - 24);

    for (const pad of this.spawnPads) {
      const x = center + pad.group.position.x * scale;
      const y = center + pad.group.position.z * scale;
      ctx.fillStyle = "rgba(130, 248, 255, 0.28)";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const enemy of this.enemies) {
      const x = center + enemy.group.position.x * scale;
      const y = center + enemy.group.position.z * scale;
      ctx.fillStyle = enemy.type.boss ? "#ffe08f" : enemy.typeName === "striker" ? "#65ffbe" : enemy.typeName === "bruiser" ? "#7efce4" : "#a7ecff";
      ctx.beginPath();
      ctx.arc(x, y, enemy.type.boss ? 7 : enemy.typeName === "bruiser" ? 4.6 : 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const px = center + this.playerObject.position.x * scale;
    const py = center + this.playerObject.position.z * scale;
    const angle = this.isTouchDevice ? this.lookAngles.yaw : this.playerObject.rotation.y;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-angle);
    ctx.fillStyle = "#fff4c4";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6.5, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6.5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ui.minimapLabel.textContent = this.bossEnemy ? "Boss Contact" : this.enemies.length > 0 ? "Threat Live" : "Sweep";
  }

  updateDebugHud() {
    if (!ui.debugHud || this.isTouchDevice) {
      return;
    }

    const keysDown = ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft"]
      .filter((code) => this.keys[code])
      .map((code) => code.replace("Key", "").replace("Left", ""))
      .join(" ") || "-";

    ui.debugHud.textContent = [
      `BUILD ${this.debugBuild}`,
      `active:${this.isGameplayActive()} started:${this.started} locked:${this.controls.isLocked} overlayHidden:${ui.overlay.classList.contains("hidden")}`,
      `pos x:${this.playerObject.position.x.toFixed(2)} y:${this.playerObject.position.y.toFixed(2)} z:${this.playerObject.position.z.toFixed(2)}`,
      `vel x:${this.player.velocity.x.toFixed(2)} y:${this.player.velocity.y.toFixed(2)} z:${this.player.velocity.z.toFixed(2)}`,
      `input x:${this.debugInfo.inputX.toFixed(2)} z:${this.debugInfo.inputZ.toFixed(2)} keys:${keysDown}`,
      `desired x:${this.debugInfo.desiredX.toFixed(2)} z:${this.debugInfo.desiredZ.toFixed(2)}`,
      `blocked:${this.debugInfo.blocked} fallback:${this.debugInfo.fallback} ground:${this.debugInfo.groundY.toFixed(2)}`,
      `look yaw:${this.lookAngles.yaw.toFixed(2)} pitch:${this.lookAngles.pitch.toFixed(2)} weapon:${this.activeWeaponId}`,
      `map: sunspire-bastion-v1`,
    ].join("\n");
  }

  updateUI(force = false) {
    const healthRatio = clamp(this.player.health / this.player.maxHealth, 0, 1);
    const shieldRatio = clamp(this.player.shield / this.player.maxShield, 0, 1);
    ui.wave.textContent = String(this.wave);
    ui.score.textContent = this.score.toString().padStart(6, "0");
    ui.best.textContent = this.bestScore.toString().padStart(6, "0");
    ui.hudCores.textContent = String(this.progression.cores);
    ui.coresTotal.textContent = String(this.progression.cores);
    ui.healthText.textContent = Math.ceil(this.player.health).toString();
    ui.shieldText.textContent = Math.ceil(this.player.shield).toString();
    ui.healthBar.style.width = `${healthRatio * 100}%`;
    ui.shieldBar.style.width = `${shieldRatio * 100}%`;
    ui.playerVitalsHealth.style.width = `${healthRatio * 100}%`;
    ui.playerVitalsShield.style.width = `${shieldRatio * 100}%`;
    ui.playerVitalsText.textContent = `${Math.ceil(this.player.health)} HP / ${Math.ceil(this.player.shield)} SH`;
    ui.playerVitals.classList.toggle("critical", healthRatio < 0.38 || this.damageFeedback.flash > 0.2);
    ui.weaponLabel.textContent = this.getActiveWeapon().label;
    ui.ammo.textContent = String(this.getActiveWeaponState().ammo);
    ui.ammoMax.textContent = String(this.getActiveWeapon().magSize);
    ui.reloadState.textContent = this.reloadTimer > 0 ? "RELOADING" : "READY";
    ui.combo.textContent = `COMBO x${this.combo}`;
    ui.weaponSlotRifle.classList.toggle("active", this.activeWeaponId === "rifle");
    ui.weaponSlotLance.classList.toggle("active", this.activeWeaponId === "lance");
    ui.grenadeCount.textContent = `3 GRENADE x${this.grenadeState.ammo}`;
    ui.grenadeCount.classList.toggle("active", this.grenadeState.cooldown <= 0 && this.grenadeState.ammo > 0);

    for (const key of UPGRADE_KEYS) {
      ui[`upgrade${key[0].toUpperCase()}${key.slice(1)}Level`].textContent = `Lv.${this.progression[key]}`;
      const cost = this.getUpgradeCost(key);
      ui[`upgrade${key[0].toUpperCase()}${key.slice(1)}Cost`].textContent = `Cost ${cost}`;
      ui[`upgrade${key[0].toUpperCase()}${key.slice(1)}`].disabled = this.progression.cores < cost;
    }

    const spread = clamp(
      this.getActiveWeapon().crosshairBase +
        this.player.moveBlend * 7 +
        this.crosshairKick * 6 -
        (this.aimDownSights ? 6 : 0),
      4,
      21,
    );
    ui.crosshair.style.setProperty("--spread", `${spread}px`);
    ui.hitmarker.classList.toggle("visible", this.hitmarkerTimer > 0);
    ui.damageVignette.style.opacity = String(clamp((this.player.damagePulse || 0) * 0.7, 0, 0.9));
    ui.damageFlash.style.opacity = String(clamp((this.damageFeedback.flash || 0) * 0.5, 0, 0.65));
    ui.damageDirection.style.opacity = String(clamp((this.damageFeedback.direction || 0) * 0.92, 0, 0.95));
    ui.damageDirection.style.setProperty("--rotation", `${this.damageFeedback.angle}rad`);

    const announcementVisible = this.announcement.time > 0;
    ui.announcer.textContent = this.announcement.text;
    ui.announcer.style.color = this.announcement.color;
    ui.announcer.classList.toggle("visible", announcementVisible);
    ui.bossHud.classList.toggle("visible", Boolean(this.bossEnemy));
    if (this.bossEnemy) {
      ui.bossName.textContent = this.bossEnemy.type.label;
      const bossHealthRatio = clamp(this.bossEnemy.health / this.bossEnemy.maxHealth, 0, 1);
      ui.bossHealthText.textContent = `${Math.ceil(bossHealthRatio * 100)}%`;
      ui.bossBar.style.width = `${bossHealthRatio * 100}%`;
    }

    if (force) {
      ui.crosshair.style.setProperty("--spread", `${spread}px`);
    }
    this.updateDebugHud();
  }

  updateGame(dt) {
    if (!this.started) {
      this.updateMenuCamera(dt);
      return;
    }

    if (!this.isGameplayActive()) {
      return;
    }

    this.updateTouchLook();
    this.applyViewRotation();
    this.updateMovement(dt);
    this.updateCombat(dt);
    this.updateThirdPersonCamera(dt);
    this.updateGrenades(dt);

    for (const enemy of [...this.enemies]) {
      enemy.update(dt);
    }

    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.updateWaveState(dt);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.updateAmbient(dt);
    this.updateGame(dt);
    this.updateWeapon(dt);
    this.minimapRefreshTimer -= dt;
    if (this.minimapRefreshTimer <= 0) {
      this.updateMinimap();
      this.minimapRefreshTimer = this.lowSpecMode ? 0.14 : 0.08;
    }
    this.updateUI();
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

const game = new Game();
window.game = game;
