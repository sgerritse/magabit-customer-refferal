// Password strength checking
document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    const strengthContainer = document.getElementById('password-strength');
    
    if (password) {
        strengthContainer.classList.remove('hidden');
        updatePasswordStrength(password);
    } else {
        strengthContainer.classList.add('hidden');
    }
});

function updatePasswordStrength(password) {
    let score = 0;
    const requirements = {
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Update requirements display
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (requirements[req]) {
            element.classList.add('met');
            score++;
        } else {
            element.classList.remove('met');
        }
    });

    // Update strength bar and label
    const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];
    
    const strengthFill = document.getElementById('strength-fill');
    const strengthLabel = document.getElementById('strength-label');
    
    strengthFill.style.width = `${(score / 5) * 100}%`;
    strengthFill.style.backgroundColor = colors[score];
    strengthLabel.textContent = labels[score];
    strengthLabel.style.color = colors[score];
}

// Dynamic child age inputs
document.getElementById('numberOfKids').addEventListener('change', function() {
    const numKids = parseInt(this.value);
    const container = document.getElementById('child-ages-container');
    
    container.innerHTML = '';
    
    for (let i = 1; i <= numKids; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label class="label" for="child-${i}">Child ${i} Age</label>
            <input class="input" type="text" id="child-${i}" placeholder="e.g., 5 years old">
        `;
        container.appendChild(div);
    }
});

// Form submission
document.getElementById('registration-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    if (!terms) {
        alert('Please accept the terms and conditions to continue.');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="spinner"></div>
        Creating Account...
    `;
    
    // Simulate form submission
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Register Now';
        alert('Demo: Registration successful! Welcome to DadderUp! (This is a static demo)');
        
        // Reset form
        document.getElementById('registration-form').reset();
        document.getElementById('password-strength').classList.add('hidden');
        document.getElementById('child-ages-container').innerHTML = '';
    }, 3000);
});