document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. RESOLUTION EFFICIENCY CHART (Color Updated) ---
    fetch('/api/chart-data')
    .then(response => response.json())
    .then(jsonData => {
        const ctx = document.getElementById('efficiencyChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    {
                        label: 'Incoming',
                        data: jsonData.incoming, 
                        borderColor: '#512da8', 
                        backgroundColor: 'rgba(81, 45, 168, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Resolved',
                        data: jsonData.resolved, 
                        borderColor: '#10b981', 
                        borderDash: [5, 5], 
                        backgroundColor: 'rgba(0,0,0,0)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    });

    // --- 2. MAP LOGIC (Zoom Fixed) ---
    if(document.getElementById('adminMap')) {
        const map = L.map('adminMap').setView([20.5937, 78.9629], 5);
       L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

        fetch('/api/map-data')
        .then(response => response.json())
        .then(data => {
            if(data.length > 0) {
                const markers = L.featureGroup();
                data.forEach(report => {
                    let color = '#3b82f6'; 
                    if(report.priority === 'High') color = '#ef4444';
                    if(report.priority === 'Medium') color = '#f59e0b';
                    if(report.priority === 'Low') color = '#10b981';
                    if(report.status === 'Resolved') color = '#94a3b8';

                    const marker = L.circleMarker([report.lat, report.lng], {
                        radius: 8, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.8
                    }).bindPopup(`
                        <b>${report.title}</b><br>
                        <span style="color:${color}; font-weight:bold;">Priority: ${report.priority}</span><br>
                        Status: ${report.status}
                    `);
                    markers.addLayer(marker);
                });
                markers.addTo(map);
                map.fitBounds(markers.getBounds(), { padding: [50, 50], maxZoom: 12 });
            }
        });
    }

    // --- 3. LIVE INCIDENTS PAGINATION/SCROLL LIMIT ---
    const feedBox = document.querySelector('.feed-box');
    if(feedBox) {
        feedBox.style.maxHeight = '500px';
        feedBox.style.overflowY = 'auto';
    }
});

// --- WORKFLOW ACTIONS ---
async function startWork(btn, id) {
    if(!confirm("Start working?")) return;
    const res = await fetch(`/admin/mark_progress/${id}`, { method: 'POST' });
    if(res.ok) location.reload();
}

const modal = document.getElementById('resolveModal');
const form = document.getElementById('resolveForm');
function openResolveModal(id) { form.action = `/admin/resolve/${id}`; modal.style.display = 'flex'; }
function closeResolveModal() { modal.style.display = 'none'; }
window.onclick = function(e) { if(e.target == modal) closeResolveModal(); }

// Function: Image Preview in Modal
function previewFile() {
    const preview = document.getElementById('imgPreview');
    const file = document.getElementById('fileInput').files[0];
    const content = document.getElementById('uploadContent');
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        preview.src = reader.result;
        preview.style.display = 'block'; 
        content.style.display = 'none';  
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}