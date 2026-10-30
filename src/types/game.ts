export type WheelStyle = 'sport' | 'bbs' | 'offroad' | 'cyber' | 'classic';

export type BodyFinish = 'gloss' | 'metallic' | 'matte';

export type CarModelId = 'gentra' | 'supercar' | 'gwagon' | 'malibu' | 'muscle';

export interface CarModelSpec {
  id: CarModelId;
  name: string;
  category: string;
  description: string;
  maxSpeed: number;
  accel: number;
  handling: number;
  fuelRate: number; // fuel burn rate multiplier
}

export interface TrafficViolation {
  id: string;
  title: string;
  amount: number; // fine in so'm
  timestamp: number;
}

export interface CarCustomization {
  modelId: CarModelId;
  bodyColor: string;
  finish: BodyFinish;
  roofColor: string;
  wheelStyle: WheelStyle;
  rimColor: string;
  tireSmokeColor: string;
  underglowColor: string | null; // null if off
  spoilerStyle: 'none' | 'sport' | 'gt';
  windowTint: 'clear' | 'smoke' | 'dark' | 'chameleon';
  hornPitch: number;
}

export interface PlayerCarState {
  id: number;
  name: string;
  modelId: CarModelId;
  x: number;
  z: number;
  y: number;
  angle: number; // yaw in radians
  speed: number; // km/h (or units/sec)
  steerAngle: number;
  drift: number;
  gear: number;
  rpm: number;
  fuel: number; // 0 to 100
  maxFuel: number;
  isRefueling: boolean;
  score: number;
  cash: number;
  fines: number;
  driverPoints: number; // 0 - 100 rating
  recentViolation?: TrafficViolation | null;
  customization: CarCustomization;
  isBraking: boolean;
  isReversing: boolean;
  isNitro: boolean;
  nitroLevel: number;
}

export type GameMode = 'freeroam' | 'twoplayer' | 'race' | 'drift';

export interface TrafficCar {
  id: number;
  x: number;
  z: number;
  y: number;
  angle: number;
  speed: number;
  targetSpeed: number;
  color: string;
  wheelStyle: WheelStyle;
  pathIndex: number;
  waypointIndex: number;
}

export interface GasStationZone {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  pumps: { x: number; z: number }[];
}

export interface Checkpoint {
  id: number;
  x: number;
  z: number;
  radius: number;
}
