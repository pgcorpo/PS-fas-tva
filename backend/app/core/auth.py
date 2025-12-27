from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User

security = HTTPBearer(auto_error=False)


def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token from NextAuth.
    """
    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SECRET,
            algorithms=["HS256"],
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    Expects a Bearer token in the Authorization header.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = verify_token(credentials.credentials)

    # Extract user identifier from token
    # NextAuth typically includes 'sub' (subject) or 'email'
    user_email = token_data.get("email")
    google_user_id = token_data.get("sub")

    if not user_email or not google_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Find or create user
    user = db.query(User).filter(User.google_user_id == google_user_id).first()

    if not user:
        # Create new user on first login
        user = User(
            google_user_id=google_user_id,
            email=user_email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
