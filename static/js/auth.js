const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const adminToggle = document.getElementById('adminToggle');
const loginTitle = document.getElementById('loginTitle');

// 1. Toggle Animation (Sign Up vs Sign In)
registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

// 2. Admin Portal Toggle (Visual Only)
let isAdminMode = false;
adminToggle.addEventListener('click', () => {
    isAdminMode = !isAdminMode;
    if (isAdminMode) {
        loginTitle.innerText = "Admin Login";
        loginTitle.style.color = "#581c8b"; // Red color for Admin
        adminToggle.innerText = "Back to User Login";
    } else {
        loginTitle.innerText = "Sign In";
        loginTitle.style.color = "#333"; // Black for User
        adminToggle.innerText = "Access Admin Portal";
    }
});

// 3. Handle Registration (Sign Up)
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.status === 201) {
        alert("Registration Successful! Please Sign In.");
        container.classList.remove("active"); // Switch to login view
    } else {
        alert(result.message);
    }
});

// ... (Keep the rest of your code at the top the same) ...

// 4. Handle Login (Sign In) WITH STRICT MODE CHECK
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Send the "mode" (door) we are using: 'admin' or 'user'
    const loginMode = isAdminMode ? 'admin' : 'user';

    const response = await fetch('/login-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: email, 
            password: password,
            mode: loginMode  // <--- WE SEND THIS NEW DATA
        })
    });

    const result = await response.json();
    
    if (response.status === 200) {
        window.location.href = result.redirect; 
    } else {
        alert(result.message); // Show specific error (e.g., "Please use Admin Portal")
    }
});