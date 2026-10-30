import { PlayerCarState, GasStationZone, TrafficViolation } from '../types/game';
import { CityObstacle, TrafficLightData, SpeedRadarZone } from './cityBuilder';
import { TrafficCarObject } from './trafficSystem';
import { soundManager } from '../audio/soundManager';
import { CAR_MODELS } from '../data/carModels';

export interface KeyControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  nitro: boolean;
  horn: boolean;
}

export class CarPhysics {
  // Timers to prevent repeating violations within few seconds
  private static lastRedLightViolationTime = 0;
  private static lastRadarViolationTime: Record<string, number> = {};
  private static lastCollisionViolationTime = 0;

  public static updateCar(
    car: PlayerCarState,
    keys: KeyControls,
    delta: number,
    obstacles: CityObstacle[],
    trafficCars: TrafficCarObject[],
    gasStations: GasStationZone[],
    trafficLights: TrafficLightData[] = [],
    speedRadars: SpeedRadarZone[] = [],
    otherPlayerCar?: PlayerCarState
  ) {
    const dt = Math.min(delta, 0.1);
    const now = Date.now();

    // Get model specifications
    const spec = CAR_MODELS[car.modelId || 'gentra'] || CAR_MODELS.gentra;

    // 1. Refueling logic
    if (car.isRefueling) {
      car.speed *= 0.85;
      car.fuel = Math.min(car.fuel + dt * 25, car.maxFuel);
      if (car.fuel >= car.maxFuel) {
        car.isRefueling = false;
        soundManager.playDing();
      }
      return;
    }

    // Horn trigger
    if (keys.horn) {
      soundManager.playHorn(car.customization.hornPitch || (car.id === 1 ? 440 : 493.88));
    }

    // Out of fuel check
    const isOutOfFuel = car.fuel <= 0.5;

    // Nitro boost
    car.isNitro = keys.nitro && car.nitroLevel > 5 && !isOutOfFuel;
    if (car.isNitro) {
      car.nitroLevel = Math.max(0, car.nitroLevel - dt * 20);
    } else {
      car.nitroLevel = Math.min(100, car.nitroLevel + dt * 6);
    }

    // Dynamic model performance
    const maxSpeedForward = isOutOfFuel ? 14 : (car.isNitro ? spec.maxSpeed * 1.35 : spec.maxSpeed);
    const maxSpeedReverse = isOutOfFuel ? -8 : -38;
    const accelPower = (car.isNitro ? spec.accel * 1.7 : spec.accel) * (isOutOfFuel ? 0.25 : 1.0);
    const brakePower = 58;
    const friction = 12;

    car.isBraking = false;
    car.isReversing = false;

    if (keys.forward) {
      if (car.speed < 0) {
        car.speed += brakePower * dt;
        car.isBraking = true;
      } else {
        car.speed = Math.min(car.speed + accelPower * dt, maxSpeedForward);
        // Fuel consumption based on model efficiency
        const fuelBurn = (car.isNitro ? 1.6 : 0.55) * spec.fuelRate * dt;
        car.fuel = Math.max(0, car.fuel - fuelBurn);
      }
    } else if (keys.backward) {
      if (car.speed > 0) {
        car.speed = Math.max(0, car.speed - brakePower * dt);
        car.isBraking = true;
      } else {
        car.speed = Math.max(car.speed - accelPower * 0.6 * dt, maxSpeedReverse);
        car.isReversing = true;
        car.fuel = Math.max(0, car.fuel - 0.35 * spec.fuelRate * dt);
      }
    } else {
      if (car.speed > 0) {
        car.speed = Math.max(0, car.speed - friction * dt);
      } else if (car.speed < 0) {
        car.speed = Math.min(0, car.speed + friction * dt);
      }
    }

    // Handbrake
    if (keys.handbrake) {
      car.speed *= (1 - 0.7 * dt);
      car.isBraking = true;
    }

    // Steering
    const absSpeed = Math.abs(car.speed);
    const maxSteer = 0.55 * spec.handling;
    const speedFactor = Math.max(0.25, 1 - (absSpeed / maxSpeedForward) * 0.52);

    let targetSteer = 0;
    if (keys.left) targetSteer += maxSteer * speedFactor;
    if (keys.right) targetSteer -= maxSteer * speedFactor;

    car.steerAngle += (targetSteer - car.steerAngle) * Math.min(dt * 12, 1);

    // Drifting calculation
    const isDrifting = (keys.handbrake || (absSpeed > 55 && Math.abs(car.steerAngle) > 0.3));
    if (isDrifting && absSpeed > 20) {
      car.drift = Math.min(1.0, car.drift + dt * 2.5);
      car.score += Math.round(absSpeed * dt * 2);
    } else {
      car.drift = Math.max(0, car.drift - dt * 4.0);
    }

    // Heading update
    const turnSign = car.speed >= 0 ? 1 : -1;
    const turnRate = car.steerAngle * (absSpeed / 12) * (1 + car.drift * 0.6);
    car.angle += turnRate * turnSign * dt;

    // Velocity projection
    const speedMetersPerSec = (car.speed / 3.6);
    const forwardX = Math.cos(car.angle);
    const forwardZ = -Math.sin(car.angle);

    const lateralX = -forwardZ;
    const lateralZ = forwardX;
    const slipFactor = car.drift * (car.steerAngle > 0 ? 0.3 : -0.3);

    const moveX = (forwardX + lateralX * slipFactor) * speedMetersPerSec * dt;
    const moveZ = (forwardZ + lateralZ * slipFactor) * speedMetersPerSec * dt;

    const nextX = car.x + moveX;
    const nextZ = car.z + moveZ;

    // 2. Obstacle Collisions
    const carRadius = 1.4;
    let collided = false;

    for (const obs of obstacles) {
      const closestX = Math.max(obs.x - obs.halfWidth, Math.min(nextX, obs.x + obs.halfWidth));
      const closestZ = Math.max(obs.z - obs.halfDepth, Math.min(nextZ, obs.z + obs.halfDepth));
      const distX = nextX - closestX;
      const distZ = nextZ - closestZ;
      const distSq = distX * distX + distZ * distZ;

      if (distSq < carRadius * carRadius) {
        collided = true;
        car.speed = -car.speed * 0.4;
        soundManager.playCrash(Math.abs(car.speed) / 60);

        const dist = Math.sqrt(distSq) || 0.01;
        const pushDist = (carRadius - dist) + 0.1;
        car.x += (distX / dist) * pushDist;
        car.z += (distZ / dist) * pushDist;
        break;
      }
    }

    // 3. Traffic Cars Collision & Traffic Accident Fine (YTH)
    for (const tObj of trafficCars) {
      const tc = tObj.data;
      const dx = nextX - tc.x;
      const dz = nextZ - tc.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.5) {
        collided = true;
        soundManager.playCrash(0.65);
        tc.speed = Math.max(5, tc.speed + car.speed * 0.2);
        car.speed = -car.speed * 0.35;
        car.x += (dx / dist) * 1.5;
        car.z += (dz / dist) * 1.5;

        // Traffic rule: Traffic Accident Fine
        if (absSpeed > 25 && now - this.lastCollisionViolationTime > 6000) {
          this.lastCollisionViolationTime = now;
          const fineAmount = 30000;
          car.fines += fineAmount;
          car.driverPoints = Math.max(0, car.driverPoints - 8);
          car.recentViolation = {
            id: `crash_${now}`,
            title: "💥 YTH (Yo'l-transport hodisasi sodir etildi)",
            amount: fineAmount,
            timestamp: now,
          };
          soundManager.playPoliceSiren();
        }
        break;
      }
    }

