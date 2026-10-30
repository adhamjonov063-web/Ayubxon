import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PlayerCarState, CarCustomization, GasStationZone } from '../types/game';
import { build3DCar, Car3DObject } from './carBuilder';
import { buildCity, CityData } from './cityBuilder';
import { TrafficSystem } from './trafficSystem';
import { CarPhysics, KeyControls } from './carPhysics';

export type CameraMode = 'chase' | 'hood' | 'top';

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera1: THREE.PerspectiveCamera;
  public camera2: THREE.PerspectiveCamera;

  public isSoftwareGl: boolean;
  private animationFrameId: number = 0;
  private isDestroyed = false;

  // City & Environment
  public cityData: CityData;
  public trafficSystem: TrafficSystem;

  // Player 1
  public player1State: PlayerCarState;
  public player1CarObj: Car3DObject;
  public player1Controls: KeyControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
    horn: false,
  };

  // Player 2
  public player2State: PlayerCarState;
  public player2CarObj: Car3DObject;
  public player2Controls: KeyControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
    horn: false,
  };

  public isTwoPlayer: boolean = false;
  public cameraMode: CameraMode = 'chase';

  // Callbacks to UI
  public onStateUpdate?: (p1: PlayerCarState, p2: PlayerCarState, isP1NearGas: boolean, isP2NearGas: boolean) => void;

  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor(
    container: HTMLElement,
    initialP1Custom: CarCustomization,
    initialP2Custom: CarCustomization
  ) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Detect Software GL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Three.js Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Studio Lighting
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.007);

    // Room Environment for reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Directional Sun / Key Light with Shadows
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    sunLight.position.set(70, 90, 60);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 280;
    const d = 120;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Hemisphere Fill Light (Sky blue vs warm asphalt ground)
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.9);
    this.scene.add(hemiLight);

    // 4. Cameras
    this.camera1 = new THREE.PerspectiveCamera(60, width / height, 0.2, 800);
    this.camera2 = new THREE.PerspectiveCamera(60, width / height, 0.2, 800);

    // 5. Build City & Environment
    this.cityData = buildCity();
    this.scene.add(this.cityData.cityGroup);

    // 6. Spawn AI Traffic
    this.trafficSystem = new TrafficSystem(this.scene, this.cityData.trafficNodes);

    // 7. Initialize Player 1
    this.player1State = {
      id: 1,
      name: "1-O'yinchi",
      modelId: initialP1Custom.modelId || 'gentra',
      x: 0,
      z: 15,
      y: 0,
      angle: 0,
      speed: 0,
      steerAngle: 0,
      drift: 0,
      gear: 1,
      rpm: 1000,
      fuel: 85,
      maxFuel: 100,
      isRefueling: false,
      score: 0,
      cash: 120000,
      fines: 0,
      driverPoints: 100,
      customization: initialP1Custom,
      isBraking: false,
      isReversing: false,
      isNitro: false,
      nitroLevel: 100,
    };
    this.player1CarObj = build3DCar(initialP1Custom);
    this.scene.add(this.player1CarObj.group);

    // 8. Initialize Player 2 (Spawned alongside Player 1)
    this.player2State = {
      id: 2,
      name: "2-O'yinchi",
      modelId: initialP2Custom.modelId || 'supercar',
      x: 0,
      z: 22,
      y: 0,
      angle: 0,
      speed: 0,
      steerAngle: 0,
      drift: 0,
      gear: 1,
      rpm: 1000,
      fuel: 90,
      maxFuel: 100,
      isRefueling: false,
      score: 0,
      cash: 120000,
      fines: 0,
      driverPoints: 100,
      customization: initialP2Custom,
      isBraking: false,
      isReversing: false,
      isNitro: false,
      nitroLevel: 100,
    };
    this.player2CarObj = build3DCar(initialP2Custom);
    this.scene.add(this.player2CarObj.group);

    // Window Resize Handler
    window.addEventListener('resize', this.handleResize);

    // Setup Keyboard Listeners
    this.setupKeyboardListeners();

    // Start Game Loop
    this.startLoop();
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;

      // Player 1 controls (WASD + Shift + Space + H)
      if (code === 'KeyW') this.player1Controls.forward = true;
      if (code === 'KeyS') this.player1Controls.backward = true;
      if (code === 'KeyA') this.player1Controls.left = true;
      if (code === 'KeyD') this.player1Controls.right = true;
      if (code === 'Space') {
        this.player1Controls.handbrake = true;
        e.preventDefault();
      }
      if (code === 'ShiftLeft') this.player1Controls.nitro = true;
      if (code === 'KeyH') this.player1Controls.horn = true;

      // Player 2 controls (Arrows + Enter + ShiftRight + KeyL)
      if (code === 'ArrowUp') {
        this.player2Controls.forward = true;
        e.preventDefault();
      }
      if (code === 'ArrowDown') {
        this.player2Controls.backward = true;
        e.preventDefault();
      }
      if (code === 'ArrowLeft') {
        this.player2Controls.left = true;
        e.preventDefault();
      }
      if (code === 'ArrowRight') {
        this.player2Controls.right = true;
        e.preventDefault();
      }
      if (code === 'Enter') {
        this.player2Controls.handbrake = true;
        e.preventDefault();
      }
      if (code === 'KeyL' || code === 'Numpad0') this.player2Controls.nitro = true;
      if (code === 'Slash' || code === 'Period') this.player2Controls.horn = true;

      // Quick key: R (Reset Car)
      if (code === 'KeyR') {
        this.resetPlayerPosition(1);
        if (this.isTwoPlayer) this.resetPlayerPosition(2);
      }

      // Quick key: C (Cycle Camera)
      if (code === 'KeyC') {
        this.cycleCamera();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      // Player 1
      if (code === 'KeyW') this.player1Controls.forward = false;
      if (code === 'KeyS') this.player1Controls.backward = false;
      if (code === 'KeyA') this.player1Controls.left = false;
      if (code === 'KeyD') this.player1Controls.right = false;
      if (code === 'Space') this.player1Controls.handbrake = false;
      if (code === 'ShiftLeft') this.player1Controls.nitro = false;
      if (code === 'KeyH') this.player1Controls.horn = false;

      // Player 2
      if (code === 'ArrowUp') this.player2Controls.forward = false;
      if (code === 'ArrowDown') this.player2Controls.backward = false;
      if (code === 'ArrowLeft') this.player2Controls.left = false;
      if (code === 'ArrowRight') this.player2Controls.right = false;
      if (code === 'Enter') this.player2Controls.handbrake = false;
      if (code === 'KeyL' || code === 'Numpad0') this.player2Controls.nitro = false;
      if (code === 'Slash' || code === 'Period') this.player2Controls.horn = false;
    });
  }

  public resetPlayerPosition(playerId: 1 | 2) {
    if (playerId === 1) {
      this.player1State.x = 0;
      this.player1State.z = 15;
      this.player1State.angle = 0;
      this.player1State.speed = 0;
      this.player1State.steerAngle = 0;
    } else {
      this.player1State.x = 0;
      this.player2State.z = 22;
      this.player2State.angle = 0;
      this.player2State.speed = 0;
      this.player2State.steerAngle = 0;
    }
  }

  public cycleCamera() {
    if (this.cameraMode === 'chase') this.cameraMode = 'hood';
    else if (this.cameraMode === 'hood') this.cameraMode = 'top';
    else this.cameraMode = 'chase';
  }

  public updatePlayer1Customization(custom: CarCustomization) {
    this.player1State.customization = custom;
    this.player1State.modelId = custom.modelId;
    this.player1CarObj.updateCustomization(custom);
  }

  public updatePlayer2Customization(custom: CarCustomization) {
    this.player2State.customization = custom;
    this.player2State.modelId = custom.modelId;
    this.player2CarObj.updateCustomization(custom);
  }

  public refuelPlayer(playerId: 1 | 2, amount: number) {
    if (playerId === 1) {
      this.player1State.fuel = Math.min(this.player1State.maxFuel, amount);
    } else {
      this.player2State.fuel = Math.min(this.player2State.maxFuel, amount);
    }
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
  };

  private updateCamera(camera: THREE.PerspectiveCamera, car: PlayerCarState, delta: number) {
    const fov = this.cameraMode === 'hood' ? 75 : 60;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const forwardX = Math.cos(car.angle);
    const forwardZ = -Math.sin(car.angle);

    if (this.cameraMode === 'chase') {
      // Smooth follow behind car
      const targetCamX = car.x - forwardX * 7.5;
      const targetCamZ = car.z - forwardZ * 7.5;
      const targetCamY = 3.6;

      // Exponential damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 9, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 9, delta);

      // Look slightly ahead of car hood
      const lookX = car.x + forwardX * 3;
      const lookZ = car.z + forwardZ * 3;
      camera.lookAt(lookX, 1.2, lookZ);
    } else if (this.cameraMode === 'hood') {
      // First person bonnet camera
      camera.position.set(car.x + forwardX * 0.4, 1.25, car.z + forwardZ * 0.4);
      camera.lookAt(car.x + forwardX * 12, 1.1, car.z + forwardZ * 12);
    } else if (this.cameraMode === 'top') {
      // Drone top-down view
      camera.position.set(car.x, 26, car.z);
      camera.lookAt(car.x, 0, car.z);
    }
  }

  private startLoop() {
    let afterDrawTimeout: number = 0;

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          afterDrawTimeout = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          afterDrawTimeout = window.setTimeout(cb, 80);
        }
      };
      afterDrawTimeout = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDestroyed) return;
      const delta = Math.min(this.clock.getDelta(), 0.05);

      // 1. Update Traffic Lights & AI Traffic
      this.cityData.updateTrafficLights(delta);
      this.trafficSystem.update(delta, this.cityData.trafficNodes);

      // 2. Update Player 1 Physics with Traffic Rules & Radars
      CarPhysics.updateCar(
        this.player1State,
        this.player1Controls,
        delta,
        this.cityData.obstacles,
        this.trafficSystem.trafficCars,
        this.cityData.gasStationZones,
        this.cityData.trafficLights,
        this.cityData.speedRadars,
        this.isTwoPlayer ? this.player2State : undefined
      );

      // Update Player 1 3D Object
      this.player1CarObj.group.position.set(this.player1State.x, 0, this.player1State.z);
      this.player1CarObj.group.rotation.y = this.player1State.angle;
      this.player1CarObj.updateWheelAnimation(this.player1State.speed, this.player1State.steerAngle, delta);
      this.player1CarObj.setNitroFlame(this.player1State.isNitro);

      // 3. Update Player 2 Physics (if active)
      if (this.isTwoPlayer) {
        CarPhysics.updateCar(
          this.player2State,
          this.player2Controls,
          delta,
          this.cityData.obstacles,
          this.trafficSystem.trafficCars,
          this.cityData.gasStationZones,
          this.cityData.trafficLights,
          this.cityData.speedRadars,
          this.player1State
        );

        this.player2CarObj.group.position.set(this.player2State.x, 0, this.player2State.z);
        this.player2CarObj.group.rotation.y = this.player2State.angle;
        this.player2CarObj.updateWheelAnimation(this.player2State.speed, this.player2State.steerAngle, delta);
        this.player2CarObj.setNitroFlame(this.player2State.isNitro);
        this.player2CarObj.group.visible = true;
      } else {
        // In 1P mode, player 2 is parked or hidden
        this.player2CarObj.group.visible = false;
      }

      // Check gas station proximity
      let isP1NearGas = false;
      let isP2NearGas = false;
      for (const gs of this.cityData.gasStationZones) {
        if (Math.hypot(this.player1State.x - gs.x, this.player1State.z - gs.z) < gs.radius) {
          isP1NearGas = true;
        }
        if (this.isTwoPlayer && Math.hypot(this.player2State.x - gs.x, this.player2State.z - gs.z) < gs.radius) {
          isP2NearGas = true;
        }
      }

      if (this.onStateUpdate) {
        this.onStateUpdate(this.player1State, this.player2State, isP1NearGas, isP2NearGas);
      }

      // 4. Render Cameras (Split screen vs Full screen)
      const totalWidth = this.container.clientWidth || window.innerWidth;
      const totalHeight = this.container.clientHeight || window.innerHeight;

      if (!this.isTwoPlayer) {
        // Full screen for Player 1
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, totalWidth, totalHeight);
        this.camera1.aspect = totalWidth / totalHeight;
        this.camera1.updateProjectionMatrix();

        this.updateCamera(this.camera1, this.player1State, delta);
        this.renderer.render(this.scene, this.camera1);
      } else {
        // Split Screen (Side-by-Side: Left for Player 1, Right for Player 2)
        const halfWidth = Math.floor(totalWidth / 2);
        this.renderer.setScissorTest(true);

        // Viewport 1 (Player 1 - Left)
        this.renderer.setScissor(0, 0, halfWidth, totalHeight);
        this.renderer.setViewport(0, 0, halfWidth, totalHeight);
        this.camera1.aspect = halfWidth / totalHeight;
        this.camera1.updateProjectionMatrix();
        this.updateCamera(this.camera1, this.player1State, delta);
        this.renderer.render(this.scene, this.camera1);

        // Viewport 2 (Player 2 - Right)
        this.renderer.setScissor(halfWidth, 0, halfWidth, totalHeight);
        this.renderer.setViewport(halfWidth, 0, halfWidth, totalHeight);
        this.camera2.aspect = halfWidth / totalHeight;
        this.camera2.updateProjectionMatrix();
        this.updateCamera(this.camera2, this.player2State, delta);
        this.renderer.render(this.scene, this.camera2);
      }

      // Next frame
      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.trafficSystem.dispose();
    this.renderer.dispose();
  }
}
