// Tab switching functionality
document.querySelectorAll('.tab-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const tabName = trigger.getAttribute('data-tab');
        
        // Update active trigger
        document.querySelectorAll('.tab-trigger').forEach(t => t.classList.remove('active'));
        trigger.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName + '-tab').classList.add('active');
    });
});

// Sign in form handling
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('signin-submit');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="spinner"></div>
        Signing In...
    `;
    
    // Simulate loading
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';
        alert('Demo: Sign in successful! (This is a static demo)');
    }, 2000);
});

// Reset password form handling
document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
        alert('Please enter your email address to reset your password.');
        return;
    }
    
    const submitBtn = document.getElementById('reset-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="spinner"></div>
        Sending Reset Email...
    `;
    
    // Simulate loading
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Reset Email';
        alert('Demo: Reset email sent! (This is a static demo)');
        showSignInForm();
    }, 2000);
});

// Show/hide forms
function showResetForm() {
    document.getElementById('signin-form').classList.add('hidden');
    document.getElementById('reset-form').classList.remove('hidden');
}

function showSignInForm() {
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('signin-form').classList.remove('hidden');
}

// Event listeners
document.getElementById('forgot-password-btn').addEventListener('click', showResetForm);
document.getElementById('back-to-signin').addEventListener('click', showSignInForm);

document.getElementById('go-to-registration').addEventListener('click', () => {
    alert('Demo: Redirecting to registration... (This is a static demo)');
});

document.getElementById('switch-to-signin').addEventListener('click', () => {
    document.querySelector('[data-tab="signin"]').click();
});