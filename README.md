
# Vila Verde - O Amanhã no Interior: Documentação do Jogo

## 1. Visão Geral do Jogo (ainda em desenvolvimento)

"Vila Verde" é um jogo pedagógico de construção de cidade do interior em 3D, onde o jogador assume o papel de um "Pioneiro da Sustentabilidade". O objetivo principal não é a competição, mas sim o aprendizado e a experimentação na criação de uma comunidade próspera e ecologicamente equilibrada. Não há pontuação competitiva, mas sim indicadores visuais e textuais que refletem o progresso e o bem-estar da vila.

### Estilo Visual

*   **Minimalista e Aconchegante**: Modelos 3D simples (estilo "low poly" ou "maquete"), cores suaves e claras, transmitindo tranquilidade e um ambiente saudável.
*   **Visão Isométrica/Top-down Rotacionável**: O jogador pode girar a câmera para apreciar a vila de diferentes ângulos.

### Mecânicas Centrais (Simplificadas)

*   **Terreno Limitado e Evolutivo**:
    *   Começa com um pequeno terreno rural.
    *   Novas áreas são desbloqueadas com o crescimento sustentável da vila.
*   **Construção Consciente**:
    *   Edifícios iniciais básicos (Casa Sustentável, Horta Comunitária).
    *   Novos edifícios são desbloqueados por necessidade da comunidade e progresso sustentável, não por "dinheiro".
*   **Tipos de Construções**:
    *   **Moradias**: Casas ecológicas.
    *   **Alimentação**: Hortas comunitárias, pomares.
    *   **Energia**: Painéis solares, pequenas turbinas eólicas.
    *   **Água**: Cisternas, estações de tratamento biológicas.
    *   **Resíduos**: Pontos de coleta seletiva, centros de compostagem.
    *   **Educação/Cultura**: Escola rural, biblioteca comunitária.
    *   **Lazer**: Praças, trilhas ecológicas.
    *   **Transporte**: Ciclovias (sem carros nesta fase).
*   **Feedback Visual**: Edifícios "felizes" (bem supridos) ou "infelizes" (com problemas) apresentam detalhes visuais sutis.
*   **Indicadores de Equilíbrio (Visuais)**:
    *   **Qualidade do Ar**: Clareza do céu, brilho do sol.
    *   **Qualidade da Água**: Cor do rio/lago (azul/transparente = limpo; opaco/verde = poluído).
    *   **Felicidade da Comunidade**: "Auras" ou "emojis" sobre as casas.
    *   **Biodiversidade**: Número de árvores, flores, pequenos animais.
*   **Recursos (Simplificado)**: Foco na disponibilidade (ex: horta garante "comida suficiente"). Notificações simples para escassez.
*   **Interação Simplificada**:
    *   Clique para construir.
    *   Clique em edifícios para informações pedagógicas.
*   **Sem "Dinheiro"**: Progresso guiado por decisões e equilíbrio, talvez "créditos de sustentabilidade".
*   **Ciclo Dia/Noite**: Opcional, para ambientação.

### Fluxo do Jogo (Experiência Pedagógica)

1.  **Início**: Apresentação do terreno e do conceito.
2.  **Primeiras Construções**: Sugestão de construções essenciais.
3.  **Feedback Instantâneo**: Indicadores visuais respondem às construções.
4.  **Desafios Guiados**: Problemas simples para resolver com soluções sustentáveis.
5.  **Informações e Dicas**: Pop-ups explicam conceitos sustentáveis.
6.  **Progressão Pedagógica**: O objetivo é uma vila equilibrada com indicadores positivos.

## 2. Estrutura do Código

O projeto é construído usando React com TypeScript para a interface do usuário e lógica de jogo, e Three.js para a renderização da cena 3D. Tailwind CSS é utilizado para estilização rápida.

### Arquivos Principais

