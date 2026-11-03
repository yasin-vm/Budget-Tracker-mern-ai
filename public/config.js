window.BUDGET_TRACKER_API_BASE = window.BUDGET_TRACKER_API_BASE
    || (['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://localhost:3000'
        : '');
