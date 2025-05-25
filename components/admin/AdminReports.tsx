import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const timeframeOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const formatOptions = [
  { value: 'excel', label: 'Excel Spreadsheet' },
  { value: 'csv', label: 'CSV File' },
];

const AdminReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('30');
  const [format, setFormat] = useState('excel');
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/admin/reports/generate', {
        timeframe,
        format
      }, {
        responseType: 'blob'
      });

      // Create a download link
      const blob = new Blob([response.data], { 
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-activity-report.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report generated and downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card>
        <CardHeader>
        <CardTitle>Generate Activity Report</CardTitle>
          <CardDescription>
          Generate a comprehensive report of platform activities including users, startups, reviews, and sponsorships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
                <div className="space-y-2">
          <h3 className="text-sm font-medium">Time Period</h3>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
              {timeframeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
          <h3 className="text-sm font-medium">Report Format</h3>
                  <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
              {formatOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
                    </SelectContent>
                  </Select>
              </div>
              
        <Button 
          onClick={handleGenerateReport} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
                </Button>

        <div className="text-sm text-muted-foreground">
          <p>The report will include:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Summary of platform activities</li>
            <li>New user registrations</li>
            <li>Startup applications and status changes</li>
            <li>Review activities and scores</li>
            <li>Sponsorship applications and amounts</li>
          </ul>
            </div>
          </CardContent>
        </Card>
  );
};

export default AdminReports; 