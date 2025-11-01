'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { dataStore } from '@/lib/data-store';

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testDirectInsert = async () => {
    try {
      // Test getting current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Auth error: ${authError.message}`);
        return;
      }
      
      console.log("Current user:", user);
      
      // Test direct insert without photo
      const { data, error: dbError } = await supabase
        .from('inventory_items')
        .insert([{
          name: 'Test Item',
          description: 'Test Description',
          category: 'Test Category',
          location: 'Test Location',
          status: 'available'
        }])
        .select();
        
      if (dbError) {
        setError(`Database error: ${dbError.message}`);
        console.error('Database error details:', dbError);
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('General error:', err);
    }
  };

  const testWithDataStore = async () => {
    try {
      const item = await dataStore.addItem({
        name: 'Test via DataStore',
        description: 'Test Description',
        category: 'Test Category',
        location: 'Test Location',
        status: 'available' as const
      });
      setResult(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('DataStore error:', err);
    }
  };

  return (
    <div className="p-4">
      <h1>Auth Test Page</h1>
      <button 
        onClick={testDirectInsert}
        className="mr-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Direct Insert
      </button>
      <button 
        onClick={testWithDataStore}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Test via DataStore
      </button>
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800">
          Error: {error}
        </div>
      )}
      {result && (
        <div className="mt-4 p-2 bg-green-100 text-green-800">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}