import { Aircraft, Player, AirdropCrate, Rocket, Bomb, GroundTank, AutoTurret, EnemyBullet, FriendlyDrone, EnemyParatrooper, FallingWreckage, CruiseMissile, HimarsTruck, FlakCannonVehicle, RadarStationTruck, BioAcidBlob } from './types';

/**
 * Pixel-art and vector hybrid canvas sprites
 * Aircraft modeled directly after the user's reference drawing (1790870175175.jpg)
 */

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Character scaled up for crisp heroic presence matching reference image (1791355263944.jpg)
  const pScale = 1.85;
  ctx.scale(pScale, pScale);

  // Parachute when dropping down
  if (player.isParachuting) {
    ctx.save();
    ctx.translate(0, -34);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.lineTo(0, 16);
    ctx.moveTo(18, -14);
    ctx.lineTo(0, 16);
    ctx.moveTo(-6, -14);
    ctx.lineTo(0, 16);
    ctx.moveTo(6, -14);
    ctx.lineTo(0, 16);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -14, 20, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -14, 9, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  // Energy shield aura
  if (player.shieldHits > 0) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -16, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();
    ctx.restore();
  }

  // Multi-jump boots glow
  if (player.activePowerup?.type === 'MULTI_JUMP') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-8, -2, 16, 3);
  }

  // Direction facing
  ctx.scale(player.facing, 1);

  // 1. Legs and Signature Boots with White Toecaps (Reference Image: 1791355263944.jpg)
  const isMoving = Math.abs(player.vx) > 5;
  let legSwing = 0;
  if (isMoving && player.isGrounded) {
    legSwing = Math.sin(player.walkFrame) * 6;
  }

  // Green trouser legs (#2e7d32)
  ctx.fillStyle = '#2e7d32';

  if (!player.isGrounded) {
    // Jump tucked legs
    // Left leg
    ctx.fillRect(-6, -10, 5, 7);
    // Right leg
    ctx.fillRect(1, -12, 5, 8);

    // Black boots with WHITE TOE-CAPS (Reference image feature!)
    // Left boot
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-7, -4, 7, 4);
    ctx.fillStyle = '#ffffff'; // white toecap
    ctx.fillRect(-2, -4, 3, 4);
    ctx.fillRect(-7, -1, 8, 1.5); // white sole

    // Right boot
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, -5, 7, 4);
    ctx.fillStyle = '#ffffff'; // white toecap
    ctx.fillRect(4, -5, 3, 4);
    ctx.fillRect(0, -2, 7, 1.5); // white sole
  } else {
    // Walking stride / Standing
    // Back leg
    ctx.fillRect(-5 - legSwing, -11, 5, 11);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-6 - legSwing, -2, 6, 4);
    ctx.fillStyle = '#ffffff'; // white toe
    ctx.fillRect(-2 - legSwing, -2, 3, 4);
    ctx.fillRect(-6 - legSwing, 1, 7, 1.5); // white sole

    // Front leg
    ctx.fillStyle = '#388e3c';
    ctx.fillRect(1 + legSwing, -11, 5, 11);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0 + legSwing, -2, 7, 4);
    ctx.fillStyle = '#ffffff'; // white toe
    ctx.fillRect(4 + legSwing, -2, 4, 4);
    ctx.fillRect(0 + legSwing, 1, 8, 1.5); // white sole
  }

  // 2. Torso / Jumpsuit Body (Bright green uniform matching reference image)
  ctx.fillStyle = '#388e3c'; // vibrant jumpsuit green
  ctx.fillRect(-6, -23, 12, 13);

  // Shirt collar
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(-4, -23);
  ctx.lineTo(0, -19);
  ctx.lineTo(4, -23);
  ctx.closePath();
  ctx.fill();

  // Front chest pocket
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(-4, -18, 4, 4);
  ctx.strokeStyle = '#1b5e20';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-4, -18, 4, 4);

  // 3. Head, Cute Face, and Hair (Reference Image: 1791355263944.jpg)
  // Peach skin tone
  ctx.fillStyle = '#fbd5b5';
  ctx.beginPath();
  ctx.roundRect(-4, -29, 8, 7.5, 3);
  ctx.fill();

  // Dark brown hair peeking out at back and sideburns
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(-6, -28, 3, 5); // back hair
  ctx.fillRect(-2, -26, 2, 3); // sideburns

  // Cute anime cartoon eye
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1, -26, 2, 2.5); // eye
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, -28, 3, 1); // eyebrow

  // Friendly mouth smile
  ctx.fillStyle = '#b45309';
  ctx.fillRect(1, -23, 2, 1);

  // Ear on side
  ctx.fillStyle = '#fbd5b5';
  ctx.beginPath();
  ctx.arc(-2, -25, 2, 0, Math.PI * 2);
  ctx.fill();

  // 4. Bright Green Military Hard Helmet with Brim (Reference Image)
  // Visor brim
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(-7, -31, 14, 2.5);
  ctx.fillRect(3, -31, 3, 2); // extended front brim

  // Rounded helmet dome
  ctx.fillStyle = '#4caf50'; // bright green dome
  ctx.beginPath();
  ctx.arc(-0.5, -31, 6.5, Math.PI, 0);
  ctx.fill();

  // Helmet molded ridge / contour line
  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-0.5, -31, 4.5, Math.PI, 0);
  ctx.stroke();

  // 5. MANPADS / Surface-To-Air Missile Launcher (Heavy military launcher from reference image)
  let gunAngle = player.aimAngle;
  if (player.facing === -1) {
    gunAngle = Math.PI - player.aimAngle;
  }

  ctx.save();
  ctx.translate(-1, -19); // right shoulder pivot
  ctx.rotate(gunAngle);

  // Main camouflage olive/bronze launcher canister tube
  ctx.fillStyle = '#4b5536'; // military olive drab
  ctx.fillRect(-14, -5, 36, 9);

  // Metallic clamping reinforcement rings
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10, -6, 3, 11);
  ctx.fillRect(2, -6, 3, 11);
  ctx.fillRect(14, -6, 3, 11);

  // Stencil / warning decal markings
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-6, -3, 6, 2);

  // Front seeker head with Optical Glass Lens (prominent lens from reference image!)
  ctx.fillStyle = '#1e293b'; // lens bezel
  ctx.fillRect(22, -6, 5, 11);
  ctx.fillStyle = '#38bdf8'; // front blue optical lens
  ctx.beginPath();
  ctx.arc(26, -0.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff'; // lens glass glint
  ctx.fillRect(25, -2, 1.5, 1.5);

  // Top targeting viewfinder scope box with glass lens
  ctx.fillStyle = '#334155';
  ctx.fillRect(6, -9, 8, 4);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(12, -8.5, 2, 3); // sight lens
  // Red indicator dial on scope
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(8, -8, 2, 2);

  // Rear Battery Coolant Unit (BCU) box mounted under tube (reference image feature!)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-12, 4, 8, 5);

  // Rear exhaust nozzle bell
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-17, -7, 4, 13);

  // Pistol grip handle & trigger
  ctx.fillStyle = '#18181b';
  ctx.fillRect(4, 4, 3, 5);

  // Soldier's green arm & hand holding the launcher grip
  ctx.fillStyle = '#388e3c'; // sleeve
  ctx.fillRect(0, 1, 5, 4);
  ctx.fillStyle = '#fbd5b5'; // hand holding grip
  ctx.fillRect(3, 4, 3, 3);

  // Red warhead tip when loaded
  if (player.reloadProgress >= 1) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(27, -2);
    ctx.lineTo(33, -0.5);
    ctx.lineTo(27, 1);
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Helper: Draw 6 segmented mosquito legs dangling downward in natural insect posture
 */
function drawInsectLegs(
  ctx: CanvasRenderingContext2D,
  color: string,
  striped = false,
  lengthMult = 1.0,
  legSpread = 1.0
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const legs = [
    // Front leg: extends forward and down
    { attachX: 4, attachY: 3, kneeX: 12 * legSpread, kneeY: 10 * lengthMult, footX: 18 * legSpread, footY: 20 * lengthMult },
    // Middle leg: extends down and slightly back
    { attachX: -2, attachY: 3, kneeX: -2, kneeY: 14 * lengthMult, footX: 2 * legSpread, footY: 25 * lengthMult },
    // Hind leg: long trailing leg extending backwards and down
    { attachX: -8, attachY: 2, kneeX: -16 * legSpread, kneeY: 12 * lengthMult, footX: -26 * legSpread, footY: 24 * lengthMult },
  ];

  legs.forEach((leg) => {
    ctx.beginPath();
    ctx.moveTo(leg.attachX, leg.attachY);
    ctx.lineTo(leg.kneeX, leg.kneeY);
    ctx.lineTo(leg.footX, leg.footY);
    ctx.stroke();

    if (striped) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(leg.kneeX - 1.5, leg.kneeY - 1.5);
      ctx.lineTo(leg.kneeX + 1.5, leg.kneeY + 1.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leg.footX - 2, leg.footY - 2);
      ctx.lineTo(leg.footX, leg.footY);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
    }
  });

  ctx.restore();
}

