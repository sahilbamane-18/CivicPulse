import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func
from database import db, User, Complaint 
from datetime import datetime

app = Flask(__name__)

# --- CONFIGURATION ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:YOUR_LOCAL_PASSWORD_HERE@localhost/civic_pulse_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'civic_pulse_secret_key')

# UPLOAD FOLDERS
UPLOAD_FOLDER = 'static/uploads/complaints'
PROFILE_FOLDER = 'static/uploads/profiles'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROFILE_FOLDER'] = PROFILE_FOLDER

os.makedirs(os.path.join(app.root_path, UPLOAD_FOLDER), exist_ok=True)
os.makedirs(os.path.join(app.root_path, PROFILE_FOLDER), exist_ok=True)

db.init_app(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- ROUTES ---

@app.route('/')
def index():
    if 'user_id' in session: 
        if session.get('role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('dashboard'))
    return render_template('auth.html')

# --- USER DASHBOARD ---
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('index'))
    if session.get('role') == 'admin': return redirect(url_for('admin_dashboard'))

    user = User.query.get(session['user_id'])
    stats = {
        'total': Complaint.query.count(),
        'pending': Complaint.query.filter_by(status='Pending').count(),
        'progress': Complaint.query.filter_by(status='In Progress').count(),
        'resolved': Complaint.query.filter_by(status='Resolved').count()
    }
    leaderboard = User.query.filter(User.role != 'admin').order_by(User.points.desc()).limit(3).all()
    return render_template('dashboard.html', user=user, stats=stats, leaderboard=leaderboard)

# --- ADMIN: DASHBOARD ---
@app.route('/admin/dashboard')
def admin_dashboard():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    if user.role != 'admin': return redirect(url_for('dashboard'))
    
    all_complaints = Complaint.query.order_by(Complaint.date_posted.desc()).all()
    stats = {
        'total': Complaint.query.count(),
        'pending': Complaint.query.filter_by(status='Pending').count(),
        'progress': Complaint.query.filter_by(status='In Progress').count(),
        'resolved': Complaint.query.filter_by(status='Resolved').count()
    }
    return render_template('admin/dashboard.html', user=user, complaints=all_complaints, stats=stats)

# --- ADMIN: MANAGE REPORTS ---
@app.route('/admin/manage-reports')
def admin_manage_reports():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    if user.role != 'admin': return redirect(url_for('dashboard'))
    
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    search_query = request.args.get('search')

    query = Complaint.query
    if status_filter: query = query.filter_by(status=status_filter)
    if priority_filter: query = query.filter_by(priority=priority_filter)
    
    if search_query:
        search = f"%{search_query}%"
        query = query.join(User).filter(
            (Complaint.title.ilike(search)) | 
            (Complaint.id.astype(str).ilike(search)) |
            (User.full_name.ilike(search))
        )

    complaints = query.order_by(Complaint.date_posted.desc()).all()
    stats = {'pending': Complaint.query.filter_by(status='Pending').count()}
    return render_template('admin/manage_reports.html', user=user, complaints=complaints, stats=stats)

# --- ADMIN: CITIZEN RECORDS ---
@app.route('/admin/citizens')
def admin_citizens():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    if user.role != 'admin': return redirect(url_for('dashboard'))

    citizens = User.query.filter(User.role != 'admin').order_by(User.points.desc()).all()
    stats = {'pending': Complaint.query.filter_by(status='Pending').count()}
    return render_template('admin/citizen_records.html', user=user, citizens=citizens, stats=stats)

# --- ADMIN: CITY STATS ---
@app.route('/admin/stats')
def admin_stats():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    if user.role != 'admin': return redirect(url_for('dashboard'))

    # Get selected year (default to current year)
    selected_year = request.args.get('year', datetime.utcnow().year, type=int)
    base_query = Complaint.query.filter(func.extract('year', Complaint.date_posted) == selected_year)

    categories = db.session.query(Complaint.category, func.count(Complaint.id)).filter(func.extract('year', Complaint.date_posted) == selected_year).group_by(Complaint.category).all()
    
    timeline_counts = [0] * 12
    timeline_results = db.session.query(func.extract('month', Complaint.date_posted), func.count(Complaint.id)).filter(func.extract('year', Complaint.date_posted) == selected_year).group_by(func.extract('month', Complaint.date_posted)).all()
    for month, count in timeline_results:
        if month: timeline_counts[int(month)-1] = count

    resolved_counts = [0] * 12
    resolved_results = db.session.query(func.extract('month', Complaint.date_posted), func.count(Complaint.id)).filter(func.extract('year', Complaint.date_posted) == selected_year, Complaint.status == 'Resolved').group_by(func.extract('month', Complaint.date_posted)).all()
    for month, count in resolved_results:
        if month: resolved_counts[int(month)-1] = count

    total_reports = base_query.count()
    resolved_count = base_query.filter_by(status='Resolved').count()
    rate = int((resolved_count / total_reports * 100)) if total_reports > 0 else 0
    active_citizens = User.query.filter(User.points > 0).count()
    
    kpi_stats = {
        'total': total_reports,
        'pending': base_query.filter_by(status='Pending').count(),
        'resolution_rate': rate,
        'active_citizens': active_citizens
    }

    return render_template('admin/city_stats.html', 
                           user=user, 
                           categories=categories, 
                           timeline=timeline_counts, 
                           resolved_timeline=resolved_counts,
                           stats=kpi_stats,
                           selected_year=selected_year)

# --- ADMIN ACTIONS ---
@app.route('/admin/mark_progress/<int:complaint_id>', methods=['POST'])
def mark_in_progress(complaint_id):
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 403
    user = User.query.get(session['user_id'])
    if user.role != 'admin': return jsonify({'error': 'Unauthorized'}), 403

    complaint = Complaint.query.get_or_404(complaint_id)
    complaint.status = 'In Progress'
    db.session.commit()
    return jsonify({'message': 'Success', 'status': 'In Progress'})

@app.route('/admin/reject_report/<int:complaint_id>', methods=['POST'])
def reject_report(complaint_id):
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 403
    admin = User.query.get(session['user_id'])
    if admin.role != 'admin': return jsonify({'error': 'Unauthorized'}), 403

    complaint = Complaint.query.get_or_404(complaint_id)
    if complaint.user_id:
        reporter = User.query.get(complaint.user_id)
        if reporter:
            reporter.points = max(0, reporter.points - 10) 
            
    complaint.status = 'Rejected'
    db.session.commit()
    return jsonify({'message': 'Report rejected. Points deducted from user.'})

@app.route('/admin/resolve/<int:complaint_id>', methods=['POST'])
def resolve_complaint(complaint_id):
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    if user.role != 'admin': return jsonify({'error': 'Unauthorized'}), 403

    complaint = Complaint.query.get_or_404(complaint_id)
    file = request.files.get('resolution_image')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.root_path, app.config['UPLOAD_FOLDER'], filename))
        complaint.resolution_image = filename

    if complaint.status != 'Resolved':
        complaint.status = 'Resolved'
        complaint.admin_comment = request.form.get('admin_comment')
        if complaint.author: 
            complaint.author.points += 50
        db.session.commit()
    return redirect(url_for('admin_manage_reports'))

