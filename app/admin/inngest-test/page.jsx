'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, CheckCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InngestTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [testData, setTestData] = useState('');
  const [results, setResults] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
  }, [session, status, router]);

  const jobTypes = [
    {
      type: 'store-approval',
      name: 'Store Approval Notification',
      description: 'Test store approval/rejection notifications',
      sampleData: {
        storeId: 'store-123',
        status: 'APPROVED',
        previousStatus: 'PENDING',
        storeName: 'My Test Store',
        userEmail: 'storeowner@example.com',
      }
    },
    {
      type: 'user-registration',
      name: 'User Registration Welcome',
      description: 'Test user registration welcome emails',
      sampleData: {
        userId: 'user-123',
        email: 'newuser@example.com',
        name: 'John Doe',
      }
    },
    {
      type: 'order-created',
      name: 'Order Processing',
      description: 'Test order confirmation and notifications',
      sampleData: {
        orderId: 'order-123',
        userId: 'user-123',
        storeId: 'store-123',
        total: 149.99,
      }
    }
  ];

  const handleJobTypeChange = (jobType) => {
    setSelectedJob(jobType);
    const job = jobTypes.find(j => j.type === jobType);
    if (job) {
      setTestData(JSON.stringify(job.sampleData, null, 2));
    }
  };

  const triggerJob = async () => {
    if (!selectedJob || !testData) {
      toast.error('Please select a job type and provide test data');
      return;
    }

    setLoading(true);
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(testData);
      } catch (e) {
        toast.error('Invalid JSON in test data');
        return;
      }

      const response = await fetch('/api/test-inngest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobType: selectedJob,
          data: parsedData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Background job triggered successfully!');
        setResults(prev => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            jobType: selectedJob,
            status: 'success',
            result,
          },
          ...prev.slice(0, 9) // Keep only last 10 results
        ]);
      } else {
        toast.error(result.message || 'Failed to trigger job');
        setResults(prev => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            jobType: selectedJob,
            status: 'error',
            result,
          },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error) {
      console.error('Error triggering job:', error);
      toast.error('Error triggering background job');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inngest Background Jobs Test</h1>
        <p className="text-muted-foreground">Test and monitor background job processing</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Job Trigger Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Background Job</CardTitle>
            <CardDescription>
              Select a job type and customize the test data to trigger background processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Type</label>
              <Select value={selectedJob} onValueChange={handleJobTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((job) => (
                    <SelectItem key={job.type} value={job.type}>
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-xs text-muted-foreground">{job.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Test Data (JSON)</label>
              <Textarea
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder="Enter test data as JSON..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <Button 
              onClick={triggerJob} 
              disabled={loading || !selectedJob || !testData}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? 'Triggering...' : 'Trigger Job'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Job Results</CardTitle>
            <CardDescription>
              Monitor the results of triggered background jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2" />
                <p>No jobs triggered yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div key={result.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium">{result.jobType}</span>
                      </div>
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {result.timestamp}
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Inngest Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Store Approval</h4>
              <p className="text-sm text-muted-foreground">
                Automatically sends notifications when store applications are approved or rejected by admins.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">User Registration</h4>
              <p className="text-sm text-muted-foreground">
                Sends welcome emails and adds users to newsletter when they register on the platform.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Order Processing</h4>
              <p className="text-sm text-muted-foreground">
                Handles order confirmations to customers and notifications to store owners.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
