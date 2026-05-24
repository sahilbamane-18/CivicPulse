let miniMap, miniMarker;

function showDetails(card) {
    const data = {
        id: card.getAttribute('data-id'),
        title: card.getAttribute('data-title'),
        status: card.getAttribute('data-status'),
        category: card.getAttribute('data-category'),
        priority: card.getAttribute('data-priority'),
        desc: card.getAttribute('data-desc'),
        address: card.getAttribute('data-address'),
        img: card.getAttribute('data-image'),
        lat: parseFloat(card.getAttribute('data-lat')),
        lng: parseFloat(card.getAttribute('data-lng')),
        resImg: card.getAttribute('data-res-img'),
        resComment: card.getAttribute('data-res-comment')
    };

    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('contentState').style.display = 'block';

    document.getElementById('d-title').innerText = data.title;
    document.getElementById('d-id').innerText = "#CP-" + data.id;
    document.getElementById('d-category').innerText = data.category;
    document.getElementById('d-desc').innerText = data.desc;
    document.getElementById('d-address').innerText = data.address;
    document.getElementById('d-image').src = `/static/uploads/complaints/${data.img}`;

    const pBadge = document.getElementById('d-priority');
    pBadge.innerText = data.priority;
    pBadge.className = `p-badge ${data.priority.toLowerCase()}`;

    const stepProgress = document.getElementById('step-progress');
    const stepResolved = document.getElementById('step-resolved');
    const resSection = document.getElementById('resolutionSection');
    
    stepProgress.classList.remove('active');
    stepResolved.classList.remove('active');
    resSection.style.display = 'none';

    if (data.status === 'In Progress') {
        stepProgress.classList.add('active');
    } else if (data.status === 'Resolved') {
        stepProgress.classList.add('active');
        stepResolved.classList.add('active');
        
        resSection.style.display = 'block';
        document.getElementById('d-res-comment').innerText = data.resComment || "Issue has been resolved by the authorities.";
        
        const resImgEl = document.getElementById('d-res-image');
        if (data.resImg && data.resImg !== 'None' && data.resImg !== '') {
            resImgEl.src = `/static/uploads/complaints/${data.resImg}`;
            resImgEl.parentElement.style.display = 'block';
            
            // Lightbox logic
            resImgEl.style.cursor = 'pointer';
            resImgEl.onclick = function() {
                document.getElementById('lightbox-img').src = this.src;
                document.getElementById('lightboxModal').style.display = 'flex';
            };
        } else {
            resImgEl.parentElement.style.display = 'none';
        }
    }

    if (!miniMap) {
        miniMap = L.map('miniMap').setView([data.lat, data.lng], 15);
       L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(miniMap);
        miniMarker = L.marker([data.lat, data.lng]).addTo(miniMap);
    } else {
        miniMap.invalidateSize();
        const newLatLng = new L.LatLng(data.lat, data.lng);
        miniMap.setView(newLatLng, 15);
        miniMarker.setLatLng(newLatLng);
    }
}

function closeLightbox() { 
    document.getElementById('lightboxModal').style.display = 'none'; 
}

function downloadReceipt() {
    const id = document.getElementById('d-id').innerText;
    const title = document.getElementById('d-title').innerText;
    const category = document.getElementById('d-category').innerText;
    const priority = document.getElementById('d-priority').innerText;
    const desc = document.getElementById('d-desc').innerText;
    const address = document.getElementById('d-address').innerText;
    const date = new Date().toLocaleDateString();

    const receiptHTML = `
        <html>
        <head>
            <title>Receipt ${id}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                .header { border-bottom: 2px solid #512da8; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                .logo h1 { color: #512da8; margin: 0; font-size: 28px; letter-spacing: -1px; }
                .logo p { margin: 5px 0 0; color: #666; font-size: 14px; }
                .meta { text-align: right; font-size: 14px; color: #888; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .box { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
                .label { font-size: 11px; text-transform: uppercase; color: #999; font-weight: 700; display: block; margin-bottom: 5px; }
                .value { font-size: 16px; font-weight: 600; color: #333; }
                .desc-box { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .desc-text { line-height: 1.6; color: #444; }
                .footer { text-align: center; border-top: 1px solid #eee; padding-top: 30px; font-size: 12px; color: #999; }
                .stamp { border: 2px solid #512da8; color: #512da8; display: inline-block; padding: 5px 15px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; opacity: 0.8; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">
                    <h1>Civic Pulse</h1>
                    <p>Official Complaint Acknowledgement</p>
                </div>
                <div class="meta">
                    <strong>Date:</strong> ${date}<br>
                    <strong>ID:</strong> ${id}
                </div>
            </div>
            <div class="grid">
                <div class="box">
                    <span class="label">Issue Title</span>
                    <span class="value">${title}</span>
                </div>
                <div class="box">
                    <span class="label">Category</span>
                    <span class="value">${category}</span>
                </div>
                <div class="box">
                    <span class="label">Priority Level</span>
                    <span class="value" style="color: ${priority === 'High' ? '#d32f2f' : '#333'}">${priority}</span>
                </div>
                <div class="box">
                    <span class="label">Status</span>
                    <span class="value">Submitted</span>
                </div>
            </div>
            <span class="label">Location / Address</span>
            <div class="box" style="margin-bottom: 20px;">
                <span class="value">${address}</span>
            </div>
            <span class="label">Complaint Description</span>
            <div class="desc-box">
                <p class="desc-text">${desc}</p>
            </div>
            <div class="footer">
                <div class="stamp">Officially Received</div>
                <p>This document serves as proof that your complaint has been registered with the Civic Pulse Authority.<br>
                Please retain this receipt for your records.</p>
            </div>
            <script>
                setTimeout(function() { window.print(); window.close(); }, 500);
            </script>
        </body>
        </html>
    `;

    const win = window.open('', '', 'height=800,width=600');
    win.document.write(receiptHTML); 
    win.document.close();
}