# --- USER MANAGEMENT ACTIONS ---
@app.route('/admin/user/reset_points/<int:user_id>', methods=['POST'])
def reset_user_points(user_id):
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 403
    admin = User.query.get(session['user_id'])
    if admin.role != 'admin': return jsonify({'error': 'Unauthorized'}), 403

    user = User.query.get_or_404(user_id)
    user.points = 0
    db.session.commit()
    return jsonify({'message': 'Points reset successfully'})

@app.route('/admin/user/ban/<int:user_id>', methods=['POST'])
def ban_user(user_id):
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 403
    admin = User.query.get(session['user_id'])
    if admin.role != 'admin': return jsonify({'error': 'Unauthorized'}), 403

    user = User.query.get_or_404(user_id)
    try:
        Complaint.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()
        db.session.expire_all()
        return jsonify({'message': 'User and their data have been permanently removed.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: Could not ban user.'}), 500

# --- EXISTING USER ROUTES ---
@app.route('/my-complaints')
def my_complaints():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    my_reports = Complaint.query.filter_by(user_id=user.id).order_by(Complaint.date_posted.desc()).all()
    return render_template('my_complaints.html', user=user, complaints=my_reports)

@app.route('/report-issue', methods=['GET', 'POST'])
def report_issue():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])

    if request.method == 'POST':
        file = request.files.get('image')
        filename = 'default.jpg'
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.root_path, app.config['UPLOAD_FOLDER'], filename))
        
        new_complaint = Complaint(
            category=request.form.get('category'),
            title=request.form.get('title'),
            description=request.form.get('description'),
            priority=request.form.get('priority'),
            address=request.form.get('address'),
            latitude=request.form.get('latitude') or None,
            longitude=request.form.get('longitude') or None,
            image_file=filename,
            user_id=session['user_id']
        )
        user.points += 10
        db.session.add(new_complaint)
        db.session.commit()
        return redirect(url_for('dashboard'))

    return render_template('report_issue.html', user=user)

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    
    if request.method == 'POST':
        user.full_name = request.form.get('full_name')
        user.mobile_number = request.form.get('mobile_number')
        if 'profile_pic' in request.files:
            file = request.files['profile_pic']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.root_path, app.config['PROFILE_FOLDER'], filename))
                user.profile_pic = filename
        db.session.commit()
        return redirect(url_for('profile'))
    
    rank, target = "Citizen", 100
    if user.points < 100: rank, target = "Citizen", 100
    elif user.points < 500: rank, target = "Activist", 500
    elif user.points < 1000: rank, target = "Guardian", 1000
    else: rank, target = "Hero", 5000
    
    progress = (user.points / target) * 100
    if progress > 100: progress = 100
    return render_template('profile.html', user=user, rank=rank, progress=progress, target=target)

