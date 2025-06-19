// Order Tracking Fix Script
// This script fixes the order tracking functionality by ensuring the correct session ID is used

(function() {
    'use strict';

    console.log('🔧 Loading Order Tracking Fix (External)...');

    // Function to get the correct session ID using multiple detection methods
    function getCorrectSessionId() {
        const params = new URLSearchParams(window.location.search);
        const tableNumber = params.get('table') || 'unknown';
        const validTableNumber = /^[A-Za-z0-9_-]+$/.test(tableNumber) ? tableNumber : 'unknown';

        console.log("🔍 Getting session ID for table:", validTableNumber);

        let sessionId = "";

        // Method 1: Check localStorage with various keys (most reliable)
        const possibleKeys = [
            `session-backup-${validTableNumber}`,
            `cart-session-id-${validTableNumber}`,
            `session-debug-${validTableNumber}`,
            `database-session-${validTableNumber}`,
            `session-${validTableNumber}`
        ];

        for (const key of possibleKeys) {
            const stored = localStorage.getItem(key);
            if (stored && stored.startsWith('session-')) {
                sessionId = stored;
                console.log(`✅ Found session in localStorage key: ${key}`);
                break;
            }
        }

        // Method 2: Check global variables
        if (!sessionId) {
            try {
                if (window.__currentSessionId && window.__currentSessionId.startsWith('session-')) {
                    sessionId = window.__currentSessionId;
                    console.log('✅ Found session in window.__currentSessionId');
                }
            } catch (e) {
                // Continue to next method
            }
        }

        // Method 3: Try to extract from React component state (if available)
        if (!sessionId) {
            try {
                // Look for React components that might have session state
                const reactRoot = document.querySelector('#root');
                if (reactRoot && reactRoot._reactInternalFiber) {
                    // This is a simplified approach - in practice, React internals are complex
                    console.log('🔍 React root found, but session extraction from React state is complex');
                }
            } catch (e) {
                // React internals access failed, continue
            }
        }

        console.log("🔍 Retrieved session ID for table", validTableNumber, ":", sessionId || 'NOT_FOUND');

        // Validate session ID format
        if (sessionId && !/^session-[A-Za-z0-9_-]+-\d{13}-[A-Za-z0-9]{6,15}$/.test(sessionId)) {
            console.warn(`⚠️ Invalid session ID format for table ${validTableNumber}:`, sessionId);
            return "";
        }

        return sessionId;
    }
    
    // Function to fetch orders with correct session ID
    async function fetchOrdersWithCorrectSession() {
        const sessionId = getCorrectSessionId();
        const params = new URLSearchParams(window.location.search);
        const tableNumber = params.get('table') || 'unknown';

        if (!sessionId) {
            console.warn('⚠️ No valid session ID found for order tracking');
            return [];
        }

        try {
            console.log('📡 Fetching orders with session:', sessionId);
            const response = await fetch('/api/customer/orders', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                    'x-table-number': tableNumber
                }
            });

            if (!response.ok) {
                console.error(`❌ HTTP error! status: ${response.status}`);
                return [];
            }

            const orders = await response.json();
            console.log('✅ Orders fetched successfully:', orders.length, 'orders found');
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            return [];
        }
    }
    
    // Function to update order tracking modal content
    function updateOrderTrackingModal(orders) {
        const params = new URLSearchParams(window.location.search);
        const tableNumber = params.get('table') || 'unknown';
        
        // Find the modal content area
        const modalContent = document.querySelector('.modal-content, [class*="modal"], [class*="Modal"]');
        if (!modalContent) {
            console.warn('⚠️ Could not find modal content area');
            return;
        }
        
        // Create order display HTML
        let orderHtml = '';
        
        if (orders.length === 0) {
            orderHtml = `
                <div style="text-align: center; padding: 20px;">
                    <h3>桌號 ${tableNumber} 目前沒有訂單</h3>
                    <p style="color: #666; margin-top: 10px;">您還沒有下任何訂單</p>
                    <button onclick="window.location.reload()" style="
                        background: #ff6b35; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        margin-top: 15px;
                        cursor: pointer;
                    ">重新整理</button>
                </div>
            `;
        } else {
            orderHtml = `
                <div style="padding: 20px;">
                    <h3>桌號 ${tableNumber} 的訂單</h3>
                    <div style="margin-top: 15px;">
            `;
            
            orders.forEach(order => {
                const statusText = order.status === 'pending' ? '準備中' : 
                                 order.status === 'completed' ? '已完成' : 
                                 order.status === 'cancelled' ? '已取消' : order.status;
                
                const statusColor = order.status === 'pending' ? '#ff6b35' : 
                                  order.status === 'completed' ? '#28a745' : 
                                  order.status === 'cancelled' ? '#dc3545' : '#6c757d';
                
                orderHtml += `
                    <div style="
                        border: 1px solid #ddd; 
                        border-radius: 8px; 
                        padding: 15px; 
                        margin-bottom: 15px;
                        background: white;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong>訂單 #${order.id}</strong>
                            <span style="
                                background: ${statusColor}; 
                                color: white; 
                                padding: 4px 8px; 
                                border-radius: 4px; 
                                font-size: 12px;
                            ">${statusText}</span>
                        </div>
                        <div style="color: #666; font-size: 14px;">
                            <div>總金額: $${order.total}</div>
                            <div>下單時間: ${new Date(order.createdAt).toLocaleString('zh-TW')}</div>
                        </div>
                    </div>
                `;
            });
            
            orderHtml += `
                    </div>
                    <button onclick="window.location.reload()" style="
                        background: #ff6b35; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        width: 100%;
                        cursor: pointer;
                        margin-top: 15px;
                    ">重新整理</button>
                </div>
            `;
        }
        
        // Update modal content
        modalContent.innerHTML = orderHtml;
    }
    
    // Function to fix order tracking when modal is opened
    async function fixOrderTracking() {
        console.log('🔧 Fixing order tracking...');
        
        try {
            const orders = await fetchOrdersWithCorrectSession();
            updateOrderTrackingModal(orders);
            console.log('✅ Order tracking fixed successfully');
        } catch (error) {
            console.error('❌ Error fixing order tracking:', error);
        }
    }
    
    // Override the original order tracking function if it exists
    if (window.trackOrders) {
        const originalTrackOrders = window.trackOrders;
        window.trackOrders = function() {
            console.log('🔧 Intercepting trackOrders call');
            fixOrderTracking();
        };
    }
    
    // More aggressive modal detection and fixing
    function interceptOrderTrackingModal() {
        // Override console.log to detect when OrderTrackingModal is opened
        const originalConsoleLog = console.log;
        console.log = function(...args) {
            const message = args.join(' ');
            if (message.includes('OrderTrackingModal opened with sessionId:')) {
                console.log('🔧 Detected OrderTrackingModal opening, applying fix...');
                setTimeout(fixOrderTracking, 50);
            }
            return originalConsoleLog.apply(console, args);
        };

        // Also watch for DOM changes that might indicate modal opening
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            // Check if this looks like a modal
                            if (node.classList && (
                                node.classList.contains('modal') ||
                                node.classList.contains('Modal') ||
                                node.querySelector && (
                                    node.querySelector('[class*="modal"]') ||
                                    node.querySelector('[class*="Modal"]')
                                )
                            )) {
                                console.log('🔍 Modal DOM element detected, checking for order tracking...');
                                setTimeout(fixOrderTracking, 100);
                            }

                            // Check if the text content suggests it's an order tracking modal
                            if (node.textContent && (
                                node.textContent.includes('目前沒有訂單') ||
                                node.textContent.includes('桌號') ||
                                node.textContent.includes('訂單')
                            )) {
                                console.log('🔍 Order tracking content detected, applying fix...');
                                setTimeout(fixOrderTracking, 50);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Listen for modal open events
    document.addEventListener('click', function(event) {
        const target = event.target;

        // Check if the clicked element is related to order tracking
        if (target.textContent && (
            target.textContent.includes('訂單') ||
            target.textContent.includes('追蹤') ||
            target.textContent.includes('track') ||
            target.textContent.includes('order')
        )) {
            console.log('🔍 Order tracking button clicked, applying fix...');
            setTimeout(fixOrderTracking, 100); // Small delay to let modal open
        }
    });
    
    // Also listen for modal show events
    document.addEventListener('DOMNodeInserted', function(event) {
        const node = event.target;
        if (node.nodeType === 1 && (
            node.classList.contains('modal') ||
            node.classList.contains('Modal') ||
            node.querySelector && node.querySelector('.modal-content')
        )) {
            console.log('🔍 Modal detected, checking for order tracking...');
            setTimeout(fixOrderTracking, 100);
        }
    });
    
    // Initialize the interceptor
    interceptOrderTrackingModal();

    // Expose fix function globally for manual testing
    window.fixOrderTracking = fixOrderTracking;
    window.getCorrectSessionId = getCorrectSessionId;

    console.log('✅ Order Tracking Fix loaded successfully');
    console.log('💡 You can manually trigger the fix by calling: window.fixOrderTracking()');
    console.log('💡 You can check session ID by calling: window.getCorrectSessionId()');

    // Try to fix immediately if there's already a modal open
    setTimeout(fixOrderTracking, 1000);

})();
