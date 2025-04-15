import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, LineChart, PieChart, Download, FileSpreadsheet, Calendar } from 'lucide-react';

type ReportType = 'users' | 'startups' | 'sponsors' | 'reviews' | 'financials';

const AdminReports = () => {
  const [reportType, setReportType] = useState<ReportType>('users');
  const [dateRange, setDateRange] = useState('last-30');
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports & Analytics</CardTitle>
          <CardDescription>
            Generate comprehensive reports and visualize system data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="generate">Generate Reports</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
              <TabsTrigger value="saved">Saved Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">User Activity</SelectItem>
                      <SelectItem value="startups">Startup Applications</SelectItem>
                      <SelectItem value="sponsors">Sponsor Engagement</SelectItem>
                      <SelectItem value="reviews">Review Analytics</SelectItem>
                      <SelectItem value="financials">Financial Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger id="date-range">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last-7">Last 7 days</SelectItem>
                      <SelectItem value="last-30">Last 30 days</SelectItem>
                      <SelectItem value="last-90">Last 90 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {dateRange === 'custom' && (
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input id="start-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button variant="outline">Preview</Button>
                <Button onClick={handleGenerateReport} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="scheduled" className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Schedule Reports</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up recurring reports to be delivered automatically
                    </p>
                  </div>
                </div>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Scheduled Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h4 className="font-medium">Monthly User Activity</h4>
                        <p className="text-sm text-muted-foreground">PDF • First day of month • Admin Recipients</p>
                      </div>
                      <Badge>Active</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h4 className="font-medium">Weekly Financial Summary</h4>
                        <p className="text-sm text-muted-foreground">Excel • Every Monday • Finance Team</p>
                      </div>
                      <Badge>Active</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Quarterly Performance</h4>
                        <p className="text-sm text-muted-foreground">PDF • End of quarter • Executive Team</p>
                      </div>
                      <Badge variant="outline">Paused</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule New Report
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="saved" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Startup Applications Q2</CardTitle>
                      <Badge variant="outline" className="text-xs">PDF</Badge>
                    </div>
                    <CardDescription>Generated June 30, 2023</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Sponsor Engagement</CardTitle>
                      <Badge variant="outline" className="text-xs">Excel</Badge>
                    </div>
                    <CardDescription>Generated May 15, 2023</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Review Completion Rates</CardTitle>
                      <Badge variant="outline" className="text-xs">PDF</Badge>
                    </div>
                    <CardDescription>Generated April 2, 2023</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Current Period</p>
                <h4 className="text-2xl font-bold">87%</h4>
                <p className="text-xs text-muted-foreground">+12% from last period</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Data Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Trend Analysis</p>
                <h4 className="text-2xl font-bold">+23%</h4>
                <p className="text-xs text-muted-foreground">Growth rate increasing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Data Export</p>
                <div className="flex space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">CSV</Badge>
                  <Badge variant="outline" className="text-xs">PDF</Badge>
                  <Badge variant="outline" className="text-xs">Excel</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports; 