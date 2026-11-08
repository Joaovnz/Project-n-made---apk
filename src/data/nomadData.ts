/**
 * Project NOMAD (Node for Offline Media, Archives, and Data)
 * Curated authentic datasets ported from Crosstalk Solutions repository.
 */

import conditionsRaw from './conditions.json' with { type: 'json' };
import naturalRemediesRaw from './natural_remedies.json' with { type: 'json' };
import homeRemediesRaw from './home_remedies.json' with { type: 'json' };
import mapsRaw from './maps.json' with { type: 'json' };

export interface NomadCondition {
  slug: string;
  label: string;
  category: string;
  searchTerms: string[];
}

export interface NomadNaturalRemedy {
  slug: string;
  name: string;
  commonNames?: string[];
  conditions: string[];
  uses: string;
  how: string;
  evidence: string;
  cautions: string;
  sourceUrl?: string;
}

export interface NomadHomeRemedy {
  slug: string;
  name: string;
  conditions: string[];
  preparation?: string;
  how?: string;
  evidence?: string;
  cautions?: string;
  sourceUrl?: string;
}

export interface NomadMapRegion {
  id: string;
  name: string;
  sizeBytes?: number;
  description?: string;
  center?: [number, number];
  zoom?: number;
  downloaded?: boolean;
}

export interface NomadCuratedApp {
  id: string;
  name: string;
  category: string;
  description: string;
  port: number;
  dockerImage: string;
  installed: boolean;
  running: boolean;
  iconName: string;
  tags: string[];
}

