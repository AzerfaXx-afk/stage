import type { MissionGroup } from './types';

export const DEFAULT_MISSIONS: MissionGroup[] = [
  {
    id: 'phase1',
    title: 'Phase 1 — Inventaire & Découverte',
    emoji: '🗺️',
    tasks: [
      { id: 'p1t1', text: 'Obtenir l\'accès à Cisco ISE auprès de Johnny', done: false },
      { id: 'p1t2', text: 'Extraire la liste complète des groupes techniques ISE', done: false },
      { id: 'p1t3', text: 'Identifier les 88 groupes techniques et leurs fabricants', done: false },
      { id: 'p1t4', text: 'Mapper chaque groupe vers un bâtiment VDL', done: false },
      { id: 'p1t5', text: 'Identifier les protocoles utilisés par groupe', done: false },
      { id: 'p1t6', text: 'Créer le schéma de l\'architecture réseau IoT actuelle', done: false },
      { id: 'p1t7', text: 'Lister les services SCADA (eau, circulation, chauffage)', done: false },
      { id: 'p1t8', text: 'Contacter les services clés (Parking, Bus, Énergie)', done: false },
      { id: 'p1t9', text: 'Documenter les équipements "connus" vs "inconnus"', done: false },
      { id: 'p1t10', text: 'Valider l\'inventaire avec le superviseur', done: false },
    ],
  },
  {
    id: 'phase2',
    title: 'Phase 2 — Standards & Sécurité',
    emoji: '🔒',
    tasks: [
      { id: 'p2t1', text: 'Compléter la section "Définitions" de la Nomenclature', done: false },
      { id: 'p2t2', text: 'Définir les protocoles autorisés par le TIC', done: false },
      { id: 'p2t3', text: 'Documenter BACnet/SC comme standard recommandé', done: false },
      { id: 'p2t4', text: 'Évaluer les risques de chaque protocole (KNX, Zigbee, Z-Wave...)', done: false },
      { id: 'p2t5', text: 'Rédiger les exigences d\'authentification et chiffrement', done: false },
      { id: 'p2t6', text: 'Définir la politique Cloud vs On-Prem', done: false },
      { id: 'p2t7', text: 'Créer le mapping Use Case → Protocole → Standard', done: false },
      { id: 'p2t8', text: 'Vérifier la conformité RED DA (directive UE août 2025)', done: false },
    ],
  },
  {
    id: 'phase2b',
    title: 'Phase 2b — Schéma froid AP Kieffer',
    emoji: '❄️',
    tasks: [
      { id: 'p2bt1', text: 'Analyser la topologie Layer 2 / Layer 3 existante', done: false },
      { id: 'p2bt2', text: 'Évaluer la sécurité GTC Kieback&Peter Neutrino', done: false },
      { id: 'p2bt3', text: 'Documenter les recommandations Regulux', done: false },
      { id: 'p2bt4', text: 'Créer le schéma de principe (bastion, VPN)', done: false },
      { id: 'p2bt5', text: 'Valider avec le service Sécurité Informatique', done: false },
    ],
  },
  {
    id: 'phase3',
    title: 'Phase 3 — DVID & Tests',
    emoji: '🧪',
    tasks: [
      { id: 'p3t1', text: 'Installer Nmap, Wireshark, Burp Suite sur PC perso', done: false },
      { id: 'p3t2', text: 'Configurer la carte DVID pour les tests', done: false },
      { id: 'p3t3', text: 'Compléter les challenges DVID (UART, SPI, JTAG)', done: false },
      { id: 'p3t4', text: 'Tester les vulnérabilités MQTT', done: false },
      { id: 'p3t5', text: 'Documenter les résultats des tests de sécurité', done: false },
      { id: 'p3t6', text: 'Rédiger les recommandations de sécurité', done: false },
    ],
  },
  {
    id: 'phase4',
    title: 'Phase 4 — Rapport & Finalisation',
    emoji: '📝',
    tasks: [
      { id: 'p4t1', text: 'Rédiger le rapport de stage (structure, intro, conclusion)', done: false },
      { id: 'p4t2', text: 'Compléter la Nomenclature IoT v1.0 finale', done: false },
      { id: 'p4t3', text: 'Préparer la présentation orale (slides)', done: false },
      { id: 'p4t4', text: 'Relecture et validation par le superviseur', done: false },
      { id: 'p4t5', text: 'Répéter la soutenance orale', done: false },
    ],
  },
];
