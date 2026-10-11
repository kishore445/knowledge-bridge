"""FastAPI dependency injectors for auth."""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from .services.auth_service import decode_token
from .database import col

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalid or expired")
    user = await col("users").find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    user["_id"] = str(user["_id"])
    return user


async def get_optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> Optional[dict]:
    if not creds:
        return None
    try:
        return await get_current_user(creds)
    except HTTPException:
        return None


def require_role(*roles: str):
    async def _check(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(roles)}",
            )
        return user
    return _check


require_admin = require_role("admin")
require_school = require_role("school", "admin")
require_kabadiwala = require_role("kabadiwala", "admin")
require_donor = require_role("donor", "admin")
require_sponsor = require_role("sponsor", "admin")
