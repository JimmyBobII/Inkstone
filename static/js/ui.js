const UI = {
    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const viewSections = document.querySelectorAll('.view-section');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 1. Remove 'active' class from all buttons and sections
                tabBtns.forEach(b => b.classList.remove('active'));
                viewSections.forEach(v => v.classList.remove('active'));
                
                // 2. Add 'active' class to the clicked button
                e.target.classList.add('active');
                
                // 3. Find the target section and make it active
                const targetId = e.target.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
                
                // Refresh music composer floor slots when entering DB view
                if (targetId === 'view-db' && typeof DbEditor !== 'undefined' && DbEditor.musicRefreshSlots) {
                    DbEditor.musicRefreshSlots();
                }
            });
        });
    },
    
    showStatus(elementId, message, isError = false) {
        const msgBox = document.getElementById(elementId);
        if (!msgBox) return;
        
        msgBox.innerText = message;
        // If it's an error, make it red. Otherwise, use our accent green.
        msgBox.style.color = isError ? '#ff4444' : 'var(--accent-green)'; 
        
        // Clear the message after 3 seconds
        setTimeout(() => {
            msgBox.innerText = '';
        }, 3000);
    }
};

// Initialize the basic UI elements as soon as the page loads
document.addEventListener('DOMContentLoaded', () => {
    UI.initTabs();
});