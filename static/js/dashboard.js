document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. CITY ACTIVITY CHART ---
    const ctx = document.getElementById('activityChart');
    if (ctx) {
        fetch('/api/chart-data')
            .then(response => response.json())
            .then(chartData => {
                const dataToUse = chartData.data || chartData.incoming || [];
                
                new Chart(ctx.getContext('2d'), {
                    type: 'line', 
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        datasets: [{
                            label: 'Complaints',
                            data: dataToUse, 
                            borderColor: '#512da8', 
                            backgroundColor: 'rgba(81, 45, 168, 0.1)', 
                            borderWidth: 3,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#512da8',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            tension: 0.4, 
                            fill: true    
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                            y: { 
                                beginAtZero: true, 
                                grid: { display: true, color: '#e2e8f0' },
                                ticks: { stepSize: 1, precision: 0 } 
                            },
                            x: { grid: { display: true, color: '#e2e8f0' } }
                        }
                    }
                });
            })
            .catch(err => console.error("Error loading chart:", err));
    }

    // --- 2. LIVE MAP (Zoom Fixed) ---
    const mapElement = document.getElementById('map');
    if (mapElement) {
        const map = L.map('map').setView([20.5937, 78.9629], 5); 

       L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

        fetch('/api/map-data')
            .then(response => response.json())
            .then(points => {
                if(points.length > 0) {
                    const markers = L.featureGroup();

                    points.forEach(point => {
                        let color = '#3b82f6'; 
                        if(point.priority === 'High') color = '#ef4444';
                        if(point.priority === 'Medium') color = '#f59e0b';
                        if(point.priority === 'Low') color = '#10b981';
                        if(point.status === 'Resolved') color = '#94a3b8'; 

                        const customIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color:${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                            iconSize: [18, 18],
                            iconAnchor: [9, 9]
                        });

                        const marker = L.marker([point.lat, point.lng], {icon: customIcon})
                            .bindPopup(`
                                <b style="font-size:14px;">${point.title}</b><br>
                                <span style="color:${color}; font-weight:bold;">Priority: ${point.priority}</span><br>
                                Status: ${point.status}<br>
                                User: ${point.author}
                            `);
                        markers.addLayer(marker);
                    });

                    markers.addTo(map);
                    map.fitBounds(markers.getBounds(), { padding: [50, 50], maxZoom: 12 });
                }
            })
            .catch(err => console.error("Error loading map:", err));
    }
});