export interface SurvivalGuide {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface MapWaypoint {
  id: string;
  name: string;
  category: 'WATER' | 'SHELTER' | 'MEDICAL' | 'COMMS' | 'RALLY' | 'CACHE';
  lat: number;
  lng: number;
  notes: string;
  timestamp: string;
}

export interface MeshtasticMessage {
  id: string;
  sender: string;
  channel: string;
  text: string;
  timestamp: string;
  rssi: number;
  snr: number;
  isEmergency?: boolean;
}

export const CONDITIONS_DATA: NomadCondition[] = conditionsRaw as NomadCondition[];
export const NATURAL_REMEDIES_DATA: NomadNaturalRemedy[] = naturalRemediesRaw as NomadNaturalRemedy[];
export const HOME_REMEDIES_DATA: NomadHomeRemedy[] = homeRemediesRaw as NomadHomeRemedy[];

export const MAP_REGIONS_DATA: NomadMapRegion[] = [
  {
    id: 'world-mini',
    name: 'Planisfério Global (World Mini Base)',
    description: 'Mapa global tático vetorial com todas as capitais, relevo e conexões marítimas/aéreas.',
    center: [0, 0],
    zoom: 2,
    sizeBytes: 850 * 1024 * 1024,
    downloaded: true
  },
  {
    id: 'sa-brazil',
    name: 'América do Sul / Brasil (ProtoMaps)',
    description: 'Malha viária, hidrografia, serras, curvas de nível e divisões municipais completas.',
    center: [-15.7801, -47.9292],
    zoom: 5,
    sizeBytes: 1420 * 1024 * 1024,
    downloaded: true
  },
  {
    id: 'na-us',
    name: 'North America / Continental US',
    description: 'Topografia e vias rodoviárias de alta definição dos EUA e Canadá.',
    center: [39.8283, -98.5795],
    zoom: 4,
    sizeBytes: 2800 * 1024 * 1024,
    downloaded: false
  },
  {
    id: 'europe',
    name: 'Europa Ocidental & Central',
    description: 'Infraestrutura completa, centros urbanos e mapas rurais europeus.',
    center: [48.8566, 2.3522],
    zoom: 4,
    sizeBytes: 2150 * 1024 * 1024,
    downloaded: false
  }
];

export const INITIAL_WAYPOINTS: MapWaypoint[] = [
  {
    id: 'wp-1',
    name: 'Posto de Água Potável & Nascente',
    category: 'WATER',
    lat: -15.7797,
    lng: -47.9297,
    notes: 'Nascente perene. Recomenda-se filtragem com filtro de pano e fervura preventiva.',
    timestamp: '2026-11-07 14:30'
  },
  {
    id: 'wp-2',
    name: 'Abrigo Tático Primário Alpha',
    category: 'SHELTER',
    lat: -15.7850,
    lng: -47.9200,
    notes: 'Estrutura de alvenaria com cobertura isolada e captação pluvial.',
    timestamp: '2026-11-07 12:15'
  },
  {
    id: 'wp-3',
    name: 'Repetidora LoRa Meshtastic (Morro)',
    category: 'COMMS',
    lat: -15.7680,
    lng: -47.9400,
    notes: 'Canal LongFast 915 MHz. Painel solar 50W + Bateria LiFePO4 100Wh. Cobre 25km.',
    timestamp: '2026-11-07 10:00'
  },
  {
    id: 'wp-4',
    name: 'Depósito Médico & Farmácia de Emergência',
    category: 'MEDICAL',
    lat: -15.7920,
    lng: -47.9350,
    notes: 'Kits de sutura, torniquetes CAT, amoxicilina, paracetamol e soro de reidratação oral.',
    timestamp: '2026-11-07 09:45'
  }
];

export const NOMAD_CURATED_APPS: NomadCuratedApp[] = [
  {
    id: 'nomad_ollama',
    name: 'Ollama AI Engine',
    category: 'Inteligência Artificial',
    description: 'Motor de inferência local para modelos de IA sem dependência de internet ou telemetria.',
    port: 11434,
    dockerImage: 'ollama/ollama:latest',
    installed: true,
    running: true,
    iconName: 'Cpu',
    tags: ['AI', 'Local LLM', 'RAG']
  },
  {
    id: 'nomad_kiwix_server',
    name: 'Kiwix Knowledge Server',
    category: 'Arquivos & Bibliotecas',
    description: 'Servidor de arquivos ZIM: Wikipedia completa, Wikivoyage, manuais médicos e guias de sobrevivência.',
    port: 8081,
    dockerImage: 'ghcr.io/kiwix/kiwix-serve:latest',
    installed: true,
    running: true,
    iconName: 'BookOpen',
    tags: ['ZIM', 'Wikipedia', 'Offline']
  },
  {
    id: 'nomad_meshtastic_web',
    name: 'Meshtastic Mesh Comms',
    category: 'Comunicação Tática',
    description: 'Interface web para rádios mesh LoRa descentralizados (comunicação sem torre celular ou internet).',
    port: 8405,
    dockerImage: 'meshtastic/web:latest',
    installed: true,
    running: true,
    iconName: 'Radio',
    tags: ['LoRa', 'Off-Grid', 'Radio', 'P2P']
  },
  {
    id: 'nomad_cyberchef',
    name: 'CyberChef Swiss Army Knife',
    category: 'Utilitários & Criptografia',
    description: 'O canivete suíço da computação: codificação, decodificação, cifra, hashes e análise forense.',
    port: 8082,
    dockerImage: 'mpepping/cyberchef:latest',
    installed: true,
    running: true,
    iconName: 'Terminal',
    tags: ['Crypto', 'Encoding', 'Utilities']
  },
  {
    id: 'nomad_flatnotes',
    name: 'FlatNotes Diário de Campo',
    category: 'Produtividade & Logs',
    description: 'Aplicativo minimalista para anotações em Markdown e registros táticos offline.',
    port: 8083,
    dockerImage: 'dullage/flatnotes:latest',
    installed: true,
    running: true,
    iconName: 'FileText',
    tags: ['Notes', 'Markdown', 'Field Logs']
  },
  {
    id: 'nomad_kolibri',
    name: 'Kolibri Learning Platform',
    category: 'Educação',
    description: 'Plataforma educacional offline completa com cursos da Khan Academy, ciências e matemática.',
    port: 8084,
    dockerImage: 'learningequality/kolibri:latest',
    installed: true,
    running: true,
    iconName: 'GraduationCap',
    tags: ['Education', 'Khan Academy']
  },
  {
    id: 'nomad_homebox',
    name: 'Homebox Suprimentos & Racionalização',
    category: 'Logística',
    description: 'Inventário e gestão de mantimentos, medicamentos, ferramentas e geradores de emergência.',
    port: 8408,
    dockerImage: 'ghcr.io/sysadminsmedia/homebox:latest',
    installed: true,
    running: false,
    iconName: 'Package',
    tags: ['Inventory', 'Supplies', 'Prepper']
  },
  {
    id: 'nomad_vaultwarden',
    name: 'Vaultwarden Cofre Seguro',
    category: 'Segurança',
    description: 'Cofre de credenciais e senhas auto-hospedado compatível com Bitwarden.',
    port: 8409,
    dockerImage: 'vaultwarden/server:latest',
    installed: true,
    running: true,
    iconName: 'Shield',
    tags: ['Security', 'Passwords']
  }
];

export const SURVIVAL_GUIDES: SurvivalGuide[] = [
  {
    id: 'guide-water',
    title: 'Purificação e Captação de Água de Emergência',
    category: 'Sobrevivência Básica',
    priority: 'CRITICAL',
    summary: 'Protocolos de filtragem mecânica, desinfecção térmica e química para água potável.',
    content: `1. FILTRAGEM MECÂNICA PRELIMINAR:
Passe a água túrbida por tecido dobrado (algodão ou filtro de café) ou filtro de camadas (carvão ativado triturado, areia fina, cascalho). Isso remove sólidos suspensos e parasitas grandes.

2. DESINFECÇÃO TÉRMICA (FERVURA):
Ferva a água vigorosamente em ebulição contínua por no mínimo 1 MINUTO (ou 3 minutos em altitudes acima de 2.000m). Mata 100% dos patógenos conhecidos (bactérias, vírus e cistos de protozoários como Giardia e Cryptosporidium).

3. DESINFECÇÃO QUÍMICA DE EMERGÊNCIA (HIPOCLORITO / CLORO):
Se ferver for impossível, use Hipoclorito de Sódio a 2% a 2,5% (água sanitária comum SEM alvejante, perfume ou sabão):
- Água clara: 2 a 4 gotas por litro.
- Água turva: 8 gotas por litro.
Misture bem e aguarde 30 MINUTOS antes de consumir. Deve haver leve odor de cloro residual.

4. DESSALINIZAÇÃO SOLAR OU DESTILAÇÃO:
Água salgada ou contaminada quimicamente requer destilação por condensação (destilador solar improvisado com lona plástica e recipiente central sob sol direto).`
  },
  {
    id: 'guide-triage',
    title: 'Protocolo de Triagem START em Emergências',
    category: 'Primeiros Socorros',
    priority: 'CRITICAL',
    summary: 'Método de triagem rápida para múltiplos feridos (Simple Triage and Rapid Treatment).',
    content: `O método START avalia 3 parâmetros: Respiração, Perfusão e Estado Mental (RPM) em menos de 60 segundos por vítima:

PASSO 1: Chamada verbal para quem consegue andar.
Todos que conseguem se locomover recebem classificação VERDE (Menor / Andante).

PASSO 2: RESPIRAÇÃO
- Não respira? Abra as vias aéreas.
  - Ainda sem respirar? Classificação: PRETO (Óbito / Não salvável).
  - Voltou a respirar? Classificação: VERMELHO (Imediato).
- Respira a mais de 30 ciclos por minuto? Classificação: VERMELHO (Imediato).
- Respira a menos de 30 rpm? Vá para o Passo 3.

PASSO 3: PERFUSÃO (Circulação)
- Pulso radial ausente ou enchimento capilar > 2 segundos? Controle hemorragias imediatas (torniquete/pressão) e classifique: VERMELHO (Imediato).
- Pulso radial presente e enchimento capilar < 2 segundos? Vá para o Passo 4.

PASSO 4: ESTADO MENTAL
- Não obedece a ordens simples (ex: 'abra os olhos', 'aperte minha mão')? Classificação: VERMELHO (Imediato).
- Obedece a ordens simples? Classificação: AMARELO (Urgente / Atrasado).`
  },
  {
    id: 'guide-radio',
    title: 'Frequências e Protocolos de Rádio em Desastres',
    category: 'Comunicação Tática',
    priority: 'HIGH',
    summary: 'Canais de emergência VHF/UHF, simplex e conduta de tráfego de rádio.',
    content: `FREQUÊNCIAS DE CHAMADA E SOCORRO PADRÃO:
- VHF Simplex Nacional (Amador): 146.520 MHz (FM)
- UHF Simplex Nacional (Amador): 446.000 MHz (FM)
- Rádio Cidadão (PX / CB Channel 9): 27.065 MHz (AM)
- Rádio FRS/GMRS Canal 1: 462.5625 MHz
- Meshtastic Canal Primário Padrão: 915 MHz (Américas) / 868 MHz (Europa) - Modem LongFast

FORMATO DE TRANSMISSÃO DE EMERGÊNCIA (MAYDAY / PAN-PAN):
1. 'MAYDAY, MAYDAY, MAYDAY' (Perigo iminente à vida)
2. Indicativo ou Nome do operador/estação (ex: 'Aqui Nomad Estação Base Alpha')
3. Posição / Coordenadas GPS (Latitude e Longitude, ou ponto de referência conspícuo)
4. Natureza da emergência (ex: 'Ferimento por queda, fratura exposta, necessita evacuação')
5. Número de pessoas e condições médicas
6. Plano de escuta (ex: 'Ficarei na escuta a cada hora cheia no minuto 00 e 30 por 5 minutos').`
  },
  {
    id: 'guide-hypothermia',
    title: 'Hipotermia e Choque Térmico',
    category: 'Medicina de Campo',
    priority: 'HIGH',
    summary: 'Sintomas de alarme, técnicas de reaquecimento passivo e ativo seguro.',
    content: `GRAUS DE HIPOTERMIA:
- Leve (35°C a 32°C): Tremores incontroláveis, fala arrastada, movimentos desajeitados, apatia.
- Moderada (32°C a 28°C): Tremores cessam, confusão mental severa, letargia, rigidez muscular.
- Grave (< 28°C): Inconsciência, pulso imperceptível, pupilas dilatadas (pode simular morte).

CONDUTA DE REAQUECIMENTO:
1. Remova imediatamente roupas molhadas. Isole a vítima do solo frio com lona ou isolante térmico.
2. Envolva em cobertor de emergência aluminizado (mylar) + saco de dormir.
3. Aquecimento passivo: Cubra a cabeça e pescoço (responsáveis por até 40% da perda térmica).
4. Reaquecimento ativo: Bolsas térmicas ou garrafas com água morna enroladas em panos aplicadas no tórax, axilas e virilha (NUNCA direto na pele nua).
5. ATENÇÃO: NÃO massageie os membros nem aqueça braços/pernas primeiro (risco de 'afterdrop' e parada cardíaca por retorno de sangue frio e tóxico ao coração).`
  }
];

export const INITIAL_MESHTASTIC_MESSAGES: MeshtasticMessage[] = [
  {
    id: 'mesh-1',
    sender: 'Base-Alpha !8fe2',
    channel: 'LongFast (#0)',
    text: 'Rede NOMAD LoRa operacional. Beacon de presença ativo a cada 15 min.',
    timestamp: '14:20',
    rssi: -82,
    snr: 8.5
  },
  {
    id: 'mesh-2',
    sender: 'Operador-Bravo !41c9',
    channel: 'LongFast (#0)',
    text: 'Relatório de rota: Ponto de água potável no waypoint #1 verificado e com fluxo normal.',
    timestamp: '14:35',
    rssi: -94,
    snr: 4.2
  },
  {
    id: 'mesh-3',
    sender: 'Posto-Medico !2a50',
    channel: 'Emergência (#911)',
    text: 'Triagem START disponível no Posto Sul. Suprimentos de ataduras e antibióticos estocados.',
    timestamp: '14:48',
    rssi: -78,
    snr: 9.8,
    isEmergency: true
  }
];
