"""
User endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_active_user, get_current_superuser
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import MessageResponse
from app.services.user_service import user_service

router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_superuser),
):
    """
    Create new user. Only superusers can create users.
    """
    return user_service.create_user(db, user_create=user_in)


@router.get("/", response_model=List[UserResponse], tags=["Users"])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_superuser),
):
    """
    Retrieve users. Only superusers can list all users.
    """
    return user_service.get_users(db, skip=skip, limit=limit)


@router.get("/me", response_model=UserResponse, tags=["Users"])
def read_user_me(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user information.
    """
    return UserResponse.from_orm(current_user)


@router.get("/{user_id}", response_model=UserResponse, tags=["Users"])
def read_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific user by ID. Users can only get their own information unless they are superuser.
    """
    user = user_service.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Users can only access their own data unless they are superuser
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse, tags=["Users"])
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Update user. Users can only update their own information unless they are superuser.
    """
    # Users can only update their own data unless they are superuser
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return user_service.update_user(db, user_id=user_id, user_update=user_in)


@router.delete("/{user_id}", response_model=MessageResponse, tags=["Users"])
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_superuser),
):
    """
    Delete user. Only superusers can delete users.
    """
    user_service.delete_user(db, user_id=user_id)
    return MessageResponse(message="User deleted successfully")
