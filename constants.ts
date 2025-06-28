import { BuildingType, IndicatorLevels, Building, Challenge, GameState } from './types';

export const GRID_SIZE = 20; // Logical grid units for placement (total potential grid)
export const CELL_SIZE = 2; // Size of each cell in 3D world units
export const INITIAL_TERRAIN_SIZE = GRID_SIZE * 1.5; // Initial buildable area in grid units (30x30 cells)
export const POPULATION_PER_HOUSE = 4; // Number of people per sustainable house

export const RIVER_PROXIMITY_THRESHOLD = CELL_SIZE * 3; // Max distance from river for riparian bonus
export const RIPARIAN_REFORESTATION_WATER_BONUS = 4; // Extra water quality points for riparian reforestation

// Constants for population impact
export const POPULATION_IMPACT_AIR_QUALITY_PER_PERSON = -0.4;
export const POPULATION_IMPACT_WATER_QUALITY_PER_PERSON = -0.4;
export const POPULATION_IMPACT_BIODIVERSITY_PER_PERSON = -0.35;
export const POPULATION_CONSUMPTION_FOOD_PER_PERSON = -0.45;
export const POPULATION_HAPPINESS_DRAG_THRESHOLD = 15;
export const POPULATION_HAPPINESS_DRAG_PER_PERSON_OVER_THRESHOLD = -0.2;


// Happiness penalties for low critical indicators
export const LOW_AIR_QUALITY_HAPPINESS_THRESHOLD = 40; // Also used as a general "low" threshold for sustained effects
export const LOW_AIR_QUALITY_HAPPINESS_PENALTY = -10;
export const LOW_WATER_QUALITY_HAPPINESS_THRESHOLD = 40; // Also used as a general "low" threshold for sustained effects
export const LOW_WATER_QUALITY_HAPPINESS_PENALTY = -10;
export const LOW_FOOD_SUPPLY_HAPPINESS_THRESHOLD = 30;
export const LOW_FOOD_SUPPLY_HAPPINESS_PENALTY = -15;

// Infrastructure Rules
export const HOUSES_PER_SCHOOL = 10;
export const HOUSES_PER_HEALTH_POST = 10;
export const HOUSES_PER_WATER_TREATMENT = 20;
export const HOUSES_PER_WASTE_COLLECTION = 15;

// Penalties for Infrastructure Deficit
export const INFRASTRUCTURE_DEFICIT_HAPPINESS_PENALTY_PER_UNIT = -8;
export const WATER_TREATMENT_DEFICIT_WATER_QUALITY_PENALTY_PER_UNIT = -10;
export const WASTE_COLLECTION_DEFICIT_AIR_QUALITY_PENALTY_PER_UNIT = -7;
export const WASTE_COLLECTION_DEFICIT_WATER_QUALITY_PENALTY_PER_UNIT = -7;
export const WASTE_COLLECTION_DEFICIT_HAPPINESS_PENALTY_PER_UNIT = -5;
export const WASTE_COLLECTION_DEFICIT_BIODIVERSITY_PENALTY_PER_UNIT = -4;

// Time-based environmental inertia constants
export const SUSTAINED_CONDITION_MONTH_THRESHOLD = 3; // Number of consecutive months for effect to trigger
export const SUSTAINED_LOW_AIR_QUALITY_ADDITIONAL_PENALTY = -3; // Applied to air quality itself
export const SUSTAINED_LOW_AIR_QUALITY_BIODIVERSITY_PENALTY = -2; // Applied to biodiversity
export const SUSTAINED_LOW_WATER_QUALITY_ADDITIONAL_PENALTY = -3; // Applied to water quality itself
export const SUSTAINED_LOW_WATER_QUALITY_BIODIVERSITY_PENALTY = -2; // Applied to biodiversity

export const SUSTAINED_HIGH_QUALITY_MONTH_THRESHOLD = 4; // Longer for positive effects
export const SUSTAINED_HIGH_AIR_QUALITY_LEVEL_FOR_BONUS = 75;
export const SUSTAINED_HIGH_WATER_QUALITY_LEVEL_FOR_BONUS = 75;
export const SUSTAINED_HIGH_AIR_QUALITY_BIODIVERSITY_BONUS = +1;
export const SUSTAINED_HIGH_WATER_QUALITY_BIODIVERSITY_BONUS = +1;

export const MONTH_DURATION_MS = 7000; // 7 segundos por mês