    // 4. Player vs Player Collision
    if (otherPlayerCar) {
      const pDx = nextX - otherPlayerCar.x;
      const pDz = nextZ - otherPlayerCar.z;
      const pDist = Math.hypot(pDx, pDz);
      if (pDist < 2.6) {
        soundManager.playCrash(0.8);
        const impulse = (car.speed - otherPlayerCar.speed) * 0.5;
        car.speed -= impulse * 0.6;
        otherPlayerCar.speed += impulse * 0.6;
        const push = (2.6 - pDist) * 0.5 + 0.1;
        car.x += (pDx / pDist) * push;
        car.z += (pDz / pDist) * push;
        otherPlayerCar.x -= (pDx / pDist) * push;
        otherPlayerCar.z -= (pDz / pDist) * push;
      }
    }

    if (!collided) {
      car.x = nextX;
      car.z = nextZ;
    }

    // ==========================================
    // 5. TRAFFIC RULES ENFORCEMENT (Yo'l Qoidalari)
    // ==========================================

    // A) Traffic Lights (Qizil Chiroqqa O'tish)
    if (absSpeed > 18 && now - this.lastRedLightViolationTime > 5000) {
      for (const tl of trafficLights) {
        const distToTl = Math.hypot(car.x - tl.x, car.z - tl.z);
        if (distToTl < 11 && tl.state === 'red') {
          this.lastRedLightViolationTime = now;
          const fine = 50000;
          car.fines += fine;
          car.driverPoints = Math.max(0, car.driverPoints - 10);
          car.recentViolation = {
            id: `red_light_${now}`,
            title: "🚦 Qizil chiroqqa o'tish (Svetofor qoidasi buzildi)",
            amount: fine,
            timestamp: now,
          };
          soundManager.playPoliceSiren();
          break;
        }
      }
    }

    // B) Speed Radar Cameras (Fotoradarlar & Tezlik Chegarasi 70 km/h)
    for (const radar of speedRadars) {
      const distToRadar = Math.hypot(car.x - radar.x, car.z - radar.z);
      const lastFineTime = this.lastRadarViolationTime[radar.id] || 0;

      if (distToRadar < 9 && absSpeed > radar.speedLimit && now - lastFineTime > 7000) {
        this.lastRadarViolationTime[radar.id] = now;
        const overspeed = Math.round(absSpeed - radar.speedLimit);
        const fine = 60000 + overspeed * 3000; // scaling fine
        car.fines += fine;
        car.driverPoints = Math.max(0, car.driverPoints - 15);
        car.recentViolation = {
          id: `radar_${radar.id}_${now}`,
          title: `📸 YPX Fotoradar: ${Math.round(absSpeed)} km/h (+${overspeed} km/h oshirildi)`,
          amount: fine,
          timestamp: now,
        };
        soundManager.playCameraShutter();
        setTimeout(() => soundManager.playPoliceSiren(), 200);
        break;
      }
    }

    // Clear recent violation after 4 seconds
    if (car.recentViolation && now - car.recentViolation.timestamp > 4000) {
      car.recentViolation = null;
    }

    // RPM & Gear calculation for dashboard
    const speedRatio = Math.min(1.0, absSpeed / spec.maxSpeed);
    car.gear = Math.max(1, Math.min(6, Math.floor(speedRatio * 5) + 1));
    const gearFraction = (speedRatio * 5) % 1;
    car.rpm = Math.floor(1000 + gearFraction * 6500 + (car.isNitro ? 1200 : 0));

    // Update audio engine
    soundManager.updateEngine(car.id as 1 | 2, car.speed, keys.forward, car.isNitro);
    soundManager.updateDrift(car.drift);
  }
}
