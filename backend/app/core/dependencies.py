"""
Common dependency functions for FastAPI route handlers.

Provides reusable dependencies for authentication, authorization,
and database access.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role

# Type aliases for cleaner dependency injection
DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
StaffUser = Annotated[dict, Depends(require_role(["staff"]))]
ParentUser = Annotated[dict, Depends(require_role(["parent"]))]
StudentUser = Annotated[dict, Depends(require_role(["student"]))]
