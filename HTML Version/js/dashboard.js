// DadderUp Dashboard - Complete JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Hero buttons
    const signOutBtn = document.querySelector('.hero-button');
    const adminBtn = document.querySelector('.hero-admin-button');
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to sign out?')) {
                window.location.href = 'auth.html';
            }
        });
    }

    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            window.location.href = 'admin.html';
        });
    }

    // Onboarding section
    const hideOnboardingBtn = document.getElementById('hide-onboarding');
    const onboardingSection = document.getElementById('onboarding-section');
    
    if (hideOnboardingBtn && onboardingSection) {
        hideOnboardingBtn.addEventListener('click', function() {
            onboardingSection.style.display = 'none';
        });
    }

    // Video modal
    const videoModal = document.getElementById('video-modal');
    const watchVideoBtn = document.getElementById('watch-video');
    const videoClose = document.getElementById('video-close');
    const videoStartChallenge = document.getElementById('video-start-challenge');
    
    if (watchVideoBtn && videoModal) {
        watchVideoBtn.addEventListener('click', function() {
            videoModal.classList.remove('hidden');
        });
    }

    if (videoClose && videoModal) {
        videoClose.addEventListener('click', function() {
            videoModal.classList.add('hidden');
        });
    }

    if (videoStartChallenge) {
        videoStartChallenge.addEventListener('click', function() {
            videoModal.classList.add('hidden');
            document.querySelector('[data-section="todays-prompt"]').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Modal functionality
    function setupModal(modalId, triggerIds, closeIds) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Setup triggers
        triggerIds.forEach(id => {
            const trigger = document.getElementById(id);
            if (trigger) {
                trigger.addEventListener('click', () => {
                    modal.classList.remove('hidden');
                });
            }
        });

        // Setup close buttons
        closeIds.forEach(id => {
            const close = document.getElementById(id);
            if (close) {
                close.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        });

        // Close on overlay click
        const overlay = modal.querySelector('.modal-overlay, .video-modal-overlay, .congratulations-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
    }

    // Setup all modals
    setupModal('challenges-modal', ['see-all-challenges'], ['challenges-close']);
    setupModal('history-modal', ['view-history'], ['history-close']);
    setupModal('badges-modal', ['view-badges'], ['badges-close']);

    // Star rating
    let currentRating = 0;
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            currentRating = currentRating === rating ? 0 : rating;
            updateStars();
        });
    });

    function updateStars() {
        stars.forEach(star => {
            const rating = parseInt(star.getAttribute('data-rating'));
            star.classList.toggle('active', rating <= currentRating);
        });
    }

    // Reactions
    const selectedReactions = [];
    const reactions = document.querySelectorAll('.reaction');
    
    reactions.forEach(reaction => {
        reaction.addEventListener('click', () => {
            const reactionId = reaction.getAttribute('data-reaction');
            const index = selectedReactions.indexOf(reactionId);
            
            if (index > -1) {
                selectedReactions.splice(index, 1);
                reaction.classList.remove('selected');
            } else {
                selectedReactions.push(reactionId);
                reaction.classList.add('selected');
            }
        });
    });

    // Media upload buttons
    const uploadImageBtn = document.getElementById('upload-image');
    const uploadVideoBtn = document.getElementById('upload-video');
    const uploadAudioBtn = document.getElementById('upload-audio');
    const imageInput = document.getElementById('image-input');
    const videoInput = document.getElementById('video-input');
    const audioInput = document.getElementById('audio-input');

    if (uploadImageBtn && imageInput) {
        uploadImageBtn.addEventListener('click', () => imageInput.click());
    }
    if (uploadVideoBtn && videoInput) {
        uploadVideoBtn.addEventListener('click', () => videoInput.click());
    }
    if (uploadAudioBtn && audioInput) {
        uploadAudioBtn.addEventListener('click', () => audioInput.click());
    }

    // Form submission
    const logForm = document.getElementById('log-form');
    const submitBtn = document.getElementById('submit-log');
    const congratulationsModal = document.getElementById('congratulations-modal');
    
    if (logForm && submitBtn) {
        logForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const experience = document.getElementById('experience').value;
            if (!experience.trim()) {
                alert('Please share your experience before completing the challenge.');
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner"></div> Completing...';
            
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Complete Challenge';
                
                if (congratulationsModal) {
                    congratulationsModal.classList.remove('hidden');
                }
                
                // Reset form
                logForm.reset();
                currentRating = 0;
                updateStars();
                selectedReactions.length = 0;
                reactions.forEach(r => r.classList.remove('selected'));
            }, 2000);
        });
    }

    // Congratulations modal
    const skipBtn = document.getElementById('skip-to-next');
    const waitBtn = document.getElementById('wait-tomorrow');
    
    if (skipBtn && congratulationsModal) {
        skipBtn.addEventListener('click', function() {
            congratulationsModal.classList.add('hidden');
            alert('Skipped to next day! Your next challenge is now available.');
        });
    }

    if (waitBtn && congratulationsModal) {
        waitBtn.addEventListener('click', function() {
            congratulationsModal.classList.add('hidden');
        });
    }

    // Community tabs
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const tabName = trigger.getAttribute('data-tab');
            
            tabTriggers.forEach(t => t.classList.remove('active'));
            trigger.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(tabName + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Follow social button
    const followSocialBtn = document.getElementById('follow-social');
    if (followSocialBtn) {
        followSocialBtn.addEventListener('click', function() {
            document.querySelector('[data-section="community-feed"]').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                const socialTab = document.querySelector('[data-tab="social-media"]');
                if (socialTab) socialTab.click();
            }, 500);
        });
    }

    // Start challenge button
    const startChallengeBtn = document.getElementById('start-challenge');
    if (startChallengeBtn) {
        startChallengeBtn.addEventListener('click', function() {
            document.querySelector('[data-section="todays-prompt"]').scrollIntoView({ behavior: 'smooth' });
        });
    }

    console.log('DadderUp Dashboard loaded successfully!');
});

// Global function for video modal (called from onclick)
function openVideoModal() {
    const videoModal = document.getElementById('video-modal');
    if (videoModal) {
        videoModal.classList.remove('hidden');
    }
}