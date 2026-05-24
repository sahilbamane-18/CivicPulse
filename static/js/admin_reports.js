let detailMap, marker;
let currentReportId = null;
let currentImageUrl = "";
let currentPage = 1;
const itemsPerPage = 10;

function showDetail(card) {
    document.querySelectorAll('.unique-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';

    const d = card.dataset;
    currentReportId = d.id;
    currentImageUrl = d.image;

    document.getElementById('d-title').innerText = d.title;
    document.getElementById('d-desc').innerText = d.desc;
    document.getElementById('d-author').innerText = d.author;
    document.getElementById('d-date').innerText = d.date;
    document.getElementById('d-address').innerText = d.address;
    document.getElementById('d-image').src = d.image;
    
    // Priority with Color
    const prio = document.getElementById('d-priority');
    prio.innerText = d.priority + " Priority";
    prio.className = `category-tag p-${d.priority.toLowerCase()}`;

    const sb = document.getElementById('d-status-badge');
    sb.innerText = d.status.toUpperCase();
    
    // Action Logic
    document.getElementById('actions-pending').style.display = (d.status === 'Pending') ? 'block' : 'none';
    document.getElementById('actions-progress').style.display = (d.status === 'In Progress') ? 'block' : 'none';
    
    if (d.status === 'Resolved') {
        document.getElementById('actions-done').style.display = 'block';
        document.getElementById('actions-done').innerHTML = `
            <div class="state-banner resolved">Issue Resolved</div>
            <button onclick="openAdminProofLightbox('${d.resImg}')" class="btn-action btn-resolve" style="margin-top:10px;">
                <i class="fas fa-image"></i> View My Resolution Proof
            </button>
        `;
    } else {
        document.getElementById('actions-done').style.display = 'none';
    }
    
    document.getElementById('actions-rejected').style.display = (d.status === 'Rejected') ? 'block' : 'none';

    document.getElementById('resolveForm').action = `/admin/resolve/${d.id}`;

    // Map
    const lat = parseFloat(d.lat), lng = parseFloat(d.lng);
    if (!detailMap) {
        detailMap = L.map('detailMap').setView([lat, lng], 15);
       L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(detailMap);
        marker = L.marker([lat, lng]).addTo(detailMap);
    } else {
        detailMap.setView([lat, lng], 15);
        marker.setLatLng([lat, lng]);
    }
}

// Actions
async function approveReport() {
    if(confirm("Approve this report?")) {
        await fetch(`/admin/mark_progress/${currentReportId}`, { method: 'POST' });
        location.reload();
    }
}

async function rejectReport() {
    if(confirm("Mark as Fake? This will deduct 10 points from the user.")) {
        await fetch(`/admin/reject_report/${currentReportId}`, { method: 'POST' });
        location.reload();
    }
}

// Pagination & Search
function renderPagination() {
    const cards = Array.from(document.querySelectorAll('.unique-card'));
    const totalPages = Math.ceil(cards.length / itemsPerPage);
    cards.forEach((card, index) => {
        if (index >= (currentPage - 1) * itemsPerPage && index < currentPage * itemsPerPage) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage} of ${totalPages}`;
}

function changePage(dir) {
    const cards = document.querySelectorAll('.unique-card');
    const totalPages = Math.ceil(cards.length / itemsPerPage);
    if (currentPage + dir > 0 && currentPage + dir <= totalPages) {
        currentPage += dir;
        renderPagination();
    }
}

function searchReports() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.unique-card').forEach(card => {
        const txt = card.dataset.title.toLowerCase() + card.dataset.id;
        card.style.display = txt.includes(q) ? 'flex' : 'none';
    });
}

function filterReports(status, btn) {
    document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.unique-card').forEach(card => {
        card.style.display = (status === 'all' || card.dataset.status === status) ? 'flex' : 'none';
    });
}

// Modals
function openResolveModal() { document.getElementById('resolveModal').style.display = 'flex'; }
function closeResolveModal() { document.getElementById('resolveModal').style.display = 'none'; }
function openLightbox() { document.getElementById('lightbox-img').src = currentImageUrl; document.getElementById('lightboxModal').style.display = 'flex'; }
function closeLightbox() { document.getElementById('lightboxModal').style.display = 'none'; }

function openAdminProofLightbox(imgName) {
    if(imgName && imgName !== 'None' && imgName !== '') {
        document.getElementById('lightbox-img').src = `/static/uploads/complaints/${imgName}`; 
        document.getElementById('lightboxModal').style.display = 'flex'; 
    } else {
        alert("No resolution image was uploaded for this report.");
    }
}

document.addEventListener('DOMContentLoaded', () => { renderPagination(); });