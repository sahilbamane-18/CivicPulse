from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile_number = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    points = db.Column(db.Integer, default=0)
    
    # --- ROLE: Distinguishes 'admin' vs 'user' ---
    role = db.Column(db.String(10), default='user')
    
    # --- PROFILE PICTURE ---
    profile_pic = db.Column(db.String(100), nullable=False, default='default_user.jpg')
    
    complaints = db.relationship('Complaint', backref='author', lazy=True)

class Complaint(db.Model):
    __tablename__ = 'complaints'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)
    
    category = db.Column(db.String(50), nullable=False, default='Other')
    priority = db.Column(db.String(20), default='Medium', nullable=False)
    address = db.Column(db.String(200), nullable=False)
    
    # User Evidence
    image_file = db.Column(db.String(100), nullable=False, default='default.jpg')
    
    # Location
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # --- ADMIN RESOLUTION FIELDS ---
    resolution_image = db.Column(db.String(100), nullable=True)
    admin_comment = db.Column(db.Text, nullable=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)