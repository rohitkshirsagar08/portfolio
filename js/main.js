/**
 * CALL OF DUTY: GAMEPLAY & COMBAT PROGRAMMER PORTFOLIO
 * TACTICAL HUD LOGIC & INTERACTIVE COMBAT SYSTEMS
 * CANDIDATE: ROHIT KSHIRSAGAR
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. SYNTHESIZED TACTICAL AUDIO SYSTEM (Web Audio API)
     Zero-latency, no external audio files required!
     ========================================================================== */
  class TacticalAudioSystem {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.initAudioContext();
    }

    initAudioContext() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }

    ensureContext() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playUiClick() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    }

    playTargetBeep() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.setValueAtTime(3200, now + 0.03);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }

    playGunshot(weaponType) {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const now = this.ctx.currentTime;

      // Noise buffer for blast punch
      const bufferSize = this.ctx.sampleRate * 0.12;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Lowpass filter for weapon body
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(weaponType === 'sniper' ? 600 : 1800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + (weaponType === 'sniper' ? 0.35 : 0.12));

      // Gain envelope
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(weaponType === 'sniper' ? 0.25 : 0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (weaponType === 'sniper' ? 0.35 : 0.12));

      // Low-end sub thump oscillator
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(weaponType === 'sniper' ? 120 : 180, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      // Connect nodes
      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.35);

      subOsc.start(now);
      subOsc.stop(now + 0.15);
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }
  }

  const audioSystem = new TacticalAudioSystem();

  /* ==========================================================================
     2. TELEMETRY & LIVE CLOCK
     ========================================================================== */
  function initTelemetry() {
    const clockEl = document.getElementById('militaryClock');
    const pingEl = document.getElementById('telemetryPing');

    function updateClock() {
      const now = new Date();
      const utcString = now.toUTCString().split(' ')[4] + ' UTC';
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      if (clockEl) {
        clockEl.textContent = `${year}.${month}.${day} // ${utcString}`;
      }
    }

    setInterval(updateClock, 1000);
    updateClock();

    // Simulated ping jitter (15ms - 22ms)
    setInterval(() => {
      if (pingEl) {
        const ping = Math.floor(16 + Math.random() * 6);
        pingEl.textContent = `${ping}ms`;
      }
    }, 2800);
  }

  /* ==========================================================================
     3. INTERACTIVE RECOIL & BALLISTICS SIMULATOR
     Simulates real C++ damped spring recoil physics + spread cones
     ========================================================================== */
  class RecoilSimulator {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');

      // Weapon definitions matching AAA combat design
      this.weapons = {
        m4: {
          name: 'M4A1 TACTICAL RIFLE',
          fireRateMs: 80, // ~750 RPM
          recoilPitch: 5.5,
          recoilYaw: 1.2,
          recoilRandomSpread: 1.8,
          springStiffness: 45.0,
          springDamping: 9.5,
          color: '#00ff88',
          ammoMax: 30
        },
        smg: {
          name: 'LACHMANN-9 SUB',
          fireRateMs: 65, // ~900 RPM
          recoilPitch: 4.0,
          recoilYaw: 2.2,
          recoilRandomSpread: 2.6,
          springStiffness: 55.0,
          springDamping: 11.0,
          color: '#ff9e1b',
          ammoMax: 40
        },
        sniper: {
          name: 'VICTUS XMR .50 CAL',
          fireRateMs: 700, // Bolt action
          recoilPitch: 28.0,
          recoilYaw: 4.0,
          recoilRandomSpread: 0.2,
          springStiffness: 22.0,
          springDamping: 6.0,
          color: '#00e5ff',
          ammoMax: 5
        }
      };

      this.currentWeaponKey = 'm4';
      this.currentWeapon = this.weapons.m4;

      // Spring simulation variables
      this.recoilOffsetX = 0;
      this.recoilOffsetY = 0;
      this.velocityX = 0;
      this.velocityY = 0;

      // Target center
      this.centerX = 0;
      this.centerY = 0;

      // State
      this.isFiring = false;
      this.lastFireTime = 0;
      this.shotsFired = 0;
      this.impacts = []; // {x, y, age, maxAge}
      this.fireIntervalId = null;

      // UI readouts
      this.shotsFiredEl = document.getElementById('simShotsFired');
      this.recoilOffsetEl = document.getElementById('simRecoilOffset');
      this.muzzleClimbEl = document.getElementById('simMuzzleClimb');
      this.fireBtn = document.getElementById('fireTriggerBtn');
      this.resetBtn = document.getElementById('resetRangeBtn');

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.bindControls();

      this.lastFrameTime = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.displayWidth = rect.width;
      this.displayHeight = rect.height;
      this.centerX = this.displayWidth / 2;
      this.centerY = this.displayHeight / 2;
    }

    bindControls() {
      // Weapon selection buttons
      const weaponBtns = document.querySelectorAll('.weapon-btn');
      weaponBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          weaponBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const weaponId = btn.dataset.weapon;
          if (this.weapons[weaponId]) {
            this.currentWeaponKey = weaponId;
            this.currentWeapon = this.weapons[weaponId];
            audioSystem.playTargetBeep();
          }
        });
      });

      // Fire Button press / hold
      if (this.fireBtn) {
        const startFire = (e) => {
          e.preventDefault();
          this.isFiring = true;
          this.fireBtn.classList.add('firing');
          audioSystem.ensureContext();
          this.triggerShot();
        };

        const stopFire = () => {
          this.isFiring = false;
          this.fireBtn.classList.remove('firing');
        };

        this.fireBtn.addEventListener('mousedown', startFire);
        window.addEventListener('mouseup', stopFire);
        this.fireBtn.addEventListener('touchstart', startFire, { passive: false });
        window.addEventListener('touchend', stopFire);
      }

      // Canvas click to shoot
      this.canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.isFiring = true;
        this.triggerShot();
      });

      // Reset Range
      if (this.resetBtn) {
        this.resetBtn.addEventListener('click', () => {
          this.impacts = [];
          this.shotsFired = 0;
          this.recoilOffsetX = 0;
          this.recoilOffsetY = 0;
          this.velocityX = 0;
          this.velocityY = 0;
          audioSystem.playUiClick();
          this.updateHudReadouts();
        });
      }
    }

    triggerShot() {
      const now = performance.now();
      if (now - this.lastFireTime < this.currentWeapon.fireRateMs) return;

      this.lastFireTime = now;
      this.shotsFired++;

      // Recoil impulse applied to spring velocity
      const recoilRise = this.currentWeapon.recoilPitch;
      const recoilDrift = (Math.random() - 0.4) * this.currentWeapon.recoilYaw;
      const spread = (Math.random() - 0.5) * this.currentWeapon.recoilRandomSpread * 4;

      // Apply impulse (Negative Y is upwards kick)
      this.velocityY -= recoilRise * 15;
      this.velocityX += recoilDrift * 12;

      // Hit point on target taking current sight position + spray
      const impactX = this.centerX + this.recoilOffsetX + spread;
      const impactY = this.centerY + this.recoilOffsetY - recoilRise * 1.5;

      this.impacts.push({
        x: impactX,
        y: impactY,
        age: 0,
        maxAge: 4000 // Fades after 4 seconds
      });

      audioSystem.playGunshot(this.currentWeaponKey);
      this.updateHudReadouts();
    }

    updatePhysics(deltaTime) {
      const dt = Math.min(deltaTime, 0.05); // Clamp dt to prevent tunneling

      if (this.isFiring) {
        const now = performance.now();
        if (now - this.lastFireTime >= this.currentWeapon.fireRateMs) {
          this.triggerShot();
        }
      }

      // Second-order damped spring system (authentic C++ combat feel)
      // d2x/dt2 = -k * x - c * v
      const k = this.currentWeapon.springStiffness;
      const c = this.currentWeapon.springDamping;

      const accelX = -k * this.recoilOffsetX - c * this.velocityX;
      const accelY = -k * this.recoilOffsetY - c * this.velocityY;

      this.velocityX += accelX * dt;
      this.velocityY += accelY * dt;

      this.recoilOffsetX += this.velocityX * dt;
      this.recoilOffsetY += this.velocityY * dt;

      // Age impacts
      for (let i = this.impacts.length - 1; i >= 0; i--) {
        this.impacts[i].age += deltaTime * 1000;
        if (this.impacts[i].age > this.impacts[i].maxAge) {
          this.impacts.splice(i, 1);
        }
      }

      this.updateHudReadouts();
    }

    updateHudReadouts() {
      if (this.shotsFiredEl) this.shotsFiredEl.textContent = this.shotsFired;
      if (this.recoilOffsetEl) {
        this.recoilOffsetEl.textContent = `${this.recoilOffsetX.toFixed(1)}, ${(-this.recoilOffsetY).toFixed(1)}`;
      }
      if (this.muzzleClimbEl) {
        const climbPct = Math.min(100, Math.abs(this.recoilOffsetY) * 1.8).toFixed(0);
        this.muzzleClimbEl.textContent = `${climbPct}%`;
      }
    }

    render() {
      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Tactical Shooting Target (Concentric Rings)
      const cx = this.centerX;
      const cy = this.centerY;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      // Target rings
      const rings = [40, 80, 120, 160, 200];
      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillText((10 - idx * 2).toString(), cx + r - 16, cy - 4);
      });

      // Target bullseye axis
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 210);
      ctx.lineTo(cx, cy + 210);
      ctx.moveTo(cx - 210, cy);
      ctx.lineTo(cx + 210, cy);
      ctx.stroke();

      // 2. Render Bullet Impacts
      this.impacts.forEach((imp) => {
        const lifeRatio = 1 - (imp.age / imp.maxAge);
        ctx.beginPath();
        ctx.arc(imp.x, imp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 158, 27, ${lifeRatio * 0.9})`;
        ctx.fill();

        // Hot glowing center
        ctx.beginPath();
        ctx.arc(imp.x, imp.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${lifeRatio})`;
        ctx.fill();
      });

      // 3. Render Dynamic Weapon Reticle (Modern Warfare Optic Crosshair)
      const reticleX = cx + this.recoilOffsetX;
      const reticleY = cy + this.recoilOffsetY;

      // Reticle Color
      ctx.strokeStyle = this.currentWeapon.color;
      ctx.fillStyle = this.currentWeapon.color;
      ctx.lineWidth = 1.5;

      const gap = 12 + Math.abs(this.velocityY) * 0.15;
      const len = 14;

      // Top chevron/line
      ctx.beginPath();
      ctx.moveTo(reticleX, reticleY - gap);
      ctx.lineTo(reticleX, reticleY - gap - len);
      // Bottom line
      ctx.moveTo(reticleX, reticleY + gap);
      ctx.lineTo(reticleX, reticleY + gap + len);
      // Left line
      ctx.moveTo(reticleX - gap, reticleY);
      ctx.lineTo(reticleX - gap - len, reticleY);
      // Right line
      ctx.moveTo(reticleX + gap, reticleY);
      ctx.lineTo(reticleX + gap + len, reticleY);
      ctx.stroke();

      // Center red/green illuminated dot
      ctx.beginPath();
      ctx.arc(reticleX, reticleY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Optic frame ring (Holographic sight circle)
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(reticleX, reticleY, 38, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    loop(currentTime) {
      const dt = (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      this.updatePhysics(dt);
      this.render();

      requestAnimationFrame((t) => this.loop(t));
    }
  }

  /* ==========================================================================
     4. C++ CODE VAULT TABS
     Real combat engineering code samples
     ========================================================================== */
  const codeSnippets = {
    recoil: `// RecoilSpringModel.cpp - Damped Harmonic Recoil Kinetic Model
// Architecture for Call of Duty style procedural gunplay
#include "RecoilSpringModel.h"

void URecoilSpringComponent::TickComponent(float DeltaTime)
{
    Super::TickComponent(DeltaTime);

    // Apply 2nd order differential spring mechanics: d2x/dt2 = -k*x - c*v
    const FVector SpringForce = -Stiffness * CurrentRecoilOffset;
    const FVector DampingForce = -Damping * RecoilVelocity;
    const FVector Acceleration = (SpringForce + DampingForce) / WeaponMass;

    RecoilVelocity += Acceleration * DeltaTime;
    CurrentRecoilOffset += RecoilVelocity * DeltaTime;

    // Apply procedural weapon kick to First-Person Camera & Weapon Bone IK
    if (APlayerCameraManager* Cam = GetPlayerCameraManager())
    {
        Cam->AddPitchInput(CurrentRecoilOffset.Y * CameraKickFactor);
        Cam->AddYawInput(CurrentRecoilOffset.Z * CameraSwayFactor);
    }
}

void URecoilSpringComponent::ApplyRecoilImpulse(const FRecoilImpulseConfig& Impulse)
{
    // High-cadence linear and angular kick injection
    RecoilVelocity.X += Impulse.RearKickMetersPerSec;
    RecoilVelocity.Y += Impulse.MuzzleRiseDegPerSec * FMath::FRandRange(0.85f, 1.15f);
    RecoilVelocity.Z += Impulse.HorizontalClimbDegPerSec * FMath::FRandRange(-1.0f, 1.0f);
}`,

    lagcomp: `// LagCompensationManager.cpp - 128-Tick Rollback Hit Registration
// Server-side historical rewind buffer for authoritative validation
#include "LagCompensationManager.h"

bool ULagCompensationManager::ValidateProjectileHit(
    const FCombatTargetHistory& TargetHistory,
    const FVector& ClientHitLocation,
    float ClientTimestampSeconds,
    float MaxPermissibleLatencyMs)
{
    const float CurrentServerTime = GetWorld()->GetTimeSeconds();
    const float RTTSeconds = CurrentServerTime - ClientTimestampSeconds;

    if (RTTSeconds * 1000.0f > MaxPermissibleLatencyMs)
    {
        return false; // Packet latency exceeds maximum authoritative threshold
    }

    // Historical rewind using circular frame ring buffer
    FTransform RewoundTargetTransform;
    if (!TargetHistory.SampleInterpolatedTransform(ClientTimestampSeconds, RewoundTargetTransform))
    {
        return false; // Historical snapshot expired or dropped
    }

    // Perform sub-frame ray-sphere capsule intersection in rewound space
    const float ValidationToleranceSq = FMath::Square(12.0f); // 12 cm spatial threshold
    const float DeltaSq = FVector::DistSquared(ClientHitLocation, RewoundTargetTransform.GetLocation());

    return DeltaSq <= ValidationToleranceSq;
}`,

    ballistics: `// BallisticsIntegrator.cpp - Sub-Millimeter Projectile Simulation
// Deterministic ballistic trajectory with air drag & material penetration
#include "BallisticsIntegrator.h"

void FBallisticBullet::StepSimulation(float DeltaTime, const FVector& EnvironmentalWind)
{
    // Atmospheric Drag equation: F_drag = 0.5 * rho * v^2 * Cd * A
    const float Speed = Velocity.Size();
    const FVector WindRelativeVelocity = Velocity - EnvironmentalWind;
    const FVector DragForce = -0.5f * AirDensity * BallisticDragCoeff * CrossSectionArea 
                              * Speed * WindRelativeVelocity;

    const FVector GravityForce = FVector(0.0f, 0.0f, -980.665f) * BulletMass;
    const FVector TotalForce = DragForce + GravityForce;

    // Numerical integration (Verlet integration for ballistic stability)
    Velocity += (TotalForce / BulletMass) * DeltaTime;
    const FVector StepDisplacement = Velocity * DeltaTime;
    const FVector NextPosition = Position + StepDisplacement;

    // Continuous Collision Detection (CCD) Raycast
    FHitResult HitResult;
    if (RaycastTrajectory(Position, NextPosition, HitResult))
    {
        HandleBallisticImpact(HitResult);
    }
    else
    {
        Position = NextPosition;
    }
}`
  };

  function initCodeTabs() {
    const tabs = document.querySelectorAll('.terminal-tab');
    const codeEl = document.getElementById('terminalCodeDisplay');
    const copyBtn = document.getElementById('copyCodeBtn');

    if (!codeEl) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const snippetKey = tab.dataset.snippet;
        if (codeSnippets[snippetKey]) {
          codeEl.textContent = codeSnippets[snippetKey];
          audioSystem.playUiClick();
        }
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'COPIED TO INTEL';
          copyBtn.style.color = '#00ff88';
          audioSystem.playTargetBeep();
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.color = '';
          }, 2000);
        });
      });
    }
  }

  /* ==========================================================================
     5. HUD CONTROLS: AUDIO & NIGHT VISION GOGGLES (NVG)
     ========================================================================== */
  function initHudControls() {
    const audioBtn = document.getElementById('toggleAudioBtn');
    const nvgBtn = document.getElementById('toggleNvgBtn');
    const menuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelector('.nav-links');

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const muted = audioSystem.toggleMute();
        audioBtn.textContent = muted ? 'SFX: MUTED' : 'SFX: LIVE';
        audioBtn.classList.toggle('active', !muted);
        if (!muted) {
          audioSystem.playTargetBeep();
        }
      });
    }

    if (nvgBtn) {
      nvgBtn.addEventListener('click', () => {
        document.body.classList.toggle('nvg-mode');
        const isActive = document.body.classList.contains('nvg-mode');
        nvgBtn.textContent = isActive ? 'NVG: ON' : 'NVG: OPTIC';
        nvgBtn.classList.toggle('active', isActive);
        audioSystem.playTargetBeep();
      });
    }

    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        audioSystem.playUiClick();
      });

      // Close mobile menu when link is clicked
      navLinks.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          audioSystem.playUiClick();
        });
      });
    }

    // Add audio click feedback to all action buttons & nav links
    document.querySelectorAll('.btn-tactical, .nav-link, .comms-channel-card').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        audioSystem.playUiClick();
      });
    });
  }

  /* ==========================================================================
     6. TRANSMISSION / CONTACT FORM HANDLING
     ========================================================================== */
  function initContactForm() {
    const form = document.getElementById('transmissionForm');
    const feedbackOverlay = document.getElementById('transmissionFeedback');

    if (form && feedbackOverlay) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.textContent = 'DISPATCHING INTEL...';
          submitBtn.disabled = true;
        }

        audioSystem.playTargetBeep();

        setTimeout(() => {
          feedbackOverlay.classList.add('active');
          form.reset();
          if (submitBtn) {
            submitBtn.textContent = 'TRANSMISSION DISPATCHED';
            submitBtn.disabled = false;
          }
          audioSystem.playTargetBeep();
        }, 1200);
      });
    }
  }

  /* ==========================================================================
     7. INITIALIZATION ON DOM READY
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initTelemetry();
    new RecoilSimulator('recoilCanvas');
    initCodeTabs();
    initHudControls();
    initContactForm();
  });
})();