// Reforestation Milestone Bonuses
export const REFORESTATION_MILESTONE_COUNT = 20;
export const REFORESTATION_MAJOR_BONUS_AIR_QUALITY = 15;
export const REFORESTATION_MAJOR_BONUS_WATER_QUALITY = 10;
export const REFORESTATION_MAJOR_BONUS_HAPPINESS = 8;
export const REFORESTATION_MAJOR_BONUS_BIODIVERSITY = 12;

export const REFORESTATION_RECURRING_INTERVAL = 5;
export const REFORESTATION_RECURRING_BONUS_AIR_QUALITY = 3;
export const REFORESTATION_RECURRING_BONUS_WATER_QUALITY = 2;
export const REFORESTATION_RECURRING_BONUS_BIODIVERSITY = 4;
export const REFORESTATION_RECURRING_BONUS_HAPPINESS = 2;


export const BUILDING_DEFINITIONS: Record<BuildingType, Omit<Building, 'id' | 'position'>> = {
  [BuildingType.SUSTAINABLE_HOUSE]: {
    type: BuildingType.SUSTAINABLE_HOUSE,
    name: 'Casa Sustentável',
    description: 'Moradia ecológica que minimiza o impacto ambiental e promove o bem-estar.',
    effects: { communityHappiness: 2, energy: -4 },
  },
  [BuildingType.COMMUNITY_GARDEN]: {
    type: BuildingType.COMMUNITY_GARDEN,
    name: 'Horta Comunitária',
    description: 'Produz alimentos frescos localmente, fortalece laços comunitários e melhora a biodiversidade.',
    effects: { food: 10, communityHappiness: 3, biodiversity: 2, waterQuality: 1 },
  },
  [BuildingType.SOLAR_PANEL_ARRAY]: {
    type: BuildingType.SOLAR_PANEL_ARRAY,
    name: 'Conjunto de Painéis Solares',
    description: 'Gera energia limpa a partir do sol, reduzindo a poluição do ar.',
    effects: { energy: 15, airQuality: 2 },
  },
  [BuildingType.WATER_TREATMENT]: {
    type: BuildingType.WATER_TREATMENT,
    name: 'Estação de Tratamento de Água',
    description: 'Purifica a água, tornando-a segura para reuso e protegendo os ecossistemas aquáticos.',
    effects: { waterQuality: 20, energy: -2 },
  },
  [BuildingType.WASTE_COLLECTION]: {
    type: BuildingType.WASTE_COLLECTION,
    name: 'Centro de Coleta Seletiva',
    description: 'Gerencia resíduos de forma eficaz, promovendo reciclagem e compostagem.',
    effects: { airQuality: 4, waterQuality: 4, communityHappiness: 2, energy: -2 },
  },
  [BuildingType.REFORESTATION_AREA]: {
    type: BuildingType.REFORESTATION_AREA,
    name: 'Área de Reflorestamento',
    description: 'Planta árvores nativas para aumentar a biodiversidade, melhorar a qualidade do ar e criar espaços verdes. Se plantada perto do rio, ajuda a proteger a mata ciliar e melhora ainda mais a água. Atingir 20 áreas concede um grande bônus único, e bônus adicionais a cada 5 áreas subsequentes!',
    effects: { biodiversity: 18, airQuality: 7, communityHappiness: 3, waterQuality: 5 },
  },
  [BuildingType.COMMUNITY_CENTER]: {
    type: BuildingType.COMMUNITY_CENTER,
    name: 'Centro Comunitário',
    description: 'Espaço para encontros, aprendizado e cultura, fortalecendo a coesão social.',
    effects: { communityHappiness: 10, energy: -1 },
  },
  [BuildingType.SCHOOL]: {
    type: BuildingType.SCHOOL,
    name: 'Escola',
    description: 'Promove educação e desenvolvimento, aumentando o conhecimento e a felicidade geral.',
    effects: { communityHappiness: 8, energy: -2 },
  },
  [BuildingType.HEALTH_POST]: {
    type: BuildingType.HEALTH_POST,
    name: 'Posto de Saúde',
    description: 'Oferece cuidados básicos de saúde, melhorando o bem-estar e a felicidade da população.',
    effects: { communityHappiness: 10, energy: -2 },
  },
};

export const INITIAL_INDICATORS: IndicatorLevels = {
  airQuality: 70,
  waterQuality: 70,
  communityHappiness: 60,
  biodiversity: 50,
  energyBalance: 0,
  foodSupply: 30,
  population: 0,
};

export const MAX_POSITIVE_HAPPINESS_BONUS_FROM_BUILDINGS = 50;
export const MAX_POSITIVE_AIR_QUALITY_BONUS_FROM_BUILDINGS = 50;
export const MAX_POSITIVE_WATER_QUALITY_BONUS_FROM_BUILDINGS = 60;
export const MAX_POSITIVE_BIODIVERSITY_BONUS_FROM_BUILDINGS = 40;


