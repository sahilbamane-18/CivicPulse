let map, marker;

document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialize Map
    map = L.map('reportMap').setView([20.5937, 78.9629], 5); // Default India

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 2. Click to Pin Logic
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setMarker(lat, lng);
    });
});

// Function to Place Marker & Update Inputs
function setMarker(lat, lng) {
    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng], {draggable: true}).addTo(map);
        
        // Update inputs when dragged
        marker.on('dragend', function(e) {
            const position = marker.getLatLng();
            updateInputs(position.lat, position.lng);
        });
    }
    
    map.setView([lat, lng], 15); // Zoom in
    updateInputs(lat, lng);
}

function updateInputs(lat, lng) {
    document.getElementById('latField').value = lat;
    document.getElementById('lngField').value = lng;
    document.getElementById('addressInput').value = `Selected: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// 3. CORRECTED GPS Button Logic
function getMyLocation() {
    if (navigator.geolocation) {
        
        // Force high accuracy and disable caching
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 
        };

        navigator.geolocation.getCurrentPosition(
            position => {
                setMarker(position.coords.latitude, position.coords.longitude);
            }, 
            error => {
                console.warn(`Geolocation Error (${error.code}): ${error.message}`);
                alert("Could not get precise location. Please ensure location permissions are granted and you are using a secure connection.");
            },
            options
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// 4. Image Preview Logic
function previewImage(event) {
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

// 5. Drag & Drop Upload Logic
document.addEventListener("DOMContentLoaded", function() {
    const dropZone = document.querySelector('.file-upload-wrapper');
    const fileInput = document.getElementById('fileInput');

    if (dropZone && fileInput) {
        // Prevent default browser behavior 
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            // If a file was dropped, assign it to the hidden input
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                
                // Manually trigger the previewImage function
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        });
    }
});