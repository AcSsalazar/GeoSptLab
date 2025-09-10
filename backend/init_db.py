"""
Database initialization script for SPT Parameters Calculator.
"""
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import create_tables, drop_tables, engine
from app.models import *  # Import all models to register them

def init_database():
    """Initialize the database with all tables."""
    print("Initializing SPT Parameters Calculator database...")
    
    try:
        # Create all tables
        create_tables()
        print("✓ Database tables created successfully!")
        
        # Test the connection
        with engine.connect() as conn:
            print("✓ Database connection successful!")
            
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        return False
    
    return True

def reset_database():
    """Reset the database by dropping and recreating all tables."""
    print("Resetting SPT Parameters Calculator database...")
    
    try:
        # Drop all tables
        drop_tables()
        print("✓ Existing tables dropped!")
        
        # Create all tables
        create_tables()
        print("✓ Database tables recreated successfully!")
        
    except Exception as e:
        print(f"✗ Error resetting database: {e}")
        return False
    
    return True

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize SPT Parameters Calculator database")
    parser.add_argument("--reset", action="store_true", help="Reset database by dropping and recreating all tables")
    
    args = parser.parse_args()
    
    if args.reset:
        success = reset_database()
    else:
        success = init_database()
    
    if success:
        print("Database initialization completed successfully!")
    else:
        print("Database initialization failed!")
        sys.exit(1)