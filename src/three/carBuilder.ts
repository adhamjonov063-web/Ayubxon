import * as THREE from 'three';
import { CarCustomization, WheelStyle, CarModelId } from '../types/game';

export interface Car3DObject {
  group: THREE.Group;
  currentModelId: CarModelId;
  updateCustomization: (custom: CarCustomization) => void;
  updateWheelAnimation: (speed: number, steerAngle: number, delta: number) => void;
  setNitroFlame: (active: boolean) => void;
}

// Procedural rim generator
function createWheel(style: WheelStyle, rimColorHex: string, scale = 1.0): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber Tire
  const tireRadius = (style === 'offroad' ? 0.38 : 0.34) * scale;
  const tireTube = (style === 'offroad' ? 0.16 : 0.12) * scale;
  const tireGeo = new THREE.TorusGeometry(tireRadius, tireTube, 16, 24);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.1,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  wheelGroup.add(tireMesh);

  // Wheel Rim Hub
  const rimColor = new THREE.Color(rimColorHex);
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    metalness: style === 'cyber' ? 0.2 : 0.85,
    roughness: style === 'cyber' ? 0.1 : 0.2,
    emissive: style === 'cyber' ? rimColor : new THREE.Color(0x000000),
    emissiveIntensity: style === 'cyber' ? 0.8 : 0,
  });

  const hubGeo = new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 0.18 * scale, 18);
  hubGeo.rotateX(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, rimMat);
  hubMesh.castShadow = true;
  wheelGroup.add(hubMesh);

  // Spoke details based on style
  if (style === 'sport') {
    // 5-spoke alloy
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spokeGeo = new THREE.BoxGeometry(0.04 * scale, 0.26 * scale, 0.12 * scale);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(Math.cos(angle) * 0.12 * scale, Math.sin(angle) * 0.12 * scale, 0.04 * scale);
      spoke.rotation.z = angle + Math.PI / 2;
      wheelGroup.add(spoke);
    }
  } else if (style === 'bbs') {
    // Multi-spoke BBS mesh
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      const spokeGeo = new THREE.BoxGeometry(0.025 * scale, 0.26 * scale, 0.1 * scale);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(Math.cos(angle) * 0.12 * scale, Math.sin(angle) * 0.12 * scale, 0.04 * scale);
      spoke.rotation.z = angle;
      wheelGroup.add(spoke);
    }
  } else if (style === 'offroad') {
    // Chunky bolts & outer rim lip
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const boltGeo = new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.05 * scale, 8);
      boltGeo.rotateX(Math.PI / 2);
      const bolt = new THREE.Mesh(boltGeo, rimMat);
      bolt.position.set(Math.cos(angle) * 0.18 * scale, Math.sin(angle) * 0.18 * scale, 0.08 * scale);
      wheelGroup.add(bolt);
    }
  } else if (style === 'cyber') {
    // Glowing outer ring
    const ringGeo = new THREE.TorusGeometry(0.24 * scale, 0.025 * scale, 8, 24);
    const ringMesh = new THREE.Mesh(ringGeo, rimMat);
    ringMesh.position.z = 0.06 * scale;
    wheelGroup.add(ringMesh);
  } else if (style === 'classic') {
    // 16 wire spokes
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const spokeGeo = new THREE.CylinderGeometry(0.008 * scale, 0.008 * scale, 0.24 * scale, 4);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(Math.cos(angle) * 0.1 * scale, Math.sin(angle) * 0.1 * scale, 0.03 * scale);
      spoke.rotation.z = angle;
      wheelGroup.add(spoke);
    }
  }

  // Brake Disc & Caliper (Red)
  const brakeDiscGeo = new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 0.02 * scale, 16);
  brakeDiscGeo.rotateX(Math.PI / 2);
  const brakeDiscMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.9,
    roughness: 0.2,
  });
  const brakeDisc = new THREE.Mesh(brakeDiscGeo, brakeDiscMat);
  brakeDisc.position.z = -0.04 * scale;
  wheelGroup.add(brakeDisc);

  const caliperGeo = new THREE.BoxGeometry(0.06 * scale, 0.1 * scale, 0.05 * scale);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xdd1111,
    metalness: 0.3,
    roughness: 0.4,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0.12 * scale, 0.06 * scale, -0.04 * scale);
  wheelGroup.add(caliper);

  return wheelGroup;
}

