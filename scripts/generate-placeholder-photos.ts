import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export interface PoolPhotoMeta {
  id: string;
  storageKey: string;
  category:
    | "exterior"
    | "living"
    | "kitchen"
    | "bedroom"
    | "bathroom"
    | "house"
    | "land"
    | "commercial"
    | "other";
  roomLabelCs: string;
  width: number;
  height: number;
  blurDataUrl: string;
}

interface SceneSpec {
  id: string;
  category: PoolPhotoMeta["category"];
  roomLabelCs: string;
  wall: string;
  wallShade: string;
  floor: string;
  accent: string;
  skyTop: string;
  skyBottom: string;
  furniture: string;
  wood: string;
  variant: number;
}

const SCENES: SceneSpec[] = [
  // Living rooms (8)
  {
    id: "living-01",
    category: "living",
    roomLabelCs: "Obývací pokoj",
    wall: "#F5F4F7",
    wallShade: "#E6E4EC",
    floor: "#D4C4B0",
    accent: "#6D3FE0",
    skyTop: "#E8E4F8",
    skyBottom: "#F9F8FC",
    furniture: "#3E3E4B",
    wood: "#B89B7A",
    variant: 0,
  },
  {
    id: "living-02",
    category: "living",
    roomLabelCs: "Obývací pokoj s terasou",
    wall: "#F8F6F2",
    wallShade: "#EAE5DC",
    floor: "#CBB59B",
    accent: "#8560F5",
    skyTop: "#E2E8F5",
    skyBottom: "#F7F6FA",
    furniture: "#565665",
    wood: "#A68663",
    variant: 1,
  },
  {
    id: "living-03",
    category: "living",
    roomLabelCs: "Světlý obývací prostor",
    wall: "#F2F2F6",
    wallShade: "#E1E1E9",
    floor: "#D9CCBC",
    accent: "#5B2FC2",
    skyTop: "#EDE9FE",
    skyBottom: "#FAF9FD",
    furniture: "#272731",
    wood: "#C2A88A",
    variant: 2,
  },
  {
    id: "living-04",
    category: "living",
    roomLabelCs: "Obývací pokoj s jídelnou",
    wall: "#F6F5F8",
    wallShade: "#E5E2EE",
    floor: "#CEBCA7",
    accent: "#6D3FE0",
    skyTop: "#E6E0FA",
    skyBottom: "#F6F5FA",
    furniture: "#484858",
    wood: "#B09373",
    variant: 3,
  },
  {
    id: "living-05",
    category: "living",
    roomLabelCs: "Prostorný obývací pokoj",
    wall: "#F7F4F0",
    wallShade: "#E7E0D8",
    floor: "#C4AE94",
    accent: "#7C52E8",
    skyTop: "#E9E5F5",
    skyBottom: "#FBF9F6",
    furniture: "#363642",
    wood: "#9E7E5C",
    variant: 0,
  },
  {
    id: "living-06",
    category: "living",
    roomLabelCs: "Moderní obývací část",
    wall: "#F3F4F7",
    wallShade: "#E2E4EB",
    floor: "#D6C9B8",
    accent: "#6D3FE0",
    skyTop: "#E4E6F4",
    skyBottom: "#F7F8FB",
    furniture: "#2F2F3B",
    wood: "#BA9F7E",
    variant: 1,
  },
  {
    id: "living-07",
    category: "living",
    roomLabelCs: "Obývací pokoj s výhledem",
    wall: "#F9F8FA",
    wallShade: "#EAE7F0",
    floor: "#D0C0AC",
    accent: "#5B2FC2",
    skyTop: "#ECE6FF",
    skyBottom: "#FAFAFB",
    furniture: "#444452",
    wood: "#AD8E6C",
    variant: 2,
  },
  {
    id: "living-08",
    category: "living",
    roomLabelCs: "Hlavní obytný prostor",
    wall: "#F5F3F0",
    wallShade: "#E4DFD9",
    floor: "#C8B39A",
    accent: "#8560F5",
    skyTop: "#E7E3F6",
    skyBottom: "#F8F7FA",
    furniture: "#3B3B48",
    wood: "#A48462",
    variant: 3,
  },
  // Kitchens (6)
  {
    id: "kitchen-01",
    category: "kitchen",
    roomLabelCs: "Kuchyňský kout",
    wall: "#F6F6F9",
    wallShade: "#E5E5EE",
    floor: "#D2C5B4",
    accent: "#6D3FE0",
    skyTop: "#EAE6FA",
    skyBottom: "#F9F9FC",
    furniture: "#FFFFFF",
    wood: "#B89B7A",
    variant: 0,
  },
  {
    id: "kitchen-02",
    category: "kitchen",
    roomLabelCs: "Moderní kuchyně",
    wall: "#F4F3F6",
    wallShade: "#E3E0EA",
    floor: "#C8B8A4",
    accent: "#5B2FC2",
    skyTop: "#E5E2F5",
    skyBottom: "#F7F6FA",
    furniture: "#EBEBEF",
    wood: "#A98967",
    variant: 1,
  },
  {
    id: "kitchen-03",
    category: "kitchen",
    roomLabelCs: "Kuchyně s ostrůvkem",
    wall: "#F8F7F4",
    wallShade: "#E8E4DC",
    floor: "#CFC0AD",
    accent: "#8560F5",
    skyTop: "#ECE8FA",
    skyBottom: "#FAF9F7",
    furniture: "#FFFFFF",
    wood: "#9E7E5C",
    variant: 2,
  },
  {
    id: "kitchen-04",
    category: "kitchen",
    roomLabelCs: "Jídelna a kuchyně",
    wall: "#F5F5F8",
    wallShade: "#E3E3EC",
    floor: "#D5C7B6",
    accent: "#6D3FE0",
    skyTop: "#E6E3F6",
    skyBottom: "#F9F8FB",
    furniture: "#FAFAFB",
    wood: "#B49674",
    variant: 0,
  },
  {
    id: "kitchen-05",
    category: "kitchen",
    roomLabelCs: "Plně vybavená kuchyně",
    wall: "#F3F2F5",
    wallShade: "#E2DFEA",
    floor: "#C6B5A1",
    accent: "#6D3FE0",
    skyTop: "#EAE5F8",
    skyBottom: "#F6F5F9",
    furniture: "#F4F4F6",
    wood: "#AA8A68",
    variant: 1,
  },
  {
    id: "kitchen-06",
    category: "kitchen",
    roomLabelCs: "Kuchyňská linka",
    wall: "#F7F6F9",
    wallShade: "#E6E4EE",
    floor: "#D3C5B3",
    accent: "#5B2FC2",
    skyTop: "#EBE7FA",
    skyBottom: "#FAFAFB",
    furniture: "#FFFFFF",
    wood: "#BC9F7D",
    variant: 2,
  },
  // Bedrooms (6)
  {
    id: "bedroom-01",
    category: "bedroom",
    roomLabelCs: "Ložnice",
    wall: "#F6F5F9",
    wallShade: "#E7E4F0",
    floor: "#D3C4B2",
    accent: "#6D3FE0",
    skyTop: "#EBE6FA",
    skyBottom: "#F9F8FC",
    furniture: "#DDDDE3",
    wood: "#B69978",
    variant: 0,
  },
  {
    id: "bedroom-02",
    category: "bedroom",
    roomLabelCs: "Klidná ložnice",
    wall: "#F8F6F3",
    wallShade: "#E9E3DC",
    floor: "#CAB69F",
    accent: "#8560F5",
    skyTop: "#E6E3F5",
    skyBottom: "#F9F8F6",
    furniture: "#E5E2EF",
    wood: "#A58665",
    variant: 1,
  },
  {
    id: "bedroom-03",
    category: "bedroom",
    roomLabelCs: "Pokoj",
    wall: "#F4F4F7",
    wallShade: "#E2E2EA",
    floor: "#D7C9B8",
    accent: "#5B2FC2",
    skyTop: "#EAE7F8",
    skyBottom: "#F8F8FB",
    furniture: "#D9D7E5",
    wood: "#BE9F7D",
    variant: 2,
  },
  {
    id: "bedroom-04",
    category: "bedroom",
    roomLabelCs: "Pracovna nebo dětský pokoj",
    wall: "#F5F4F6",
    wallShade: "#E4E1EB",
    floor: "#CEBEA9",
    accent: "#6D3FE0",
    skyTop: "#E7E2F7",
    skyBottom: "#F8F7FA",
    furniture: "#E0DEE8",
    wood: "#AE8F6D",
    variant: 0,
  },
  {
    id: "bedroom-05",
    category: "bedroom",
    roomLabelCs: "Hlavní ložnice",
    wall: "#F7F5F2",
    wallShade: "#E6E0D9",
    floor: "#C7B299",
    accent: "#7B51E8",
    skyTop: "#EAE5F8",
    skyBottom: "#FAF8F6",
    furniture: "#E3E0EC",
    wood: "#9F805E",
    variant: 1,
  },
  {
    id: "bedroom-06",
    category: "bedroom",
    roomLabelCs: "Světlý pokoj",
    wall: "#F3F4F6",
    wallShade: "#E2E4EA",
    floor: "#D4C6B5",
    accent: "#6D3FE0",
    skyTop: "#E4E6F5",
    skyBottom: "#F7F8FA",
    furniture: "#DDDDE5",
    wood: "#B79A79",
    variant: 2,
  },
  // Bathrooms (4)
  {
    id: "bathroom-01",
    category: "bathroom",
    roomLabelCs: "Koupelna",
    wall: "#F4F4F7",
    wallShade: "#E5E5EC",
    floor: "#CFCFD8",
    accent: "#6D3FE0",
    skyTop: "#EAE6FA",
    skyBottom: "#F8F8FB",
    furniture: "#FFFFFF",
    wood: "#B89B7A",
    variant: 0,
  },
  {
    id: "bathroom-02",
    category: "bathroom",
    roomLabelCs: "Koupelna se sprchovým koutem",
    wall: "#F6F5F3",
    wallShade: "#E7E4DF",
    floor: "#D2CEC8",
    accent: "#8560F5",
    skyTop: "#E8E5F6",
    skyBottom: "#FAF9F7",
    furniture: "#FFFFFF",
    wood: "#AA8B69",
    variant: 1,
  },
  {
    id: "bathroom-03",
    category: "bathroom",
    roomLabelCs: "Koupelna s vanou",
    wall: "#F3F3F6",
    wallShade: "#E3E2EA",
    floor: "#CACAD4",
    accent: "#5B2FC2",
    skyTop: "#EBE7FA",
    skyBottom: "#F7F7FA",
    furniture: "#FAFAFB",
    wood: "#BC9F7D",
    variant: 0,
  },
  {
    id: "bathroom-04",
    category: "bathroom",
    roomLabelCs: "Moderní koupelna",
    wall: "#F7F6F9",
    wallShade: "#E6E4EE",
    floor: "#D3D1DC",
    accent: "#6D3FE0",
    skyTop: "#ECE6FF",
    skyBottom: "#FAFAFB",
    furniture: "#FFFFFF",
    wood: "#B09270",
    variant: 1,
  },
  // Exterior apartments / buildings (5)
  {
    id: "exterior-01",
    category: "exterior",
    roomLabelCs: "Exteriér bytového domu",
    wall: "#F2F1F5",
    wallShade: "#DFDDE7",
    floor: "#D5D4DC",
    accent: "#6D3FE0",
    skyTop: "#DED8F8",
    skyBottom: "#F4F4F8",
    furniture: "#3E3E4B",
    wood: "#A6896A",
    variant: 0,
  },
  {
    id: "exterior-02",
    category: "exterior",
    roomLabelCs: "Pohled na dům z ulice",
    wall: "#F5F2EE",
    wallShade: "#E4DDD5",
    floor: "#CFCBC6",
    accent: "#5B2FC2",
    skyTop: "#DCE2F5",
    skyBottom: "#F6F5F8",
    furniture: "#4A4A58",
    wood: "#9A7D5E",
    variant: 1,
  },
  {
    id: "exterior-03",
    category: "exterior",
    roomLabelCs: "Novostavba s balkony",
    wall: "#F6F6F9",
    wallShade: "#E4E4EC",
    floor: "#D1D1DA",
    accent: "#8560F5",
    skyTop: "#E3DCFA",
    skyBottom: "#F8F8FC",
    furniture: "#2E2E3A",
    wood: "#B59877",
    variant: 2,
  },
  {
    id: "exterior-04",
    category: "exterior",
    roomLabelCs: "Činžovní dům v klidné ulici",
    wall: "#F4EFEA",
    wallShade: "#E2D9CE",
    floor: "#CCC7C2",
    accent: "#6D3FE0",
    skyTop: "#E1DDF6",
    skyBottom: "#F7F6F9",
    furniture: "#3C3C49",
    wood: "#A38464",
    variant: 0,
  },
  {
    id: "exterior-05",
    category: "exterior",
    roomLabelCs: "Rezidenční budova se zelení",
    wall: "#F3F4F7",
    wallShade: "#E0E2EA",
    floor: "#CED2D8",
    accent: "#6D3FE0",
    skyTop: "#DFDCF7",
    skyBottom: "#F5F6FA",
    furniture: "#353542",
    wood: "#AE906F",
    variant: 1,
  },
  // Houses (5)
  {
    id: "house-01",
    category: "house",
    roomLabelCs: "Rodinný dům se zahradou",
    wall: "#F7F6F4",
    wallShade: "#E5E2DC",
    floor: "#B8C7B2",
    accent: "#6D3FE0",
    skyTop: "#DCD6F6",
    skyBottom: "#F5F4FA",
    furniture: "#3E3E4B",
    wood: "#A68766",
    variant: 0,
  },
  {
    id: "house-02",
    category: "house",
    roomLabelCs: "Moderní vila",
    wall: "#F5F5F8",
    wallShade: "#E2E2EB",
    floor: "#B5C5AF",
    accent: "#5B2FC2",
    skyTop: "#E2DCFA",
    skyBottom: "#F8F7FC",
    furniture: "#272731",
    wood: "#B89977",
    variant: 1,
  },
  {
    id: "house-03",
    category: "house",
    roomLabelCs: "Dům se slunnou terasou",
    wall: "#F6F3EE",
    wallShade: "#E4DDD3",
    floor: "#BECCB6",
    accent: "#8560F5",
    skyTop: "#DDE2F5",
    skyBottom: "#F7F6FA",
    furniture: "#484856",
    wood: "#9E7E5C",
    variant: 2,
  },
  {
    id: "house-04",
    category: "house",
    roomLabelCs: "Řadový rodinný dům",
    wall: "#F4F4F6",
    wallShade: "#E1E1E8",
    floor: "#B6C4B0",
    accent: "#6D3FE0",
    skyTop: "#E0DAF7",
    skyBottom: "#F6F6FA",
    furniture: "#393947",
    wood: "#AD8E6D",
    variant: 0,
  },
  {
    id: "house-05",
    category: "house",
    roomLabelCs: "Pohled ze zahrady",
    wall: "#F8F6F2",
    wallShade: "#E6E0D7",
    floor: "#AFC1A8",
    accent: "#6D3FE0",
    skyTop: "#E4DFFA",
    skyBottom: "#F9F8FB",
    furniture: "#32323E",
    wood: "#A38361",
    variant: 1,
  },
  // Land (2)
  {
    id: "land-01",
    category: "land",
    roomLabelCs: "Stavební pozemek",
    wall: "#C7D4BF",
    wallShade: "#B2C2A8",
    floor: "#9FB394",
    accent: "#6D3FE0",
    skyTop: "#D9D3F5",
    skyBottom: "#F5F4FA",
    furniture: "#4E5B47",
    wood: "#8D7B68",
    variant: 0,
  },
  {
    id: "land-02",
    category: "land",
    roomLabelCs: "Pozemek s výhledem do krajiny",
    wall: "#CCD6C4",
    wallShade: "#B7C5AD",
    floor: "#A5B89A",
    accent: "#8560F5",
    skyTop: "#DCE0F5",
    skyBottom: "#F7F6FA",
    furniture: "#55634E",
    wood: "#9A8672",
    variant: 1,
  },
  // Commercial (2)
  {
    id: "commercial-01",
    category: "commercial",
    roomLabelCs: "Kancelářské prostory",
    wall: "#F4F4F7",
    wallShade: "#E2E2EB",
    floor: "#CFCFD8",
    accent: "#6D3FE0",
    skyTop: "#E3DDF8",
    skyBottom: "#F8F8FC",
    furniture: "#2E2E3A",
    wood: "#B49675",
    variant: 0,
  },
  {
    id: "commercial-02",
    category: "commercial",
    roomLabelCs: "Obchodní a komerční prostor",
    wall: "#F6F5F8",
    wallShade: "#E4E1EE",
    floor: "#D4D2DC",
    accent: "#5B2FC2",
    skyTop: "#E7E2FA",
    skyBottom: "#FAFAFC",
    furniture: "#3E3E4B",
    wood: "#A88A69",
    variant: 1,
  },
  // Other / Garage (2)
  {
    id: "other-01",
    category: "other",
    roomLabelCs: "Garáž a parkovací stání",
    wall: "#EFEFF3",
    wallShade: "#DDDDE5",
    floor: "#C8C8D2",
    accent: "#6D3FE0",
    skyTop: "#E2DDF6",
    skyBottom: "#F5F5F9",
    furniture: "#3E3E4B",
    wood: "#9C9CAA",
    variant: 0,
  },
  {
    id: "other-02",
    category: "other",
    roomLabelCs: "Kryté parkovací místo",
    wall: "#F2F2F5",
    wallShade: "#E0E0E8",
    floor: "#CECED7",
    accent: "#8560F5",
    skyTop: "#E6E2F8",
    skyBottom: "#F7F7FA",
    furniture: "#4A4A58",
    wood: "#8A8A99",
    variant: 1,
  },
];

