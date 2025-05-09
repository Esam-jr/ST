import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Budget {
  id: string;
  title: string;
  description: string | null;
  totalAmount: number;
  currency: string;
  fiscalYear: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  categories: BudgetCategory[];
  expenses: Expense[];
}

interface BudgetCategory {
  id: string;
  name: string;
  description: string | null;
  allocatedAmount: number;
  budgetId: string;
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
  budgetId: string;
  category: BudgetCategory | null;
}

interface BudgetDashboardProps {
  startupCallId: string;
  budgets: Budget[];
}

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

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  startupCallId,
  budgets,
}) => {
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [spendingPercentage, setSpendingPercentage] = useState(0);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyExpenseData, setMonthlyExpenseData] = useState<any[]>([]);
  const [budgetOverview, setBudgetOverview] = useState<any[]>([]);

  useEffect(() => {
    // Calculate totals and prepare chart data
    if (budgets && budgets.length > 0) {
      const totalBudgetAmount = budgets.reduce(
        (sum, budget) => sum + budget.totalAmount,
        0
      );

      // Calculate total expenses across all budgets
      const allExpenses = budgets.flatMap((budget) => budget.expenses);
      const totalExpensesAmount = allExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const remainingAmount = totalBudgetAmount - totalExpensesAmount;
      const spendingPercent =
        totalBudgetAmount > 0
          ? Math.round((totalExpensesAmount / totalBudgetAmount) * 100)
          : 0;

      setTotalBudget(totalBudgetAmount);
      setTotalExpenses(totalExpensesAmount);
      setTotalRemaining(remainingAmount);
      setSpendingPercentage(spendingPercent);

      // Prepare category data for pie chart
      const aggregatedCategories: { [key: string]: number } = {};

      budgets.forEach((budget) => {
        budget.categories.forEach((category) => {
          if (aggregatedCategories[category.name]) {
            aggregatedCategories[category.name] += category.allocatedAmount;
          } else {
            aggregatedCategories[category.name] = category.allocatedAmount;
          }
        });
      });

      const categoryChartData = Object.entries(aggregatedCategories).map(
        ([name, value]) => ({
          name,
          value,
        })
      );

      setCategoryData(categoryChartData);

      // Generate monthly expense data
      const currentYear = new Date().getFullYear();
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const monthlyData = months.map((month) => {
        return {
          name: month,
          expenses: 0,
          budget: 0,
        };
      });

      // Add expense data by month
      allExpenses.forEach((expense) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getFullYear() === currentYear) {
          const monthIndex = expenseDate.getMonth();
          monthlyData[monthIndex].expenses += expense.amount;
        }
      });

      // Distribute budget amounts evenly across the year (or could be more sophisticated)
      const monthlyBudgetAmount = totalBudgetAmount / 12;
      monthlyData.forEach((month) => {
        month.budget = monthlyBudgetAmount;
      });

      setMonthlyExpenseData(monthlyData);

      // Prepare budget overview data
      const budgetOverviewData = budgets.map((budget) => {
        const totalExpensesForBudget = budget.expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );
        const remainingForBudget = budget.totalAmount - totalExpensesForBudget;
        const percentSpent =
          budget.totalAmount > 0
            ? Math.round((totalExpensesForBudget / budget.totalAmount) * 100)
            : 0;

        return {
          id: budget.id,
          title: budget.title,
          totalAmount: budget.totalAmount,
          spent: totalExpensesForBudget,
          remaining: remainingForBudget,
          percentSpent: percentSpent,
          currency: budget.currency,
          status: budget.status,
          fiscalYear: budget.fiscalYear,
        };
      });

      setBudgetOverview(budgetOverviewData);
    }
  }, [budgets]);

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-500 bg-green-50";
      case "draft":
        return "text-gray-500 bg-gray-50";
      case "closed":
        return "text-blue-500 bg-blue-50";
      case "archived":
        return "text-purple-500 bg-purple-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent < 50) return "bg-green-500";
    if (percent < 75) return "bg-yellow-500";
    if (percent < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total allocated across {budgets.length} budget
              {budgets.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="flex items-center pt-1">
              <Progress
                value={spendingPercentage}
                className={`h-2 w-full ${getProgressColor(spendingPercentage)}`}
              />
              <span className="ml-2 text-xs text-muted-foreground">
                {spendingPercentage}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRemaining < 0 ? (
                <span className="text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> Over budget
                </span>
              ) : (
                `${100 - spendingPercentage}% of budget remaining`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
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
                      {categoryData.map((entry, index) => (
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
                    No budget categories found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Budget vs. Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {monthlyExpenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyExpenseData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                    <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No monthly data available
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>
            Status of all budgets for this startup call
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgetOverview.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No budgets created yet</p>
              <Button className="mt-4">Create Budget</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetOverview.map((budget) => (
                <Card key={budget.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{budget.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(budget.status)}>
                            {budget.status.charAt(0).toUpperCase() +
                              budget.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {budget.fiscalYear}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(budget.totalAmount, budget.currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Budget
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {formatCurrency(budget.spent, budget.currency)} spent
                          ({budget.percentSpent}%)
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(budget.remaining, budget.currency)}{" "}
                          remaining
                        </span>
                      </div>
                      <Progress
                        value={budget.percentSpent}
                        className={`h-2 ${getProgressColor(
                          budget.percentSpent
                        )}`}
                      />
                    </div>
                  </div>
                  <CardFooter className="bg-muted/50 px-6 py-3">
                    <div className="flex justify-end w-full">
                      <Link
                        href={`/admin/startup-calls/${startupCallId}/budgets/${budget.id}`}
                        passHref
                      >
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetDashboard;