@app.route('/change-password', methods=['POST'])
def change_password():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    current_pw = request.form.get('current_password')
    new_pw = request.form.get('new_password')
    if check_password_hash(user.password, current_pw):
        user.password = generate_password_hash(new_pw)
        db.session.commit()
    return redirect(url_for('profile'))

@app.route('/about')
def about():
    if 'user_id' not in session: return redirect(url_for('index'))
    user = User.query.get(session['user_id'])
    return render_template('about.html', user=user)

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('role', None)
    return redirect(url_for('index'))

@app.route('/api/chart-data')
def chart_data():
    incoming_data = [0] * 12
    incoming_results = db.session.query(func.extract('month', Complaint.date_posted), func.count(Complaint.id)).group_by(func.extract('month', Complaint.date_posted)).all()
    for month, count in incoming_results: incoming_data[int(month)-1] = count

    resolved_data = [0] * 12
    resolved_results = db.session.query(func.extract('month', Complaint.date_posted), func.count(Complaint.id)).filter(Complaint.status == 'Resolved').group_by(func.extract('month', Complaint.date_posted)).all()
    for month, count in resolved_results: resolved_data[int(month)-1] = count

    return jsonify({
        'incoming': incoming_data,
        'resolved': resolved_data,
        'data': incoming_data 
    })

@app.route('/api/map-data')
def map_data():
    complaints = Complaint.query.filter(Complaint.latitude != None).all()
    return jsonify([{
        'title': c.title, 
        'lat': c.latitude, 
        'lng': c.longitude, 
        'status': c.status, 
        'priority': c.priority,
        'author': c.author.full_name
    } for c in complaints])

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first(): return jsonify({'message': 'Email exists'}), 400
    role = 'user'
    if data['email'] == 'admin@civicpulse.com': role = 'admin'

    new_user = User(
        full_name=data['full_name'], 
        email=data['email'], 
        mobile_number=data['mobile_number'], 
        password=generate_password_hash(data['password']), 
        role=role
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Success'}), 201

@app.route('/login-api', methods=['POST'])
def login_api():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    login_mode = data.get('mode') 

    if user and check_password_hash(user.password, data['password']):
        if user.role == 'admin' and login_mode and login_mode != 'admin':
             return jsonify({'message': 'Access Denied. Please use the Admin Portal.'}), 403
        if user.role != 'admin' and login_mode == 'admin':
             return jsonify({'message': 'Access Denied. You are not an Admin.'}), 403
        
        session['user_id'] = user.id
        session['role'] = user.role
        
        if user.role == 'admin':
            return jsonify({'message': 'Success', 'redirect': '/admin/dashboard'}), 200
        else:
            return jsonify({'message': 'Success', 'redirect': '/dashboard'}), 200
            
    return jsonify({'message': 'Invalid credentials'}), 401

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)