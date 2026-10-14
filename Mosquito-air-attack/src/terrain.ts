import { TunnelBunker } from './types';

export interface Tree {
  x: number;
  type: 'LEAFY' | 'DEAD' | 'STUMP';
  height: number;
  health: number;
}

export interface TerrainData {
  width: number;
  height: number;
  heights: Float32Array;
  trees: Tree[];
  tunnel: TunnelBunker;
}

/**
 * Procedurally generates the exact terrain landscape seen in the video:
 * - High hill on the left with dead crooked tree
 * - Ridge with lush leafy green tree and 2 chopped stumps
 * - Smooth valley / dip in the center-right
 * - Smooth hill rising on the right
 */
export function generateTerrain(width: number, height: number, customSeed?: number): TerrainData {
  const heights = new Float32Array(width);
  const seed = customSeed ?? 42;

  // Smooth level flat ground across the battlefield ("নিচের পাহাড়টা সমান করে দাও")
  for (let x = 0; x < width; x++) {
    // Base flat level ground around 74% of height
    const baseGroundY = height * 0.74;
    heights[x] = baseGroundY;
  }

  // Smooth the terrain array
  for (let pass = 0; pass < 3; pass++) {
    for (let x = 1; x < width - 1; x++) {
      heights[x] = (heights[x - 1] + heights[x] * 2 + heights[x + 1]) / 4;
    }
  }

  // Exact tree locations from the video:
  // 1. Dead spooky tree on the far left hill (nx ~ 0.10)
  // 2. Leafy green oak tree on the next crest (nx ~ 0.22)
  // 3. Two tree stumps right after the leafy tree (nx ~ 0.30 and 0.35)
  const trees: Tree[] = [
    {
      x: width * 0.105,
      type: 'DEAD',
      height: 60,
      health: 100,
    },
    {
      x: width * 0.225,
      type: 'LEAFY',
      height: 72,
      health: 100,
    },
    {
      x: width * 0.305,
      type: 'STUMP',
      height: 24,
      health: 100,
    },
    {
      x: width * 0.345,
      type: 'STUMP',
      height: 20,
      health: 100,
    },
  ];

  const tunnel: TunnelBunker = {
    startX: 280, // Vast 640px wide bunker complex across battlefield
    endX: 920,
    leftEntranceX: 310,
    rightEntranceX: 890,
    hatchOpeningX: 600,
    hatchWidth: 68,
  };

  return { width, height, heights, trees, tunnel };
}

export function getTerrainY(x: number, terrain: TerrainData): number {
  const ix = Math.max(0, Math.min(terrain.width - 1, Math.round(x)));
  return terrain.heights[ix];
}

export function getTunnelFloorY(x: number, terrain: TerrainData): number {
  return getTerrainY(x, terrain) + 64; // Much roomier & deeper bunker floor!
}

export function getTunnelCeilingY(x: number, terrain: TerrainData): number {
  return getTerrainY(x, terrain) + 12;
}

export function isCoveredByBunkerRoof(x: number, terrain: TerrainData): boolean {
  const t = terrain.tunnel;
  if (!t) return false;
  if (x < t.startX || x > t.endX) return false;
  // Open hatch in the middle
  if (x >= t.hatchOpeningX - t.hatchWidth * 0.5 && x <= t.hatchOpeningX + t.hatchWidth * 0.5) {
    return false;
  }
  return true;
}

export function applyCrater(terrain: TerrainData, cx: number, _cy: number, radius: number): void {
  const startX = Math.max(0, Math.floor(cx - radius));
  const endX = Math.min(terrain.width - 1, Math.ceil(cx + radius));

  // The base level ground level (~74% of canvas height)
  const baseGroundY = terrain.height * 0.74;
  // STRICT CEILING: Soil can NEVER sink deeper than baseGroundY + 16px!
  // This completely prevents the ground from sinking outside the display screen.
  const maxAllowedSinkY = baseGroundY + 16;

  for (let x = startX; x <= endX; x++) {
    // 1. Fortified Military Bunker Protection:
    // Heavy reinforced concrete slabs, rebar & steel pillars are unbreakable!
    // Never deform, collapse or break the subterranean bunker complex.
    if (terrain.tunnel && x >= terrain.tunnel.startX - 16 && x <= terrain.tunnel.endX + 16) {
      continue;
    }

    const dx = x - cx;
    const factor = Math.sqrt(Math.max(0, radius * radius - dx * dx)) / radius;
    const depth = 12 * factor; // Natural shallow tactical battlefield crater
    const targetY = Math.min(maxAllowedSinkY, Math.max(terrain.heights[x], baseGroundY + depth));
    terrain.heights[x] = targetY;
  }
}

