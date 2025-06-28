

export enum BuildingType {
  SUSTAINABLE_HOUSE = 'Casa Sustentável',
  COMMUNITY_GARDEN = 'Horta Comunitária',
  SOLAR_PANEL_ARRAY = 'Conjunto de Painéis Solares',
  WATER_TREATMENT = 'Estação de Tratamento de Água',
  WASTE_COLLECTION = 'Centro de Coleta Seletiva',
  REFORESTATION_AREA = 'Área de Reflorestamento',
  COMMUNITY_CENTER = 'Centro Comunitário',
  SCHOOL = 'Escola',
  HEALTH_POST = 'Posto de Saúde',
}

export interface Building {
  id: string;
  type: BuildingType;
  position: { x: number; y: number; z: number };
  name: string;
  description: string;
  effects: {
    airQuality?: number;
    waterQuality?: number;
    communityHappiness?: number;
    biodiversity?: number;
    energy?: number; // positive if generates, negative if consumes
    food?: number; // positive if generates
  };
}

export interface IndicatorLevels {
  airQuality: number; // 0-100, higher is better
  waterQuality: number; // 0-100, higher is better
  communityHappiness: number; // 0-100, higher is better
  biodiversity: number; // 0-100, higher is better
  energyBalance: number; // Can be negative
  foodSupply: number; // 0-100
  population: number; // Total estimated population
}

export interface PlacedBuilding extends Building {
  meshUuid?: string; // To link to Three.js mesh
  isRiparian?: boolean;
}

export interface HistoricDataPoint {
  turn: number;
  indicators: IndicatorLevels;
}

export interface GameState {
  placedBuildings: PlacedBuilding[];
  indicators: IndicatorLevels;
  availableBuildings: BuildingType[];
  selectedBuildingForInfo: PlacedBuilding | null;
  currentChallenge: Challenge | null;
  unlockedTerrainAreas: number; // Number of unlocked areas
  history: HistoricDataPoint[];
  currentTurn: number;
  completedChallengeIds: string[];
  majorReforestationMilestoneReached: boolean; // Flag for one-time major reforestation bonus
}

export interface Challenge {
  id:string;
  title: string;
  description: string;
  goal: (gameState: GameState) => boolean; // Function to check if challenge is met
  reward: string; // Textual description of reward or outcome
  // 'triggered' foi removido daqui
}

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}