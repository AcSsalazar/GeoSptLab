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
    parser.add_argument("--create-only", action="store_true", help="Create tables only (don't drop existing)")
    parser.add_argument("--drop-only", action="store_true", help="Drop tables only (don't recreate)")
    
    args = parser.parse_args()
    
    if args.reset:
        success = reset_database()
    elif args.create_only:
        success = init_database()
    elif args.drop_only:
        try:
            drop_tables()
            print("✓ All tables dropped successfully!")
            success = True
        except Exception as e:
            print(f"✗ Error dropping tables: {e}")
            success = False
    else:
        success = init_database()
    
    if success:
        print("Database operation completed successfully!")
    else:
        print("Database operation failed!")
        sys.exit(1)