function renderSceneSvg(scene: SceneSpec): string {
  const { wall, wallShade, floor, accent, skyTop, skyBottom, furniture, wood, variant, category } =
    scene;
  const shift = variant * 28;

  if (category === "land") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skyTop}" />
          <stop offset="100%" stop-color="${skyBottom}" />
        </linearGradient>
        <linearGradient id="meadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${wall}" />
          <stop offset="100%" stop-color="${floor}" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1067" fill="url(#sky)" />
      <circle cx="${1220 - shift}" cy="220" r="88" fill="#FFFFFF" fill-opacity="0.65" />
      <path d="M0 590 Q 420 510 860 570 T 1600 540 L 1600 1067 L 0 1067 Z" fill="${wallShade}" />
      <path d="M0 660 Q 520 600 1080 650 T 1600 620 L 1600 1067 L 0 1067 Z" fill="url(#meadow)" />
      <polygon points="${340 + shift},860 ${1260 - shift},860 ${1060 - shift},670 ${540 + shift},670" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="4" stroke-dasharray="16 12" />
      <circle cx="240" cy="560" r="76" fill="${furniture}" fill-opacity="0.55" />
      <circle cx="320" cy="590" r="54" fill="${furniture}" fill-opacity="0.45" />
      <circle cx="1360" cy="530" r="84" fill="${furniture}" fill-opacity="0.5" />
      <rect x="234" y="610" width="12" height="58" rx="4" fill="${wood}" />
      <rect x="1354" y="590" width="12" height="62" rx="4" fill="${wood}" />
    </svg>`;
  }

  if (category === "house") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skyTop}" />
          <stop offset="100%" stop-color="${skyBottom}" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1067" fill="url(#sky)" />
      <rect y="730" width="1600" height="337" fill="${floor}" />
      <rect x="${310 + shift}" y="380" width="920" height="370" rx="10" fill="${wall}" />
      <rect x="${310 + shift}" y="380" width="320" height="370" fill="${wallShade}" />
      <rect x="${280 + shift}" y="346" width="980" height="44" rx="8" fill="${furniture}" />
      <rect x="${360 + shift}" y="440" width="220" height="210" rx="8" fill="${skyTop}" stroke="${furniture}" stroke-width="8" />
      <rect x="${670 + shift}" y="440" width="240" height="310" rx="8" fill="${skyBottom}" stroke="${furniture}" stroke-width="8" />
      <line x1="${790 + shift}" y1="440" x2="${790 + shift}" y2="750" stroke="${furniture}" stroke-width="6" />
      <rect x="${960 + shift}" y="440" width="210" height="180" rx="8" fill="${skyTop}" stroke="${furniture}" stroke-width="8" />
      <rect x="${960 + shift}" y="660" width="210" height="90" rx="4" fill="${wood}" />
      <rect x="${620 + shift}" y="750" width="340" height="24" rx="6" fill="${wood}" />
      <circle cx="190" cy="610" r="90" fill="#7D9677" fill-opacity="0.72" />
      <circle cx="1410" cy="590" r="102" fill="#7D9677" fill-opacity="0.65" />
      <rect x="${420 + shift}" y="690" width="110" height="14" rx="7" fill="${accent}" fill-opacity="0.45" />
    </svg>`;
  }

  if (category === "exterior") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skyTop}" />
          <stop offset="100%" stop-color="${skyBottom}" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1067" fill="url(#sky)" />
      <rect y="830" width="1600" height="237" fill="${floor}" />
      <rect x="${260 + shift}" y="170" width="1040" height="680" rx="16" fill="${wall}" />
      <rect x="${260 + shift}" y="170" width="260" height="680" fill="${wallShade}" />
      ${[0, 1, 2]
        .map((row) =>
          [0, 1, 2, 3]
            .map(
              (col) => `
          <rect x="${320 + shift + col * 235}" y="${230 + row * 190}" width="170" height="128" rx="8" fill="${skyTop}" stroke="${furniture}" stroke-width="6" />
          <rect x="${312 + shift + col * 235}" y="${358 + row * 190}" width="186" height="18" rx="4" fill="${wood}" />
        `,
            )
            .join(""),
        )
        .join("")}
      <rect x="${700 + shift}" y="720" width="180" height="130" rx="14" fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-width="5" />
      <circle cx="170" cy="740" r="88" fill="#88A083" fill-opacity="0.7" />
      <circle cx="1430" cy="720" r="96" fill="#88A083" fill-opacity="0.6" />
    </svg>`;
  }

  if (category === "kitchen") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
      <rect width="1600" height="740" fill="${wall}" />
      <rect width="340" height="740" fill="${wallShade}" />
      <rect y="740" width="1600" height="327" fill="${floor}" />
      <rect x="420" y="130" width="840" height="170" rx="10" fill="${furniture}" stroke="#DDDDE3" stroke-width="4" />
      <rect x="420" y="340" width="840" height="140" fill="${wallShade}" />
      <rect x="420" y="480" width="840" height="260" rx="8" fill="${furniture}" stroke="#DDDDE3" stroke-width="4" />
      <rect x="414" y="472" width="852" height="22" rx="4" fill="${wood}" />
      <rect x="${500 + shift}" y="630" width="580" height="180" rx="14" fill="${wood}" />
      <rect x="${490 + shift}" y="616" width="600" height="24" rx="8" fill="${furniture}" stroke="#DDDDE3" stroke-width="3" />
      <circle cx="660" cy="100" r="24" fill="${accent}" fill-opacity="0.35" />
      <circle cx="880" cy="100" r="24" fill="${accent}" fill-opacity="0.35" />
      <line x1="660" y1="0" x2="660" y2="76" stroke="#6A6A7A" stroke-width="3" />
      <line x1="880" y1="0" x2="880" y2="76" stroke="#6A6A7A" stroke-width="3" />
      <rect x="1320" y="160" width="210" height="460" rx="12" fill="${skyTop}" stroke="#DDDDE3" stroke-width="6" />
    </svg>`;
  }

  if (category === "bedroom") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
      <rect width="1600" height="740" fill="${wall}" />
      <rect x="1160" y="0" width="440" height="740" fill="${wallShade}" />
      <rect y="740" width="1600" height="327" fill="${floor}" />
      <rect x="120" y="130" width="320" height="450" rx="14" fill="${skyTop}" stroke="#DDDDE3" stroke-width="8" />
      <polygon points="120,580 440,580 760,960 220,960" fill="#FFFFFF" fill-opacity="0.22" />
      <rect x="${560 + shift}" y="390" width="580" height="210" rx="22" fill="${wood}" />
      <rect x="${540 + shift}" y="530" width="620" height="240" rx="24" fill="#FFFFFF" stroke="#DDDDE3" stroke-width="4" />
      <rect x="${540 + shift}" y="610" width="620" height="160" rx="20" fill="${accent}" fill-opacity="0.18" />
      <rect x="${585 + shift}" y="470" width="230" height="90" rx="24" fill="${furniture}" />
      <rect x="${865 + shift}" y="470" width="230" height="90" rx="24" fill="${furniture}" />
      <rect x="${670 + shift}" y="190" width="360" height="145" rx="12" fill="#FFFFFF" stroke="#DDDDE3" stroke-width="5" />
      <circle cx="${850 + shift}" cy="262" r="44" fill="${accent}" fill-opacity="0.24" />
    </svg>`;
  }

  if (category === "bathroom") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
      <rect width="1600" height="740" fill="${wall}" />
      <rect y="740" width="1600" height="327" fill="${floor}" />
      <rect x="260" y="130" width="380" height="380" rx="190" fill="${skyTop}" stroke="#FFFFFF" stroke-width="14" />
      <rect x="220" y="560" width="460" height="180" rx="16" fill="${wood}" />
      <rect x="330" y="510" width="240" height="60" rx="18" fill="${furniture}" stroke="#DDDDE3" stroke-width="4" />
      <rect x="820" y="490" width="560" height="250" rx="70" fill="${furniture}" stroke="#DDDDE3" stroke-width="6" />
      <rect x="860" y="150" width="480" height="220" rx="12" fill="${wallShade}" />
      <rect x="1080" y="210" width="90" height="14" rx="7" fill="${accent}" fill-opacity="0.4" />
    </svg>`;
  }

  if (category === "commercial" || category === "other") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
      <rect width="1600" height="740" fill="${wall}" />
      <rect width="380" height="740" fill="${wallShade}" />
      <rect y="740" width="1600" height="327" fill="${floor}" />
      <rect x="140" y="110" width="1320" height="440" rx="16" fill="${skyTop}" stroke="${furniture}" stroke-width="8" />
      <line x1="580" y1="110" x2="580" y2="550" stroke="${furniture}" stroke-width="6" />
      <line x1="1020" y1="110" x2="1020" y2="550" stroke="${furniture}" stroke-width="6" />
      <rect x="${420 + shift}" y="610" width="720" height="34" rx="8" fill="${wood}" />
      <rect x="${460 + shift}" y="644" width="22" height="150" rx="6" fill="${furniture}" />
      <rect x="${1080 + shift}" y="644" width="22" height="150" rx="6" fill="${furniture}" />
      <rect x="${690 + shift}" y="520" width="180" height="90" rx="12" fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-width="4" />
    </svg>`;
  }

  // Default: living room
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1067" width="1600" height="1067">
    <defs>
      <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}" />
        <stop offset="100%" stop-color="${skyBottom}" />
      </linearGradient>
    </defs>
    <rect width="1600" height="740" fill="${wall}" />
    <rect width="360" height="740" fill="${wallShade}" />
    <rect y="740" width="1600" height="327" fill="${floor}" />
    <rect x="150" y="110" width="440" height="510" rx="16" fill="url(#win)" stroke="#FFFFFF" stroke-width="12" />
    <line x1="370" y1="110" x2="370" y2="620" stroke="#FFFFFF" stroke-width="8" />
    <polygon points="150,620 590,620 960,960 280,960" fill="#FFFFFF" fill-opacity="0.22" />
    <rect x="${740 + shift}" y="170" width="420" height="210" rx="16" fill="#FFFFFF" stroke="#DDDDE3" stroke-width="5" />
    <path d="M${830 + shift} 330 Q ${950 + shift} 210 ${1070 + shift} 330" fill="${accent}" fill-opacity="0.24" />
    <circle cx="${1020 + shift}" cy="240" r="32" fill="${accent}" fill-opacity="0.45" />
    <rect x="${640 + shift}" y="520" width="640" height="190" rx="34" fill="${furniture}" />
    <rect x="${620 + shift}" y="580" width="680" height="150" rx="28" fill="${furniture}" />
    <rect x="${680 + shift}" y="556" width="110" height="86" rx="20" fill="${accent}" fill-opacity="0.65" />
    <rect x="${760 + shift}" y="760" width="400" height="54" rx="16" fill="${wood}" />
    <rect x="${780 + shift}" y="814" width="18" height="76" rx="6" fill="${furniture}" />
    <rect x="${1120 + shift}" y="814" width="18" height="76" rx="6" fill="${furniture}" />
    <ellipse cx="1410" cy="650" rx="64" ry="88" fill="#7D9677" fill-opacity="0.7" />
    <rect x="1376" y="710" width="68" height="86" rx="14" fill="#FFFFFF" stroke="#DDDDE3" stroke-width="4" />
  </svg>`;
}

