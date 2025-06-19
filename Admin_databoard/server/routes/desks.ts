import { Router } from 'express';
import { databaseStorage as storage } from '../database';

const router = Router();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  const userId = req.headers.authorization?.replace('Bearer ', '');
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.userId = parseInt(userId);
  next();
};

const requireAdmin = async (req: any, res: any, next: any) => {
  const user = await storage.getUser(req.userId);
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Get all desks with status
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/desks - Fetching desks');
    
    // Use storage object instead of direct db query
    const desksWithStatus = await storage.getDesks();
    console.log(`Found ${desksWithStatus.length} desks`);
    
    res.json(desksWithStatus);
  } catch (error) {
    console.error('Error fetching desks:', error);
    res.status(500).json({ error: 'Failed to fetch desks' });
  }
});

// Update a desk's status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isOccupied } = req.body;
    
    if (typeof isOccupied !== 'boolean') {
      return res.status(400).json({ error: 'isOccupied field is required and must be a boolean' });
    }

    const updatedDesk = await storage.updateDeskStatus(parseInt(id), isOccupied);

    if (!updatedDesk) {
      return res.status(404).json({ error: 'Desk not found' });
    }

    res.json(updatedDesk);
  } catch (error) {
    console.error('Error updating desk:', error);
    res.status(500).json({ error: 'Failed to update desk' });
  }
});

// Mark table as paid and clear
router.post('/:id/release', async (req, res) => {
  try {
    const { id } = req.params;
    const deskId = parseInt(id);
    
    console.log(`Processing release request for desk ${deskId}`);
    
    // Use storage method to complete orders and release desk
    const completedOrders = await storage.completeAndPayDeskOrders(deskId);
    console.log(`Completed ${completedOrders.length} orders for desk ${deskId}`);
    
    const updatedDesk = await storage.setDeskOccupied(deskId, false);
    console.log(`Updated desk ${deskId} status to available: ${JSON.stringify(updatedDesk)}`);
    
    res.json({ 
      success: true, 
      message: `Table ${id} has been released and is now available`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error releasing table:', error);
    res.status(500).json({ error: 'Failed to release table' });
  }
});

// Toggle table status (available/occupied)
router.post('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const deskId = parseInt(id);
    
    if (!status || !['available', 'occupied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "available" or "occupied"' });
    }
    
    if (status === 'available') {
      // When marking as available, clear all orders and release desk
      await storage.completeAndPayDeskOrders(deskId);
      await storage.setDeskOccupied(deskId, false);
    } else if (status === 'occupied') {
      // When marking as occupied, just update the status
      await storage.setDeskOccupied(deskId, true);
    }
    
    res.json({ 
      success: true, 
      message: `Table ${id} has been marked as ${status}`,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling table status:', error);
    res.status(500).json({ error: 'Failed to toggle table status' });
  }
});

export default router; 