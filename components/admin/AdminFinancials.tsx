import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import {
  Download,
  Upload,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
} from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  status: "completed" | "pending" | "failed";
};

type Budget = {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
};

type PieLabelProps = {
  name: string;
  percent: number;
};

const AdminFinancials: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("month");

  // Mock data
  const transactions: Transaction[] = [
    {
      id: "txn-001",
      date: "2023-10-15",
      description: "Sponsor payment from Tech Corp",
      amount: 5000,
      type: "income",
      category: "sponsorship",
      status: "completed",
    },
    {
      id: "txn-002",
      date: "2023-10-18",
      description: "Office supplies",
      amount: 250,
      type: "expense",
      category: "operations",
      status: "completed",
    },
    {
      id: "txn-003",
      date: "2023-10-22",
      description: "Startup grant payment",
      amount: 2000,
      type: "expense",
      category: "grants",
      status: "completed",
    },
    {
      id: "txn-004",
      date: "2023-10-25",
      description: "Event sponsorship",
      amount: 3000,
      type: "income",
      category: "events",
      status: "pending",
    },
    {
      id: "txn-005",
      date: "2023-10-28",
      description: "Marketing campaign",
      amount: 1500,
      type: "expense",
      category: "marketing",
      status: "completed",
    },
    {
      id: "txn-006",
      date: "2023-11-02",
      description: "Annual membership fees",
      amount: 4000,
      type: "income",
      category: "membership",
      status: "completed",
    },
    {
      id: "txn-007",
      date: "2023-11-05",
      description: "Staff salaries",
      amount: 7500,
      type: "expense",
      category: "payroll",
      status: "pending",
    },
  ];

  const budgets: Budget[] = [
    {
      category: "Operations",
      allocated: 10000,
      spent: 6500,
      remaining: 3500,
      percentUsed: 65,
    },
    {
      category: "Marketing",
      allocated: 5000,
      spent: 3200,
      remaining: 1800,
      percentUsed: 64,
    },
    {
      category: "Events",
      allocated: 8000,
      spent: 6800,
      remaining: 1200,
      percentUsed: 85,
    },
    {
      category: "Grants",
      allocated: 20000,
      spent: 12000,
      remaining: 8000,
      percentUsed: 60,
    },
    {
      category: "Payroll",
      allocated: 30000,
      spent: 21000,
      remaining: 9000,
      percentUsed: 70,
    },
  ];

  const monthlyData = [
    { month: "Jan", income: 12000, expenses: 10000 },
    { month: "Feb", income: 15000, expenses: 12000 },
    { month: "Mar", income: 18000, expenses: 14000 },
    { month: "Apr", income: 16000, expenses: 15000 },
    { month: "May", income: 17000, expenses: 13000 },
    { month: "Jun", income: 19000, expenses: 14500 },
    { month: "Jul", income: 21000, expenses: 16000 },
    { month: "Aug", income: 22000, expenses: 17000 },
    { month: "Sep", income: 20000, expenses: 15500 },
    { month: "Oct", income: 23000, expenses: 18000 },
    { month: "Nov", income: 25000, expenses: 19000 },
    { month: "Dec", income: 28000, expenses: 21000 },
  ];

  const incomeByCategory = [
    { name: "Sponsorships", value: 45000 },
    { name: "Memberships", value: 32000 },
    { name: "Events", value: 18000 },
    { name: "Grants", value: 15000 },
    { name: "Other", value: 5000 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  // Filtering and searching transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || transaction.category === filterCategory;
    const matchesType = filterType === "all" || transaction.type === filterType;

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Financial Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">8%</span> from last
              month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500 font-medium">3%</span> from last
              month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance > 0 ? (
                <>
                  <TrendingUp className="inline h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">
                    Positive
                  </span>{" "}
                  balance
                </>
              ) : (
                <>
                  <TrendingDown className="inline h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">
                    Negative
                  </span>{" "}
                  balance
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Manage budgets for all your startup calls. Track expenses,
                  allocate funds, and generate detailed reports.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() =>
                      (window.location.href =
                        "/admin?section=budget-management")
                    }
                    variant="default"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Open Budget Management
                  </Button>
                </div>
              </div>
              <div className="w-1/3">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={budgets}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="allocated"
                      nameKey="category"
                    >
                      {budgets.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="overview"
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income & Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" fill="#0088FE" name="Income" />
                      <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: PieLabelProps) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {incomeByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          `$${value.toLocaleString()}`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="capitalize">
                        {transaction.category}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {transaction.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="grants">Grants</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex">
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                  </Button>
                  <Button className="ml-2">
                    <Upload className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="capitalize">
                        {transaction.category}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {transaction.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation</CardTitle>
              <div className="flex justify-end">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Edit Budgets
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => (
                    <TableRow key={budget.category}>
                      <TableCell>{budget.category}</TableCell>
                      <TableCell className="text-right">
                        ${budget.allocated.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${budget.spent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${budget.remaining.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div
                              className={`h-2.5 rounded-full ${
                                budget.percentUsed > 90
                                  ? "bg-red-600"
                                  : budget.percentUsed > 70
                                  ? "bg-yellow-400"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${budget.percentUsed}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">
                            {budget.percentUsed}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Monthly Income Statement
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Quarterly Expense Report
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Annual Budget Analysis
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Cash Flow Statement
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Tax Documentation
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  Funding Allocation Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancials;