/**
 * Helper: Draw translucent fluttering insect wings with delicate venation lines
 */
function drawInsectWings(
  ctx: CanvasRenderingContext2D,
  flapPhase: number,
  wingLength: number,
  wingWidth: number,
  tintColor = 'rgba(240, 249, 255, 0.7)',
  veinColor = 'rgba(100, 116, 139, 0.55)'
) {
  ctx.save();
  const flap = Math.sin(flapPhase || 0);
  const scaleY = 0.25 + 0.75 * Math.abs(flap);
  const angleOffset = flap * 0.35;

  ctx.translate(-2, -6);
  ctx.rotate(-0.35 + angleOffset);
  ctx.scale(1, scaleY);

  ctx.fillStyle = tintColor;
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-wingLength * 0.45, -wingWidth * 1.5, -wingLength, -wingWidth * 0.5);
  ctx.quadraticCurveTo(-wingLength * 0.7, wingWidth * 0.4, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-wingLength * 0.8, -wingWidth * 0.3);
  ctx.moveTo(-wingLength * 0.35, -wingWidth * 0.4);
  ctx.lineTo(-wingLength * 0.7, -wingWidth * 0.8);
  ctx.moveTo(-wingLength * 0.45, -wingWidth * 0.1);
  ctx.lineTo(-wingLength * 0.75, wingWidth * 0.1);
  ctx.stroke();

  ctx.restore();
}

/**
 * 1. AEDES MOSQUITO (এডিস মশা - Dengue Tiger Mosquito)
 */
