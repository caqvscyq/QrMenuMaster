import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewFeaturePage() {
  const [data, setData] = useState(null);

  const handleAction = async () => {
    try {
      // Call your new API endpoint
      const response = await fetch('/api/customer/new-feature', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>New Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAction}>
            Load Data
          </Button>
          {data && (
            <div className="mt-4">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