export async function generatePlaceholderPhotos(force = false): Promise<PoolPhotoMeta[]> {
  const storageDir = path.resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");
  const poolStorageDir = path.join(storageDir, "pool");
  const manifestDir = path.resolve(process.cwd(), "seed", "generated");
  const manifestPath = path.join(manifestDir, "pool-manifest.json");
  const userPhotosDir = path.resolve(process.cwd(), "seed", "photos");

  if (!force) {
    try {
      const existing = await fs.readFile(manifestPath, "utf-8");
      const parsed = JSON.parse(existing) as PoolPhotoMeta[];
      if (parsed.length >= 20) {
        // Verify first file exists in storage
        const firstPath = path.join(storageDir, `${parsed[0]!.storageKey}-card.webp`);
        await fs.access(firstPath);
        return parsed;
      }
    } catch {
      // Proceed to generate
    }
  }

  await fs.mkdir(poolStorageDir, { recursive: true });
  await fs.mkdir(manifestDir, { recursive: true });

  // Optional user-supplied real photos in seed/photos/*.jpg
  let userFiles: string[] = [];
  try {
    const entries = await fs.readdir(userPhotosDir);
    userFiles = entries.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  } catch {
    userFiles = [];
  }

  const results: PoolPhotoMeta[] = [];

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i]!;
    const storageKey = `pool/${scene.id}`;
    const sourceBuffer =
      userFiles[i] !== undefined
        ? await fs.readFile(path.join(userPhotosDir, userFiles[i]!))
        : Buffer.from(renderSceneSvg(scene), "utf-8");

    const baseSharp = sharp(sourceBuffer).rotate();

    const fullPath = path.join(storageDir, `${storageKey}-full.webp`);
    const cardPath = path.join(storageDir, `${storageKey}-card.webp`);
    const thumbPath = path.join(storageDir, `${storageKey}-thumb.webp`);

    const [fullMeta, blurBuffer] = await Promise.all([
      baseSharp.clone().resize(1600, 1067, { fit: "cover" }).webp({ quality: 82 }).toFile(fullPath),
      baseSharp.clone().resize(16, 11, { fit: "cover" }).webp({ quality: 40 }).toBuffer(),
      baseSharp.clone().resize(640, 427, { fit: "cover" }).webp({ quality: 80 }).toFile(cardPath),
      baseSharp.clone().resize(320, 213, { fit: "cover" }).webp({ quality: 76 }).toFile(thumbPath),
    ]);

    results.push({
      id: scene.id,
      storageKey,
      category: scene.category,
      roomLabelCs: scene.roomLabelCs,
      width: fullMeta.width,
      height: fullMeta.height,
      blurDataUrl: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
    });
  }

  // Generate 3 clean agency logos (4th agency intentionally has no logo per SEED-DATA.md)
  const agenciesDir = path.join(storageDir, "agencies");
  await fs.mkdir(agenciesDir, { recursive: true });
  const agencyBadges = [
    { file: "bohemia-home.webp", bg: "#17171E", fg: "#FFFFFF", accent: "#8560F5", text: "BH" },
    { file: "moravia-reality.webp", bg: "#ECE6FF", fg: "#482699", accent: "#6D3FE0", text: "MR" },
    { file: "atelier-bydleni.webp", bg: "#FAFAFB", fg: "#17171E", accent: "#6D3FE0", text: "AB" },
  ];
  for (const badge of agencyBadges) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <rect width="240" height="240" rx="48" fill="${badge.bg}" />
      <rect x="20" y="20" width="200" height="200" rx="36" fill="none" stroke="${badge.accent}" stroke-width="6" stroke-opacity="0.4" />
      <text x="120" y="138" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="84" fill="${badge.fg}">${badge.text}</text>
    </svg>`;
    await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(path.join(agenciesDir, badge.file));
  }

  await fs.writeFile(manifestPath, JSON.stringify(results, null, 2), "utf-8");
  return results;
}

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  const started = Date.now();
  generatePlaceholderPhotos(true)
    .then((items) => {
      console.log(
        `Vygenerováno ${items.length} obrázků (thumb/card/full WebP + blur) za ${Date.now() - started} ms.`,
      );
    })
    .catch((err) => {
      console.error("Chyba generování fotek:", err);
      process.exit(1);
    });
}
