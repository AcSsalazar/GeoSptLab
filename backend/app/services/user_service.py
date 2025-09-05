"""
User service for business logic operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.repositories.user_repo import user_repo


class UserService:
    """Service class for user business logic."""
    
    def __init__(self):
        self.user_repo = user_repo
    
    def create_user(self, db: Session, user_create: UserCreate) -> UserResponse:
        """Create a new user."""
        # Check if user already exists
        existing_user = self.user_repo.get_by_email(db, email=user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user = self.user_repo.create(db, obj_in=user_create)
        return UserResponse.from_orm(user)
    
    def get_user(self, db: Session, user_id: int) -> Optional[UserResponse]:
        """Get user by ID."""
        user = self.user_repo.get(db, id=user_id)
        if not user:
            return None
        return UserResponse.from_orm(user)
    
    def get_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        """Get list of users."""
        users = self.user_repo.get_multi(db, skip=skip, limit=limit)
        return [UserResponse.from_orm(user) for user in users]
    
    def update_user(self, db: Session, user_id: int, user_update: UserUpdate) -> UserResponse:
        """Update user information."""
        user = self.user_repo.get(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        updated_user = self.user_repo.update(db, db_obj=user, obj_in=user_update)
        return UserResponse.from_orm(updated_user)
    
    def delete_user(self, db: Session, user_id: int) -> bool:
        """Delete user."""
        user = self.user_repo.get(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        self.user_repo.delete(db, id=user_id)
        return True
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        return self.user_repo.authenticate(db, email=email, password=password)


# Global instance
user_service = UserService()
