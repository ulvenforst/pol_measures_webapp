import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from measures.metrics.literature import (
    EMDPol,
    EstebanRay,
    Experts,
    GeneralizedER,
    ShannonPol,
    VanDerEijkPol,
)
from measures.metrics.proposed import MEC, BiPol, GeneralizedMEC, MECNormalized
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Predefined alienation functions for GeneralizedER
ALIENATION_FUNCTIONS = {
    "d": lambda d: d,
    "d^2": lambda d: d**2,
    "d^3": lambda d: d**3,
    "d+d^2": lambda d: d + d**2,
    "d+2d^2": lambda d: d + 2 * d**2,
    "exp(d)-1": lambda d: np.exp(d) - 1,
    "exp(2d)-1": lambda d: np.exp(2 * d) - 1,
}


class MeasureConfig(BaseModel):
    type: str  # EstebanRay, BiPol, MECNormalized, MEC, GeneralizedMEC, EMD, Shannon, VanDerEijk, Experts, GeneralizedER
    params: dict[str, float | str] = {}


class ComputeRequest(BaseModel):
    x: list[float]
    weights: list[float]
    measures: list[MeasureConfig]


class MeasureResultOut(BaseModel):
    name: str
    value: float | None
    error: str | None = None


class ComputeResponse(BaseModel):
    measures: list[MeasureResultOut]


def build_measure(cfg: MeasureConfig):
    """Instantiate a measure from a config."""
    t = cfg.type
    p = cfg.params

    if t == "EstebanRay":
        alpha = float(p.get("alpha", 0.8))
        return f"ER({alpha})", EstebanRay(alpha=alpha)

    if t == "BiPol":
        return "BiPol", BiPol()

    if t == "MECNormalized":
        alpha = float(p.get("alpha", 2))
        beta = float(p.get("beta", 1.15))
        return f"MEC({alpha},{beta})N", MECNormalized(alpha=alpha, beta=beta)

    if t == "MEC":
        alpha = float(p.get("alpha", 2))
        beta = float(p.get("beta", 1.15))
        return f"MEC({alpha},{beta})", MEC(alpha=alpha, beta=beta)

    if t == "GeneralizedMEC":
        alpha = float(p.get("alpha", 2))
        alienation_key = str(p.get("alienation", "d"))
        alienation_fn = ALIENATION_FUNCTIONS.get(alienation_key)
        if alienation_fn is None:
            raise ValueError(f"Unknown alienation: {alienation_key}")
        return f"GMEC({alpha},{alienation_key})", GeneralizedMEC(
            alpha=alpha, alienation=alienation_fn
        )

    if t == "EMD":
        return "EMD", EMDPol()

    if t == "Shannon":
        return "Shannon", ShannonPol()

    if t == "VanDerEijk":
        return "VanDerEijk", VanDerEijkPol()

    if t == "Experts":
        return "Experts", Experts()

    if t == "GeneralizedER":
        alpha = float(p.get("alpha", 0.8))
        alienation_key = str(p.get("alienation", "d"))
        alienation_fn = ALIENATION_FUNCTIONS.get(alienation_key)
        if alienation_fn is None:
            raise ValueError(f"Unknown alienation: {alienation_key}")
        return f"GER({alpha},{alienation_key})", GeneralizedER(
            alpha=alpha, alienation=alienation_fn
        )

    raise ValueError(f"Unknown measure type: {t}")


@app.post("/compute", response_model=ComputeResponse)
def compute(req: ComputeRequest):
    x = np.array(req.x)
    weights = np.array(req.weights)
    results: list[MeasureResultOut] = []

    for cfg in req.measures:
        try:
            name, measure = build_measure(cfg)
            value = float(measure(x, weights))
            results.append(MeasureResultOut(name=name, value=value))
        except Exception as e:
            # Try to build a name even on error
            name = cfg.type
            results.append(MeasureResultOut(name=name, value=None, error=str(e)))

    return ComputeResponse(measures=results)


@app.get("/alienation-functions")
def get_alienation_functions():
    """Return available alienation function keys."""
    return list(ALIENATION_FUNCTIONS.keys())
