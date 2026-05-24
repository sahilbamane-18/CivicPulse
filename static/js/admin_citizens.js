let currentUserId = null;

function showProfile(card) {
    // UI Toggle
    document.querySelectorAll('.user-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    
    document.getElementById('empty-state').style.display = 'none';
    const profileView = document.getElementById('profile-view');
    profileView.style.display = 'block';
    
    // Animation reset
    profileView.style.animation = 'none';
    profileView.offsetHeight; 
    profileView.style.animation = 'fadeIn 0.3s ease';

    const d = card.dataset;
    currentUserId = d.id;

    document.getElementById('p-avatar').src = d.avatar;
    document.getElementById('p-name').innerText = d.name;
    document.getElementById('p-rank').innerText = d.rank;
    document.getElementById('p-rank').className = `rank-pill rank-${d.rank.toLowerCase()}`;
    document.getElementById('p-points').innerText = d.points;
    document.getElementById('p-id').innerText = d.id;
    document.getElementById('p-email').innerText = d.email;
    document.getElementById('p-phone').innerText = d.phone;
}

// Reset Points
async function resetPoints() {
    if(!currentUserId) return;
    if(!confirm("Reset points to 0?")) return;

    try {
        const res = await fetch(`/admin/user/reset_points/${currentUserId}`, { method: 'POST' });
        
        if (res.ok) {
            document.getElementById('p-points').innerText = "0";
            document.getElementById('card-points-' + currentUserId).innerHTML = '<i class="fas fa-star"></i> 0';
            alert("Points reset.");
        } else {
            alert("Error resetting points.");
        }
    } catch (err) {
        console.error(err);
    }
}

// Ban User
async function banUser() {
    if(!currentUserId) return;
    if(!confirm("Permanently ban this user?")) return;

    try {
        const res = await fetch(`/admin/user/ban/${currentUserId}`, { method: 'POST' });
        
        if (res.ok) {
            const card = document.getElementById('card-' + currentUserId);
            if(card) {
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 300);
            }
            document.getElementById('profile-view').style.display = 'none';
            document.getElementById('empty-state').style.display = 'flex';
            alert("User banned.");
        } else {
            alert("Error banning user.");
        }
    } catch (err) {
        console.error(err);
    }
}

function searchUsers() {
    const q = document.getElementById('userSearch').value.toLowerCase();
    document.querySelectorAll('.user-card').forEach(card => {
        const txt = card.dataset.name.toLowerCase() + card.dataset.email.toLowerCase();
        card.style.display = txt.includes(q) ? 'flex' : 'none';
    });
}

function filterRank(rank, btn) {
    document.querySelectorAll('.rank-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.user-card').forEach(card => {
        if(rank === 'all' || card.dataset.rank === rank) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}