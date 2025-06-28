import React, { useRef, useEffect, useCallback } from 'react';
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, PlaneGeometry, AmbientLight, DirectionalLight, Raycaster, Vector2, Object3D, Color, CylinderGeometry, MeshStandardMaterial, Group, ConeGeometry, GridHelper, CatmullRomCurve3, Vector3 as ThreeVector3, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, DoubleSide, Material, InstancedMesh } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PlacedBuilding, BuildingType, IndicatorLevels, Vector3 as GameVector3 } from '../types';
import { CELL_SIZE, GRID_SIZE, INITIAL_TERRAIN_SIZE, RIVER_PROXIMITY_THRESHOLD } from '../constants';

interface ThreeSceneProps {
  placedBuildings: PlacedBuilding[];
  onPlaceBuilding: (position: GameVector3, type: BuildingType, isRiparian?: boolean) => void;
  selectedBuildingTypeForPlacement: BuildingType | null;
  indicators: IndicatorLevels;
  unlockedTerrainAreas: number;
  riparianReforestationCount: number;
}

const BUILDING_GROUP_NAME = "buildingContainer";
const MAX_INSTANCES_PER_TYPE = 500; // Max number of instances for instanced meshes

const ThreeScene: React.FC<ThreeSceneProps> = ({
  placedBuildings,
  onPlaceBuilding,
  selectedBuildingTypeForPlacement,
  indicators,
  unlockedTerrainAreas,
  riparianReforestationCount,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groundPlaneRef = useRef<Mesh | null>(null);
  const riverMeshRef = useRef<Mesh | null>(null);
  const riverPathPointsRef = useRef<ThreeVector3[]>([]); // To store river path points for distance calculation
  const buildingGroupRef = useRef<Group | null>(null);
  const gridHelperRef = useRef<GridHelper | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const instancedMeshesRef = useRef<Map<BuildingType, Record<string, InstancedMesh>>>(new Map());
  const dummyObjectRef = useRef(new Object3D()); // For matrix calculations


  const getBuildingColor = useCallback((type: BuildingType): Color => {
    switch (type) {
      case BuildingType.SUSTAINABLE_HOUSE: return new Color(0x90caf9);
      case BuildingType.COMMUNITY_GARDEN: return new Color(0x4CAF50);
      case BuildingType.SOLAR_PANEL_ARRAY: return new Color(0xffcc80);
      case BuildingType.WATER_TREATMENT: return new Color(0x80deea);
      case BuildingType.WASTE_COLLECTION: return new Color(0xce93d8);
      case BuildingType.REFORESTATION_AREA: return new Color(0x66bb6a);
      case BuildingType.COMMUNITY_CENTER: return new Color(0xffab91);
      case BuildingType.SCHOOL: return new Color(0x4169E1);
      case BuildingType.HEALTH_POST: return new Color(0xf5f5f5);
      default: return new Color(0xeeeeee);
    }
  }, []);

  const createBuildingMesh = useCallback((building: PlacedBuilding): Mesh | Group | null => {
    if (building.type === BuildingType.SUSTAINABLE_HOUSE) {
      return null;
    }

    switch (building.type) {
        case BuildingType.COMMUNITY_GARDEN: {
            const group = new Group();
            const soilMat = new MeshStandardMaterial({ color: 0x966919, roughness: 0.9 });
            const plantMat = new MeshStandardMaterial({ color: 0x4CAF50 });
            const soil = new Mesh(new BoxGeometry(CELL_SIZE * 1.5, CELL_SIZE * 0.2, CELL_SIZE * 1.5), soilMat);
            group.add(soil);

            for (let i = 0; i < 5; i++) {
                const plant = new Mesh(new BoxGeometry(CELL_SIZE * 0.2, CELL_SIZE * 0.3, CELL_SIZE * 0.2), plantMat);
                plant.position.set(
                    (Math.random() - 0.5) * CELL_SIZE * 1.2,
                    CELL_SIZE * 0.25,
                    (Math.random() - 0.5) * CELL_SIZE * 1.2
                );
                group.add(plant);
            }
            group.position.set(building.position.x, building.position.y + CELL_SIZE * 0.1, building.position.z);
            group.userData = { buildingId: building.id, type: building.type };
            group.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
            return group;
        }

        case BuildingType.SOLAR_PANEL_ARRAY: {
            const group = new Group();
            const panelMat = new MeshStandardMaterial({ color: 0x050533, roughness: 0.2, metalness: 0.8 });
            const frameMat = new MeshStandardMaterial({ color: 0xaaaaaa });
            const panel = new Mesh(new BoxGeometry(CELL_SIZE * 1.8, CELL_SIZE * 0.1, CELL_SIZE * 1.2), panelMat);
            panel.rotation.x = Math.PI / 6;
            panel.position.y = CELL_SIZE * 0.3;
            const support = new Mesh(new BoxGeometry(CELL_SIZE * 0.2, CELL_SIZE * 0.4, CELL_SIZE * 1.0), frameMat);
            support.position.y = CELL_SIZE * 0.1;
            group.add(panel, support);
            group.position.set(building.position.x, building.position.y, building.position.z);
            group.userData = { buildingId: building.id, type: building.type };
            group.traverse(child => { if (child instanceof Mesh) child.castShadow = true; });
            return group;
        }

        case BuildingType.WATER_TREATMENT: {
            const group = new Group();
            const tankMat = new MeshStandardMaterial({ color: getBuildingColor(building.type), roughness: 0.4, metalness: 0.4 });
            const mainTank = new Mesh(new CylinderGeometry(CELL_SIZE * 0.6, CELL_SIZE * 0.6, CELL_SIZE * 1, 16), tankMat);
            mainTank.position.y = CELL_SIZE * 0.5;
            const smallTank1 = new Mesh(new CylinderGeometry(CELL_SIZE * 0.3, CELL_SIZE * 0.3, CELL_SIZE * 0.7, 12), tankMat);
            smallTank1.position.set(CELL_SIZE * 0.7, CELL_SIZE * 0.35, 0);
            const smallTank2 = new Mesh(new CylinderGeometry(CELL_SIZE * 0.25, CELL_SIZE * 0.25, CELL_SIZE * 0.5, 12), tankMat);
            smallTank2.position.set(-CELL_SIZE * 0.6, CELL_SIZE * 0.25, CELL_SIZE * 0.5);
            group.add(mainTank, smallTank1, smallTank2);
            group.position.set(building.position.x, building.position.y, building.position.z);
            group.userData = { buildingId: building.id, type: building.type };
            group.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
            return group;
        }
        
        case BuildingType.WASTE_COLLECTION: {
            const group = new Group();
            const buildingMat = new MeshStandardMaterial({ color: 0xd3d3d3 });
            const roofMat = new MeshStandardMaterial({ color: 0xaaaaaa });
            
            const mainBuilding = new Mesh(new BoxGeometry(CELL_SIZE * 1.5, CELL_SIZE * 0.6, CELL_SIZE), buildingMat);
            mainBuilding.position.y = CELL_SIZE * 0.3;
            const roof = new Mesh(new BoxGeometry(CELL_SIZE * 1.6, CELL_SIZE * 0.1, CELL_SIZE * 1.1), roofMat);
            roof.position.y = CELL_SIZE * 0.65;
            group.add(mainBuilding, roof);

            const binData = [{ color: 0x0077ff, x: -0.5 }, { color: 0x34a853, x: 0 }, { color: 0xfbbc05, x: 0.5 }];
            binData.forEach(data => {
                const bin = new Mesh(new BoxGeometry(CELL_SIZE * 0.25, CELL_SIZE * 0.3, CELL_SIZE * 0.25), new MeshStandardMaterial({ color: data.color }));
                bin.position.set(CELL_SIZE * data.x, CELL_SIZE * 0.15, CELL_SIZE * 0.7);
                group.add(bin);
            });
            group.position.set(building.position.x, building.position.y, building.position.z);
            group.userData = { buildingId: building.id, type: building.type };
            group.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
            return group;
        }

        case BuildingType.REFORESTATION_AREA: {
            const reforestGroup = new Group();
            const trunkMat = new MeshStandardMaterial({color: 0x8B4513}); 
            const foliageMat = new MeshStandardMaterial({color: 0x2E8B57}); 
            for(let i=0; i<3; i++) { 
                const trunk = new Mesh(new CylinderGeometry(CELL_SIZE*0.1, CELL_SIZE*0.1, CELL_SIZE*0.5, 8), trunkMat);
                const foliage = new Mesh(new ConeGeometry(CELL_SIZE*0.3, CELL_SIZE*0.6, 8), foliageMat); 
                foliage.position.y = CELL_SIZE*0.55 / 2 + CELL_SIZE*0.5 /2 ; 
                const tree = new Group();
                trunk.position.y = CELL_SIZE*0.5 / 2; 
                tree.add(trunk);
                tree.add(foliage);
                tree.position.set(
                    (Math.random() - 0.5) * CELL_SIZE * 0.7, 
                    0,
                    (Math.random() - 0.5) * CELL_SIZE * 0.7
                );
                tree.traverse(child => { if (child instanceof Mesh) child.castShadow = true; });
                reforestGroup.add(tree);
            }
            const baseGeometry = new BoxGeometry(CELL_SIZE * 1.8, CELL_SIZE * 0.1, CELL_SIZE * 1.8);
            const baseMesh = new Mesh(baseGeometry, new MeshBasicMaterial({ visible: false })); 
            reforestGroup.add(baseMesh); 
            reforestGroup.userData = { buildingId: building.id, type: building.type };
            reforestGroup.position.set(building.position.x, building.position.y + CELL_SIZE * 0.05, building.position.z); 
            reforestGroup.receiveShadow = true;
            return reforestGroup;
        }
        
        case BuildingType.COMMUNITY_CENTER: {
            const group = new Group();
            const wallMat = new MeshStandardMaterial({ color: getBuildingColor(building.type) });
            const roofMat = new MeshStandardMaterial({ color: 0xd2b48c });
            const body = new Mesh(new BoxGeometry(CELL_SIZE * 1.4, CELL_SIZE * 0.7, CELL_SIZE * 1.4), wallMat);
            body.position.y = CELL_SIZE * 0.35;
            const roof = new Mesh(new ConeGeometry(CELL_SIZE, CELL_SIZE * 0.5, 4, 1), roofMat);
            roof.position.y = CELL_SIZE * 0.7 + (CELL_SIZE * 0.25);
            roof.rotation.y = Math.PI / 4;
            group.add(body, roof);
            group.position.set(building.position.x, building.position.y, building.position.z);
            group.userData = { buildingId: building.id, type: building.type };
            group.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
            return group;
        }

        case BuildingType.SCHOOL: {
            const group = new Group();
            const wallMat = new MeshStandardMaterial({ color: 0xf5f5dc });
            const roofMat = new MeshStandardMaterial({ color: getBuildingColor(building.type) });
            const mainBuilding = new Mesh(new BoxGeometry(CELL_SIZE * 1.8, CELL_SIZE * 0.8, CELL_SIZE * 1.2), wallMat);
            mainBuilding.position.y = CELL_SIZE * 0.4;
            const roof = new Mesh(new BoxGeometry(CELL_SIZE * 1.9, CELL_SIZE * 0.1, CELL_SIZE * 1.3), roofMat);
            roof.position.y = CELL_SIZE * 0.85;
            group.add(mainBuilding, roof);
            group.position.set(building.position.x, building.position.y, building.position.z);
            group.userData = { buildingId: building.id, type: building.type };
            group.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
            return group;
        }
        
        case BuildingType.HEALTH_POST: {
            const group = new Group();
            const wallMat = new MeshStandardMaterial({ color: getBuildingColor(building.type) });
            const crossMat = new MeshStandardMaterial({ color: 0xff0000 });

            const bodyHeight = CELL_SIZE * 0.7;
            const body = new Mesh(new BoxGeometry(CELL_SIZE * 1.0, bodyHeight, CELL_SIZE * 1.0), wallMat);
            body.position.y = bodyHeight / 2;
            
            const crossY = bodyHeight + (CELL_SIZE * 0.1 / 2);
            
            const crossBar1 = new Mesh(new BoxGeometry(CELL_SIZE * 0.4, CELL_SIZE * 0.1, CELL_SIZE * 0.1), crossMat);
            crossBar1.position.y = crossY;
            
            const crossBar2 = new Mesh(new BoxGeometry(CELL_SIZE * 0.1, CELL_SIZE * 0.4, CELL_SIZE * 0.1), crossMat);
            crossBar2.position.y = crossY;

            group.add(body, crossBar1, crossBar2);
            group.position.set(building.position.x, building.position.y, building.position.z);
            group.userData = { buildingId: building.id, type: building.type };
            group.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
            return group;
        }

        default: {
            const geometry = new BoxGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9);
            const material = new MeshStandardMaterial({ color: getBuildingColor(building.type), flatShading: false, roughness: 0.7, metalness: 0.2 });
            const mesh = new Mesh(geometry, material);
            mesh.position.set(building.position.x, building.position.y + (geometry.parameters.height || (CELL_SIZE * 0.9)) / 2, building.position.z);
            mesh.userData = { buildingId: building.id, type: building.type };
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }
    }
  }, [getBuildingColor]);

  const createRiverData = useCallback((): { geometry: BufferGeometry; pathPoints: ThreeVector3[] } => {
    const riverWidth = CELL_SIZE * 1.5;
    const riverYPosition = 0.1; 
    const terrainEdgeZ = GRID_SIZE * CELL_SIZE * 0.75; 

    const curvePoints = [
        new ThreeVector3(-CELL_SIZE * 10, riverYPosition, -terrainEdgeZ), 
        new ThreeVector3(-CELL_SIZE * 11, riverYPosition, -GRID_SIZE * CELL_SIZE * 0.2),
        new ThreeVector3(-CELL_SIZE * 10, riverYPosition, GRID_SIZE * CELL_SIZE * 0.2),
        new ThreeVector3(-CELL_SIZE * 9, riverYPosition, terrainEdgeZ)  
    ];
    const curve = new CatmullRomCurve3(curvePoints);
    const pathPoints = curve.getPoints(50); // These are the points defining the center line of the river

    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let i = 0; i < pathPoints.length; i++) {
        const point = pathPoints[i];
        let tangent;
        if (i === 0) {
            tangent = pathPoints[1].clone().sub(pathPoints[0]).normalize();
        } else if (i === pathPoints.length - 1) {
            tangent = pathPoints[i].clone().sub(pathPoints[i-1]).normalize();
        } else {
            tangent = curve.getTangentAt(i / (pathPoints.length - 1)).normalize();
        }

        const normal = new ThreeVector3(-tangent.z, 0, tangent.x).normalize(); 

        const v1 = point.clone().add(normal.clone().multiplyScalar(riverWidth / 2));
        const v2 = point.clone().sub(normal.clone().multiplyScalar(riverWidth / 2));

        vertices.push(v1.x, v1.y, v1.z);
        vertices.push(v2.x, v2.y, v2.z);

        normals.push(0, 1, 0); 
        normals.push(0, 1, 0);

        uvs.push(i / (pathPoints.length -1), 0);
        uvs.push(i / (pathPoints.length -1), 1);
    }

    const indices = [];
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return { geometry, pathPoints };
  }, []);

  const calculateMinDistanceToRiver = useCallback((point: GameVector3, riverPoints: ThreeVector3[]): number => {
    if (!riverPoints || riverPoints.length === 0) {
        return Infinity;
    }
    let minDistanceSq = Infinity;
    for (const riverPoint of riverPoints) {
        const dx = point.x - riverPoint.x;
        const dz = point.z - riverPoint.z; // River is on XZ plane
        minDistanceSq = Math.min(minDistanceSq, dx * dx + dz * dz);
    }
    return Math.sqrt(minDistanceSq);
  }, []);

  const updateRiverAppearance = useCallback((waterQuality: number, riparianCount: number) => {
    if (!riverMeshRef.current || !(riverMeshRef.current.material instanceof MeshStandardMaterial)) {
        return;
    }
    const qualityRatio = Math.max(0, Math.min(1, waterQuality / 100)); 
    const pollutedColor = new Color(0x795548); 
    const cleanColor = new Color('#0476e0');   
    const piscinaBlue = new Color(0x4dd0e1); // A nice light blue/cyan
    const MAX_TREES_FOR_RIVER_EFFECT = 25; // Number of riparian trees for max blue effect

    // 1. Determine base color from water quality
    const baseColor = new Color().lerpColors(pollutedColor, cleanColor, qualityRatio);
    
    // 2. Determine how much to blend in the "piscina blue" based on riparian trees
    const blueEffectRatio = Math.min(1, riparianCount / MAX_TREES_FOR_RIVER_EFFECT);

    // 3. Lerp from the quality-based color to the piscina blue.
    // The effect is multiplied by 0.7 so it's a blend, not a complete override.
    const finalColor = baseColor.lerp(piscinaBlue, blueEffectRatio * 0.7);

    riverMeshRef.current.material.color.set(finalColor);
    
    // Opacity is still mainly driven by quality
    const minOpacityClean = 0.5; 
    const maxOpacityPolluted = 0.9;
    const currentOpacity = maxOpacityPolluted - (maxOpacityPolluted - minOpacityClean) * qualityRatio;
    riverMeshRef.current.material.opacity = currentOpacity;
    
    riverMeshRef.current.material.needsUpdate = true;
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    sceneRef.current = new Scene();
    sceneRef.current.background = new Color(0x87ceeb);

    cameraRef.current = new PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    // Adjusted initial camera position for "rio embaixo" view
    cameraRef.current.position.set(0, GRID_SIZE * CELL_SIZE * 0.45, GRID_SIZE * CELL_SIZE * 0.75); 
    cameraRef.current.lookAt(0, 0, -GRID_SIZE * CELL_SIZE * 0.1); // Look slightly towards the horizon beyond the river start

    rendererRef.current = new WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.shadowMap.enabled = true;
    currentMount.appendChild(rendererRef.current.domElement);

    buildingGroupRef.current = new Group();
    buildingGroupRef.current.name = BUILDING_GROUP_NAME;
    sceneRef.current.add(buildingGroupRef.current);

    // Setup InstancedMesh for Sustainable Houses
    const houseBodyGeo = new BoxGeometry(CELL_SIZE * 0.8, CELL_SIZE * 0.8, CELL_SIZE * 0.8);
    const houseBodyMat = new MeshStandardMaterial({ color: getBuildingColor(BuildingType.SUSTAINABLE_HOUSE), flatShading: false, roughness: 0.7, metalness: 0.2 });
    const houseBodyInstances = new InstancedMesh(houseBodyGeo, houseBodyMat, MAX_INSTANCES_PER_TYPE);
    houseBodyInstances.castShadow = true;
    houseBodyInstances.receiveShadow = true; 
    houseBodyInstances.name = `${BuildingType.SUSTAINABLE_HOUSE}_body_instanced`;

    const roofHeight = CELL_SIZE * 0.6;
    const roofRadius = CELL_SIZE * 0.8 * 1.15; 
    const roofGeo = new ConeGeometry(roofRadius, roofHeight, 4); 
    const roofMat = new MeshStandardMaterial({ color: 0xf08080, flatShading: false, roughness: 0.7, metalness: 0.2 }); 
    const houseRoofInstances = new InstancedMesh(roofGeo, roofMat, MAX_INSTANCES_PER_TYPE);
    houseRoofInstances.castShadow = true;
    houseRoofInstances.name = `${BuildingType.SUSTAINABLE_HOUSE}_roof_instanced`;

    buildingGroupRef.current.add(houseBodyInstances);
    buildingGroupRef.current.add(houseRoofInstances);

    instancedMeshesRef.current.set(BuildingType.SUSTAINABLE_HOUSE, {
        body: houseBodyInstances,
        roof: houseRoofInstances,
    });


    const groundGeometry = new PlaneGeometry(GRID_SIZE * CELL_SIZE * 1.5, GRID_SIZE * CELL_SIZE * 1.5);
    const groundMaterial = new MeshStandardMaterial({ color: 0x9ccc65, roughness: 1, metalness: 0 });
    groundPlaneRef.current = new Mesh(groundGeometry, groundMaterial);
    groundPlaneRef.current.rotation.x = -Math.PI / 2;
    groundPlaneRef.current.receiveShadow = true;
    sceneRef.current.add(groundPlaneRef.current);

    const gridHelperSize = GRID_SIZE * CELL_SIZE * 1.5;
    const gridHelperDivisions = GRID_SIZE * 1.5;
    gridHelperRef.current = new GridHelper(gridHelperSize, gridHelperDivisions, 0x000000, 0xbbbbbb);
    gridHelperRef.current.position.y = 0.01;
    if (gridHelperRef.current.material instanceof LineBasicMaterial) {
        gridHelperRef.current.material.transparent = true;
        gridHelperRef.current.material.opacity = 0.3;
    }
    sceneRef.current.add(gridHelperRef.current);

    const riverData = createRiverData();
    const riverGeom = riverData.geometry;
    riverPathPointsRef.current = riverData.pathPoints; // Store river path points

    const riverMat = new MeshStandardMaterial({
        color: new Color(0x64b5f6),
        transparent: true,
        opacity: 0.6,
        side: DoubleSide,
    });
    riverMeshRef.current = new Mesh(riverGeom, riverMat);
    riverMeshRef.current.name = 'river';
    sceneRef.current.add(riverMeshRef.current);

    const ambientLight = new AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambientLight);
    const directionalLight = new DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(20, 35, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -GRID_SIZE * CELL_SIZE * 0.75;
    directionalLight.shadow.camera.right = GRID_SIZE * CELL_SIZE * 0.75;
    directionalLight.shadow.camera.top = GRID_SIZE * CELL_SIZE * 0.75;
    directionalLight.shadow.camera.bottom = -GRID_SIZE * CELL_SIZE * 0.75;
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    controlsRef.current.screenSpacePanning = false;
    controlsRef.current.minDistance = CELL_SIZE * 3;
    controlsRef.current.maxDistance = GRID_SIZE * CELL_SIZE * 1.2;
    controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.05;

    const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        controlsRef.current?.update();
        rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    };
    animate();

    const handleResize = () => {
        if (cameraRef.current && rendererRef.current && currentMount) {
            cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 

    return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }
        controlsRef.current?.dispose();

        instancedMeshesRef.current.forEach((instanceGroup) => {
            Object.values(instanceGroup).forEach(instancedMesh => {
                instancedMesh.geometry?.dispose();
                if (Array.isArray(instancedMesh.material)) {
                    (instancedMesh.material as Material[]).forEach(mat => mat.dispose());
                } else if (instancedMesh.material instanceof Material) {
                    instancedMesh.material.dispose();
                }
            });
        });
        instancedMeshesRef.current.clear();
        
        sceneRef.current?.traverse(object => {
            if (object instanceof Mesh && !(object instanceof InstancedMesh)) { // Don't double-dispose InstancedMesh parts handled above
                object.geometry?.dispose();
                if (Array.isArray(object.material)) {
                    (object.material as Material[]).forEach((mat: Material) => mat.dispose());
                } else if (object.material instanceof Material) {
                    object.material.dispose();
                }
            }
        });
        if (gridHelperRef.current) gridHelperRef.current.dispose();
        rendererRef.current?.dispose();
        if (rendererRef.current?.domElement && currentMount.contains(rendererRef.current.domElement)) {
            currentMount.removeChild(rendererRef.current.domElement);
        }
        sceneRef.current = null;
        cameraRef.current = null;
        rendererRef.current = null;
        buildingGroupRef.current = null;
        groundPlaneRef.current = null;
        riverMeshRef.current = null;
        riverPathPointsRef.current = [];
        gridHelperRef.current = null;
    };
  }, [createRiverData, getBuildingColor]); // Added getBuildingColor dependency

  useEffect(() => {
    if (!mountRef.current || !cameraRef.current || !groundPlaneRef.current || !sceneRef.current) return;
    const currentMount = mountRef.current;
    const raycaster = new Raycaster();
    const mouse = new Vector2();
    const handleClick = (event: MouseEvent) => {
      if (!selectedBuildingTypeForPlacement || !groundPlaneRef.current || !cameraRef.current || !currentMount) return;
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(groundPlaneRef.current);
      if (intersects.length > 0) {
          const intersectPoint = intersects[0].point;
          const gamePosition: GameVector3 = {
            x: Math.round(intersectPoint.x / CELL_SIZE) * CELL_SIZE,
            y: 0, // Buildings are placed on y=0
            z: Math.round(intersectPoint.z / CELL_SIZE) * CELL_SIZE
          };
          const maxCoord = (INITIAL_TERRAIN_SIZE + unlockedTerrainAreas) * CELL_SIZE / 2 - CELL_SIZE / 2; 
          
          if (Math.abs(gamePosition.x) <= maxCoord && Math.abs(gamePosition.z) <= maxCoord) {
            let isRiparian = false;
            if (selectedBuildingTypeForPlacement === BuildingType.REFORESTATION_AREA) {
                const distanceToRiver = calculateMinDistanceToRiver(gamePosition, riverPathPointsRef.current);
                if (distanceToRiver <= RIVER_PROXIMITY_THRESHOLD) {
                    isRiparian = true;
                    console.log(`Reforestation area is riparian. Distance: ${distanceToRiver.toFixed(2)}`);
                }
            }
            onPlaceBuilding(gamePosition, selectedBuildingTypeForPlacement, isRiparian);
          } else {
            console.log("Cannot build outside allowed terrain area.");
          }
      }
    };
    currentMount.addEventListener('click', handleClick);
    return () => {
      currentMount.removeEventListener('click', handleClick);
    };
  }, [onPlaceBuilding, selectedBuildingTypeForPlacement, unlockedTerrainAreas, cameraRef, groundPlaneRef, mountRef, sceneRef, calculateMinDistanceToRiver]);


  useEffect(() => {
    const buildingContainer = sceneRef.current?.getObjectByName(BUILDING_GROUP_NAME) as Group | undefined;
    if (!buildingContainer || !sceneRef.current) return;

    const dummy = dummyObjectRef.current;

    // Handle Instanced Sustainable Houses
    const sustainableHouses = placedBuildings.filter(b => b.type === BuildingType.SUSTAINABLE_HOUSE);
    const houseInstancesMap = instancedMeshesRef.current.get(BuildingType.SUSTAINABLE_HOUSE);

    if (houseInstancesMap) {
        const { body: bodyInstances, roof: roofInstances } = houseInstancesMap;
        let houseInstanceIdx = 0;
        sustainableHouses.forEach(building => {
            if (houseInstanceIdx < MAX_INSTANCES_PER_TYPE) {
                // Body
                const bodyHeight = CELL_SIZE * 0.8;
                dummy.position.set(building.position.x, building.position.y + bodyHeight / 2, building.position.z);
                dummy.rotation.set(0, 0, 0); 
                dummy.scale.set(1, 1, 1); 
                dummy.updateMatrix();
                bodyInstances.setMatrixAt(houseInstanceIdx, dummy.matrix);

                // Roof
                const roofRotationY = Math.PI / 4;
                dummy.position.set(building.position.x, building.position.y + bodyHeight, building.position.z);
                dummy.rotation.set(0, roofRotationY, 0);
                dummy.updateMatrix();
                roofInstances.setMatrixAt(houseInstanceIdx, dummy.matrix);
                
                houseInstanceIdx++;
            }
        });
        bodyInstances.count = houseInstanceIdx;
        bodyInstances.instanceMatrix.needsUpdate = true;
        roofInstances.count = houseInstanceIdx;
        roofInstances.instanceMatrix.needsUpdate = true;
    }

    // Handle Non-Instanced Buildings
    const nonInstancedBuildings = placedBuildings.filter(b => b.type !== BuildingType.SUSTAINABLE_HOUSE);
    const existingNonInstancedMeshIds = new Set<string>();
    
    buildingContainer.children.forEach(child => {
        let isChildAnInstancedMesh = false;
        instancedMeshesRef.current.forEach(instanceGroup => {
            if (Object.values(instanceGroup).includes(child as InstancedMesh)) {
                isChildAnInstancedMesh = true;
            }
        });
        if (!isChildAnInstancedMesh && child.userData.buildingId) {
            existingNonInstancedMeshIds.add(child.userData.buildingId);
        }
    });

    nonInstancedBuildings.forEach(building => {
        if (!existingNonInstancedMeshIds.has(building.id)) {
            const mesh = createBuildingMesh(building); 
            if (mesh) { 
                buildingContainer.add(mesh);
            }
        }
    });

    const placedNonInstancedBuildingIds = new Set(nonInstancedBuildings.map(b => b.id));
    const meshesToRemove: Object3D[] = [];
    buildingContainer.children.forEach(child => {
        let isChildAnInstancedMesh = false;
        instancedMeshesRef.current.forEach(instanceGroup => {
            if (Object.values(instanceGroup).includes(child as InstancedMesh)) {
                isChildAnInstancedMesh = true;
            }
        });
        if (!isChildAnInstancedMesh && child.userData.buildingId && !placedNonInstancedBuildingIds.has(child.userData.buildingId)) {
            meshesToRemove.push(child);
        }
    });

    meshesToRemove.forEach(meshToRemove => {
        meshToRemove.traverse(subChild => {
            if (subChild instanceof Mesh) {
                subChild.geometry?.dispose();
                if (Array.isArray(subChild.material)) {
                    (subChild.material as Material[]).forEach(mat => mat.dispose());
                } else if (subChild.material instanceof Material) {
                    subChild.material.dispose();
                }
            }
        });
        buildingContainer.remove(meshToRemove);
    });
  }, [placedBuildings, createBuildingMesh, sceneRef]); 

  useEffect(() => {
    updateRiverAppearance(indicators.waterQuality, riparianReforestationCount);
  }, [indicators.waterQuality, riparianReforestationCount, updateRiverAppearance]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeScene;