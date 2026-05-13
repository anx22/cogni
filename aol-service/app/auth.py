"""Bearer-Auth für /aol/* Endpoints."""
import os
from fastapi import Header, HTTPException, status

EXPECTED = os.environ.get("AOL_SERVICE_TOKEN", "")


def require_bearer(authorization: str = Header(default="")) -> None:
    if not EXPECTED:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AOL_SERVICE_TOKEN nicht konfiguriert",
        )
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer-Token fehlt")
    token = authorization.split(" ", 1)[1].strip()
    if token != EXPECTED:
        raise HTTPException(status_code=403, detail="Ungültiger Token")
