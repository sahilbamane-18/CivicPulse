document.addEventListener("DOMContentLoaded", function() {
    // 1. Animate Progress Bar on Load
    const progressBar = document.querySelector('.fill');
    const targetWidth = progressBar.getAttribute('data-width');
    setTimeout(() => {
        progressBar.style.width = targetWidth + "%";
    }, 300);

    // 2. Avatar Preview Logic
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    if(avatarInput) {
        avatarInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

// 3. Modal Functions
function openModal() {
    document.getElementById('passwordModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('passwordModal');
    if (event.target == modal) {
        closeModal();
    }
}