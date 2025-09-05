from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.ext.declarative import Base
from sqlalchemy import Column, Integer, String
from backend.core.config import settings

DATABASE_URL = settings.database_url

