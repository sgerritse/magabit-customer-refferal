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

// Demo button interactions
document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', (e) => {
        if (button.textContent.includes('Add') || button.textContent.includes('Create')) {
            e.preventDefault();
            alert('Demo: This would open a form to add new content (This is a static demo)');
        } else if (button.textContent.includes('Edit')) {
            e.preventDefault();
            alert('Demo: This would open an edit form (This is a static demo)');
        } else if (button.textContent.includes('View')) {
            e.preventDefault();
            alert('Demo: This would show detailed view (This is a static demo)');
        }
    });
});

// Demo form submission
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Demo: Form submitted successfully! (This is a static demo)');
        form.reset();
    });
});