export function build3DCar(custom: CarCustomization): Car3DObject {
  const carGroup = new THREE.Group();
  let currentCustom = { ...custom };

  // Internal references to animate
  let flWheel: THREE.Group;
  let frWheel: THREE.Group;
  let rlWheel: THREE.Group;
  let rrWheel: THREE.Group;
  let flameL: THREE.Mesh;
  let flameR: THREE.Mesh;
  let wheelSpinAngle = 0;

  function constructModel(c: CarCustomization) {
    // Clear previous children
    while (carGroup.children.length > 0) {
      const obj = carGroup.children[0];
      carGroup.remove(obj);
    }

    const modelId: CarModelId = c.modelId || 'supercar';
    const bodyColor = new THREE.Color(c.bodyColor);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: c.finish === 'metallic' ? 0.85 : c.finish === 'matte' ? 0.05 : 0.5,
      roughness: c.finish === 'matte' ? 0.8 : c.finish === 'metallic' ? 0.25 : 0.15,
    });

    const windowMat = new THREE.MeshPhysicalMaterial({
      color: c.windowTint === 'dark' ? 0x0a0a0a : c.windowTint === 'chameleon' ? 0x1e3a8a : 0x222222,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: c.windowTint === 'dark' ? 0.95 : 0.65,
    });

    let wheelOffsetY = 0.36;
    let wheelOffsetFrontX = -1.35;
    let wheelOffsetRearX = 1.35;
    let wheelOffsetZ = 0.98;
    let wheelScale = 1.0;

    if (modelId === 'gwagon') {
      // 1. G-Wagon (Boxy G63 SUV)
      wheelOffsetY = 0.48;
      wheelScale = 1.25;
      wheelOffsetFrontX = -1.4;
      wheelOffsetRearX = 1.4;
      wheelOffsetZ = 1.05;

      // Heavy Boxy Body
      const lowerGeo = new THREE.BoxGeometry(4.3, 0.9, 2.0);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.position.y = 0.8;
      lower.castShadow = true;
      carGroup.add(lower);

      // Boxy Cabin
      const cabinGeo = new THREE.BoxGeometry(2.7, 1.1, 1.95);
      const cabin = new THREE.Mesh(cabinGeo, bodyMat);
      cabin.position.set(0.2, 1.7, 0);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Upright Windshield
      const winGeo = new THREE.BoxGeometry(0.1, 0.9, 1.8);
      const windshield = new THREE.Mesh(winGeo, windowMat);
      windshield.position.set(-1.16, 1.7, 0);
      carGroup.add(windshield);

      // Side & Rear Windows
      const sideWinGeo = new THREE.BoxGeometry(2.3, 0.7, 2.02);
      const sideWins = new THREE.Mesh(sideWinGeo, windowMat);
      sideWins.position.set(0.3, 1.75, 0);
      carGroup.add(sideWins);

      // Rear Mounted Spare Wheel
      const spareTire = createWheel(c.wheelStyle, c.rimColor, 1.1);
      spareTire.rotation.y = Math.PI / 2;
      spareTire.position.set(2.25, 1.1, 0);
      carGroup.add(spareTire);

      // Bullbar & Grille
      const bullbarGeo = new THREE.BoxGeometry(0.15, 0.6, 1.6);
      const bullbar = new THREE.Mesh(bullbarGeo, new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
      bullbar.position.set(-2.2, 0.75, 0);
      carGroup.add(bullbar);

      // Round Classic Headlights
      const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.2 });
      const hlL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), hlMat);
      hlL.rotateZ(Math.PI / 2);
      hlL.position.set(-2.16, 0.85, 0.68);
      const hlR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), hlMat);
      hlR.rotateZ(Math.PI / 2);
      hlR.position.set(-2.16, 0.85, -0.68);
      carGroup.add(hlL, hlR);

    } else if (modelId === 'gentra') {
      // 2. Chevrolet Gentra / Lacetti (Uzbek Popular City Sedan)
      wheelOffsetY = 0.35;
      wheelScale = 0.95;
      wheelOffsetFrontX = -1.3;
      wheelOffsetRearX = 1.3;
      wheelOffsetZ = 0.92;

      // Sedan Hood & Lower Body
      const sedanShape = new THREE.Shape();
      sedanShape.moveTo(-2.1, 0.25);
      sedanShape.lineTo(-2.15, 0.5);
      sedanShape.lineTo(-1.3, 0.68); // gentle hood
      sedanShape.lineTo(-0.4, 0.74); // windshield base
      sedanShape.lineTo(0.2, 1.3);   // roof top
      sedanShape.lineTo(1.2, 1.3);   // roof back
      sedanShape.lineTo(1.8, 0.78);  // trunk deck
      sedanShape.lineTo(2.15, 0.72);
      sedanShape.lineTo(2.1, 0.25);
      sedanShape.lineTo(-2.1, 0.25);

      const sedanGeo = new THREE.ExtrudeGeometry(sedanShape, {
        depth: 1.76,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.08,
        bevelSegments: 2,
      });
      sedanGeo.center();
      const sedanMesh = new THREE.Mesh(sedanGeo, bodyMat);
      sedanMesh.position.y = 0.52;
      sedanMesh.castShadow = true;
      carGroup.add(sedanMesh);

      // Gentra Chrome Radiator Grille
      const grilleGeo = new THREE.BoxGeometry(0.1, 0.24, 0.7);
      const grilleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
      const grille = new THREE.Mesh(grilleGeo, grilleMat);
      grille.position.set(-2.15, 0.45, 0);
      carGroup.add(grille);

      // Gentra Headlights (Trapezoidal)
      const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffae0, emissiveIntensity: 1.8 });
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.36), hlMat);
      hlL.position.set(-2.12, 0.58, 0.58);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.36), hlMat);
      hlR.position.set(-2.12, 0.58, -0.58);
      carGroup.add(hlL, hlR);

      // Windshield & Rear glass
      const wsGeo = new THREE.BoxGeometry(0.85, 0.5, 1.45);
      wsGeo.rotateZ(0.6);
      const ws = new THREE.Mesh(wsGeo, windowMat);
      ws.position.set(-0.15, 0.98, 0);
      carGroup.add(ws);

      const rwGeo = new THREE.BoxGeometry(0.8, 0.45, 1.4);
      rwGeo.rotateZ(-0.55);
      const rw = new THREE.Mesh(rwGeo, windowMat);
      rw.position.set(1.45, 0.98, 0);
      carGroup.add(rw);

    } else if (modelId === 'malibu') {
      // 3. Malibu 2 (Modern Sleek Business Sedan)
      wheelOffsetY = 0.36;
      wheelScale = 1.02;
      wheelOffsetFrontX = -1.45;
      wheelOffsetRearX = 1.45;
      wheelOffsetZ = 0.96;

      // Sweeping aerodynamic body
      const shape = new THREE.Shape();
      shape.moveTo(-2.3, 0.22);
      shape.lineTo(-2.35, 0.46);
      shape.lineTo(-1.4, 0.65);
      shape.lineTo(-0.5, 0.7);
      shape.lineTo(0.3, 1.25);
      shape.lineTo(1.4, 1.22); // fastback slope
      shape.lineTo(2.0, 0.8);
      shape.lineTo(2.3, 0.72);
      shape.lineTo(2.25, 0.24);
      shape.lineTo(-2.3, 0.22);

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 1.82,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, bodyMat);
      mesh.position.y = 0.54;
      mesh.castShadow = true;
      carGroup.add(mesh);

      // Dual-tier grille
      const grilleUpper = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.15, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
      );
      grilleUpper.position.set(-2.32, 0.55, 0);
      carGroup.add(grilleUpper);

      // Sharp LED Headlights
      const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f0ff, emissiveIntensity: 2.2 });
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.4), hlMat);
      hlL.position.set(-2.3, 0.56, 0.64);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.4), hlMat);
      hlR.position.set(-2.3, 0.56, -0.64);
      carGroup.add(hlL, hlR);

    } else if (modelId === 'muscle') {
      // 4. V8 Mustang Muscle Car
      wheelOffsetY = 0.36;
      wheelScale = 1.05;
      wheelOffsetFrontX = -1.35;
      wheelOffsetRearX = 1.35;
      wheelOffsetZ = 1.02;

      const muscleShape = new THREE.Shape();
      muscleShape.moveTo(-2.2, 0.2);
      muscleShape.lineTo(-2.25, 0.55); // high blunt front
      muscleShape.lineTo(-1.2, 0.72);  // long flat hood
      muscleShape.lineTo(-0.3, 0.75);
      muscleShape.lineTo(0.3, 1.25);
      muscleShape.lineTo(1.1, 1.25);
      muscleShape.lineTo(1.7, 0.82);   // fastback slope
      muscleShape.lineTo(2.2, 0.75);
      muscleShape.lineTo(2.15, 0.22);
      muscleShape.lineTo(-2.2, 0.2);

      const mGeo = new THREE.ExtrudeGeometry(muscleShape, {
        depth: 1.88,
        bevelEnabled: true,
        bevelThickness: 0.12,
        bevelSize: 0.1,
        bevelSegments: 2,
      });
      mGeo.center();
      const mMesh = new THREE.Mesh(mGeo, bodyMat);
      mMesh.position.y = 0.55;
      mMesh.castShadow = true;
      carGroup.add(mMesh);

      // Raised Hood Scoop (Supercharger Blower)
      const scoopGeo = new THREE.BoxGeometry(0.8, 0.18, 0.5);
      const scoop = new THREE.Mesh(scoopGeo, new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
      scoop.position.set(-1.1, 1.02, 0);
      carGroup.add(scoop);

      // Aggressive Deep Grille
      const gMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.35, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 })
      );
      gMesh.position.set(-2.22, 0.45, 0);
      carGroup.add(gMesh);

    } else {
      // 5. Apex GT Supercar (Low-slung Aerodynamic Hypercar)
      wheelOffsetY = 0.35;
      wheelScale = 1.0;
      wheelOffsetFrontX = -1.35;
      wheelOffsetRearX = 1.35;
      wheelOffsetZ = 0.98;

      const bodyShape = new THREE.Shape();
      bodyShape.moveTo(-2.1, 0.2);
      bodyShape.lineTo(-2.2, 0.45);
      bodyShape.lineTo(-1.6, 0.65);
      bodyShape.lineTo(-0.6, 0.72);
      bodyShape.lineTo(0.1, 1.25);
      bodyShape.lineTo(1.1, 1.25);
      bodyShape.lineTo(1.8, 0.78);
      bodyShape.lineTo(2.2, 0.72);
      bodyShape.lineTo(2.1, 0.25);
      bodyShape.lineTo(-2.1, 0.2);

      const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
        depth: 1.8,
        bevelEnabled: true,
        bevelThickness: 0.12,
        bevelSize: 0.1,
        bevelSegments: 3,
      });
      bodyGeo.center();
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.55;
      bodyMesh.castShadow = true;
      carGroup.add(bodyMesh);

      // Windshield
      const windshieldGeo = new THREE.BoxGeometry(0.8, 0.55, 1.5);
      windshieldGeo.rotateZ(0.65);
      const windshield = new THREE.Mesh(windshieldGeo, windowMat);
      windshield.position.set(-0.25, 0.95, 0);
      carGroup.add(windshield);
    }

    // Common Taillights (Red LED)
    const tlMat = new THREE.MeshStandardMaterial({ color: 0xff0011, emissive: 0xff1122, emissiveIntensity: 2.0 });
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.45), tlMat);
    tlL.position.set(2.2, 0.68, 0.65);
    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.45), tlMat);
    tlR.position.set(2.2, 0.68, -0.65);
    carGroup.add(tlL, tlR);

    // Common Spoiler (If configured)
    if (c.spoilerStyle !== 'none') {
      const spGroup = new THREE.Group();
      const spMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
      const wingH = c.spoilerStyle === 'gt' ? 1.25 : 1.05;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 1.9), spMat);
      wing.position.set(1.95, wingH, 0);

      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, wingH - 0.7, 0.04), spMat);
      strutL.position.set(1.95, 0.7 + (wingH - 0.7) / 2, 0.55);
      const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.08, wingH - 0.7, 0.04), spMat);
      strutR.position.set(1.95, 0.7 + (wingH - 0.7) / 2, -0.55);

      spGroup.add(wing, strutL, strutR);
      carGroup.add(spGroup);
    }

    // Twin Exhaust Pipes & Nitro Flames
    const exhaustPipes = new THREE.Group();
    const exMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), exMat);
    pL.rotateZ(Math.PI / 2);
    pL.position.set(2.18, 0.28, 0.38);
    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), exMat);
    pR.rotateZ(Math.PI / 2);
    pR.position.set(2.18, 0.28, -0.38);
    exhaustPipes.add(pL, pR);

    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.85 });
    flameL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 8), flameMat);
    flameL.rotateZ(-Math.PI / 2);
    flameL.position.set(2.48, 0.28, 0.38);
    flameL.visible = false;

    flameR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 8), flameMat);
    flameR.rotateZ(-Math.PI / 2);
    flameR.position.set(2.48, 0.28, -0.38);
    flameR.visible = false;

    exhaustPipes.add(flameL, flameR);
    carGroup.add(exhaustPipes);

    // Underglow Neon
    if (c.underglowColor) {
      const neonLight = new THREE.PointLight(new THREE.Color(c.underglowColor), 3.5, 6);
      neonLight.position.set(0, 0.15, 0);
      carGroup.add(neonLight);

      const ugPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 1.8).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(c.underglowColor),
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        })
      );
      ugPlane.position.y = 0.05;
      carGroup.add(ugPlane);
    }

    // 4 Wheels
    flWheel = createWheel(c.wheelStyle, c.rimColor, wheelScale);
    frWheel = createWheel(c.wheelStyle, c.rimColor, wheelScale);
    rlWheel = createWheel(c.wheelStyle, c.rimColor, wheelScale);
    rrWheel = createWheel(c.wheelStyle, c.rimColor, wheelScale);

    flWheel.position.set(wheelOffsetFrontX, wheelOffsetY, wheelOffsetZ);
    frWheel.position.set(wheelOffsetFrontX, wheelOffsetY, -wheelOffsetZ);
    frWheel.rotation.y = Math.PI;

    rlWheel.position.set(wheelOffsetRearX, wheelOffsetY, wheelOffsetZ);
    rrWheel.position.set(wheelOffsetRearX, wheelOffsetY, -wheelOffsetZ);
    rrWheel.rotation.y = Math.PI;

    carGroup.add(flWheel, frWheel, rlWheel, rrWheel);
  }

  constructModel(custom);

  const updateCustomization = (newCustom: CarCustomization) => {
    currentCustom = { ...newCustom };
    constructModel(newCustom);
  };

  const updateWheelAnimation = (speed: number, steerAngle: number, delta: number) => {
    if (!flWheel || !frWheel || !rlWheel || !rrWheel) return;
    wheelSpinAngle += speed * delta * 2.8;

    flWheel.rotation.y = steerAngle;
    if (flWheel.children[0]) flWheel.children[0].rotation.z = wheelSpinAngle;
    if (flWheel.children[1]) flWheel.children[1].rotation.z = wheelSpinAngle;

    frWheel.rotation.y = Math.PI + steerAngle;
    if (frWheel.children[0]) frWheel.children[0].rotation.z = -wheelSpinAngle;
    if (frWheel.children[1]) frWheel.children[1].rotation.z = -wheelSpinAngle;

    if (rlWheel.children[0]) rlWheel.children[0].rotation.z = wheelSpinAngle;
    if (rlWheel.children[1]) rlWheel.children[1].rotation.z = wheelSpinAngle;

    if (rrWheel.children[0]) rrWheel.children[0].rotation.z = -wheelSpinAngle;
    if (rrWheel.children[1]) rrWheel.children[1].rotation.z = -wheelSpinAngle;
  };

  const setNitroFlame = (active: boolean) => {
    if (flameL && flameR) {
      flameL.visible = active;
      flameR.visible = active;
      if (active) {
        const s = 0.8 + Math.random() * 0.5;
        flameL.scale.set(s, s, s);
        flameR.scale.set(s, s, s);
      }
    }
  };

  return {
    group: carGroup,
    currentModelId: custom.modelId || 'supercar',
    updateCustomization,
    updateWheelAnimation,
    setNitroFlame,
  };
}
