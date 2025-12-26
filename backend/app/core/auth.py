from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User

# TODO: Implement proper authentication
# For now, this is a placeholder that will be implemented with Google OAuth


async def get_current_user(
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user.
    This is a placeholder - will be implemented with proper OAuth.
    """
    # TODO: Extract user from session/token
    # For now, raise unauthorized
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )
