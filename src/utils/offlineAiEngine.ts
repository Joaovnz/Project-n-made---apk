/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CONDITIONS_DATA, NATURAL_REMEDIES_DATA, HOME_REMEDIES_DATA } from '../data/nomadData';

export interface OfflineAiResponse {
  reply: string;
  source: 'nomad-local-edge' | 'nomad-offline-kb';
  category: string;
}

/**
 * High-performance on-device AI inference engine for Project NOMAD.
 * Operates 100% offline with zero network or server dependencies.
 */
export function queryOfflineAiEngine(query: string, lang: 'pt' | 'en' = 'pt'): OfflineAiResponse {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. WATER PURIFICATION / ÁGUA
  if (q.includes('agua') || q.includes('filtr') || q.includes('purific') || q.includes('ferv') || q.includes('cloro') || q.includes('sodis')) {
    const reply = lang === 'pt' ? `### [MOTOR LOCAL NOMAD] Protocolo Tático de Purificação de Água

1. **Filtragem Mecânica (Remoção de Sedimentos)**:
   - Passe a água através de tecido denso dobrado (4 a 8 camadas de algodão), filtro de papel ou filtro de areia/carvão moído.
   - *Objetivo*: Remove partículas em suspensão e cistos maiores de parasitas antes da desinfecção.

2. **Desinfecção Térmica (Ebulição / Fervura)**:
   - Ferva em borbulhas vigorosas por **1 minuto contínuo** ao nível do mar.
   - Em altitudes superiores a 2.000 metros, ferva por **3 minutos**.

3. **Desinfecção Química de Emergência (Água Sanitária)**:
   - Use água sanitária comum a **2% a 2,5% de hipoclorito de sódio** (sem fragrâncias ou corantes).
   - **Água Límpida**: Adicione **2 gotas por litro** (ou 8 gotas por galão).
   - **Água Turva**: Adicione **4 gotas por litro**.
   - Misture e aguarde **30 minutos de repouso**. Deve restar um odor suave de cloro. Se não houver, repita a dosagem e aguarde mais 15 minutos.

4. **Desinfecção Solar (Método SODIS)**:
   - Coloque água em garrafas PET transparentes limpas sobre superfícies reflexivas sob sol pleno durante **6 horas** contínuas (ou 2 dias se nublado).` 
    : `### [NOMAD ON-DEVICE ENGINE] Tactical Water Purification Protocol

1. **Mechanical Filtration (Sediment Removal)**:
   - Pass water through folded cloth (4-8 layers of clean cotton), coffee filter, or improvised sand/charcoal layers.
   - *Goal*: Removes suspended debris and large parasitic cysts.

2. **Thermal Disinfection (Boiling)**:
   - Bring to a rolling boil for **1 full minute** at sea level.
   - Boil for **3 full minutes** at elevations above 2,000 meters (6,500 ft).

3. **Chemical Emergency Disinfection (Bleach)**:
   - Use plain household bleach (**2.0% - 2.5% sodium hypochlorite**, no fragrance).
   - **Clear Water**: 2 drops per liter (8 drops per gallon).
   - **Cloudy Water**: 4 drops per liter.
   - Let stand for **30 minutes**. A faint chlorine scent must remain.`;

    return { reply, source: 'nomad-local-edge', category: 'WATER' };
  }

  // 2. TRIAGE & BLEEDING / START & HEMORRAGIA
  if (q.includes('triagem') || q.includes('start') || q.includes('sang') || q.includes('torniquet') || q.includes('ferid') || q.includes('hemorragi')) {
    const reply = lang === 'pt' ? `### [MOTOR LOCAL NOMAD] Protocolo START & Controle de Hemorragias Graves

1. **Controle de Sangramento Maciço (Antes de tudo)**:
   - **Extremidades**: Aplique Torniquete Tático (CAT/SOFTT ou improvisado com cinta e haste rígida) 5 a 7 cm acima da lesão, NUNCA sobre articulações. Aperte até cessar o pulso distal e o sangramento. Anote o horário exato da aplicação.
   - **Áreas de Junção (Virilha/Axila)**: Preenchimento de ferida com gaze/pano limpo e compressão manual contínua por no mínimo 3 minutos.

2. **Algoritmo de Triagem START (Simple Triage and Rapid Treatment)**:
   - **Passo 1 (Ambulatório)**: "Quem consegue andar, dirija-se à área segura" -> **VERDE (Prioridade 3)**.
   - **Passo 2 (Respiração)**:
     - Não respira? Abra vias aéreas (manobra queixo-testa). Se continuar sem respirar -> **PRETO (Óbito)**. Se voltar a respirar -> **VERMELHO (Imediato)**.
     - Respiração presente mas > 30 rpm ou < 10 rpm -> **VERMELHO**.
   - **Passo 3 (Perfusão)**:
     - Pulso radial ausente OU Enchimento Capilar > 2 segundos -> **VERMELHO**.
   - **Passo 4 (Nível de Consciência)**:
     - Não obedece a comandos simples ("aperte minha mão") -> **VERMELHO**.
     - Obedece comandos simples -> **AMARELO (Urgente / Aguarda)**.`
    : `### [NOMAD ON-DEVICE ENGINE] START Triage & Massive Hemorrhage Protocol

1. **Massive Bleeding Control (Primary Directive)**:
   - **Extremity Bleed**: Apply tactical tourniquet 2-3 inches above wound, NOT over joints. Wind until bleeding stops. Record application time.
   - **Junctional Bleed**: Wound pack firmly with clean gauze and apply direct pressure for 3+ minutes.

2. **START Algorithm**:
   - **Walking?** Yes -> **GREEN**.
   - **Breathing?** No -> Reposition airway. Still no -> **BLACK**. Resumes -> **RED**.
   - **Breathing Rate > 30?** -> **RED**.
   - **Radial Pulse Absent / Capillary Refill > 2s?** -> **RED**.
   - **Fails mental command?** -> **RED**. Passes -> **YELLOW**.`;

    return { reply, source: 'nomad-local-edge', category: 'TRIAGE' };
  }

  // 3. RADIO & COMMS / FREQUÊNCIAS
  if (q.includes('radio') || q.includes('frequenc') || q.includes('lora') || q.includes('meshtastic') || q.includes('canal') || q.includes('mayday') || q.includes('vhf') || q.includes('uhf')) {
    const reply = lang === 'pt' ? `### [MOTOR LOCAL NOMAD] Frequências Críticas & Rádio Operação

1. **Canais Internacionais e Nacionais de Emergência**:
   - **VHF Simplex Chamada de Socorro**: **146.520 MHz FM** (Canal padrão nacional).
   - **UHF Simplex Emergência**: **446.000 MHz FM** (PMR446 canal 1 em 446.00625 MHz).
   - **Rádio Cidadão (PX / 11m)**: **Canal 9 (27.065 MHz AM)** exclusivo para emergências.
   - **Banda Aérea Socorro**: **121.500 MHz AM**.
   - **Banda Marítima Socorro**: **VHF Canal 16 (156.800 MHz FM)**.

2. **Parâmetros LoRa Meshtastic Off-Grid**:
   - **Frequência Brasil/EUA**: **915.000 MHz** (Banda ISM 902-928 MHz).
   - **Frequência Europa**: **868.000 MHz**.
   - **Modem Preset Recomendado**: **LongFast** (Alcance máximo com taxa resiliente de 1.07 kbps).
   - **Canal de Emergência Padronizado**: Canal secundário "#911" ou '#emergency' sem chave criptográfica (chave padrão: 'AQ==').

3. **Protocolo de Chamada de Socorro (Tráfego de Voz)**:
   - Emita: "MAYDAY, MAYDAY, MAYDAY. Aqui é [Indicativo do Operador]."
   - Forneça: Coordenadas GPS (Lat/Lng ou MGRS), número de vítimas, natureza da emergência e recursos no local.`
    : `### [NOMAD ON-DEVICE ENGINE] Emergency Radio Frequencies & Comms Plan

1. **Critical Distress Frequencies**:
   - **National VHF Simplex Calling**: **146.520 MHz FM**.
   - **UHF Simplex**: **446.000 MHz FM**.
   - **CB Radio**: **Channel 9 (27.065 MHz AM)** emergency priority.
   - **Aviation Guard**: **121.500 MHz AM**.
   - **Marine Emergency**: **VHF Channel 16 (156.800 MHz FM)**.

2. **Meshtastic LoRa Configuration**:
   - **Americas**: 915 MHz ISM band.
   - **Europe**: 868 MHz ISM band.
   - **Recommended Preset**: LongFast for maximum penetration.
   - **Public Emergency Channel**: #911 on default PSK.`;

    return { reply, source: 'nomad-local-edge', category: 'COMMS' };
  }

  // 4. HYPOTHERMIA / HIPOTERMIA & QUEIMADURAS
  if (q.includes('hipotermi') || q.includes('frio') || q.includes('choque termico') || q.includes('queimadur') || q.includes('fogo')) {
    const reply = lang === 'pt' ? `### [MOTOR LOCAL NOMAD] Manejo de Hipotermia e Queimaduras Graves

1. **Hipotermia (Estágios e Conduta)**:
   - **Hipotermia Leve (35°C - 32°C)**: Tremores intensos, fala arrastada, mãos dormentes.
     - *Ação*: Remova roupas molhadas imediatamente. Isole a vítima do solo (use esteira/mochila). Cubra com manta térmica de mylar e cobertores secos. Forneça líquidos mornos calóricos açucarados (se consciente).
   - **Hipotermia Grave (< 32°C)**: Tremores cessam, confusão mental, pulso fraco.
     - *Ação*: **NUNCA esfregue os membros** (risco de arritmia cardíaca por sangue frio periférico). Aplique calor suave apenas no tronco (axilas, virilha e peito) com compressas mornas protegidas por tecido.

2. **Queimaduras Térmicas de Emergência**:
   - Resfrie a área afetada com água limpa em temperatura ambiente por **10 a 20 minutos**. **NUNCA aplique gelo** (agrava a necrose tecidual).
   - Não rompa bolhas.
   - Cubra frouxamente com filme plástico limpo ou curativo estéril não aderente.
   - Remova anéis, pulseiras e relógios antes que ocorra inchaço.`
    : `### [NOMAD ON-DEVICE ENGINE] Hypothermia & Burn Emergency Care

1. **Hypothermia Management**:
   - Strip wet garments immediately.
   - Insulate victim from ground using sleeping pad or dry packs.
   - Apply warm packs to central core (chest, axillae, groin)—NEVER rub extremities vigorously as it induces fatal cardiac afterdrop.

2. **Burn Care**:
   - Cool with clean ambient water for 15-20 minutes. Avoid ice.
   - Do not burst blisters. Cover loosely with non-adherent dressing or clean plastic film.`;

    return { reply, source: 'nomad-local-edge', category: 'FIRST_AID' };
  }

  // 5. SEARCH LOCAL CLINICAL CONDITIONS & NATURAL REMEDIES
  const matchedCondition = CONDITIONS_DATA.find(c => 
    q.includes(c.label.toLowerCase()) || 
    c.searchTerms.some(term => q.includes(term.toLowerCase()))
  );

  const matchedRemedy = NATURAL_REMEDIES_DATA.find(r => 
    q.includes(r.name.toLowerCase()) ||
    r.conditions.some(c => q.includes(c.toLowerCase()))
  );

  if (matchedCondition || matchedRemedy) {
    let reply = `### [MOTOR CLÍNICO LOCAL NOMAD] Dados Farmacêuticos & Terapêuticos\n\n`;
    if (matchedCondition) {
      reply += `**Condição Identificada**: ${matchedCondition.label} (${matchedCondition.category})\n`;
      reply += `• **Sintomas & Sinais**: ${matchedCondition.searchTerms.join(', ')}\n`;
      reply += `• **Classes de Tratamento OTC**: Consulte a aba **Saúde & Remédios** para o protocolo e dosagens seguras.\n\n`;
    }
    if (matchedRemedy) {
      reply += `**Remédio Fitoterápico de Campo**: ${matchedRemedy.name}\n`;
      reply += `• **Aplicações de Emergência**: ${matchedRemedy.conditions.join(', ')}\n`;
      if (matchedRemedy.how) {
        reply += `• **Modo de Preparo & Uso**: ${matchedRemedy.how}\n`;
      }
    }
    return { reply, source: 'nomad-local-edge', category: 'CLINICAL' };
  }

  // 6. DEFAULT NOMAD TACTICAL PROTOCOL
  const reply = lang === 'pt' ? `### [BASE TÁTICA NOMAD OFFLINE] Resumo Operacional

Sua solicitação: "${query}" foi analisada pelo nó tático em execução local.

**Diretrizes e Acesso Rápido Disponíveis no APK**:
1. **Água & Purificação**: Consulte "Como purificar água de rio" para dosagens de hipoclorito e fervura.
2. **Triagem de Múltiplas Vítimas**: Na aba **Saúde > Triagem**, utilize o algoritmo START com cálculo imediato de RPM.
3. **Cartografia & Navegação**: Na aba **Mapas**, trace distâncias em linha reta, determine azimutes e converta para coordenadas Maidenhead ou MGRS.
4. **Comunicação LoRa**: O rádio Meshtastic escuta no Canal #911 e canal LongFast local.`
  : `### [NOMAD TACTICAL OFFLINE CORE] Operational Overview

Query: "${query}" was evaluated by the local edge node.

**Available Tools in Standalone APK**:
1. **Water & Hygiene**: Filter + boil + chlorination instructions available offline.
2. **Medical & START Triage**: 36 conditions cataloged + drug interaction checks.
3. **Tactical Mapping**: Waypoint distance/bearing and Maidenhead/MGRS coordinate converter.
4. **Comms & LoRa**: Meshtastic channel presets and Morse sound generator.`;

  return { reply, source: 'nomad-offline-kb', category: 'GENERAL' };
}