/**
 * Draws the terrain exactly like the video:
 * - Grassy edge with dark green / olive green pixel line
 * - Brown earthy dirt texture underneath
 * - Black bedrock gradient below
 */
let cachedDirtGrad: CanvasGradient | null = null;
let cachedGradHeight = 0;

export function renderTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainData,
  canvasWidth: number,
  canvasHeight: number
) {
  const scaleX = canvasWidth / terrain.width;

  ctx.save();
  // 1. Ground dirt body
  ctx.beginPath();
  ctx.moveTo(0, canvasHeight);
  ctx.lineTo(0, terrain.heights[0]);

  for (let x = 4; x < terrain.width; x += 6) {
    ctx.lineTo(x * scaleX, terrain.heights[x]);
  }
  ctx.lineTo(canvasWidth, terrain.heights[terrain.width - 1]);
  ctx.lineTo(canvasWidth, canvasHeight);
  ctx.closePath();

  // Rich earthy soil gradient illuminated by daylight (cached)
  if (!cachedDirtGrad || cachedGradHeight !== canvasHeight) {
    cachedDirtGrad = ctx.createLinearGradient(0, canvasHeight * 0.65, 0, canvasHeight);
    cachedDirtGrad.addColorStop(0, '#5c3d24'); // warm sunlit rich earth brown
    cachedDirtGrad.addColorStop(0.3, '#452b17');
    cachedDirtGrad.addColorStop(0.75, '#2e1c0e');
    cachedDirtGrad.addColorStop(1, '#190e06');
    cachedGradHeight = canvasHeight;
  }
  ctx.fillStyle = cachedDirtGrad;
  ctx.fill();

  // 1b. Render Subterranean Fortified Bunker / Tunnel Corridor
  renderUndergroundTunnel(ctx, terrain, canvasWidth, canvasHeight);

  // 2. Grassy dark rim
  ctx.beginPath();
  ctx.moveTo(0, terrain.heights[0]);
  for (let x = 4; x < terrain.width; x += 6) {
    ctx.lineTo(x * scaleX, terrain.heights[x]);
  }
  ctx.lineTo(canvasWidth, terrain.heights[terrain.width - 1]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#3e751d'; // lush green daytime rim
  ctx.stroke();

  // 3. Bright vibrant golden-green grass top fringe illuminated by sunlight
  ctx.beginPath();
  ctx.moveTo(0, terrain.heights[0] - 1);
  for (let x = 4; x < terrain.width; x += 6) {
    ctx.lineTo(x * scaleX, terrain.heights[x] - 1);
  }
  ctx.lineTo(canvasWidth, terrain.heights[terrain.width - 1] - 1);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#7ec828'; // vibrant sunlit bright grass line
  ctx.stroke();

  // 4. Subtle grass blades
  ctx.fillStyle = '#65a828';
  for (let x = 8; x < terrain.width - 8; x += 24) {
    const screenX = x * scaleX;
    const gy = terrain.heights[x];
    ctx.fillRect(screenX, gy - 3, 2, 3);
    ctx.fillRect(screenX + 2, gy - 4, 1, 4);
  }

  ctx.restore();
}

/**
 * Draws trees and stumps matching the video (00:01 - 00:08)
 */
export function renderTrees(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainData,
  canvasWidth: number
) {
  const scaleX = canvasWidth / terrain.width;

  for (const tree of terrain.trees) {
    const x = tree.x * scaleX;
    const y = getTerrainY(tree.x, terrain);

    ctx.save();
    ctx.translate(x, y);

    if (tree.type === 'DEAD') {
      // Dead crooked tree with sprawling bare branches (as seen in the video at left!)
      ctx.fillStyle = '#2b1b14';
      ctx.strokeStyle = '#2b1b14';

      // Crooked trunk
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.lineTo(3, -tree.height);
      ctx.lineTo(-2, -tree.height);
      ctx.closePath();
      ctx.fill();

      // Main branches
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, -tree.height * 0.45);
      ctx.lineTo(-18, -tree.height * 0.7);
      ctx.lineTo(-26, -tree.height * 0.9);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-16, -tree.height * 0.7);
      ctx.lineTo(-14, -tree.height * 0.55);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(2, -tree.height * 0.6);
      ctx.lineTo(16, -tree.height * 0.8);
      ctx.lineTo(24, -tree.height * 0.95);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(14, -tree.height * 0.78);
      ctx.lineTo(12, -tree.height * 0.65);
      ctx.stroke();

      // Little twig ends
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -tree.height);
      ctx.lineTo(-5, -tree.height - 8);
      ctx.moveTo(0, -tree.height);
      ctx.lineTo(6, -tree.height - 10);
      ctx.stroke();

    } else if (tree.type === 'LEAFY') {
      // Leafy green tree with thick trunk and round bushy foliage
      // Trunk
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(-6, -tree.height * 0.48, 12, tree.height * 0.48);
      // Trunk shadow
      ctx.fillStyle = '#24160a';
      ctx.fillRect(-6, -tree.height * 0.48, 5, tree.height * 0.48);

      // Roots on terrain
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(-10, -4, 4, 4);
      ctx.fillRect(6, -4, 5, 4);

      const fy = -tree.height * 0.62;

      // Dark foliage base
      ctx.fillStyle = '#245214';
      ctx.beginPath();
      ctx.arc(0, fy, 30, 0, Math.PI * 2);
      ctx.fill();

      // Mid green clumps
      ctx.fillStyle = '#3c7e1f';
      ctx.beginPath();
      ctx.arc(-10, fy - 6, 22, 0, Math.PI * 2);
      ctx.arc(10, fy - 4, 24, 0, Math.PI * 2);
      ctx.arc(0, fy - 16, 22, 0, Math.PI * 2);
      ctx.fill();

      // Bright top highlight foliage
      ctx.fillStyle = '#5ca627';
      ctx.beginPath();
      ctx.arc(-5, fy - 16, 16, 0, Math.PI * 2);
      ctx.arc(6, fy - 12, 16, 0, Math.PI * 2);
      ctx.fill();

      // Subtle light pixel spots
      ctx.fillStyle = '#78c634';
      ctx.fillRect(-8, fy - 22, 6, 4);
      ctx.fillRect(4, fy - 18, 5, 4);

    } else if (tree.type === 'STUMP') {
      // Chopped tree stump (two of them in the video!)
      ctx.fillStyle = '#3d2616';
      ctx.fillRect(-7, -tree.height, 14, tree.height);

      // Top oval cut
      ctx.fillStyle = '#6e4526';
      ctx.beginPath();
      ctx.ellipse(0, -tree.height, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bark shadow
      ctx.fillStyle = '#26160b';
      ctx.fillRect(-7, -tree.height, 4, tree.height);
    }

    ctx.restore();
  }
}

