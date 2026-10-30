import * as THREE from 'three';
import { GasStationZone } from '../types/game';

export interface CityObstacle {
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
  name: string;
}

export interface TrafficLightData {
  lightMesh: THREE.Mesh;
  timer: number;
  state: 'green' | 'yellow' | 'red';
  x: number;
  z: number;
}

export interface SpeedRadarZone {
  id: string;
  x: number;
  z: number;
  speedLimit: number;
  lastTriggerTime: number;
}

export interface CityData {
  cityGroup: THREE.Group;
  obstacles: CityObstacle[];
  gasStationZones: GasStationZone[];
  trafficNodes: { x: number; z: number }[][];
  trafficLights: TrafficLightData[];
  speedRadars: SpeedRadarZone[];
  updateTrafficLights: (delta: number) => void;
}

// Procedural Asphalt Road Texture with Markings
function createRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt background with subtle grain
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 512, 512);

  // Grain/noise
  for (let i = 0; i < 4000; i++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#2b2e35' : '#191b1f';
    ctx.fillRect(nx, ny, 2, 2);
  }

  // Yellow edge lines
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(18, 512);
  ctx.moveTo(494, 0);
  ctx.lineTo(494, 512);
  ctx.stroke();

  // White center dashed line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.setLineDash([32, 24]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Sidewalk / Pavement Texture
