export interface MeasureConfig {
  type: string;
  params: Record<string, number | string>;
}

export interface MeasureResult {
  name: string;
  value: number | null;
  error?: string | null;
}

export interface Distribution {
  id: string;
  name: string;
  x: number[];
  weights: number[];
  measures: MeasureResult[];
}

export interface Table {
  id: string;
  name: string;
  distributionIds: string[];
  measureOrder: string[];
}

// All available measure types with their parameter definitions
export const MEASURE_TYPES: {
  type: string;
  label: string;
  params: {
    key: string;
    label: string;
    default: number | string;
    options?: string[];
  }[];
}[] = [
  {
    type: "EstebanRay",
    label: "Esteban-Ray",
    params: [{ key: "alpha", label: "alpha", default: 0.8 }],
  },
  { type: "BiPol", label: "BiPol", params: [] },
  {
    type: "MECNormalized",
    label: "MEC Normalized",
    params: [
      { key: "alpha", label: "alpha", default: 2 },
      { key: "beta", label: "beta", default: 1.15 },
    ],
  },
  {
    type: "MEC",
    label: "MEC",
    params: [
      { key: "alpha", label: "alpha", default: 2 },
      { key: "beta", label: "beta", default: 1.15 },
    ],
  },
  {
    type: "GeneralizedMEC",
    label: "Generalized MEC",
    params: [
      { key: "alpha", label: "alpha", default: 2 },
      {
        key: "alienation",
        label: "alienation",
        default: "d",
        options: [
          "d",
          "d^2",
          "d^3",
          "d+d^2",
          "d+2d^2",
          "exp(d)-1",
          "exp(2d)-1",
        ],
      },
    ],
  },
  { type: "EMD", label: "EMD", params: [] },
  { type: "Shannon", label: "Shannon", params: [] },
  { type: "VanDerEijk", label: "Van der Eijk", params: [] },
  { type: "Experts", label: "Experts (5-cat)", params: [] },
  {
    type: "GeneralizedER",
    label: "Generalized ER",
    params: [
      { key: "alpha", label: "alpha", default: 0.8 },
      {
        key: "alienation",
        label: "alienation",
        default: "d",
        options: [
          "d",
          "d^2",
          "d^3",
          "d+d^2",
          "d+2d^2",
          "exp(d)-1",
          "exp(2d)-1",
        ],
      },
    ],
  },
];

export function measureConfigName(cfg: MeasureConfig): string {
  const t = cfg.type;
  const p = cfg.params;
  if (t === "EstebanRay") return `ER(${p.alpha ?? 0.8})`;
  if (t === "BiPol") return "BiPol";
  if (t === "MECNormalized") return `MEC(${p.alpha ?? 2},${p.beta ?? 1.15})N`;
  if (t === "MEC") return `MEC(${p.alpha ?? 2},${p.beta ?? 1.15})`;
  if (t === "GeneralizedMEC")
    return `GMEC(${p.alpha ?? 2},${p.alienation ?? "d"})`;
  if (t === "EMD") return "EMD";
  if (t === "Shannon") return "Shannon";
  if (t === "VanDerEijk") return "VanDerEijk";
  if (t === "Experts") return "Experts";
  if (t === "GeneralizedER")
    return `GER(${p.alpha ?? 0.8},${p.alienation ?? "d"})`;
  return t;
}

const SIMPLE_MEASURES: Record<string, MeasureConfig> = {
  BiPol: { type: "BiPol", params: {} },
  EMD: { type: "EMD", params: {} },
  Shannon: { type: "Shannon", params: {} },
  VanDerEijk: { type: "VanDerEijk", params: {} },
  Experts: { type: "Experts", params: {} },
};

export function parseMeasureName(name: string): MeasureConfig | null {
  if (SIMPLE_MEASURES[name]) return SIMPLE_MEASURES[name];

  // MEC(a,b)N → MECNormalized
  let m = name.match(/^MEC\(([^,]+),([^)]+)\)N$/);
  if (m) {
    return {
      type: "MECNormalized",
      params: { alpha: parseFloat(m[1]), beta: parseFloat(m[2]) },
    };
  }

  // MEC(a,b) → MEC
  m = name.match(/^MEC\(([^,]+),([^)]+)\)$/);
  if (m) {
    const maybeBeta = parseFloat(m[2]);
    if (!Number.isNaN(maybeBeta)) {
      return {
        type: "MEC",
        params: { alpha: parseFloat(m[1]), beta: maybeBeta },
      };
    }

    // MEC(a,fn) → GeneralizedMEC (benchmark convention)
    return {
      type: "GeneralizedMEC",
      params: { alpha: parseFloat(m[1]), alienation: m[2] },
    };
  }

  // GMEC(a,fn) → GeneralizedMEC (API/UI convention)
  m = name.match(/^GMEC\(([^,]+),(.+)\)$/);
  if (m) {
    return {
      type: "GeneralizedMEC",
      params: { alpha: parseFloat(m[1]), alienation: m[2] },
    };
  }

  // GER(a,fn) → GeneralizedER (API convention)
  m = name.match(/^GER\(([^,]+),(.+)\)$/);
  if (m) {
    return {
      type: "GeneralizedER",
      params: { alpha: parseFloat(m[1]), alienation: m[2] },
    };
  }

  // ER(a,fn) → GeneralizedER (benchmark convention)
  m = name.match(/^ER\(([^,]+),(.+)\)$/);
  if (m) {
    return {
      type: "GeneralizedER",
      params: { alpha: parseFloat(m[1]), alienation: m[2] },
    };
  }

  // ER(a) → EstebanRay
  m = name.match(/^ER\(([^,)]+)\)$/);
  if (m) {
    return {
      type: "EstebanRay",
      params: { alpha: parseFloat(m[1]) },
    };
  }

  return null;
}
