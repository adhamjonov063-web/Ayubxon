import * as THREE from 'three';
import { TrafficCar } from '../types/game';

export interface TrafficCarObject {
  data: TrafficCar;
  meshGroup: THREE.Group;
}

export class TrafficSystem {
  public trafficCars: TrafficCarObject[] = [];
  private trafficGroup: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene, routes: { x: number; z: number }[][]) {
    scene.add(this.trafficGroup);
    this.spawnTraffic(routes);
  }

  private spawnTraffic(routes: { x: number; z: number }[][]) {
    const colors = [
      0x2563eb, // Cobalt blue
      0xd97706, // Amber
      0x059669, // Emerald
      0xdc2626, // Crimson
      0x475569, // Slate gray
      0xffffff, // White
      0x7c3aed, // Purple
      0x0f172a, // Obsidian black
    ];

    let id = 1;
    for (let r = 0; r < routes.length; r++) {
      const route = routes[r];
      const countOnRoute = 3;

      for (let i = 0; i < countOnRoute; i++) {
        const waypointIndex = Math.floor((i / countOnRoute) * route.length);
        const nextWp = (waypointIndex + 1) % route.length;
        const curPt = route[waypointIndex];
        const nextPt = route[nextWp];

        const t = Math.random();
        const startX = curPt.x + (nextPt.x - curPt.x) * t;
        const startZ = curPt.z + (nextPt.z - curPt.z) * t;
        const angle = Math.atan2(nextPt.z - curPt.z, nextPt.x - curPt.x);

        const carColor = colors[(id + i) % colors.length];
        const meshGroup = this.createTrafficCarMesh(carColor);
        meshGroup.position.set(startX, 0, startZ);
        meshGroup.rotation.y = -angle + Math.PI / 2;

        this.trafficGroup.add(meshGroup);

        this.trafficCars.push({
          data: {
            id: id++,
            x: startX,
            z: startZ,
            y: 0,
            angle: angle,
            speed: 12 + Math.random() * 8, // ~15 km/h
            targetSpeed: 16,
            color: `#${carColor.toString(16).padStart(6, '0')}`,
            wheelStyle: 'sport',
            pathIndex: r,
            waypointIndex: nextWp,
          },
          meshGroup,
        });
      }
    }
  }

  private createTrafficCarMesh(colorHex: number): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.6,
      roughness: 0.3,
    });
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.7, 3.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.1,
      transmission: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.55, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.05, -0.2);
    group.add(cabin);

    // Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfffbe8 });
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), hlMat);
    hlL.position.set(-0.6, 0.55, 1.91);
    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), hlMat);
    hlR.position.set(0.6, 0.55, 1.91);
    group.add(hlL, hlR);

    // Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), tlMat);
    tlL.position.set(-0.6, 0.55, -1.91);
    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), tlMat);
    tlR.position.set(0.6, 0.55, -1.91);
    group.add(tlL, tlR);

    // Wheels (4 cylinders)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    const offsets = [
      { x: -0.9, z: 1.1 },
      { x: 0.9, z: 1.1 },
      { x: -0.9, z: -1.1 },
      { x: 0.9, z: -1.1 },
    ];
    for (const off of offsets) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(off.x, 0.32, off.z);
      group.add(wheel);
    }

    return group;
  }

  public update(delta: number, routes: { x: number; z: number }[][]) {
    for (const carObj of this.trafficCars) {
      const car = carObj.data;
      const route = routes[car.pathIndex];
      if (!route || route.length === 0) continue;

      const targetPoint = route[car.waypointIndex];
      const dx = targetPoint.x - car.x;
      const dz = targetPoint.z - car.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 6) {
        // Switch to next waypoint
        car.waypointIndex = (car.waypointIndex + 1) % route.length;
      }

      // Smooth steering toward waypoint
      const targetAngle = Math.atan2(dz, dx);
      let angleDiff = targetAngle - car.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      car.angle += angleDiff * Math.min(delta * 2.5, 1);

      // Move along angle
      const speedUnitsPerSec = car.speed * 0.45;
      car.x += Math.cos(car.angle) * speedUnitsPerSec * delta;
      car.z += Math.sin(car.angle) * speedUnitsPerSec * delta;

      // Update 3D mesh
      carObj.meshGroup.position.set(car.x, 0, car.z);
      // Three.js car faces Z or X, align with angle
      carObj.meshGroup.rotation.y = -car.angle + Math.PI / 2;
    }
  }

  public dispose() {
    this.trafficCars.forEach((c) => {
      this.trafficGroup.remove(c.meshGroup);
    });
    this.trafficCars = [];
  }
}