function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 256, 256);

  // Paver tile grid
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Building Facade Windows Texture
function createBuildingTexture(windowColor = '#60a5fa', wallColor = '#334155'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, 256, 512);

  // Rows and columns of glowing or reflected windows
  const rows = 16;
  const cols = 6;
  const winW = 24;
  const winH = 18;
  const gapX = 16;
  const gapY = 12;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = 12 + c * (winW + gapX);
      const wy = 16 + r * (winH + gapY);

      // Random window illumination
      const isLit = (r + c * 3) % 4 !== 0;
      ctx.fillStyle = isLit ? windowColor : '#1e293b';
      ctx.fillRect(wx, wy, winW, winH);

      // Window frame
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(wx, wy, winW, winH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildCity(): CityData {
  const cityGroup = new THREE.Group();
  const obstacles: CityObstacle[] = [];
  const gasStationZones: GasStationZone[] = [];
  const trafficLights: TrafficLightData[] = [];

  const roadTex = createRoadTexture();
  const sidewalkTex = createSidewalkTexture();

  // 1. Terrain Ground (Expanded city floor with perimeter greenbelt)
  const terrainGeo = new THREE.PlaneGeometry(600, 600);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x243322,
    roughness: 0.9,
    metalness: 0.1,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.position.y = -0.05;
  terrain.receiveShadow = true;
  cityGroup.add(terrain);

  // City bounds and grid setup
  // City size: 300x300 meters centered around (0,0)
  // Grid layout: 4 major avenues in X (-75, 0, 75, 150) and 4 major avenues in Z (-75, 0, 75, 150)
  const roadWidth = 14;
  const roadCoords = [-120, -60, 0, 60, 120];

  // Build Road Network
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.7,
    metalness: 0.2,
  });

  // East-West Roads (Z axis strips)
  for (const z of roadCoords) {
    const ewRoadGeo = new THREE.PlaneGeometry(360, roadWidth);
    ewRoadGeo.rotateX(-Math.PI / 2);
    const ewRoad = new THREE.Mesh(ewRoadGeo, roadMat);
    ewRoad.position.set(0, 0.01, z);
    ewRoad.receiveShadow = true;
    cityGroup.add(ewRoad);

    // Sidewalks on both sides of EW road
    const swMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.8,
      metalness: 0.1,
    });
    const swGeo = new THREE.BoxGeometry(360, 0.16, 3);
    const swNorth = new THREE.Mesh(swGeo, swMat);
    swNorth.position.set(0, 0.08, z + (roadWidth / 2 + 1.5));
    const swSouth = new THREE.Mesh(swGeo, swMat);
    swSouth.position.set(0, 0.08, z - (roadWidth / 2 + 1.5));
    cityGroup.add(swNorth, swSouth);
  }

  // North-South Roads (X axis strips)
  for (const x of roadCoords) {
    const nsRoadGeo = new THREE.PlaneGeometry(roadWidth, 360);
    nsRoadGeo.rotateX(-Math.PI / 2);
    const nsRoad = new THREE.Mesh(nsRoadGeo, roadMat);
    nsRoad.position.set(x, 0.012, 0); // slightly offset to prevent z-fighting
    nsRoad.receiveShadow = true;
    cityGroup.add(nsRoad);

    // Sidewalks
    const swMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.8,
      metalness: 0.1,
    });
    const swGeo = new THREE.BoxGeometry(3, 0.16, 360);
    const swEast = new THREE.Mesh(swGeo, swMat);
    swEast.position.set(x + (roadWidth / 2 + 1.5), 0.08, 0);
    const swWest = new THREE.Mesh(swGeo, swMat);
    swWest.position.set(x - (roadWidth / 2 + 1.5), 0.08, 0);
    cityGroup.add(swEast, swWest);
  }

  // Intersections: Traffic Lights & Street Lamps
  for (const x of roadCoords) {
    for (const z of roadCoords) {
      // 4-corner street lamps at intersection
      const lampOffsets = [
        { lx: x + 9, lz: z + 9 },
        { lx: x - 9, lz: z - 9 },
      ];
      for (const { lx, lz } of lampOffsets) {
        const lampGroup = new THREE.Group();
        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3;
        pole.castShadow = true;
        lampGroup.add(pole);

        // Arm
        const armGeo = new THREE.BoxGeometry(0.1, 0.1, 1.8);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(0, 5.8, -0.6);
        lampGroup.add(arm);

        // Light Head
        const headGeo = new THREE.ConeGeometry(0.35, 0.25, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xfffae0, emissive: 0xffe6aa, emissiveIntensity: 1.5 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 5.65, -1.2);
        lampGroup.add(head);

        lampGroup.position.set(lx, 0, lz);
        cityGroup.add(lampGroup);
      }

      // Traffic light at intersection corner
      const tlGroup = new THREE.Group();
      const tlPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
      );
      tlPole.position.y = 2.5;
      tlGroup.add(tlPole);

      const tlBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.2, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      tlBox.position.set(0, 4.4, 0);
      tlGroup.add(tlBox);

      const lightMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 1.8,
      });
      const lightBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), lightMat);
      lightBulb.position.set(0, 4.1, 0.21);
      tlGroup.add(lightBulb);

      tlGroup.position.set(x + 8.5, 0, z - 8.5);
      cityGroup.add(tlGroup);

      trafficLights.push({
        lightMesh: lightBulb,
        timer: Math.random() * 8,
        state: 'green',
        x,
        z,
      });

      // Zebra crosswalk decals before intersection
      const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
      for (let s = -4; s <= 4; s += 2) {
        // EW crossing
        const zLine = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4).rotateX(-Math.PI / 2), zebraMat);
        zLine.position.set(x + s, 0.02, z - 10);
        cityGroup.add(zLine);

        // NS crossing
        const zLineNS = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.8).rotateX(-Math.PI / 2), zebraMat);
        zLineNS.position.set(x - 10, 0.02, z + s);
        cityGroup.add(zLineNS);
      }
    }
  }

  // 1.5. YPX SPEED RADARS (Fotoradarlar & Tezlik Chegarasi 70 km/h)
  const speedRadars: SpeedRadarZone[] = [
    { id: 'radar_north', x: 0, z: 45, speedLimit: 70, lastTriggerTime: 0 },
    { id: 'radar_south', x: 0, z: -45, speedLimit: 70, lastTriggerTime: 0 },
    { id: 'radar_east', x: 45, z: 0, speedLimit: 70, lastTriggerTime: 0 },
    { id: 'radar_west', x: -45, z: 0, speedLimit: 70, lastTriggerTime: 0 },
  ];

  for (const radar of speedRadars) {
    const isEwRoad = radar.x === 0;
    const gantryGroup = new THREE.Group();

    // Overhead Steel Truss Arch
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const beamW = 16;
    const beamH = 6.2;

    // Left & Right Pillars
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, beamH, 8), trussMat);
    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, beamH, 8), trussMat);
    pL.position.y = beamH / 2;
    pR.position.y = beamH / 2;

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(beamW, 0.4, 0.4), trussMat);
    crossBeam.position.y = beamH;

    if (isEwRoad) {
      pL.position.x = -beamW / 2;
      pR.position.x = beamW / 2;
      gantryGroup.add(pL, pR, crossBeam);
    } else {
      pL.position.z = -beamW / 2;
      pR.position.z = beamW / 2;
      crossBeam.rotateY(Math.PI / 2);
      gantryGroup.add(pL, pR, crossBeam);
    }

    // Speed Camera Box
    const camBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    camBox.position.set(0, beamH - 0.4, 0);
    gantryGroup.add(camBox);

    // Glowing Flash Lens
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    lens.position.set(0, beamH - 0.4, isEwRoad ? 0.42 : 0);
    gantryGroup.add(lens);

    // Radar Sign Canvas "70 KM/H RADAR"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d')!;
    sCtx.fillStyle = '#dc2626';
    sCtx.fillRect(0, 0, 256, 128);
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 36px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('70 KM/H', 128, 55);
    sCtx.font = 'bold 24px sans-serif';
    sCtx.fillText('📷 FOTORADAR', 128, 100);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;

    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 1.8),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signBoard.position.set(0, beamH + 1.2, 0);
    if (!isEwRoad) signBoard.rotateY(Math.PI / 2);
    gantryGroup.add(signBoard);

    gantryGroup.position.set(radar.x, 0, radar.z);
    cityGroup.add(gantryGroup);
  }

  // 2. PRIMARY HERO LOCATION: The Grand Gas Station (Benzin Zapravka "LUK-AVTO / O'ZBEKISTON PETROL")
  // Situated at prime spot: (X: 30, Z: 30) between major road blocks
  const gsX = 30;
  const gsZ = 30;
  const gsWidth = 42;
  const gsDepth = 36;

  const gasStationGroup = new THREE.Group();
  gasStationGroup.position.set(gsX, 0, gsZ);

  // Gas Station Forecourt (Polished Concrete Base)
  const forecourtGeo = new THREE.BoxGeometry(gsWidth, 0.15, gsDepth);
  const forecourtMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6, metalness: 0.2 });
  const forecourt = new THREE.Mesh(forecourtGeo, forecourtMat);
  forecourt.position.y = 0.07;
  forecourt.receiveShadow = true;
  gasStationGroup.add(forecourt);

  // Yellow Refueling Bay Markings (Drive-in bays)
  for (let b = -10; b <= 10; b += 10) {
    const bayGeo = new THREE.PlaneGeometry(7, 12);
    bayGeo.rotateX(-Math.PI / 2);
    const bayMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const bay = new THREE.Mesh(bayGeo, bayMat);
    bay.position.set(b, 0.16, 0);
    gasStationGroup.add(bay);
  }

  // Giant Illuminated Canopy Roof
  const canopyRoofGeo = new THREE.BoxGeometry(32, 1.2, 22);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3 }); // Red petrol brand
  const canopy = new THREE.Mesh(canopyRoofGeo, canopyMat);
  canopy.position.set(0, 5.8, 0);
  canopy.castShadow = true;
  gasStationGroup.add(canopy);

  // Glowing Canopy Edge (Neon Strip)
  const neonEdgeGeo = new THREE.BoxGeometry(32.4, 0.25, 22.4);
  const neonEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xfacc15,
    emissiveIntensity: 2.5,
  });
  const neonEdge = new THREE.Mesh(neonEdgeGeo, neonEdgeMat);
  neonEdge.position.set(0, 5.8, 0);
  gasStationGroup.add(neonEdge);

  // Canopy Support Columns (4 strong steel pillars)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 });
  const pillarCoords = [
    { px: -10, pz: -6 },
    { px: 10, pz: -6 },
    { px: -10, pz: 6 },
    { px: 10, pz: 6 },
  ];
  for (const { px, pz } of pillarCoords) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 5.8, 12), pillarMat);
    pillar.position.set(px, 2.9, pz);
    pillar.castShadow = true;
    gasStationGroup.add(pillar);
  }

  // 4 Modern Fuel Pump Islands (Yoqilg'i quyish shoxobchalari)
  const pumpPositions = [
    { px: -10, pz: -3 },
    { px: -10, pz: 3 },
    { px: 10, pz: -3 },
    { px: 10, pz: 3 },
  ];
  for (const { px, pz } of pumpPositions) {
    const pumpGroup = new THREE.Group();
    // Concrete Curb Island
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.3, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    curb.position.y = 0.15;
    pumpGroup.add(curb);

    // Pump Dispenser Body
    const pumpBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.2, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.3 })
    );
    pumpBody.position.y = 1.25;
    pumpBody.castShadow = true;
    pumpGroup.add(pumpBody);

    // Digital Screen (Fuel price / Liters)
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    screen.position.set(0.61, 1.5, 0);
    screen.rotateY(Math.PI / 2);
    pumpGroup.add(screen);

    // Fuel Nozzle details
    const nozzleL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    nozzleL.position.set(0.4, 1.2, 0.55);
    pumpGroup.add(nozzleL);

    pumpGroup.position.set(px, 0, pz);
    gasStationGroup.add(pumpGroup);
  }

  // Convenience Store & Cafe Building (Mini-market)
  const storeX = 0;
  const storeZ = -13;
  const storeW = 20;
  const storeH = 4.2;
  const storeD = 8;
  const storeBody = new THREE.Mesh(
    new THREE.BoxGeometry(storeW, storeH, storeD),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
  );
  storeBody.position.set(storeX, storeH / 2, storeZ);
  storeBody.castShadow = true;
  gasStationGroup.add(storeBody);

  // Store Glass Front & Door
  const glassFront = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 3),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
    })
  );
  glassFront.position.set(0, 1.8, storeZ + storeD / 2 + 0.05);
  gasStationGroup.add(glassFront);

  // Store Sign "AVTO-MART & BENZIN"
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const signCtx = signCanvas.getContext('2d')!;
  signCtx.fillStyle = '#dc2626';
  signCtx.fillRect(0, 0, 512, 128);
  signCtx.fillStyle = '#ffffff';
  signCtx.font = 'bold 44px sans-serif';
  signCtx.textAlign = 'center';
  signCtx.textBaseline = 'middle';
  signCtx.fillText("⛽ ZAPRAVKA • AVTO-MART", 256, 64);
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;

  const signBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 2.2),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signBoard.position.set(0, 4.6, storeZ + storeD / 2 + 0.1);
  gasStationGroup.add(signBoard);

  // Digital Fuel Prices Totem (Pylon Sign at street edge)
  const pylonGroup = new THREE.Group();
  const pylonBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 7, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
  );
  pylonBody.position.y = 3.5;
  pylonGroup.add(pylonBody);

  // Fuel price board
  const priceCanvas = document.createElement('canvas');
  priceCanvas.width = 256;
  priceCanvas.height = 512;
  const pCtx = priceCanvas.getContext('2d')!;
  pCtx.fillStyle = '#0f172a';
  pCtx.fillRect(0, 0, 256, 512);
  pCtx.fillStyle = '#ef4444';
  pCtx.font = 'bold 34px sans-serif';
  pCtx.fillText("BENZIN", 40, 50);
  pCtx.fillStyle = '#22c55e';
  pCtx.font = 'bold 24px monospace';
  pCtx.fillText("Ai-92:  11,500", 25, 120);
  pCtx.fillText("Ai-95:  13,200", 25, 180);
  pCtx.fillText("Ai-98:  15,500", 25, 240);
  pCtx.fillStyle = '#38bdf8';
  pCtx.fillText("METAN:   3,800", 25, 300);
  pCtx.fillText("PROP:    5,200", 25, 360);
  pCtx.fillStyle = '#facc15';
  pCtx.font = 'bold 20px sans-serif';
  pCtx.fillText("24/7 XIZMAT", 50, 440);
  const priceTex = new THREE.CanvasTexture(priceCanvas);
  priceTex.colorSpace = THREE.SRGBColorSpace;

  const priceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 5.5),
    new THREE.MeshBasicMaterial({ map: priceTex })
  );
  priceMesh.position.set(0, 3.8, 0.42);
  pylonGroup.add(priceMesh);

  pylonGroup.position.set(-16, 0, 14);
  gasStationGroup.add(pylonGroup);

  cityGroup.add(gasStationGroup);

  // Register Gas Station Obstacle & Interaction Zone
  obstacles.push({
    x: gsX + storeX,
    z: gsZ + storeZ,
    halfWidth: storeW / 2 + 1,
    halfDepth: storeD / 2 + 1,
    name: 'Zapravka Binosi',
  });
  obstacles.push({
    x: gsX - 16,
    z: gsZ + 14,
    halfWidth: 1.5,
    halfDepth: 1,
    name: 'Zapravka Reklama Ustuni',
  });

  gasStationZones.push({
    id: 'central_gas_station',
    name: "Markaziy Benzin Shoxobchasi (Zapravka)",
    x: gsX,
    z: gsZ,
    radius: 14,
    pumps: pumpPositions.map((p) => ({ x: gsX + p.px, z: gsZ + p.pz })),
  });

  // 3. SECOND GAS STATION (South-West highway zapravka)
  // For large open city driving
  const gs2X = -90;
  const gs2Z = -90;
  const gasStation2Group = new THREE.Group();
  gasStation2Group.position.set(gs2X, 0, gs2Z);

  const forecourt2 = new THREE.Mesh(forecourtGeo, forecourtMat);
  forecourt2.position.y = 0.07;
  gasStation2Group.add(forecourt2);

  const canopy2 = new THREE.Mesh(canopyRoofGeo, new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7 }));
  canopy2.position.set(0, 5.8, 0);
  gasStation2Group.add(canopy2);

  for (const { px, pz } of pillarCoords) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 5.8, 12), pillarMat);
    pillar.position.set(px, 2.9, pz);
    gasStation2Group.add(pillar);
  }

  for (const { px, pz } of pumpPositions) {
    const pumpIsland = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.4), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    pumpIsland.position.set(px, 1.25, pz);
    gasStation2Group.add(pumpIsland);
  }

  cityGroup.add(gasStation2Group);

  gasStationZones.push({
    id: 'highway_gas_station',
    name: "G'arbiy Tezkor Yo'l Zapravkasi",
    x: gs2X,
    z: gs2Z,
    radius: 14,
    pumps: pumpPositions.map((p) => ({ x: gs2X + p.px, z: gs2Z + p.pz })),
  });

  // 4. Procedural Skyscrapers & Multi-part City Buildings
  // City blocks are located between the road coordinates
  const buildingColors = [
    { wall: '#1e293b', win: '#93c5fd' },
    { wall: '#334155', win: '#fef08a' },
    { wall: '#0f172a', win: '#67e8f9' },
    { wall: '#27272a', win: '#fca5a5' },
    { wall: '#18181b', win: '#86efac' },
  ];

  const cityBlockCenters = [
    // Quadrant 1
    { bx: -90, bz: -30, w: 34, d: 34, floors: 14 },
    { bx: -30, bz: -90, w: 34, d: 34, floors: 18 },
    { bx: -30, bz: -30, w: 32, d: 32, floors: 22 }, // High skyscraper
    // Quadrant 2
    { bx: 30, bz: -90, w: 34, d: 34, floors: 16 },
    { bx: 90, bz: -90, w: 36, d: 36, floors: 12 },
    { bx: 90, bz: -30, w: 34, d: 34, floors: 20 },
    { bx: 30, bz: -30, w: 32, d: 32, floors: 26 }, // Downtown Tower
    // Quadrant 3
    { bx: -90, bz: 30, w: 34, d: 34, floors: 15 },
    { bx: -90, bz: 90, w: 36, d: 36, floors: 11 },
    { bx: -30, bz: 30, w: 32, d: 32, floors: 24 },
    { bx: -30, bz: 90, w: 34, d: 34, floors: 17 },
    // Quadrant 4 (Gas station is at (30,30))
    { bx: 90, bz: 30, w: 34, d: 34, floors: 19 },
    { bx: 30, bz: 90, w: 32, d: 32, floors: 13 },
    { bx: 90, bz: 90, w: 36, d: 36, floors: 14 },
  ];

  cityBlockCenters.forEach((block, idx) => {
    const colScheme = buildingColors[idx % buildingColors.length];
    const buildingHeight = block.floors * 3.2;

    const bGroup = new THREE.Group();
    bGroup.position.set(block.bx, 0, block.bz);

    // 1. Ground floor retail shopfront (Glass & Canopy)
    const baseH = 4.5;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(block.w, baseH, block.d),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 })
    );
    baseMesh.position.y = baseH / 2;
    baseMesh.castShadow = true;
    bGroup.add(baseMesh);

    // 2. Main Tower Shaft (with procedural window texture)
    const towerH = buildingHeight - baseH;
    const towerTex = createBuildingTexture(colScheme.win, colScheme.wall);
    towerTex.repeat.set(block.w / 10, towerH / 12);

    const towerMat = new THREE.MeshStandardMaterial({
      map: towerTex,
      roughness: 0.35,
      metalness: 0.7,
    });
    const towerGeo = new THREE.BoxGeometry(block.w - 2, towerH, block.d - 2);
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.y = baseH + towerH / 2;
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    bGroup.add(towerMesh);

    // 3. Roof Crown / Penthouse / Helipad / Antenna
    const roofBox = new THREE.Mesh(
      new THREE.BoxGeometry(block.w * 0.6, 3, block.d * 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    roofBox.position.y = buildingHeight + 1.5;
    bGroup.add(roofBox);

    // Antenna Mast
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.3, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 })
    );
    antenna.position.set(0, buildingHeight + 8, 0);
    bGroup.add(antenna);

    cityGroup.add(bGroup);

    // Register building obstacle for physics collision
    obstacles.push({
      x: block.bx,
      z: block.bz,
      halfWidth: block.w / 2 + 0.6,
      halfDepth: block.d / 2 + 0.6,
      name: `Bino #${idx + 1}`,
    });
  });

  // 5. Stylized Street Trees & Greenery along Avenues
  const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8);
  const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const treeFoliageGeo = new THREE.DodecahedronGeometry(1.6, 1);
  const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

  const treeCoords = [
    { tx: -45, tz: -15 },
    { tx: -45, tz: 15 },
    { tx: -15, tz: -45 },
    { tx: 15, tz: -45 },
    { tx: 45, tz: -15 },
    { tx: -75, tz: 45 },
    { tx: 75, tz: -45 },
    { tx: -15, tz: 45 },
    { tx: 45, tz: 75 },
    { tx: -45, tz: 75 },
  ];

  for (const { tx, tz } of treeCoords) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliage = new THREE.Mesh(treeFoliageGeo, treeFoliageMat);
    foliage.position.y = 3.2;
    foliage.castShadow = true;
    tree.add(foliage);

    tree.position.set(tx, 0, tz);
    cityGroup.add(tree);

    obstacles.push({
      x: tx,
      z: tz,
      halfWidth: 0.8,
      halfDepth: 0.8,
      name: 'Daraxt',
    });
  }

  // 6. Natural Perimeter Barriers (Low mountains and tree lines bounding the city)
  const perimeterHillsGeo = new THREE.CylinderGeometry(190, 190, 8, 32, 1, true);
  const hillsMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a1e,
    roughness: 0.95,
  });
  const hills = new THREE.Mesh(perimeterHillsGeo, hillsMat);
  hills.position.y = 4;
  cityGroup.add(hills);

  // Outer city wall obstacles (boundary guardrails)
  const bounds = 155;
  obstacles.push({ x: 0, z: bounds, halfWidth: 160, halfDepth: 2, name: 'Chegara' });
  obstacles.push({ x: 0, z: -bounds, halfWidth: 160, halfDepth: 2, name: 'Chegara' });
  obstacles.push({ x: bounds, z: 0, halfWidth: 2, halfDepth: 160, name: 'Chegara' });
  obstacles.push({ x: -bounds, z: 0, halfWidth: 2, halfDepth: 160, name: 'Chegara' });

  // 7. Traffic AI Nodes (Waypoints for traffic cars along the road grid)
  const trafficNodes: { x: number; z: number }[][] = [
    // Route 1: Outer Loop (Counter-Clockwise)
    [
      { x: -120, z: -120 },
      { x: -120, z: 120 },
      { x: 120, z: 120 },
      { x: 120, z: -120 },
    ],
    // Route 2: Central East-West Highway
    [
      { x: -140, z: 0 },
      { x: -60, z: 0 },
      { x: 0, z: 0 },
      { x: 60, z: 0 },
      { x: 140, z: 0 },
      { x: 140, z: 60 },
      { x: 0, z: 60 },
      { x: -140, z: 60 },
    ],
    // Route 3: North-South Central Boulevard
    [
      { x: 0, z: -140 },
      { x: 0, z: -60 },
      { x: 0, z: 0 },
      { x: 0, z: 60 },
      { x: 0, z: 140 },
      { x: -60, z: 140 },
      { x: -60, z: 0 },
      { x: -60, z: -140 },
    ],
  ];

  // Dynamic traffic light updater
  const updateTrafficLights = (delta: number) => {
    for (const tl of trafficLights) {
      tl.timer += delta;
      if (tl.state === 'green' && tl.timer > 7) {
        tl.state = 'yellow';
        tl.timer = 0;
        (tl.lightMesh.material as THREE.MeshStandardMaterial).color.set(0xeab308);
        (tl.lightMesh.material as THREE.MeshStandardMaterial).emissive.set(0xeab308);
      } else if (tl.state === 'yellow' && tl.timer > 2) {
        tl.state = 'red';
        tl.timer = 0;
        (tl.lightMesh.material as THREE.MeshStandardMaterial).color.set(0xef4444);
        (tl.lightMesh.material as THREE.MeshStandardMaterial).emissive.set(0xef4444);
      } else if (tl.state === 'red' && tl.timer > 6) {
        tl.state = 'green';
        tl.timer = 0;
        (tl.lightMesh.material as THREE.MeshStandardMaterial).color.set(0x22c55e);
        (tl.lightMesh.material as THREE.MeshStandardMaterial).emissive.set(0x22c55e);
      }
    }
  };

  return {
    cityGroup,
    obstacles,
    gasStationZones,
    trafficNodes,
    trafficLights,
    speedRadars,
    updateTrafficLights,
  };
}
