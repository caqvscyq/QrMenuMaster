const fetch = require('node-fetch');

async function addCustomizations() {
  try {
    // First, let's add customization options to the beef noodle soup (ID: 1)
    const beefNoodleCustomizations = [
      {
        id: 'spice_level',
        name: '辣度選擇',
        type: 'radio',
        required: true,
        options: [
          { id: 'mild', name: '不辣', price: 0 },
          { id: 'medium', name: '小辣', price: 0 },
          { id: 'hot', name: '中辣', price: 0 },
          { id: 'extra_hot', name: '大辣', price: 0 }
        ]
      },
      {
        id: 'noodle_type',
        name: '麵條選擇',
        type: 'radio',
        required: true,
        options: [
          { id: 'regular', name: '一般麵條', price: 0 },
          { id: 'thick', name: '粗麵條', price: 5 },
          { id: 'thin', name: '細麵條', price: 0 }
        ]
      },
      {
        id: 'extra_beef',
        name: '加牛肉',
        type: 'checkbox',
        price: 50
      },
      {
        id: 'extra_vegetables',
        name: '加青菜',
        type: 'checkbox',
        price: 20
      }
    ];

    console.log('Adding customizations to beef noodle soup...');
    const response1 = await fetch('http://localhost:5000/api/admin/menu-items/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customizationOptions: JSON.stringify(beefNoodleCustomizations)
      })
    });

    if (response1.ok) {
      console.log('✓ Beef noodle soup updated successfully');
    } else {
      console.log('✗ Failed to update beef noodle soup:', await response1.text());
    }

    // Add customizations to bubble tea (ID: 6)
    const bubbleTeaCustomizations = [
      {
        id: 'sweetness',
        name: '甜度',
        type: 'radio',
        required: true,
        options: [
          { id: 'no_sugar', name: '無糖', price: 0 },
          { id: 'quarter', name: '微糖', price: 0 },
          { id: 'half', name: '半糖', price: 0 },
          { id: 'less', name: '少糖', price: 0 },
          { id: 'regular', name: '正常糖', price: 0 }
        ]
      },
      {
        id: 'ice_level',
        name: '冰塊',
        type: 'radio',
        required: true,
        options: [
          { id: 'no_ice', name: '去冰', price: 0 },
          { id: 'less_ice', name: '微冰', price: 0 },
          { id: 'half_ice', name: '半冰', price: 0 },
          { id: 'regular_ice', name: '正常冰', price: 0 }
        ]
      },
      {
        id: 'extra_pearls',
        name: '加珍珠',
        type: 'checkbox',
        price: 10
      },
      {
        id: 'coconut_jelly',
        name: '加椰果',
        type: 'checkbox',
        price: 10
      }
    ];

    console.log('Adding customizations to bubble tea...');
    const response2 = await fetch('http://localhost:5000/api/admin/menu-items/6', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customizationOptions: JSON.stringify(bubbleTeaCustomizations)
      })
    });

    if (response2.ok) {
      console.log('✓ Bubble tea updated successfully');
    } else {
      console.log('✗ Failed to update bubble tea:', await response2.text());
    }

    // Add customizations to salt & pepper chicken (ID: 3)
    const chickenCustomizations = [
      {
        id: 'spice_level',
        name: '辣度',
        type: 'radio',
        required: true,
        options: [
          { id: 'no_spice', name: '不辣', price: 0 },
          { id: 'mild', name: '微辣', price: 0 },
          { id: 'medium', name: '中辣', price: 0 },
          { id: 'hot', name: '重辣', price: 0 }
        ]
      },
      {
        id: 'extra_seasoning',
        name: '加胡椒鹽',
        type: 'checkbox',
        price: 5
      }
    ];

    console.log('Adding customizations to salt & pepper chicken...');
    const response3 = await fetch('http://localhost:5000/api/admin/menu-items/3', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customizationOptions: JSON.stringify(chickenCustomizations)
      })
    });

    if (response3.ok) {
      console.log('✓ Salt & pepper chicken updated successfully');
    } else {
      console.log('✗ Failed to update salt & pepper chicken:', await response3.text());
    }

    console.log('\nAll customizations added successfully!');
    console.log('Now clearing cache...');
    
    // Clear cache
    const { cacheFlush } = require('./dist/config/redis');
    await cacheFlush();
    
    console.log('Cache cleared! Customization buttons should now appear.');
    
  } catch (error) {
    console.error('Error adding customizations:', error);
  }
}

addCustomizations();
