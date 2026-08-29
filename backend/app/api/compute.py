from fastapi import APIRouter, Query

router = APIRouter(tags=["experiments"])


@router.get("/compute")
def compute_workload(
    iterations: int = Query(default=100_000, ge=10_000, le=1_000_000),
) -> dict[str, int]:
    """Run bounded CPU work for later controlled load-testing experiments.

    This is not a business operation and must not be expanded into an unbounded
    work endpoint. The cap keeps local demonstration traffic controlled.
    """

    checksum = 0
    for value in range(iterations):
        checksum = (checksum + (value * value)) % 1_000_003
    return {"iterations": iterations, "checksum": checksum}
