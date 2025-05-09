import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subMonths, startOfYear, endOfYear } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  FileText,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";

interface Budget {
  id: string;
  title: string;
  description: string | null;
  totalAmount: number;
  currency: string;
  fiscalYear: string;
  status: string;
  categories: BudgetCategory[];
  expenses: Expense[];
}

interface BudgetCategory {
  id: string;
  name: string;
  description: string | null;
  allocatedAmount: number;
}

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  date: string;
  receipt: string | null;
  status: string;
  categoryId: string | null;
  category: BudgetCategory | null;
}

interface BudgetReportsProps {
  startupCallId: string;
  budgets: Budget[];
}

// Colors for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#4CAF50",
  "#9C27B0",
  "#3F51B5",
];

const BudgetReports: React.FC<BudgetReportsProps> = ({
  startupCallId,
  budgets,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });
  const [reportTimeframe, setReportTimeframe] = useState<string>("yearly");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate report data whenever filters change
  useEffect(() => {
    generateReportData();
  }, [selectedBudget, dateRange, reportTimeframe, budgets]);

  // Function to generate report data based on current filters
  const generateReportData = () => {
    setLoading(true);

    // Filter budgets if a specific one is selected
    const filteredBudgets =
      selectedBudget === "all"
        ? budgets
        : budgets.filter((budget) => budget.id === selectedBudget);

    if (filteredBudgets.length === 0) {
      setReportData([]);
      setLoading(false);
      return;
    }

    // Flatten all expenses from selected budgets
    const allExpenses = filteredBudgets.flatMap((budget) => budget.expenses);

    // Filter expenses by date range if set
    const filteredExpenses = allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      if (dateRange?.from && dateRange?.to) {
        return expenseDate >= dateRange.from && expenseDate <= dateRange.to;
      }
      return true;
    });

    // Generate data based on the selected timeframe
    let formattedData: any[] = [];

    switch (reportTimeframe) {
      case "monthly":
        formattedData = generateMonthlyData(filteredExpenses, filteredBudgets);
        break;
      case "quarterly":
        formattedData = generateQuarterlyData(
          filteredExpenses,
          filteredBudgets
        );
        break;
      case "yearly":
      default:
        formattedData = generateYearlyData(filteredExpenses, filteredBudgets);
        break;
    }

    setReportData(formattedData);
    setLoading(false);
  };

  // Generate monthly report data
  const generateMonthlyData = (
    expenses: Expense[],
    selectedBudgets: Budget[]
  ) => {
    const months: { [key: string]: { expenses: number; budget: number } } = {};

    // Initialize all months in range
    const startDate = dateRange?.from || subMonths(new Date(), 6);
    const endDate = dateRange?.to || new Date();
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthKey = format(currentDate, "MMM yyyy");
      months[monthKey] = { expenses: 0, budget: 0 };
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
    }

    // Sum expenses by month
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const monthKey = format(expenseDate, "MMM yyyy");

      if (months[monthKey]) {
        months[monthKey].expenses += expense.amount;
      }
    });

    // Calculate monthly budget allocation (simplified by dividing total budget)
    const totalMonths = Object.keys(months).length;
    if (totalMonths > 0) {
      const totalBudget = selectedBudgets.reduce(
        (sum, b) => sum + b.totalAmount,
        0
      );
      const monthlyBudget = totalBudget / totalMonths;

      Object.keys(months).forEach((month) => {
        months[month].budget = monthlyBudget;
      });
    }

    // Convert to array format for charts
    return Object.keys(months).map((month) => ({
      name: month,
      expenses: months[month].expenses,
      budget: months[month].budget,
    }));
  };

  // Generate quarterly report data
  const generateQuarterlyData = (
    expenses: Expense[],
    selectedBudgets: Budget[]
  ) => {
    const quarters: { [key: string]: { expenses: number; budget: number } } = {
      Q1: { expenses: 0, budget: 0 },
      Q2: { expenses: 0, budget: 0 },
      Q3: { expenses: 0, budget: 0 },
      Q4: { expenses: 0, budget: 0 },
    };

    // Group expenses by quarter
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const month = expenseDate.getMonth();
      let quarter: string;

      if (month < 3) quarter = "Q1";
      else if (month < 6) quarter = "Q2";
      else if (month < 9) quarter = "Q3";
      else quarter = "Q4";

      quarters[quarter].expenses += expense.amount;
    });

    // Calculate quarterly budget allocation
    const totalBudget = selectedBudgets.reduce(
      (sum, b) => sum + b.totalAmount,
      0
    );
    const quarterlyBudget = totalBudget / 4;

    Object.keys(quarters).forEach((quarter) => {
      quarters[quarter].budget = quarterlyBudget;
    });

    // Convert to array format for charts
    return Object.keys(quarters).map((quarter) => ({
      name: quarter,
      expenses: quarters[quarter].expenses,
      budget: quarters[quarter].budget,
    }));
  };

  // Generate yearly report data
  const generateYearlyData = (
    expenses: Expense[],
    selectedBudgets: Budget[]
  ) => {
    // Group expenses by category
    const categoriesData: { [key: string]: number } = {};
    const totalBudget = selectedBudgets.reduce(
      (sum, b) => sum + b.totalAmount,
      0
    );
    let totalExpenses = 0;

    // Initialize with budget categories
    selectedBudgets.forEach((budget) => {
      budget.categories.forEach((category) => {
        if (categoriesData[category.name]) {
          categoriesData[category.name] += 0;
        } else {
          categoriesData[category.name] = 0;
        }
      });
    });

    // Add uncategorized if needed
    categoriesData["Uncategorized"] = 0;

    // Sum expenses by category
    expenses.forEach((expense) => {
      const categoryName = expense.category?.name || "Uncategorized";
      if (categoriesData[categoryName] !== undefined) {
        categoriesData[categoryName] += expense.amount;
      } else {
        categoriesData[categoryName] = expense.amount;
      }
      totalExpenses += expense.amount;
    });

    // Convert to array format for charts
    const data = Object.keys(categoriesData).map((category) => ({
      name: category,
      value: categoriesData[category],
      budget: selectedBudgets
        .flatMap((b) => b.categories)
        .filter((c) => c.name === category)
        .reduce((sum, c) => sum + c.allocatedAmount, 0),
    }));

    // Add overall data
    data.push({
      name: "Total",
      expenses: totalExpenses,
      budget: totalBudget,
      remaining: totalBudget - totalExpenses,
    });

    return data;
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Export data to CSV
  const exportToCSV = () => {
    // Different export formats depending on the view
    let csvContent = "";
    let fileName = "";

    if (activeTab === "overview") {
      const headers = ["Category", "Spent", "Budget", "Remaining", "% Used"];
      const rows = reportData
        .filter((item) => item.name !== "Total")
        .map((item) => {
          const spent = item.value || 0;
          const budget = item.budget || 0;
          const remaining = budget - spent;
          const percentUsed =
            budget > 0 ? Math.round((spent / budget) * 100) : 0;

          return [
            item.name,
            spent.toFixed(2),
            budget.toFixed(2),
            remaining.toFixed(2),
            `${percentUsed}%`,
          ];
        });

      csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      fileName = `budget_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
    } else if (activeTab === "trend") {
      const headers = ["Period", "Expenses", "Budget"];
      const rows = reportData.map((item) => [
        item.name,
        item.expenses.toFixed(2),
        item.budget.toFixed(2),
      ]);

      csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      fileName = `budget_trend_${reportTimeframe}_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.csv`;
    }

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, fileName);

    toast({
      title: "Export Successful",
      description: `The report has been exported as ${fileName}`,
    });
  };

  // Generate PDF report
  const generatePDFReport = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `/api/startup-calls/${startupCallId}/budgets/report`,
        {
          budgetId: selectedBudget === "all" ? null : selectedBudget,
          dateFrom: dateRange?.from
            ? format(dateRange.from, "yyyy-MM-dd")
            : null,
          dateTo: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
          timeframe: reportTimeframe,
        },
        {
          responseType: "blob",
        }
      );

      const fileName = `budget_report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      const blob = new Blob([response.data], { type: "application/pdf" });
      saveAs(blob, fileName);

      toast({
        title: "Report Generated",
        description: "The PDF report has been generated successfully",
      });
    } catch (error) {
      console.error("Error generating PDF report:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Budget Reports & Analysis</CardTitle>
              <CardDescription>
                Generate and visualize budget reports
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="default" onClick={generatePDFReport}>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Report Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select value={selectedBudget} onValueChange={setSelectedBudget}>
              <SelectTrigger>
                <SelectValue placeholder="Select Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
            />

            <Select value={reportTimeframe} onValueChange={setReportTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Select Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">
                <PieChartIcon className="mr-2 h-4 w-4" />
                Budget Overview
              </TabsTrigger>
              <TabsTrigger value="trend">
                <BarChartIcon className="mr-2 h-4 w-4" />
                Spending Trends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Budget Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {reportData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.filter(
                                (item) => item.name !== "Total"
                              )}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="budget"
                            >
                              {reportData
                                .filter((item) => item.name !== "Total")
                                .map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Allocated",
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No data available
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Expense Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {reportData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.filter(
                                (item) =>
                                  item.name !== "Total" && item.value > 0
                              )}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {reportData
                                .filter((item) => item.name !== "Total")
                                .map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Spent",
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No expense data available
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Budget vs. Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {reportData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={reportData.filter(
                            (item) => item.name !== "Total"
                          )}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => [
                              formatCurrency(value),
                              "",
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="budget" name="Budget" fill="#8884d8" />
                          <Bar dataKey="value" name="Spent" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          No data available
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trend" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spending Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {reportData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={reportData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "",
                              ]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="expenses"
                              name="Expenses"
                              stroke="#ff7300"
                              activeDot={{ r: 8 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="budget"
                              name="Budget"
                              stroke="#387908"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No trend data available
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Cumulative Budget Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {reportData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={reportData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "",
                              ]}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="budget"
                              name="Budget"
                              stroke="#8884d8"
                              fill="#8884d8"
                            />
                            <Area
                              type="monotone"
                              dataKey="expenses"
                              name="Expenses"
                              stroke="#82ca9d"
                              fill="#82ca9d"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No cumulative data available
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetReports;