*   **`index.html`**:
    *   Ponto de entrada da aplicação web.
    *   Configura o viewport, título e inclui o Tailwind CSS via CDN.
    *   Define um `div#root` onde a aplicação React será montada.
    *   Utiliza um `importmap` para gerenciar as dependências de módulos JavaScript (React, Three.js).
    *   Carrega o `index.tsx` como um módulo ES6.

*   **`index.tsx`**:
    *   Ponto de entrada da aplicação React.
    *   Utiliza `ReactDOM.createRoot` para renderizar o componente principal `App` no `div#root`.
    *   Envolve o `App` em `<React.StrictMode>` para verificações e avisos adicionais em desenvolvimento.

*   **`metadata.json`**:
    *   Contém metadados sobre a aplicação, como nome, descrição e permissões necessárias (atualmente nenhuma).

*   **`types.ts`**:
    *   Define todas as interfaces e enumerações TypeScript usadas no jogo. Isso inclui:
        *   `BuildingType`: Enumeração dos tipos de edifícios.
        *   `Building`: Interface base para definição de edifícios.
        *   `PlacedBuilding`: Interface para edifícios colocados no mapa (com ID e posição).
        *   `IndicatorLevels`: Interface para os níveis dos indicadores de sustentabilidade.
        *   `GameState`: Interface que representa o estado completo do jogo.
        *   `Challenge`: Interface para os desafios propostos ao jogador.
        *   `Vector3`: Interface simples para coordenadas 3D.

*   **`constants.ts`**:
    *   Armazena constantes globais do jogo, como:
        *   `GRID_SIZE`, `CELL_SIZE`: Dimensões para o grid de construção.
        *   `INITIAL_TERRAIN_SIZE`: Tamanho inicial do terreno.
        *   `BUILDING_DEFINITIONS`: Um record com as definições de cada `BuildingType` (nome, descrição, efeitos nos indicadores).
        *   `INITIAL_INDICATORS`: Valores iniciais para os indicadores de sustentabilidade.
        *   `INITIAL_AVAILABLE_BUILDINGS`: Lista dos edifícios disponíveis no início do jogo.
        *   `CHALLENGES`: Array com as definições dos desafios.
        *   `MAX_INDICATOR_VALUE`, `MIN_INDICATOR_VALUE`: Limites para os valores dos indicadores.
        *   `TERRAIN_UNLOCK_THRESHOLD`: Condição para desbloquear novas áreas de terreno.

*   **`components/ThreeScene.tsx`**:
    *   Componente React responsável por toda a renderização da cena 3D usando Three.js.
    *   Gerencia a `Scene`, `Camera`, `Renderer`, luzes (`AmbientLight`, `DirectionalLight`).
    *   Renderiza o terreno (`groundPlaneRef`) e a água (`waterPlaneRef`).
    *   Cria e posiciona meshes 3D para cada `PlacedBuilding`. As geometrias e materiais são definidos aqui (atualmente formas simples como `BoxGeometry`, `CylinderGeometry`). Áreas de reflorestamento usam um `Group` com múltiplos "sub-meshes".
    *   Implementa `OrbitControls` para permitir a rotação e zoom da câmera.
    *   Lida com cliques no canvas para:
        *   Selecionar um edifício existente para mostrar informações (chamando `onSelectBuildingForInfo`).
        *   Colocar um novo edifício no terreno (chamando `onPlaceBuilding`) se um `selectedBuildingTypeForPlacement` estiver ativo.
    *   Atualiza visualmente a cena com base nas props recebidas (ex: cor do céu e da água mudam com `indicators.airQuality` e `indicators.waterQuality`).
    *   Gerencia a limpeza de recursos do Three.js ao desmontar o componente.

