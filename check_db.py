from app import app
from database import db, User

with app.app_context():
    # Get all users
    users = User.query.all()
    
    print(f"Total Users Found: {len(users)}")
    print("-" * 30)
    for user in users:
        print(f"ID: {user.id} | Name: {user.full_name} | Email: {user.email}")