export function drawAedesMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.7, 1.7);

  drawInsectLegs(ctx, '#0f172a', true, 1.05, 1.0);
  drawInsectWings(ctx, m.wingFlapPhase, 32, 10, 'rgba(224, 242, 254, 0.65)', 'rgba(30, 41, 59, 0.6)');

  // Segmented Striped Abdomen (Black with stark white rings)
  ctx.save();
  ctx.translate(-4, 0);
  ctx.rotate(0.2);
  for (let s = 0; s < 6; s++) {
    const segX = -s * 5;
    const segWidth = 5;
    const segH = Math.max(3, 7 - s * 0.7);

    ctx.fillStyle = s % 2 === 0 ? '#0f172a' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(segX - segWidth, -segH / 2, segWidth + 1, segH, 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(segX - segWidth + 1, -segH / 2 + 0.5, 1.8, segH - 1);
  }
  ctx.restore();

  // Thorax
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(2, -2, 7, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(2, -3.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(0, -5, 4, 1.2);

  // Head and Antennae
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(8, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(9, -2.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(9, -4);
  ctx.quadraticCurveTo(14, -8, 17, -7);
  ctx.moveTo(9, -3);
  ctx.quadraticCurveTo(13, -6, 16, -4);
  ctx.stroke();

  // Needle Proboscis
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(10, -1);
  ctx.lineTo(24, 6);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(24, 6, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const drawPropellerPlane = drawAedesMosquito;

/**
 * 2. CULEX MOSQUITO (কিউলেক্স মশা - Common Swarmer)
 */
export function drawCulexMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.65, 1.65);

  drawInsectLegs(ctx, '#78350f', false, 1.0, 0.95);
  drawInsectWings(ctx, m.wingFlapPhase, 30, 9, 'rgba(254, 243, 199, 0.65)', 'rgba(180, 83, 9, 0.55)');

  // Brownish segmented abdomen
  ctx.save();
  ctx.translate(-3, 0);
  ctx.rotate(0.15);
  for (let s = 0; s < 6; s++) {
    const segX = -s * 4.8;
    const segWidth = 4.8;
    const segH = Math.max(3, 6.5 - s * 0.6);

    ctx.fillStyle = s % 2 === 0 ? '#92400e' : '#b45309';
    ctx.beginPath();
    ctx.roundRect(segX - segWidth, -segH / 2, segWidth + 1, segH, 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(segX - segWidth + 1, -segH / 2 + 0.5, 1.2, segH - 1);
  }
  ctx.restore();

  // Thorax
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(2, -2, 6.5, 4.8, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Head
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(7.5, -1.8, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(8.5, -2.2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Proboscis
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(9, -1);
  ctx.lineTo(22, 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * 3. ANOPHELES MOSQUITO (অ্যানোফিলিস মশা - Malaria Mosquito)
 * Signature 40° tilted abdomen posture
 */
export function drawAnophelesMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.7, 1.7);

  ctx.rotate(-0.35); // Anopheles tilted posture

  drawInsectLegs(ctx, '#334155', false, 1.15, 1.1);
  drawInsectWings(ctx, m.wingFlapPhase, 33, 10, 'rgba(241, 245, 249, 0.7)', 'rgba(71, 85, 105, 0.7)');

  // Tilted abdomen
  ctx.save();
  ctx.translate(-4, -1);
  ctx.rotate(-0.25);
  for (let s = 0; s < 7; s++) {
    const segX = -s * 5;
    const segWidth = 5;
    const segH = Math.max(2.8, 6.2 - s * 0.55);

    ctx.fillStyle = s % 2 === 0 ? '#475569' : '#64748b';
    ctx.beginPath();
    ctx.roundRect(segX - segWidth, -segH / 2, segWidth + 1, segH, 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(segX - segWidth + 2, -1, 1.5, 2);
  }
  ctx.restore();

  // Thorax
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(2, -2, 6.5, 4.5, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(8, -2, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.arc(9, -2.4, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Proboscis
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(9, -1);
  ctx.lineTo(24, 3);
  ctx.stroke();

  ctx.restore();
}

export const drawJetFighter = drawCulexMosquito;

/**
 * 4. BLOODSUCKER MOSQUITO (রক্তচোষা দৈত্য মশা - Engorged Red Blood Mosquito)
 * Massive swollen translucent red belly full of pulsating blood, aggressive diving!
 */
export function drawBloodsuckerMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.8, 1.8);

  drawInsectLegs(ctx, '#450a0a', true, 1.1, 1.05);
  drawInsectWings(ctx, (m.wingFlapPhase || 0) * 1.3, 34, 11, 'rgba(254, 202, 202, 0.7)', 'rgba(153, 27, 27, 0.65)');

  // Massive swollen blood sac
  ctx.save();
  ctx.translate(-6, 1);
  ctx.rotate(0.18);

  const bloodPulse = 0.85 + Math.sin(Date.now() / 150) * 0.15;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
  ctx.shadowBlur = 10 * bloodPulse;

  const bloodGrad = ctx.createRadialGradient(-14, 0, 2, -14, 0, 16);
  bloodGrad.addColorStop(0, '#f87171');
  bloodGrad.addColorStop(0.5, '#dc2626');
  bloodGrad.addColorStop(0.85, '#991b1b');
  bloodGrad.addColorStop(1, '#450a0a');

  ctx.fillStyle = bloodGrad;
  ctx.beginPath();
  ctx.ellipse(-14, 0, 18, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(254, 226, 226, 0.4)';
  ctx.lineWidth = 1.2;
  for (let r = -24; r <= -4; r += 5) {
    ctx.beginPath();
    ctx.arc(r, 0, 8.5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-16, -5, 10, 2.8, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Thorax
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.ellipse(3, -2, 7, 5.2, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Head
  ctx.fillStyle = '#450a0a';
  ctx.beginPath();
  ctx.arc(9, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(10, -2.5, 2.0, 0, Math.PI * 2);
  ctx.fill();

  // Proboscis
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(11, -1);
  ctx.lineTo(27, 7);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(27, 8, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 5. TOXIC MUTANT MOSQUITO (বিষাক্ত মিউট্যান্ট মশা - Radioactive Green)
 */
export function drawToxicMutantMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.75, 1.75);

  drawInsectLegs(ctx, '#14532d', false, 1.05, 1.0);
  drawInsectWings(ctx, m.wingFlapPhase, 32, 10, 'rgba(187, 247, 208, 0.7)', 'rgba(34, 197, 94, 0.7)');

  // Glowing toxic abdomen
  ctx.save();
  ctx.translate(-4, 0);
  ctx.rotate(0.2);

  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 8;

  for (let s = 0; s < 6; s++) {
    const segX = -s * 5;
    const segWidth = 5;
    const segH = Math.max(3.2, 7.5 - s * 0.7);

    ctx.fillStyle = s % 2 === 0 ? '#15803d' : '#22c55e';
    ctx.beginPath();
    ctx.roundRect(segX - segWidth, -segH / 2, segWidth + 1, segH, 2);
    ctx.fill();

    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(segX - segWidth / 2, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // Thorax
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.ellipse(2, -2, 7, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, -4, 4, 3);

  // Head
  ctx.fillStyle = '#052e16';
  ctx.beginPath();
  ctx.arc(8, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(9.2, -2.4, 2.0, 0, Math.PI * 2);
  ctx.fill();

  // Proboscis
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(10, -1);
  ctx.lineTo(25, 6);
  ctx.stroke();

  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(25, 6, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 6. SPEED SWARM MOSQUITO (দ্রুতগতির ঝাঁক মশা)
 */
export function drawSpeedMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.5, 1.5);

  drawInsectLegs(ctx, '#1e293b', false, 0.85, 0.8);

  const blurAlpha = 0.4 + Math.random() * 0.3;
  ctx.fillStyle = `rgba(224, 242, 254, ${blurAlpha})`;
  ctx.beginPath();
  ctx.ellipse(-2, -8, 22, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(2, -1);
  ctx.lineTo(-24, 2);
  ctx.lineTo(-24, -2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.fillRect(-10, -2, 2.5, 4);
  ctx.fillRect(-18, -1.5, 2.5, 3);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(5, -1, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(6, -1.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(7, -0.5);
  ctx.lineTo(19, 4);
  ctx.stroke();

  ctx.restore();
}

/**
 * 8. ZIKA VIRUS MOSQUITO (জিকা ভাইরাস মশা - Cyan Neon Bio-Acid Mosquito)
 */
export function drawZikaVirusMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.65, 1.65);

  drawInsectLegs(ctx, '#0e7490', false, 1.1, 1.05);
  drawInsectWings(ctx, m.wingFlapPhase, 34, 11, 'rgba(165, 243, 252, 0.75)', 'rgba(6, 182, 212, 0.7)');

  // Bioluminescent Cyan-Teal Abdomen with Virus Pustules
  ctx.save();
  ctx.translate(-4, 0);
  ctx.rotate(0.22);
  const zikaGrad = ctx.createLinearGradient(-26, 0, 0, 0);
  zikaGrad.addColorStop(0, '#083344');
  zikaGrad.addColorStop(0.5, '#06b6d4');
  zikaGrad.addColorStop(1, '#67e8f9');
  ctx.fillStyle = zikaGrad;
  ctx.beginPath();
  ctx.ellipse(-13, 0, 14, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing virus nodes
  ctx.fillStyle = '#a5f3fc';
  for (let p = 0; p < 4; p++) {
    ctx.beginPath();
    ctx.arc(-20 + p * 5, Math.sin(p * 2) * 2.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Thorax
  ctx.fillStyle = '#164e63';
  ctx.beginPath();
  ctx.ellipse(3, -2, 7, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Head with compound glowing cyan eyes
  ctx.fillStyle = '#083344';
  ctx.beginPath();
  ctx.arc(8.5, -2, 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(9.5, -2.5, 2.0, 0, Math.PI * 2);
  ctx.fill();

  // Bio-Acid needle proboscis
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(10, -1);
  ctx.lineTo(26, 6);
  ctx.stroke();

  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.arc(26, 6, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 9. CHIKUNGUNYA VIRUS MOSQUITO (চিকুনগুনিয়া ভাইরাস মশা - Rapid Erratic Red Kamikaze)
 */
export function drawChikungunyaMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 1.55, 1.55);

  drawInsectLegs(ctx, '#7c2d12', false, 1.15, 1.1);
  drawInsectWings(ctx, m.wingFlapPhase * 1.2, 30, 9, 'rgba(254, 205, 211, 0.8)', 'rgba(239, 68, 68, 0.75)');

  // Angular flame-orange & blood-red body
  ctx.save();
  ctx.translate(-4, 0);
  ctx.rotate(0.28);
  for (let s = 0; s < 5; s++) {
    ctx.fillStyle = s % 2 === 0 ? '#ea580c' : '#b91c1c';
    ctx.fillRect(-s * 5 - 4, -4 + s * 0.4, 5, 8 - s * 0.8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-s * 5 - 3, -1, 2, 2);
  }
  ctx.restore();

  // Thorax
  ctx.fillStyle = '#9a3412';
  ctx.beginPath();
  ctx.ellipse(3, -2, 6.5, 4.8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Head with fiery eyes
  ctx.fillStyle = '#431407';
  ctx.beginPath();
  ctx.arc(8, -2, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(9, -2.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Razor needle proboscis
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(9, -1);
  ctx.lineTo(25, 5);
  ctx.stroke();

  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(25, 5, 2.0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 10. VIRUS BIO-TITAN MOSQUITO (বায়ো-টাইটান ভাইরাস মশা - Mutated Toxic Giant Queen)
 */
export function drawBioTitanVirusMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(m.direction * 2.2, 2.2);

  drawInsectLegs(ctx, '#064e3b', true, 1.2, 1.15);
  drawInsectWings(ctx, m.wingFlapPhase, 42, 14, 'rgba(187, 247, 208, 0.8)', 'rgba(16, 185, 129, 0.7)');

  // Massive Corrosive Acid Sac Abdomen
  ctx.save();
  ctx.translate(-8, 2);
  ctx.rotate(0.24);

  const titanGrad = ctx.createRadialGradient(-16, 0, 3, -16, 0, 20);
  titanGrad.addColorStop(0, '#ecfccb');
  titanGrad.addColorStop(0.4, '#84cc16');
  titanGrad.addColorStop(0.7, '#15803d');
  titanGrad.addColorStop(1, '#064e3b');

  ctx.fillStyle = titanGrad;
  ctx.beginPath();
  ctx.ellipse(-16, 0, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Biohazard Spore Dots
  ctx.fillStyle = '#facc15';
  for (let b = 0; b < 5; b++) {
    ctx.beginPath();
    ctx.arc(-24 + b * 4.5, Math.sin(b * 1.8) * 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Thorax with toxic spikes
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.ellipse(3, -2, 8, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Spikes
  ctx.fillStyle = '#a3e635';
  ctx.beginPath();
  ctx.moveTo(1, -8);
  ctx.lineTo(3, -12);
  ctx.lineTo(5, -8);
  ctx.lineTo(7, -13);
  ctx.lineTo(9, -8);
  ctx.fill();

  // Head
  ctx.fillStyle = '#022c22';
  ctx.beginPath();
  ctx.arc(10, -2, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a3e635';
  ctx.beginPath();
  ctx.arc(11.5, -2.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Heavy toxic Proboscis
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(12, -1);
  ctx.lineTo(34, 9);
  ctx.stroke();

  ctx.fillStyle = '#bef264';
  ctx.beginPath();
  ctx.arc(34, 9, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 7. TITAN QUEEN MOSQUITO BOSS (দৈত্য রানী মশা - Giant Egg-Laying Boss Queen)
 */
export function drawQueenMosquitoBoss(ctx: CanvasRenderingContext2D, boss: Aircraft) {
  ctx.save();
  ctx.translate(boss.x, boss.y);

  // When diving, rotate body downward towards target for menacing dive attack
  if (boss.isDivingToBite && boss.vy) {
    const tilt = Math.min(0.5, Math.max(-0.5, Math.atan2(boss.vy, Math.abs(boss.vx))));
    ctx.rotate(tilt);
  }

  ctx.scale(boss.direction * 2.4, 2.4);

  drawInsectLegs(ctx, boss.isEnraged ? '#7f1d1d' : '#3b0764', true, 1.25, 1.2);

  // Quad Wings
  drawInsectWings(ctx, boss.wingFlapPhase, 46, 15, 'rgba(243, 232, 255, 0.75)', 'rgba(126, 34, 206, 0.7)');
  ctx.save();
  ctx.translate(-6, 2);
  ctx.scale(0.85, 0.85);
  drawInsectWings(ctx, boss.wingFlapPhase + 0.5, 40, 13, 'rgba(233, 213, 255, 0.65)', 'rgba(147, 51, 234, 0.6)');
  ctx.restore();

  // Enormous Egg-Sac Abdomen
  ctx.save();
  ctx.translate(-10, 2);
  ctx.rotate(0.22);

  // Enormous Egg-Sac Abdomen with smooth glowing aura ring (zero GPU shadow blur overhead)
  ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-18, 0, 27, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  const sacGrad = ctx.createRadialGradient(-18, 0, 3, -18, 0, 22);
  sacGrad.addColorStop(0, '#f3e8ff');
  sacGrad.addColorStop(0.35, '#c084fc');
  sacGrad.addColorStop(0.7, '#7e22ce');
  sacGrad.addColorStop(1, '#3b0764');

  ctx.fillStyle = sacGrad;
  ctx.beginPath();
  ctx.ellipse(-18, 0, 24, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let e = 0; e < 5; e++) {
    const ex = -28 + e * 5;
    const ey = Math.sin(e * 1.5) * 4;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 3, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.8;
  for (let r = -32; r <= -4; r += 6) {
    ctx.beginPath();
    ctx.arc(r, 0, 11, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }
  ctx.restore();

  // Thorax with Crown spines
  ctx.fillStyle = '#581c87';
  ctx.beginPath();
  ctx.ellipse(4, -3, 9, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3b0764';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(2, -14);
  ctx.lineTo(4, -9);
  ctx.lineTo(6, -15);
  ctx.lineTo(8, -9);
  ctx.lineTo(10, -13);
  ctx.lineTo(11, -8);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.fillStyle = '#3b0764';
  ctx.beginPath();
  ctx.arc(12, -3, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(14, -3.5, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(13, -7, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Proboscis (menacing blood-sucking stinger needle)
  const isDiving = boss.isDivingToBite || (boss.biteAttackPrepTimer && boss.biteAttackPrepTimer > 0);
  const isEnraged = boss.isEnraged;
  ctx.strokeStyle = isDiving || isEnraged ? '#ef4444' : '#020617';
  ctx.lineWidth = isDiving || isEnraged ? 3.4 : 2.4;
  ctx.beginPath();
  ctx.moveTo(15, -1);
  ctx.lineTo(isDiving ? 42 : 36, isDiving ? 15 : 9);
  ctx.stroke();

  // Needle tip with blood / venom drop
  ctx.fillStyle = isDiving || isEnraged ? '#dc2626' : '#d946ef';
  ctx.beginPath();
  ctx.arc(isDiving ? 42 : 36, isDiving ? 15 : 9, isDiving ? 3.8 : 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Central Mosquito Dispatcher with In-World Floating Health Bars (মশার লাইফ সরাসরি মশার সাথে)
 */
export function drawMosquito(ctx: CanvasRenderingContext2D, m: Aircraft) {
  switch (m.type) {
    case 'AEDES_MOSQUITO':
      drawAedesMosquito(ctx, m);
      break;
    case 'CULEX_MOSQUITO':
      drawCulexMosquito(ctx, m);
      break;
    case 'ANOPHELES_MOSQUITO':
      drawAnophelesMosquito(ctx, m);
      break;
    case 'BLOODSUCKER_MOSQUITO':
      drawBloodsuckerMosquito(ctx, m);
      break;
    case 'TOXIC_MUTANT_MOSQUITO':
      drawToxicMutantMosquito(ctx, m);
      break;
    case 'SPEED_MOSQUITO':
      drawSpeedMosquito(ctx, m);
      break;
    case 'QUEEN_MOSQUITO':
      drawQueenMosquitoBoss(ctx, m);
      break;
    case 'ZIKA_VIRUS_MOSQUITO':
      drawZikaVirusMosquito(ctx, m);
      break;
    case 'CHIKUNGUNYA_MOSQUITO':
      drawChikungunyaMosquito(ctx, m);
      break;
    case 'VIRUS_BIO_TITAN':
      drawBioTitanVirusMosquito(ctx, m);
      break;
    default:
      drawCulexMosquito(ctx, m);
      break;
  }

  // Floating In-World Health Bars Directly With The Mosquito (মশার লাইফ সরাসরি মশার সাথে প্রদর্শিত)
  if (m.type === 'QUEEN_MOSQUITO') {
    const hpRatio = Math.max(0, m.health / m.maxHealth);
    ctx.save();
    ctx.translate(m.x, m.y - 46);

    // Background container
    ctx.fillStyle = '#020617';
    ctx.fillRect(-46, 0, 92, 8);

    // HP Fill bar
    ctx.fillStyle = hpRatio > 0.5 ? '#a855f7' : hpRatio > 0.25 ? '#ec4899' : '#ef4444';
    ctx.fillRect(-44, 1.5, 88 * hpRatio, 5);

    // Border
    ctx.strokeStyle = m.isEnraged ? '#ef4444' : '#a855f7';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-46, 0, 92, 8);

    // Header label
    ctx.font = '700 7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`👑 QUEEN ${Math.ceil(m.health)}/${m.maxHealth} HP`, 0, -4);
    ctx.restore();
  } else if (m.type === 'VIRUS_BIO_TITAN') {
    const hpRatio = Math.max(0, m.health / m.maxHealth);
    ctx.save();
    ctx.translate(m.x, m.y - 42);

    ctx.fillStyle = '#020617';
    ctx.fillRect(-38, 0, 76, 7);

    ctx.fillStyle = hpRatio > 0.5 ? '#84cc16' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(-36, 1.5, 72 * hpRatio, 4);

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-38, 0, 76, 7);

    ctx.font = '700 6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bef264';
    ctx.fillText(`☣️ BIO-TITAN ${Math.ceil(m.health)}/${m.maxHealth} HP`, 0, -4);
    ctx.restore();
  } else if (m.maxHealth > 1 || (m.health < m.maxHealth && m.health > 0)) {
    const hpRatio = Math.max(0, m.health / m.maxHealth);
    ctx.save();
    ctx.translate(m.x, m.y - 25);

    const barW = 28;
    ctx.fillStyle = '#020617';
    ctx.fillRect(-barW / 2, 0, barW, 4.5);

    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(-barW / 2 + 1, 1, (barW - 2) * hpRatio, 2.5);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-barW / 2, 0, barW, 4.5);

    ctx.font = '700 5.5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${Math.ceil(m.health)}/${m.maxHealth}`, 0, -3);
    ctx.restore();
  }
}

// Backward compatible aliases
export const drawJetCargo = drawBloodsuckerMosquito;
export const drawHueyHelicopter = drawAnophelesMosquito;
export const drawApacheGunship = drawToxicMutantMosquito;

/**
 * Rocket with crisp white dotted trail
 */
export function drawRocket(ctx: CanvasRenderingContext2D, rocket: Rocket) {
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.angle);
  ctx.scale(1.4, 1.4); // Enlarged 1.4x

  // Enlarged rocket missile
  ctx.fillStyle = '#f8fafc'; // bright white missile
  ctx.fillRect(-12, -3, 22, 6);

  // Red warhead tip
  ctx.fillStyle = rocket.isHoming ? '#38bdf8' : '#ef4444';
  ctx.beginPath();
  ctx.moveTo(10, -3);
  ctx.lineTo(20, 0);
  ctx.lineTo(10, 3);
  ctx.fill();

  // Tail stabilizer fins
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-13, -6, 4, 12);

  // Rear propulsion flame
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(-12, -2.5);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-12, 2.5);
  ctx.fill();

  ctx.restore();
}

/**
 * Falling Mosquito Egg (মশার ডিম - Mosquito Egg Pod)
 * Oval gelatinous insect egg dropped by mosquitoes, destructible by player weapons!
 */
export function drawMosquitoEgg(ctx: CanvasRenderingContext2D, egg: Bomb) {
  ctx.save();
  ctx.translate(egg.x, egg.y);
  
  // Wobble rotation as egg falls through the air
  const wobbleRot = (egg.rotation || 0) + Math.sin(egg.wobble || 0) * 0.22;
  ctx.rotate(wobbleRot);
  ctx.scale((egg.scale || 1.0) * 1.45, (egg.scale || 1.0) * 1.45);

  const eggType = egg.eggType || 'REGULAR';

  // Egg shell styles based on mosquito species (fast vector glow, zero filter lag)
  if (eggType === 'AEDES') {
    // Dengue Aedes Egg: Black with stark white speckles & toxic purple aura
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // White speckles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -6, 2, 2);
    ctx.fillRect(2, -2, 2, 2);
    ctx.fillRect(-2, 3, 2, 2);

    // Embryo
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(0, 1, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (eggType === 'BLOOD') {
    // Bloodsucker Egg: Pulsating crimson blood egg
    ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const bloodGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
    bloodGrad.addColorStop(0, '#f87171');
    bloodGrad.addColorStop(0.6, '#dc2626');
    bloodGrad.addColorStop(1, '#7f1d1d');

    ctx.fillStyle = bloodGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark core
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.arc(0, 1.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (eggType === 'TOXIC') {
    // Toxic Acid Egg: Neon radioactive green
    ctx.fillStyle = 'rgba(34, 197, 94, 0.26)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    const toxicGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
    toxicGrad.addColorStop(0, '#86efac');
    toxicGrad.addColorStop(0.5, '#22c55e');
    toxicGrad.addColorStop(1, '#14532d');

    ctx.fillStyle = toxicGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 12.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Acid bubble
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.arc(1, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (eggType === 'QUEEN') {
    // Titan Queen Cluster Egg: Massive golden-violet royal cluster egg
    ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    const queenGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    queenGrad.addColorStop(0, '#fef08a');
    queenGrad.addColorStop(0.4, '#c084fc');
    queenGrad.addColorStop(0.8, '#7e22ce');
    queenGrad.addColorStop(1, '#3b0764');

    ctx.fillStyle = queenGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Multiple larva embryos inside queen egg
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-2, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(2, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Regular / Culex Egg: Amber translucent gelatinous pod
    ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const eggGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 11);
    eggGrad.addColorStop(0, '#fef3c7');
    eggGrad.addColorStop(0.5, '#f59e0b');
    eggGrad.addColorStop(1, '#78350f');

    ctx.fillStyle = eggGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner larva embryo nucleus
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, 1, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glossy translucent highlight on top rim of egg
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.ellipse(-2.5, -4.5, 2.8, 4.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Fine translucent membrane outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 11.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export const drawBomb = drawMosquitoEgg;

/**
 * Corrosive Bio-Acid Globule (ক্ষতিকর ভাইরাস এসিড ড্রপলেট - যুদ্ধাস্ত্র ধ্বংসকারী গোলা)
 */
export function drawBioAcidBlob(ctx: CanvasRenderingContext2D, blob: BioAcidBlob) {
  ctx.save();
  ctx.translate(blob.x, blob.y);

  const angle = Math.atan2(blob.vy, blob.vx);
  ctx.rotate(angle);

  // Outer toxic aura
  ctx.shadowColor = blob.color || '#22c55e';
  ctx.shadowBlur = 10;

  // Acid tear-drop elongation
  ctx.fillStyle = blob.color || '#22c55e';
  ctx.beginPath();
  ctx.ellipse(0, 0, blob.radius * 1.5, blob.radius, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bright incandescent chemical core
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(blob.radius * 0.4, 0, blob.radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Acid splatter bubbles
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(-blob.radius * 0.8, -blob.radius * 0.4, 1.8, 0, Math.PI * 2);
  ctx.arc(-blob.radius * 1.2, blob.radius * 0.3, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

/**
 * Airdrop Supply Crate with parachute, lifetime countdown, and vanishing blink
 */
export function drawAirdropCrate(ctx: CanvasRenderingContext2D, crate: AirdropCrate) {
  ctx.save();
  ctx.translate(crate.x, crate.y);
  ctx.scale(1.35, 1.35); // Enlarged 1.35x

  // Blinking effect in last 3.5 seconds before vanishing
  if (crate.hasLanded && crate.lifetime <= 3.5) {
    if (Math.floor(crate.lifetime * 8) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }
  }

  if (crate.parachute && !crate.hasLanded) {
    ctx.save();
    ctx.translate(0, -24);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.lineTo(0, 20);
    ctx.moveTo(18, -14);
    ctx.lineTo(0, 20);
    ctx.moveTo(-7, -14);
    ctx.lineTo(0, 20);
    ctx.moveTo(7, -14);
    ctx.lineTo(0, 20);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -14, 20, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -14, 11, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  // Wooden supply crate
  ctx.fillStyle = '#b45309';
  ctx.fillRect(-13, -13, 26, 26);

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-13, -13, 26, 26);

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-13, -13);
  ctx.lineTo(13, 13);
  ctx.moveTo(13, -13);
  ctx.lineTo(-13, 13);
  ctx.stroke();

  // Floating label in white pixel font
  ctx.font = '700 8.5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.fillText(crate.label, 1, -21);
  ctx.fillStyle = '#fef08a';
  ctx.fillText(crate.label, 0, -22);

  // Remaining lifetime timer badge once landed
  if (crate.hasLanded) {
    const secsLeft = Math.ceil(crate.lifetime);
    ctx.font = '700 7px "Press Start 2P", monospace';
    ctx.fillStyle = crate.lifetime < 3.5 ? '#ef4444' : '#38bdf8';
    ctx.fillText(`⏳ ${secsLeft}s`, 0, 23);
  }

  ctx.restore();
}

/**
 * 6. Combat Drone (UAV - Predator / Reaper style)
 * Modeled after reference image 1790870270967.jpg bottom-middle
 * Slender fuselage, nose camera ball, high-aspect wings, inverted V-tail, rear pusher prop
 */
export function drawCombatDrone(ctx: CanvasRenderingContext2D, drone: Aircraft) {
  ctx.save();
  ctx.translate(drone.x, drone.y);
  ctx.scale(drone.direction * 1.8, 1.8);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;

  // Slender aerodynamic composite fuselage
  ctx.fillStyle = '#e2e8f0'; // stealth light composite grey
  ctx.beginPath();
  ctx.moveTo(34, 0); // nose radome
  ctx.lineTo(24, -4);
  ctx.lineTo(-4, -5);
  ctx.lineTo(-32, -2);
  ctx.lineTo(-36, 0); // rear engine mount
  ctx.lineTo(-32, 2);
  ctx.lineTo(10, 4);
  ctx.lineTo(28, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Optical FLIR Sensor Camera Ball Turret under nose (reference image feature!)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(22, 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#38bdf8'; // camera lens
  ctx.beginPath();
  ctx.arc(24, 6, 2, 0, Math.PI * 2);
  ctx.fill();

  // Long Glider Wings
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-14, 16);
  ctx.lineTo(-24, 15);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Under-wing AGM Hellfire Missile (reference image feature!)
  ctx.fillStyle = '#334155';
  ctx.fillRect(-16, 12, 14, 3);
  ctx.fillStyle = '#ef4444'; // missile seeker tip
  ctx.fillRect(-4, 12, 3, 3);

  // Inverted V-Tail (pointed downwards and upwards like Reaper drone)
  ctx.fillStyle = '#64748b';
  // Upper tail fin
  ctx.beginPath();
  ctx.moveTo(-28, -2);
  ctx.lineTo(-36, -15);
  ctx.lineTo(-30, -15);
  ctx.lineTo(-24, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lower ventral tail fin
  ctx.beginPath();
  ctx.moveTo(-28, 2);
  ctx.lineTo(-35, 10);
  ctx.lineTo(-30, 10);
  ctx.lineTo(-24, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rear Pusher Propeller (spinning behind the tail)
  const propSpin = (Date.now() / 15) % Math.PI;
  const propH = 14 * Math.sin(propSpin);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-36, -propH);
  ctx.lineTo(-36, propH);
  ctx.stroke();

  ctx.restore();
}

/**
 * 7. Heavy Main Battle Tank (Ground Combat Vehicle)
 * Modeled after reference image 1790870270967.jpg top-middle
 * Heavy chassis, tracked treads with 6 roadwheels, rotating angular turret with cannon and cupola gun
 */
export function drawBattleTank(ctx: CanvasRenderingContext2D, tank: GroundTank) {
  ctx.save();
  ctx.translate(tank.x, tank.y);
  ctx.scale(tank.direction * 1.75, 1.75);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;

  // 1. Lower Track Assembly (Treads and roadwheels)
  ctx.fillStyle = '#1e293b'; // dark steel tracks
  ctx.beginPath();
  ctx.roundRect(-36, -3, 72, 14, 6);
  ctx.fill();
  ctx.stroke();

  // Moving track segment links
  ctx.fillStyle = '#475569';
  for (let tx = -32; tx <= 32; tx += 6) {
    ctx.fillRect(tx, 9, 3, 2);
    ctx.fillRect(tx, -4, 3, 2);
  }

  // 6 Large Roadwheels + Idler & Drive sprocket
  ctx.fillStyle = '#334155';
  for (let wx = -28; wx <= 28; wx += 11.5) {
    ctx.beginPath();
    ctx.arc(wx, 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Wheel hub
    ctx.fillStyle = '#64748b';
    ctx.fillRect(wx - 1.5, 2.5, 3, 3);
    ctx.fillStyle = '#334155';
  }

  // 2. Armored Hull Body with side skirts
  ctx.fillStyle = tank.isFriendly ? '#1e3a5f' : '#3f4f34'; // Allied navy-blue steel vs military combat olive drab
  ctx.beginPath();
  ctx.moveTo(-38, -3);
  ctx.lineTo(-34, -12);
  ctx.lineTo(28, -12);
  ctx.lineTo(38, -4);
  ctx.lineTo(34, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Front reactive armor sloped glacis
  ctx.fillStyle = tank.isFriendly ? '#0f2744' : '#2f3c27';
  ctx.beginPath();
  ctx.moveTo(22, -12);
  ctx.lineTo(36, -5);
  ctx.lineTo(24, -5);
  ctx.closePath();
  ctx.fill();

  // 3. Rotating Turret and Long Cannon Barrel
  ctx.save();
  ctx.translate(0, -12); // turret pivot
  ctx.rotate(tank.turretAngle * tank.direction);

  // Long Tank Cannon Barrel with Bore Evacuator
  ctx.fillStyle = '#334155';
  ctx.fillRect(14, -4, 36, 5); // main barrel
  ctx.strokeRect(14, -4, 36, 5);

  // Bore Evacuator sleeve in middle of barrel
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(32, -5.5, 8, 8);
  ctx.strokeRect(32, -5.5, 8, 8);

  // Muzzle brake tip
  ctx.fillRect(48, -5, 4, 7);

  // Angular Turret Armor Body
  ctx.fillStyle = tank.isFriendly ? '#2563eb' : '#4a5d3e';
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-14, -10);
  ctx.lineTo(16, -10);
  ctx.lineTo(20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Allied white star emblem
  if (tank.isFriendly) {
    ctx.font = '700 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('★', 0, -3);
  }

  // Commander Cupola and Hatch
  ctx.fillStyle = '#24301d';
  ctx.fillRect(-6, -13, 8, 3.5);
  ctx.strokeRect(-6, -13, 8, 3.5);

  // Anti-Air Machine Gun on Cupola (reference image feature!)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -17, 10, 2);
  ctx.fillRect(-2, -15, 3, 3); // mount

  ctx.restore();

  // Badge or Health bar above tank
  if (tank.isFriendly) {
    const sec = Math.ceil(tank.duration ?? 60);
    const hp = Math.max(0, Math.ceil(tank.health ?? 12));
    const maxHp = tank.maxHealth ?? 12;
    const hpRatio = Math.max(0, hp / maxHp);
    ctx.font = '700 6.5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = hpRatio <= 0.35 ? '#ef4444' : (sec <= 10 ? '#f59e0b' : '#38bdf8');
    ctx.fillText(`TANK HP:${hp}/${maxHp} (${sec}s)`, 0, -32);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-22, -26, 44, 4);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
    ctx.fillRect(-21, -25.5, 42 * hpRatio, 3);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-22, -26, 44, 4);
  } else {
    // Hostile Enemy Panzer Tank: Red warning text & health bar!
    ctx.font = '700 6.5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`ENEMY PANZER (${tank.health}/${tank.maxHealth})`, 0, -32);

    const hpPct = Math.max(0, tank.health / tank.maxHealth);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-22, -26, 44, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-21, -25, 42 * hpPct, 3);
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-22, -26, 44, 5);
  }

  ctx.restore();
}

/**
 * 8. Automated Anti-Air SAM / HIMARS Launcher Truck (Auto-Turret)
 * Modeled after reference image 1790870270967.jpg top-left / top-right
 * 6x6 Heavy tactical truck chassis with rotating/elevating missile canister pods
 */
export function drawAutoTurret(ctx: CanvasRenderingContext2D, turret: AutoTurret) {
  ctx.save();
  ctx.translate(turret.x, turret.y);
  ctx.scale(1.45, 1.45); // Enlarged 1.45x

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;

  // 6x6 Heavy Truck Chassis & Cab
  ctx.fillStyle = '#3a4c33'; // military olive truck cab
  ctx.fillRect(14, -16, 20, 16); // front armored cab
  ctx.strokeRect(14, -16, 20, 16);

  // Cab windshield
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(24, -14, 8, 6);

  // Truck frame chassis bed
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-34, -4, 66, 6);
  ctx.strokeRect(-34, -4, 66, 6);

  // 6 Heavy all-terrain military wheels
  ctx.fillStyle = '#0f172a';
  [-24, -10, 24].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, 5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillRect(wx - 2, 3, 4, 4);
    ctx.fillStyle = '#0f172a';
  });

  // Elevated Angled Missile Launch Canister Box (rotates towards airborne planes!)
  ctx.save();
  ctx.translate(-14, -8); // turntable pivot
  ctx.rotate(turret.angle);

  // Heavy hydraulic elevation arm
  ctx.fillStyle = '#475569';
  ctx.fillRect(-6, -6, 12, 6);

  // 6-Cell Armored Missile Pod Container Box
  ctx.fillStyle = '#2f3f2a';
  ctx.beginPath();
  ctx.roundRect(-8, -18, 38, 14, 3);
  ctx.fill();
  ctx.stroke();

  // Missile tube front openings
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(26, -16, 4, 10);
  ctx.fillStyle = '#ef4444'; // active missile warhead seekers
  ctx.fillRect(28, -15, 2, 3);
  ctx.fillRect(28, -10, 2, 3);

  // Scanning radar antenna dish on top of pod (reference image feature!)
  const radarSweep = (Date.now() / 250) % Math.PI;
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(-2, -22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2, -22);
  ctx.lineTo(-2 + Math.cos(radarSweep) * 7, -22 + Math.sin(radarSweep) * 7);
  ctx.stroke();

  ctx.restore();

  // "AUTO SAM" status badge with HP and 60s timer countdown
  const samSec = Math.ceil(turret.duration ?? 60);
  const samHp = Math.max(0, Math.ceil(turret.health ?? 8));
  const samMaxHp = turret.maxHealth ?? 8;
  const samRatio = Math.max(0, samHp / samMaxHp);
  ctx.font = '700 6.5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = samRatio <= 0.35 ? '#ef4444' : (samSec <= 10 ? '#f59e0b' : '#22c55e');
  ctx.fillText(`SAM HP:${samHp}/${samMaxHp} (${samSec}s)`, 0, -36);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-20, -30, 40, 4);
  ctx.fillStyle = samRatio > 0.5 ? '#22c55e' : (samRatio > 0.25 ? '#eab308' : '#ef4444');
  ctx.fillRect(-19, -29.5, 38 * samRatio, 3);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-20, -30, 40, 4);

  ctx.restore();
}

/**
 * 9. Enemy tracer machine gun bullet
 */
export function drawEnemyBullet(ctx: CanvasRenderingContext2D, bullet: EnemyBullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  const ang = Math.atan2(bullet.vy, bullet.vx);
  ctx.rotate(ang);

  // Bright orange-yellow tracer streak
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-7, -1.5, 12, 3);

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-2, -1, 8, 2);

  ctx.restore();
}

/**
 * 10. Friendly Support Combat Drone (Guardian UAV)
 * Quad-rotor tactical drone hovering above player with auto-tracking twin blasters
 */
export function drawFriendlyDrone(ctx: CanvasRenderingContext2D, drone: FriendlyDrone) {
  ctx.save();
  ctx.translate(drone.x, drone.y);
  ctx.scale(1.45, 1.45); // Enlarged 1.45x

  // Slight hovering bobbing animation
  const bob = Math.sin(Date.now() / 200) * 3;
  ctx.translate(0, bob);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;

  // 4 Rotor Boom Arms (X-configuration)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.lineTo(18, 10);
  ctx.moveTo(-18, 10);
  ctx.lineTo(18, -10);
  ctx.stroke();

  // 4 Spinning Rotors with Blur Discs
  const rotorSpin = (Date.now() / 15) % (Math.PI * 2);
  const rotorPositions = [
    { x: -18, y: -10 },
    { x: 18, y: -10 },
    { x: -18, y: 10 },
    { x: 18, y: 10 },
  ];

  rotorPositions.forEach((rp) => {
    // Motor nacelle
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rp.x - 2, rp.y - 2, 4, 4);

    // Rotor spinning blur disc
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Spinning rotor blade
    const span = 8 * Math.cos(rotorSpin);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rp.x - span, rp.y);
    ctx.lineTo(rp.x + span, rp.y);
    ctx.stroke();
  });

  // Central Avionics Pod Fuselage
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-10, -8, 20, 16, 4);
  ctx.fill();
  ctx.stroke();

  // Tactical Allied Blue Armor Plating
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(-8, -6, 16, 12, 3);
  ctx.fill();

  // Glowing Cyan AI Sensor Eye / Target Scanner
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Swiveling Twin Weapon Barrels aimed towards drone.targetAngle
  ctx.save();
  ctx.rotate(drone.targetAngle);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(4, -3.5, 9, 2.2); // top barrel
  ctx.fillRect(4, 1.3, 9, 2.2);  // bottom barrel
  // Muzzle glow if just fired
  if (drone.shootCooldown > 0.8) {
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(13, -4, 4, 3);
    ctx.fillRect(13, 1, 4, 3);
  }
  ctx.restore();

  // Overhead Status Text Badge with HP and 60s timer countdown
  const droneSec = Math.ceil(drone.duration ?? 60);
  const droneHp = Math.max(0, Math.ceil(drone.health ?? 6));
  const droneMaxHp = drone.maxHealth ?? 6;
  const droneRatio = Math.max(0, droneHp / droneMaxHp);
  ctx.font = '700 6.5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = droneRatio <= 0.35 ? '#ef4444' : (droneSec <= 10 ? '#f59e0b' : '#a855f7');
  ctx.fillText(`DRONE HP:${droneHp}/${droneMaxHp} (${droneSec}s)`, 0, -22);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-16, -18, 32, 3.5);
  ctx.fillStyle = droneRatio > 0.5 ? '#38bdf8' : '#ef4444';
  ctx.fillRect(-15, -17.5, 30 * droneRatio, 2.5);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-16, -18, 32, 3.5);

  ctx.restore();
}

/**
 * 11. HIMARS / MLRS Multi-Launch Rocket Artillery Truck
 * Modeled after user reference image 1790870270967.jpg top-left
 * 6x6 Tactical camo truck with rotating 6-tube rocket pod
 */
export function drawHimarsTruck(ctx: CanvasRenderingContext2D, himars: HimarsTruck) {
  ctx.save();
  ctx.translate(himars.x, himars.y);
  ctx.scale(1.4, 1.4);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;

  // 1. Armored Camo Truck Chassis
  ctx.fillStyle = '#2f3f26'; // dark olive drab
  ctx.fillRect(-32, -6, 68, 7);
  ctx.strokeRect(-32, -6, 68, 7);

  // Front Armored Cab
  ctx.fillStyle = '#3a4e2f';
  ctx.beginPath();
  ctx.moveTo(18, -6);
  ctx.lineTo(18, -20);
  ctx.lineTo(34, -20);
  ctx.lineTo(38, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Armored Cab Windows
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(22, -18, 12, 6);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(22, -18, 12, 6);

  // 6 Heavy Military All-Terrain Wheels
  [-24, -10, 24].forEach((wx) => {
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(wx, 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();
    // Wheel Hub
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(wx, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Elevated Tilting 6-Cell Rocket Launcher Pod (Turntable pivot at x = -8, y = -10)
  ctx.save();
  ctx.translate(-8, -10);
  ctx.rotate(himars.angle);

  // Heavy hydraulic lifting cylinder
  ctx.fillStyle = '#475569';
  ctx.fillRect(-4, -4, 8, 5);

  // Armored 6-Rocket Container Box
  ctx.fillStyle = '#283620';
  ctx.fillRect(-12, -22, 42, 16);
  ctx.strokeStyle = '#0f172a';
  ctx.strokeRect(-12, -22, 42, 16);

  // Camo stripes
  ctx.fillStyle = '#3b4f2c';
  ctx.fillRect(0, -22, 10, 16);
  ctx.fillRect(18, -22, 6, 16);

  // 6 Rocket Tube Openings
  ctx.fillStyle = '#0f172a';
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const rx = 24 + col * 2;
      const ry = -20 + row * 7;
      ctx.beginPath();
      ctx.arc(rx, ry + 2.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Glowing loaded rocket warheads
      if (himars.ammo > col + row * 3) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(rx - 0.5, ry + 1.5, 1.5, 2);
        ctx.fillStyle = '#0f172a';
      }
    }
  }

  // Active launch smoke & muzzle flare
  if (himars.burstCount > 0 && himars.burstTimer < 0.1) {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(32, -14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(33, -14, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Status Badge with HP and countdown
  const sec = Math.ceil(himars.duration ?? 60);
  const hp = Math.max(0, Math.ceil(himars.health ?? 8));
  const maxHp = himars.maxHealth ?? 8;
  const hpRatio = Math.max(0, hp / maxHp);
  ctx.font = '700 6.5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = hpRatio <= 0.35 ? '#ef4444' : (sec <= 10 ? '#f59e0b' : '#eab308');
  ctx.fillText(`HIMARS HP:${hp}/${maxHp} (${sec}s)`, 0, -36);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-22, -31, 44, 4);
  ctx.fillStyle = hpRatio > 0.5 ? '#eab308' : (hpRatio > 0.25 ? '#f97316' : '#ef4444');
  ctx.fillRect(-21, -30.5, 42 * hpRatio, 3);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-22, -31, 44, 4);

  ctx.restore();
}

/**
 * 12. Dual Flak Autocannon Mobile AA Platform
 * Modeled after user reference image 1790870270967.jpg bottom-left
 * Tracked mobile vehicle with twin rapid-fire 35mm flak autocannons
 */
export function drawFlakCannon(ctx: CanvasRenderingContext2D, flak: FlakCannonVehicle) {
  ctx.save();
  ctx.translate(flak.x, flak.y);
  ctx.scale(1.4, 1.4);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;

  // 1. Armored Track Hull
  ctx.fillStyle = '#1c2833';
  ctx.fillRect(-30, -3, 60, 6);
  ctx.strokeRect(-30, -3, 60, 6);

  // Track Roadwheels
  ctx.fillStyle = '#0f172a';
  [-22, -11, 0, 11, 22].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, 3.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(wx - 1, 2.5, 2, 2);
    ctx.fillStyle = '#0f172a';
  });

  // Sloped Hull Body
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(-28, -3);
  ctx.lineTo(-24, -12);
  ctx.lineTo(24, -12);
  ctx.lineTo(28, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Swiveling AA Turret with Twin Flak Barrels
  ctx.save();
  ctx.translate(0, -12);
  ctx.rotate(flak.angle * flak.direction);

  // Twin 35mm Flak Autocannon Barrels with Fluted Muzzle Brakes
  ctx.fillStyle = '#1e293b';
  // Top Barrel
  ctx.fillRect(10, -8, 32, 3);
  ctx.strokeRect(10, -8, 32, 3);
  // Bottom Barrel
  ctx.fillRect(10, -2, 32, 3);
  ctx.strokeRect(10, -2, 32, 3);

  // Fluted Muzzle Brakes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, -9, 4, 5);
  ctx.fillRect(40, -3, 4, 5);

  // Muzzle Flash when firing
  if (flak.cooldown > 0.08) {
    const flashY = flak.barrelIndex === 0 ? -6.5 : -0.5;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(46, flashY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(48, flashY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Turret Housing
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.roundRect(-14, -12, 26, 14, 3);
  ctx.fill();
  ctx.stroke();

  // Rotating Search Radar Dish on top of Flak Turret
  const flakRadar = (Date.now() / 180) % Math.PI;
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(-6, -16, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.lineTo(-6 + Math.cos(flakRadar) * 6, -16 + Math.sin(flakRadar) * 6);
  ctx.stroke();

  ctx.restore();

  // Status Badge with HP and countdown
  const sec = Math.ceil(flak.duration ?? 60);
  const hp = Math.max(0, Math.ceil(flak.health ?? 8));
  const maxHp = flak.maxHealth ?? 8;
  const hpRatio = Math.max(0, hp / maxHp);
  ctx.font = '700 6.5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = hpRatio <= 0.35 ? '#ef4444' : (sec <= 10 ? '#f59e0b' : '#38bdf8');
  ctx.fillText(`FLAK HP:${hp}/${maxHp} (${sec}s)`, 0, -36);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-22, -31, 44, 4);
  ctx.fillStyle = hpRatio > 0.5 ? '#38bdf8' : (hpRatio > 0.25 ? '#f97316' : '#ef4444');
  ctx.fillRect(-21, -30.5, 42 * hpRatio, 3);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-22, -31, 44, 4);

  ctx.restore();
}

/**
 * 13. 3D Phased-Array Air Defense Radar Truck
 * Modeled after user reference image 1790870270967.jpg bottom-right
 * Heavy military carrier truck equipped with rotating phased-array radar dish
 */
export function drawRadarStation(ctx: CanvasRenderingContext2D, radar: RadarStationTruck) {
  ctx.save();
  ctx.translate(radar.x, radar.y);
  ctx.scale(1.4, 1.4);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;

  // Heavy Transporter Truck Chassis
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-32, -6, 64, 7);
  ctx.strokeRect(-32, -6, 64, 7);

  // Front Cab
  ctx.fillStyle = '#334155';
  ctx.fillRect(16, -18, 18, 12);
  ctx.strokeRect(16, -18, 18, 12);
  // Cab Window
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(24, -16, 8, 5);

  // 6 Heavy Wheels
  [-22, -8, 22].forEach((wx) => {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(wx, 4, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();
  });

  // Hydraulic Outrigger Stabilizers deployed to ground
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-30, 0, 4, 7);
  ctx.fillRect(-32, 6, 8, 2);
  ctx.fillRect(10, 0, 4, 7);
  ctx.fillRect(8, 6, 8, 2);

  // Turntable Pedestal Mast
  ctx.fillStyle = '#475569';
  ctx.fillRect(-12, -18, 12, 12);
  ctx.strokeRect(-12, -18, 12, 12);

  // Rotating Phased-Array Antenna Dish Pivot
  ctx.save();
  ctx.translate(-6, -20);
  ctx.rotate(radar.dishAngle);

  // Phased-Array Planar / Dish Face
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.roundRect(-4, -18, 24, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.stroke();

  // Array Grid Cells
  ctx.fillStyle = '#f0fdf4';
  for (let c = 0; c < 4; c++) {
    ctx.fillRect(-2 + c * 5.5, -16.5, 3.5, 5);
  }

  // Central Feed Horn & Waveguide
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, -10);
  ctx.lineTo(8, -4);
  ctx.stroke();

  ctx.restore();

  // Status Badge with HP and countdown
  const sec = Math.ceil(radar.duration ?? 60);
  const hp = Math.max(0, Math.ceil(radar.health ?? 8));
  const maxHp = radar.maxHealth ?? 8;
  const hpRatio = Math.max(0, hp / maxHp);
  ctx.font = '700 6.5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = hpRatio <= 0.35 ? '#ef4444' : (sec <= 10 ? '#f59e0b' : '#10b981');
  ctx.fillText(`RADAR HP:${hp}/${maxHp} (${sec}s)`, 0, -40);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-22, -35, 44, 4);
  ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
  ctx.fillRect(-21, -34.5, 42 * hpRatio, 3);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-22, -35, 44, 4);

  ctx.restore();
}

/**
 * 8. Titan AC-130 Sky Fortress Boss
 * Massive flying gunship dreadnought with heavy armored plating, quad turboprops,
 * twin swiveling howitzer/flak cannons, and command bridge.
 */
export function drawBossFortress(ctx: CanvasRenderingContext2D, boss: Aircraft) {
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.scale(boss.direction * 2.2, 2.2);

  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2;

  // 1. Massive Dreadnought Hull
  ctx.fillStyle = '#1e293b'; // dark armored gunmetal
  ctx.beginPath();
  ctx.moveTo(70, 0);   // heavy nose radome
  ctx.lineTo(52, -14);
  ctx.lineTo(20, -18);
  ctx.lineTo(-65, -16);
  ctx.lineTo(-85, -6);
  ctx.lineTo(-88, 6);
  ctx.lineTo(-65, 18);
  ctx.lineTo(20, 20);
  ctx.lineTo(56, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Heavy Armored Plating panels
  ctx.fillStyle = '#334155';
  ctx.fillRect(-50, -12, 60, 24);
  ctx.strokeRect(-50, -12, 60, 24);

  // Command Bridge Windows with glowing red combat battlestation lights
  ctx.fillStyle = '#ef4444';
  for (let w = 0; w < 4; w++) {
    ctx.fillRect(36 + w * 5, -10, 3.5, 5);
  }

  // 2. High-Mounted Heavy Wings
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(15, -14);
  ctx.lineTo(-30, -32);
  ctx.lineTo(-55, -30);
  ctx.lineTo(-20, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Engine Pods with Spinning Propeller / Turbofan Blurs
  const engineXs = [-35, -10, 15];
  engineXs.forEach((ex) => {
    // Engine nacelle
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ex, -28, 16, 7);
    ctx.strokeRect(ex, -28, 16, 7);

    // Spinning prop blur
    const spin = (Date.now() / 12 + ex) % Math.PI;
    const propH = 22 * Math.sin(spin);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ex + 16, -24.5 - propH);
    ctx.lineTo(ex + 16, -24.5 + propH);
    ctx.stroke();
  });

  // 4. Twin Swiveling Under-belly Heavy Cannons (aimed down towards ground)
  ctx.fillStyle = '#0f172a';
  // Front 40mm Bofors Twin Cannon
  ctx.fillRect(8, 14, 18, 5);
  ctx.strokeRect(8, 14, 18, 5);
  // Rear 105mm Heavy Howitzer
  ctx.fillRect(-28, 15, 24, 7);
  ctx.strokeRect(-28, 15, 24, 7);

  // 5. Huge Swept T-Tail with Red Warning Beacon
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-60, -16);
  ctx.lineTo(-84, -42);
  ctx.lineTo(-72, -42);
  ctx.lineTo(-50, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Horizontal T-Tail stabilizer on top
  ctx.fillStyle = '#334155';
  ctx.fillRect(-88, -44, 22, 5);

  // Blinking Red Warning Strobes
  if (Math.floor(Date.now() / 250) % 2 === 0) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-82, -45, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(68, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Boss In-World Health Bar Directly Above Sky Fortress
  const hpRatio = Math.max(0, boss.health / boss.maxHealth);
  ctx.save();
  ctx.scale(boss.direction, 1); // unflip text & bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-50, -56, 100, 10);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(-50, -56, 100, 10);

  // Glowing health fill
  ctx.fillStyle = hpRatio > 0.4 ? '#ef4444' : '#dc2626';
  ctx.fillRect(-48, -54, 96 * hpRatio, 6);

  ctx.font = '700 7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`TITAN DREADNOUGHT ${Math.ceil(boss.health)}HP`, 0, -60);
  ctx.restore();

  ctx.restore();
}

/**
 * 9. Kamikaze Dive Drone (Red Suicide UAV)
 * High-speed glowing red attacker with fiery thruster
 */
export function drawKamikazeDrone(ctx: CanvasRenderingContext2D, drone: Aircraft) {
  ctx.save();
  ctx.translate(drone.x, drone.y);
  ctx.scale(drone.direction * 1.6, 1.6);

  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.5;

  // Sleek delta body
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(26, 0); // sharp nose
  ctx.lineTo(10, -6);
  ctx.lineTo(-18, -12);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-18, 12);
  ctx.lineTo(10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing Red Seeker Sensor Eye in nose
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(22, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Warning Skull decal or stripe
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-2, -3, 6, 6);

  // Fiery Jet Afterburner Trail
  const flameLen = 14 + Math.random() * 8;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(-14, -3);
  ctx.lineTo(-14 - flameLen, 0);
  ctx.lineTo(-14, 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(-14, -1.5);
  ctx.lineTo(-14 - flameLen * 0.5, 0);
  ctx.lineTo(-14, 1.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 10. Stealth Bomber (B-2 Spirit Flying Wing)
 * Matte black faceted flying wing dropping carpet bomb payloads
 */
export function drawStealthBomber(ctx: CanvasRenderingContext2D, bomber: Aircraft) {
  ctx.save();
  ctx.translate(bomber.x, bomber.y);
  ctx.scale(bomber.direction * 2.0, 2.0);

  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1.6;

  // Flying Wing Planform
  ctx.fillStyle = '#0f172a'; // ultra-dark radar-absorbent matte black
  ctx.beginPath();
  ctx.moveTo(34, 0);  // nose apex
  ctx.lineTo(-6, -26); // left wingtip
  ctx.lineTo(-24, -24);
  ctx.lineTo(-18, -10);
  ctx.lineTo(-28, 0);   // rear center serrated notch
  ctx.lineTo(-18, 10);
  ctx.lineTo(-24, 24);
  ctx.lineTo(-6, 26);  // right wingtip
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit glass flush windows
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(20, -2);
  ctx.lineTo(14, -5);
  ctx.lineTo(8, -2);
  ctx.lineTo(8, 2);
  ctx.lineTo(14, 5);
  ctx.lineTo(20, 2);
  ctx.closePath();
  ctx.fill();

  // Bomb Bay Door open indicator
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10, -6, 12, 12);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1;
  ctx.strokeRect(-10, -6, 12, 12);

  ctx.restore();
}

/**
 * 11. Enemy Paratrooper (Airborne Commando)
 */
export function drawEnemyParatrooper(ctx: CanvasRenderingContext2D, trooper: EnemyParatrooper) {
  ctx.save();
  ctx.translate(trooper.x, trooper.y);

  if (!trooper.isGrounded) {
    // Parachute canopy above
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.lineTo(0, -6);
    ctx.moveTo(16, -24);
    ctx.lineTo(0, -6);
    ctx.moveTo(-6, -24);
    ctx.lineTo(0, -6);
    ctx.moveTo(6, -24);
    ctx.lineTo(0, -6);
    ctx.stroke();

    // Camo canopy dome
    ctx.fillStyle = '#15803d'; // army green parachute
    ctx.beginPath();
    ctx.arc(0, -24, 18, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ca8a04'; // camo accent
    ctx.fillRect(-6, -30, 12, 6);
  }

  ctx.scale(trooper.facing * 1.3, 1.3);

  // Commando body
  ctx.fillStyle = '#1e293b'; // combat uniform
  ctx.fillRect(-4, -14, 8, 10);

  // Helmet & face
  ctx.fillStyle = '#334155'; // helmet
  ctx.fillRect(-4, -20, 8, 5);
  ctx.fillStyle = '#fbd5b5'; // face
  ctx.fillRect(-3, -16, 6, 4);
  // Red goggles
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, -16, 4, 2);

  // Legs
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -4, 3, 5);
  ctx.fillRect(1, -4, 3, 5);

  // Assault Rifle / RPG held
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(2, -12, 10, 3);
  ctx.fillRect(6, -10, 2, 4);

  // Muzzle flash when shooting
  if (trooper.shootCooldown > 1.8) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(14, -10.5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paratrooper HP bar above head
  if (trooper.health < 2) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-6, -24, 12 * (trooper.health / 2), 2);
  }

  ctx.restore();
}

/**
 * 12. Cruise Missile (Streaking Sea-Skimmer / Air-to-Surface Missile)
 */
export function drawCruiseMissile(ctx: CanvasRenderingContext2D, missile: CruiseMissile) {
  ctx.save();
  ctx.translate(missile.x, missile.y);
  const ang = Math.atan2(missile.vy, missile.vx);
  ctx.rotate(ang);

  // Missile body
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(-16, -2.5, 32, 5);
  ctx.fillStyle = '#ef4444'; // warhead nose
  ctx.beginPath();
  ctx.moveTo(16, -2.5);
  ctx.lineTo(24, 0);
  ctx.lineTo(16, 2.5);
  ctx.closePath();
  ctx.fill();

  // Pop-out Wings
  ctx.fillStyle = '#475569';
  ctx.fillRect(-4, -8, 6, 16);
  ctx.fillRect(-14, -6, 4, 12); // tail fins

  // Fiery rocket exhaust
  const flame = 10 + Math.random() * 8;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(-16, -2);
  ctx.lineTo(-16 - flame, 0);
  ctx.lineTo(-16, 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 13. Falling Aircraft Wreckage (Crashing with fire and smoke)
 */
export function drawFallingWreckage(ctx: CanvasRenderingContext2D, wreckage: FallingWreckage) {
  ctx.save();
  ctx.translate(wreckage.x, wreckage.y);
  ctx.rotate(wreckage.rotation);
  ctx.scale(wreckage.direction * wreckage.scale, wreckage.scale);

  // Charred black fuselage
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(10, -6);
  ctx.lineTo(-24, -4);
  ctx.lineTo(-28, 2);
  ctx.lineTo(10, 5);
  ctx.closePath();
  ctx.fill();

  // Broken wing
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-6, -14, 10, 14);

  // Intense fire coming from damaged engine
  const flame = 18 + Math.random() * 10;
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(-6 - flame, -8 + Math.random() * 6);
  ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(-6 - flame * 0.5, -4);
  ctx.lineTo(-6, 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