*   **`App.tsx`**:
    *   Componente React principal que orquestra todo o jogo.
    *   Gerencia o `gameState` (edifícios colocados, indicadores, edifícios disponíveis, desafios, etc.).
    *   **Lógica de Jogo**:
        *   `handlePlaceBuilding`: Adiciona um novo edifício ao estado, verifica condições (ex: energia suficiente).
        *   `calculateIndicators`: Recalcula os indicadores de sustentabilidade com base nos edifícios construídos.
        *   `updateGameState`: Função central que atualiza o estado do jogo, incluindo indicadores, desbloqueio de novos edifícios e expansão de terreno.
        *   Gerenciamento de desafios: Verifica se as condições para iniciar um novo desafio são atendidas e se o objetivo de um desafio ativo foi alcançado.
    *   **Interface do Usuário (UI)**:
        *   Renderiza os indicadores de sustentabilidade (`IndicatorDisplay`).
        *   Apresenta o menu de construção com os `availableBuildings`.
        *   Mostra pop-ups informativos para edifícios selecionados.
        *   Exibe modais para desafios ativos e mensagens de boas-vindas.
        *   Implementa um banner "Modo Construção" quando um tipo de edifício é selecionado para colocação.
        *   Inclui um botão para alternar entre os temas claro (light) e escuro (dark) para a UI.
    *   Passa os dados necessários e callbacks para o componente `ThreeScene`.

### Fluxo de Dados e Interação

1.  **Inicialização**:
    *   `index.html` carrega `index.tsx`.
    *   `index.tsx` renderiza `App.tsx`.
    *   `App.tsx` inicializa o `gameState` com valores de `constants.ts` e renderiza a UI básica e o componente `ThreeScene.tsx`.
    *   O tema (claro/escuro) é carregado do `localStorage` ou definido com base nas preferências do sistema.

2.  **Interação do Jogador (Construção)**:
    *   O jogador clica em um botão de edifício no menu de construção (em `App.tsx`).
    *   `App.tsx` atualiza `selectedBuildingTypeForPlacement`.
    *   O jogador clica em uma célula válida no terreno 3D (`ThreeScene.tsx`).
    *   `ThreeScene.tsx` detecta o clique, calcula a posição no grid e chama o callback `onPlaceBuilding` (passado por `App.tsx`) com a posição e o tipo do edifício.
    *   `App.tsx` (`handlePlaceBuilding`) cria o novo `PlacedBuilding`, atualiza o `gameState.placedBuildings`, recalcula os indicadores (`calculateIndicators`), e atualiza outros aspectos do estado (`updateGameState`).
    *   O `gameState` atualizado é passado como prop para `ThreeScene.tsx`, que re-renderiza a cena 3D com o novo edifício e os indicadores visuais atualizados (cor do céu/água).

3.  **Interação do Jogador (Informações)**:
    *   O jogador clica em um edifício existente na cena 3D (`ThreeScene.tsx`).
    *   `ThreeScene.tsx` identifica o edifício clicado e chama `onSelectBuildingForInfo` (passado por `App.tsx`).
    *   `App.tsx` atualiza `gameState.selectedBuildingForInfo`, o que faz com que o pop-up de informações do edifício seja exibido.

4.  **Atualização de Estado e UI**:
    *   Qualquer mudança no `gameState` (ex: novos edifícios, indicadores alterados, desafios) causa uma re-renderização de `App.tsx` e, consequentemente, da UI e do `ThreeScene` (se as props relevantes mudarem).
    *   A lógica de desbloqueio de edifícios, expansão de terreno e ativação/conclusão de desafios reside em `App.tsx` e é acionada por mudanças no `gameState`.

5.  **Gerenciamento de Tema (Dark/Light Mode)**:
    *   Um estado `theme` em `App.tsx` controla o tema atual.
    *   Um `useEffect` em `App.tsx` adiciona/remove a classe `dark` do elemento `<html>` e salva a preferência no `localStorage`.
    *   Os componentes da UI usam classes condicionais do Tailwind CSS (ex: `dark:bg-gray-800`) para estilização.

Este fluxo de dados unidirecional (principalmente de `App.tsx` para `ThreeScene.tsx` para renderização, e callbacks de `ThreeScene.tsx` para `App.tsx` para ações) é típico de aplicações React e ajuda a manter a lógica organizada.