/**
 * Draws the Subterranean Fortified Tunnel Bunker (মাটির নিচে টানেল / বাঙ্কার)
 * Provides overhead bomb shelter and tactical firing slits/hatch!
 */
export function renderUndergroundTunnel(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainData,
  canvasWidth: number,
  _canvasHeight: number
) {
  const scaleX = canvasWidth / terrain.width;
  const t = terrain.tunnel;
  if (!t) return;

  ctx.save();

  // 1. Excavated Tunnel Interior Cavity
  ctx.beginPath();
  ctx.moveTo(t.startX * scaleX, getTerrainY(t.startX, terrain) + 12);
  for (let x = t.startX; x <= t.endX; x += 6) {
    ctx.lineTo(x * scaleX, getTerrainY(x, terrain) + 12);
  }
  ctx.lineTo(t.endX * scaleX, getTerrainY(t.endX, terrain) + 64);
  for (let x = t.endX; x >= t.startX; x -= 6) {
    ctx.lineTo(x * scaleX, getTerrainY(x, terrain) + 64);
  }
  ctx.closePath();

  // Dark reinforced bunker interior wall
  ctx.fillStyle = '#090d16';
  ctx.fill();

  // Corrugated steel wall ribs texture
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  for (let x = t.startX + 8; x < t.endX; x += 14) {
    const sx = x * scaleX;
    const cy = getTerrainY(x, terrain) + 12;
    const fy = getTerrainY(x, terrain) + 64;
    ctx.beginPath();
    ctx.moveTo(sx, cy);
    ctx.lineTo(sx, fy);
    ctx.stroke();
  }

  // 2. Heavy Reinforced Concrete & Steel Roof Slabs
  const hatchLeft = t.hatchOpeningX - t.hatchWidth * 0.5;
  const hatchRight = t.hatchOpeningX + t.hatchWidth * 0.5;

  const drawRoofSection = (x1: number, x2: number) => {
    ctx.fillStyle = '#334155'; // armored concrete slab
    ctx.beginPath();
    ctx.moveTo(x1 * scaleX, getTerrainY(x1, terrain));
    for (let x = x1; x <= x2; x += 6) {
      ctx.lineTo(x * scaleX, getTerrainY(x, terrain));
    }
    for (let x = x2; x >= x1; x -= 6) {
      ctx.lineTo(x * scaleX, getTerrainY(x, terrain) + 12);
    }
    ctx.closePath();
    ctx.fill();

    // Steel I-beam border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Steel rebar bolts
    ctx.fillStyle = '#94a3b8';
    for (let x = x1 + 12; x < x2; x += 20) {
      ctx.fillRect(x * scaleX - 1.5, getTerrainY(x, terrain) + 4, 3, 3);
    }
  };

  drawRoofSection(t.startX, hatchLeft);
  drawRoofSection(hatchRight, t.endX);

  // 3. Wooden Duckboard Floor Walkway
  for (let x = t.startX + 4; x < t.endX; x += 12) {
    const sx = x * scaleX;
    const fy = getTerrainY(x, terrain) + 60;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(sx, fy, 10 * scaleX, 4);
    ctx.fillStyle = '#271001';
    ctx.fillRect(sx + 9 * scaleX, fy, 2 * scaleX, 4);
  }

  // 4. Heavy Steel Support Beams across vast complex
  const beamPositions = [t.startX + 30, t.startX + 140, hatchLeft - 15, hatchRight + 15, t.endX - 140, t.endX - 30];
  beamPositions.forEach((bx) => {
    const sx = bx * scaleX;
    const cy = getTerrainY(bx, terrain) + 12;
    const fy = getTerrainY(bx, terrain) + 64;

    // Timber pillar
    ctx.fillStyle = '#3a1f10';
    ctx.fillRect(sx - 3.5, cy, 7, fy - cy);
    ctx.strokeStyle = '#1f0d05';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 3.5, cy, 7, fy - cy);

    // Steel bracket
    ctx.fillStyle = '#475569';
    ctx.fillRect(sx - 5.5, cy, 11, 4);
  });

  // 5. Entrance and Center Ladders
  const drawLadder = (ladderX: number) => {
    const lx = ladderX * scaleX;
    const topY = getTerrainY(ladderX, terrain) - 4;
    const botY = getTerrainY(ladderX, terrain) + 62;

    // Steel rails
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx - 5, topY);
    ctx.lineTo(lx - 5, botY);
    ctx.moveTo(lx + 5, topY);
    ctx.lineTo(lx + 5, botY);
    ctx.stroke();

    // Rungs
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.6;
    for (let ry = topY + 5; ry < botY; ry += 8) {
      ctx.beginPath();
      ctx.moveTo(lx - 5, ry);
      ctx.lineTo(lx + 5, ry);
      ctx.stroke();
    }

    // Top hatch cover / rim on surface
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(lx - 10, topY - 2, 20, 4);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(lx - 10, topY - 2, 20, 4);
  };

  drawLadder(t.leftEntranceX);
  drawLadder(t.rightEntranceX);
  drawLadder(t.hatchOpeningX); // Central ladder directly under firing hatch!

  // 6. Sandbag Revetments around surface entrances & open firing hatch
  const drawSandbags = (sx: number, sy: number, count: number) => {
    ctx.fillStyle = '#78716c';
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.roundRect(sx + i * 8, sy - 5, 9, 5, 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  drawSandbags((t.leftEntranceX - 16) * scaleX, getTerrainY(t.leftEntranceX - 16, terrain), 2);
  drawSandbags((t.rightEntranceX + 4) * scaleX, getTerrainY(t.rightEntranceX + 4, terrain), 2);
  drawSandbags((hatchLeft - 18) * scaleX, getTerrainY(hatchLeft - 18, terrain), 2);
  drawSandbags((hatchRight + 2) * scaleX, getTerrainY(hatchRight + 2, terrain), 2);

  // 7. Glowing Bulkhead Cage Lanterns (Zero gradient allocation - buttery smooth 60-120fps)
  const lanternXList = [360, 480, 600, 720, 840];
  lanternXList.forEach((lx) => {
    const sx = lx * scaleX;
    const cy = getTerrainY(lx, terrain) + 12;

    // Hanging cord
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, cy);
    ctx.lineTo(sx, cy + 9);
    ctx.stroke();

    // Concentric light glow arcs (fast, zero heap GC)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.beginPath();
    ctx.arc(sx, cy + 12, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.arc(sx, cy + 12, 16, 0, Math.PI * 2);
    ctx.fill();

    // Bulb and cage
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sx, cy + 12, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 3.5, cy + 9, 7, 7);
  });

  // 8. Interior Tactical Stations
  // 8a. Left Field Medical Station (380px)
  const medX = 390 * scaleX;
  const medY = getTerrainY(390, terrain) + 48;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(medX, medY, 14, 10);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(medX, medY, 14, 10);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(medX + 5, medY + 2, 4, 6);
  ctx.fillRect(medX + 3, medY + 4, 8, 2);

  // 8b. Heavy Ammo Crates (510px)
  const crateX = 510 * scaleX;
  const crateY = getTerrainY(510, terrain) + 46;
  ctx.fillStyle = '#2d4019'; // military olive
  ctx.fillRect(crateX, crateY, 18, 12);
  ctx.strokeStyle = '#14230b';
  ctx.strokeRect(crateX, crateY, 18, 12);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(crateX + 4, crateY + 4, 10, 3);

  // 8c. Radio / Command Terminal (690px)
  const radioX = 690 * scaleX;
  const radioY = getTerrainY(690, terrain) + 44;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(radioX, radioY, 16, 14);
  ctx.strokeStyle = '#0f172a';
  ctx.strokeRect(radioX, radioY, 16, 14);
  ctx.fillStyle = (Date.now() % 600 < 300) ? '#22c55e' : '#ef4444';
  ctx.fillRect(radioX + 3, radioY + 3, 3, 3);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(radioX + 8, radioY + 3, 5, 3);

  // 8d. Armory Missile Racks (800px)
  const rackX = 800 * scaleX;
  const rackY = getTerrainY(800, terrain) + 46;
  ctx.fillStyle = '#334155';
  ctx.fillRect(rackX, rackY, 18, 12);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(rackX, rackY, 18, 12);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(rackX + 3, rackY + 3, 12, 2.5);
  ctx.fillRect(rackX + 3, rackY + 7, 12, 2.5);

  // 9. Stencil Text on Wall & Surface Signs
  ctx.font = '700 7px "Press Start 2P", monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('FORTIFIED SUBTERRANEAN BUNKER • সুবিশাল সুরক্ষিত বাঙ্কার কমপ্লেক্স', 600 * scaleX, getTerrainY(600, terrain) + 28);

  ctx.font = '700 6px "Press Start 2P", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('🪜 BUNKER', t.leftEntranceX * scaleX, getTerrainY(t.leftEntranceX, terrain) - 10);
  ctx.fillText('🪜 BUNKER', t.rightEntranceX * scaleX, getTerrainY(t.rightEntranceX, terrain) - 10);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('💥 CENTRAL FIRING HATCH 🪜', t.hatchOpeningX * scaleX, getTerrainY(t.hatchOpeningX, terrain) - 10);

  ctx.restore();
}
