// data.js - Constantes e dados estáticos da aplicação

const CATEGORIES = [
  {
    id: "animais",
    label: "Bicharada",
    color: "#5CAE52",
    colorDark: "#3F8A38",
    colorSoft: "#E4F5DF",
    icon: "paw"
  },
  {
    id: "casa",
    label: "Cá em Casa",
    color: "#F2704E",
    colorDark: "#C85A3B",
    colorSoft: "#FEE9E1",
    icon: "home"
  },
  {
    id: "natureza",
    label: "Lá Fora",
    color: "#6F52B5",
    colorDark: "#54408A",
    colorSoft: "#EAE3F8",
    icon: "leaf"
  }
];

const SKIN_TONES = ["#FFDBB4", "#F1C27D", "#C68642", "#8D5524"];
const HAIR_COLORS = ["#2E2321", "#7A4A2B", "#D4A017", "#8B2E2E"];
const HAIR_STYLES = ["liso", "encaracolado"];

const ACCESSORIES = [
  { id: "chapeu", label: "Chapéu de explorador", threshold: 6 },
  { id: "oculos", label: "Óculos redondos", threshold: 14 },
  { id: "capa", label: "Capa de aventuras", threshold: 22 },
  { id: "coroa", label: "Coroa de campeão", threshold: 30 }
];

const PRAISE = [
  "Boa! Isso mesmo!",
  "Muito bem, continua assim!",
  "Certinho! Estás a aprender depressa.",
  "Excelente! Essa palavra já é tua.",
  "Perfeito! Que orgulho."
];

const RETRY = [
  "Quase! Tenta outra vez.",
  "Não foi essa, mas tu consegues.",
  "Hmm, vamos tentar de novo.",
  "Ainda não é essa. Pensa bem no significado."
];