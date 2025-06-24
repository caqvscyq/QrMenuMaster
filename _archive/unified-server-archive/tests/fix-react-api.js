/**
 * React API Fix - Monkey Patch for Broken Session Management
 * This script intercepts and fixes the React app's API calls to work with unified-server
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading React API fix...');
    
    // Store original fetch function
    const originalFetch = window.fetch;
    
    // Session management state
    let currentSessionId = null;
    let currentTableNumber = null;
    let isInitializing = false;
    
    // Get table number from URL
    function getTableNumber() {
        if (currentTableNumber) return currentTableNumber;
        
        const params = new URLSearchParams(window.location.search);
        currentTableNumber = params.get('table') || 'A1';
        
        // Validate table number format
        if (!/^[A-Za-z0-9_-]+$/.test(currentTableNumber)) {
            console.warn('Invalid table number format, using A1');
            currentTableNumber = 'A1';
        }
        
        return currentTableNumber;
    }
    
    // Create a new session
    async function createSession() {
        if (isInitializing) {
            // Wait for existing initialization
            while (isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return currentSessionId;
        }
        
        isInitializing = true;
        
        try {
            console.log('🆕 Creating new session for table:', getTableNumber());
            
            const response = await originalFetch('/api/session/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tableNumber: getTableNumber(),
                    shopId: 1,
                    expirationHours: 4
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.session) {
                currentSessionId = data.session.id;
                
                // Store in localStorage for compatibility
                const tableNumber = getTableNumber();
                localStorage.setItem(`session-${tableNumber}`, currentSessionId);
                localStorage.setItem(`session-backup-${tableNumber}`, currentSessionId);
                localStorage.setItem(`cart-session-id-${tableNumber}`, currentSessionId);
                localStorage.setItem(`database-session-${tableNumber}`, currentSessionId);
                
                // Set global session ID for compatibility
                window.__currentSessionId = currentSessionId;
                
                console.log('✅ Session created:', currentSessionId);
                return currentSessionId;
            } else {
                throw new Error(data.message || 'Failed to create session');
            }
        } catch (error) {
            console.error('❌ Failed to create session:', error);
            // Create fallback session
            const timestamp = Date.now();
            const randomPart = Math.random().toString(36).substring(2, 11);
            currentSessionId = `session-${getTableNumber()}-${timestamp}-${randomPart}`;
            console.log('⚠️ Using fallback session:', currentSessionId);
            return currentSessionId;
        } finally {
            isInitializing = false;
        }
    }
    
    // Get or create session
    async function getSessionId() {
        if (currentSessionId) return currentSessionId;
        
        // Try to get from localStorage first
        const tableNumber = getTableNumber();
        const possibleKeys = [
            `session-${tableNumber}`,
            `session-backup-${tableNumber}`,
            `cart-session-id-${tableNumber}`,
            `database-session-${tableNumber}`
        ];
        
        for (const key of possibleKeys) {
            const stored = localStorage.getItem(key);
            if (stored && stored.startsWith('session-')) {
                currentSessionId = stored;
                window.__currentSessionId = stored;
                console.log('🔍 Found existing session:', stored);
                return stored;
            }
        }
        
        // No existing session, create new one
        return await createSession();
    }
    
    // Fix API URL and add headers
    function fixApiRequest(url, options = {}) {
        const sessionId = currentSessionId || window.__currentSessionId;
        
        // Fix URL patterns
        let fixedUrl = url;
        
        // Convert old cart API patterns to new ones
        if (url.includes('/api/cart/session-')) {
            // /api/cart/session-xxx -> /api/customer/cart with headers
            fixedUrl = '/api/customer/cart';
        } else if (url.match(/\/api\/cart\/session-[^\/]+$/)) {
            // /api/cart/session-xxx -> /api/customer/cart with headers
            fixedUrl = '/api/customer/cart';
        } else if (url.startsWith('/api/cart')) {
            // /api/cart -> /api/customer/cart
            fixedUrl = url.replace('/api/cart', '/api/customer/cart');
        } else if (url.startsWith('/api/menu')) {
            // /api/menu -> /api/customer/menu
            fixedUrl = url.replace('/api/menu', '/api/customer/menu');
        } else if (url.startsWith('/api/orders')) {
            // /api/orders -> /api/customer/orders
            fixedUrl = url.replace('/api/orders', '/api/customer/orders');
        }
        
        // Add session headers
        const headers = {
            ...options.headers
        };
        
        if (sessionId && (fixedUrl.includes('/cart') || fixedUrl.includes('/orders'))) {
            headers['X-Session-ID'] = sessionId;
            headers['X-Table-Number'] = getTableNumber();
        }
        
        return {
            url: fixedUrl,
            options: {
                ...options,
                headers
            }
        };
    }
    
    // Monkey patch fetch function
    window.fetch = async function(url, options = {}) {
        // Ensure we have a session for API requests
        if (typeof url === 'string' && url.includes('/api/') && 
            (url.includes('/cart') || url.includes('/orders'))) {
            await getSessionId();
        }
        
        // Fix the request
        const { url: fixedUrl, options: fixedOptions } = fixApiRequest(url, options);
        
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url} -> ${fixedUrl}`, {
            originalUrl: url,
            fixedUrl: fixedUrl,
            headers: fixedOptions.headers
        });
        
        try {
            const response = await originalFetch(fixedUrl, fixedOptions);
            
            // Handle 401 errors by creating new session
            if (response.status === 401 && fixedUrl.includes('/api/')) {
                console.warn('🔐 401 error, creating new session...');
                currentSessionId = null;
                await createSession();
                
                // Retry with new session
                const retryFixed = fixApiRequest(url, options);
                console.log(`🔄 Retrying with new session: ${retryFixed.url}`);
                return await originalFetch(retryFixed.url, retryFixed.options);
            }
            
            return response;
        } catch (error) {
            console.error(`❌ API request failed: ${fixedUrl}`, error);
            throw error;
        }
    };
    
    // Initialize session when script loads
    getSessionId().then(() => {
        console.log('✅ React API fix loaded and session initialized');
    }).catch(error => {
        console.error('❌ Failed to initialize session:', error);
    });
    
    // Expose functions for debugging
    window.debugSession = {
        getCurrentSession: () => currentSessionId,
        createNewSession: createSession,
        getTableNumber: getTableNumber,
        clearSession: () => {
            currentSessionId = null;
            const tableNumber = getTableNumber();
            localStorage.removeItem(`session-${tableNumber}`);
            localStorage.removeItem(`session-backup-${tableNumber}`);
            localStorage.removeItem(`cart-session-id-${tableNumber}`);
            localStorage.removeItem(`database-session-${tableNumber}`);
        }
    };
    
})();
