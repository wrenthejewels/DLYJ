// Dynamic Navigation System
// Handles client-side routing without page refreshes

(function() {
    'use strict';

    // Configuration for page routes
    const routes = {
        '/': 'index.html',
        '/guide': 'guide/index.html',
        '/method': 'method/index.html'
    };

    // Initialize navigation on page load
    function init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', handlePopState);

        // Attach click handlers to all navigation buttons
        attachNavigationHandlers();

        // Set initial active state based on current URL
        updateActiveButton(window.location.pathname);
    }

    // Attach click handlers to navigation buttons
    function attachNavigationHandlers() {
        const navButtons = document.querySelectorAll('[data-page]');

        navButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const targetPage = this.getAttribute('data-page');

                // Validate that the target page is a known route
                if (!targetPage) {
                    console.error('Navigation button missing data-page attribute');
                    return;
                }

                if (!routes[targetPage]) {
                    console.error(`Invalid route: ${targetPage}`);
                    return;
                }

                navigateTo(targetPage);
            });
        });
    }

    // Navigate to a new page without refresh
    function navigateTo(path) {
        // Update browser history
        if (window.location.pathname !== path) {
            window.history.pushState({ path: path }, '', path);
        }

        // Load the new content
        loadPage(path);

        // Update active button state
        updateActiveButton(path);
    }

    // Load page content dynamically
    function loadPage(path) {
        const fileName = routes[path] || routes['/'];

        // For now, just do a full navigation since we need the entire page
        // In a more advanced setup, you could fetch just the content area
        window.location.href = path;
    }

    // Handle browser back/forward button clicks
    function handlePopState(event) {
        const path = event.state ? event.state.path : window.location.pathname;
        loadPage(path);
        updateActiveButton(path);
    }

    // Update which navigation button appears active
    function updateActiveButton(currentPath) {
        const navButtons = document.querySelectorAll('[data-page]');

        navButtons.forEach(button => {
            const buttonPath = button.getAttribute('data-page');

            if (buttonPath === currentPath) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