export const INITIAL_AVAILABLE_BUILDINGS: BuildingType[] = [
  BuildingType.SUSTAINABLE_HOUSE,
  BuildingType.COMMUNITY_GARDEN,
  BuildingType.SOLAR_PANEL_ARRAY,
];

export const MAX_INDICATOR_VALUE = 100;
export const MIN_INDICATOR_VALUE = 0;

export const TERRAIN_UNLOCK_THRESHOLD = 2;

export interface PedagogicalInfo {
  title: string;
  explanation: string;
  howToImprove: string;
  relevantPositiveBuildings: BuildingType[];
  whatWorsens?: string;
  relevantNegativeBuildings?: BuildingType[];
  timeFactor?: string; // New field for time-related info
}

export const INDICATOR_PEDAGOGICAL_INFO: Record<keyof IndicatorLevels, PedagogicalInfo> = {
  airQuality: {
    title: 'Qualidade do Ar',
    explanation: 'Representa a pureza do ar na vila. Ar limpo é crucial para a saúde dos habitantes e do ecossistema. Poluição industrial, queima de combustíveis fósseis e má gestão de resíduos pioram a qualidade do ar.',
    howToImprove: 'Invista em áreas de reflorestamento, fontes de energia limpa como painéis solares e implemente Centros de Coleta Seletiva. Evite construções altamente poluentes ou compense-as.',
    relevantPositiveBuildings: [BuildingType.REFORESTATION_AREA, BuildingType.SOLAR_PANEL_ARRAY, BuildingType.WASTE_COLLECTION],
    whatWorsens: 'O aumento da população sem infraestrutura adequada, como coleta de lixo, e o consumo de energia de fontes poluentes podem piorar a qualidade do ar. A falta de Centros de Coleta Seletiva em proporção à população é um grande fator negativo.',
    relevantNegativeBuildings: [],
    timeFactor: 'Manter a qualidade do ar baixa por vários meses consecutivos pode degradar ainda mais o ambiente e dificultar a recuperação. Por outro lado, ar consistentemente limpo pode beneficiar a biodiversidade a longo prazo.'
  },
  waterQuality: {
    title: 'Qualidade da Água',
    explanation: 'Indica a limpeza dos corpos d\'água da vila. Água pura é vital para o consumo, agricultura e vida aquática. Despejo de resíduos, falta de saneamento e má gestão do lixo contaminam a água. O reflorestamento nas margens dos rios (mata ciliar) é essencial para proteger a água.',
    howToImprove: 'Construa Estações de Tratamento de Água, Centros de Coleta Seletiva e promova o reflorestamento ripário (próximo aos rios). Hortas comunitárias bem manejadas também podem ajudar a filtrar a água superficial.',
    relevantPositiveBuildings: [BuildingType.WATER_TREATMENT, BuildingType.COMMUNITY_GARDEN, BuildingType.REFORESTATION_AREA, BuildingType.WASTE_COLLECTION],
    whatWorsens: 'Crescimento populacional sem tratamento de esgoto e coleta de lixo adequados, descarte incorreto de resíduos próximo a rios e a falta de mata ciliar. A ausência de Estações de Tratamento de Água e Centros de Coleta Seletiva em proporção à população agrava o problema.',
    relevantNegativeBuildings: [],
    timeFactor: 'A poluição contínua da água por vários meses pode levar a danos ecológicos graves e impactar negativamente a biodiversidade. Sustentar alta qualidade da água beneficia o ecossistema a longo prazo.'
  },
  communityHappiness: {
    title: 'Felicidade da Comunidade',
    explanation: 'Mede o contentamento e bem-estar geral dos habitantes. Fatores como moradia de qualidade, acesso a alimentos, lazer, cultura, educação, saúde e um ambiente saudável contribuem para a felicidade. Problemas ambientais graves, superlotação ou falta de serviços básicos podem diminuir drasticamente a felicidade.',
    howToImprove: 'Construa Casas Sustentáveis, Centros Comunitários, Hortas, Escolas, Postos de Saúde e Centros de Coleta Seletiva. Promova a biodiversidade. Garanta que as necessidades básicas como energia, alimentos, ar e água limpos estejam supridas.',
    relevantPositiveBuildings: [BuildingType.SUSTAINABLE_HOUSE, BuildingType.COMMUNITY_CENTER, BuildingType.COMMUNITY_GARDEN, BuildingType.REFORESTATION_AREA, BuildingType.SCHOOL, BuildingType.HEALTH_POST, BuildingType.WATER_TREATMENT, BuildingType.WASTE_COLLECTION],
    whatWorsens: 'Falta de moradia, escassez de alimentos, poluição excessiva (ar e água), falta de acesso à educação, saúde e coleta de lixo, falta de espaços de convivência e superlotação sem infraestrutura de suporte.',
    relevantNegativeBuildings: [],
    timeFactor: 'Condições ambientais ou sociais negativas persistentes ao longo dos meses podem corroer a felicidade da comunidade. Melhorias sustentadas tendem a aumentar a felicidade gradualmente.'
  },
  biodiversity: {
    title: 'Biodiversidade',
    explanation: 'Reflete a variedade de vida (plantas e animais) na vila. Ecossistemas ricos em biodiversidade são mais resilientes e saudáveis. Desmatamento, poluição e má gestão de resíduos reduzem a biodiversidade.',
    howToImprove: 'Crie Áreas de Reflorestamento, mantenha Hortas Comunitárias, implemente Centros de Coleta Seletiva e garanta a qualidade da água e do ar. Evite expansão descontrolada sobre áreas verdes.',
    relevantPositiveBuildings: [BuildingType.REFORESTATION_AREA, BuildingType.COMMUNITY_GARDEN, BuildingType.WASTE_COLLECTION],
    whatWorsens: 'Remoção de vegetação nativa para construção sem planejamento, poluição, crescimento populacional desordenado em áreas naturais e especialmente a falta de gerenciamento de resíduos (lixo) que contamina habitats.',
    relevantNegativeBuildings: [BuildingType.SUSTAINABLE_HOUSE], // Indireto, pela ocupação de espaço
    timeFactor: 'A degradação ambiental contínua (baixa qualidade do ar/água por meses) afeta negativamente a biodiversidade. Esforços de conservação e manutenção de um ambiente limpo por longos períodos promovem o florescimento da vida selvagem.'
  },
  energyBalance: {
    title: 'Balanço de Energia',
    explanation: 'Mostra a diferença entre a energia gerada e consumida na vila. Um balanço positivo com fontes renováveis é ideal. Dependência de fontes não renováveis ou consumo excessivo podem ser problemáticos.',
    howToImprove: 'Instale Conjuntos de Painéis Solares e outras fontes de energia renovável. Promova a eficiência energética nas construções.',
    relevantPositiveBuildings: [BuildingType.SOLAR_PANEL_ARRAY],
    whatWorsens: 'Muitas construções que consomem energia sem geração correspondente. Cada casa consome energia.',
    relevantNegativeBuildings: [BuildingType.SUSTAINABLE_HOUSE, BuildingType.WATER_TREATMENT, BuildingType.WASTE_COLLECTION, BuildingType.COMMUNITY_CENTER, BuildingType.SCHOOL, BuildingType.HEALTH_POST],
    timeFactor: 'O balanço de energia é calculado mensalmente. Um déficit energético prolongado pode levar à necessidade de mais construções de geração ou à infelicidade se os serviços forem afetados.'
  },
  foodSupply: {
    title: 'Suprimento de Alimentos',
    explanation: 'Indica a capacidade da vila de produzir alimentos para seus habitantes. Segurança alimentar é fundamental para o bem-estar da comunidade.',
    howToImprove: 'Desenvolva Hortas Comunitárias. A diversificação da produção local é benéfica.',
    relevantPositiveBuildings: [BuildingType.COMMUNITY_GARDEN],
    whatWorsens: 'População crescente sem aumento na produção de alimentos. Cada habitante consome alimentos mensalmente.',
    relevantNegativeBuildings: [],
    timeFactor: 'O suprimento de alimentos é verificado mensalmente contra o consumo da população. A escassez prolongada causa grande infelicidade.'
  },
  population: {
    title: 'População',
    explanation: 'O número total de habitantes na sua vila. O crescimento populacional traz novos desafios e oportunidades para o desenvolvimento sustentável. Cada casa adiciona 4 habitantes.',
    howToImprove: 'A população aumenta com a construção de Casas Sustentáveis. Gerencie o crescimento para não sobrecarregar os recursos e a infraestrutura ao longo dos meses.',
    relevantPositiveBuildings: [BuildingType.SUSTAINABLE_HOUSE],
    whatWorsens: 'Não aplicável diretamente, mas o crescimento descontrolado pode impactar negativamente outros indicadores se não for acompanhado de infraestrutura sustentável. A população consome recursos e impacta o ambiente mensalmente.',
    relevantNegativeBuildings: []
  }
};
