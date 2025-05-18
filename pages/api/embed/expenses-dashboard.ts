import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Generate HTML for the expenses dashboard
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Expense Dashboard</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: transparent;
        }
        .dashboard-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .chart-container {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        @media (max-width: 768px) {
          .dashboard-container {
            grid-template-columns: 1fr;
          }
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #3b82f6;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="p-4">
        <div class="mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Expense Analytics</h2>
            <div class="flex gap-2">
              <select id="timeFilter" class="px-3 py-1 border rounded-md text-sm">
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="quarter">This Quarter</option>
                <option value="month" selected>This Month</option>
              </select>
              <button id="refreshBtn" class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg shadow">
              <div class="text-sm text-gray-500">Total Expenses</div>
              <div class="text-2xl font-bold" id="totalExpenses">₹0</div>
              <div class="text-xs text-gray-400" id="expenseCount">0 expenses</div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
              <div class="text-sm text-gray-500">Pending Approval</div>
              <div class="text-2xl font-bold text-yellow-600" id="pendingExpenses">₹0</div>
              <div class="text-xs text-gray-400" id="pendingCount">0 expenses</div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
              <div class="text-sm text-gray-500">Approved</div>
              <div class="text-2xl font-bold text-green-600" id="approvedExpenses">₹0</div>
              <div class="text-xs text-gray-400" id="approvedCount">0 expenses</div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
              <div class="text-sm text-gray-500">Rejected</div>
              <div class="text-2xl font-bold text-red-600" id="rejectedExpenses">₹0</div>
              <div class="text-xs text-gray-400" id="rejectedCount">0 expenses</div>
            </div>
          </div>
        </div>

        <div class="dashboard-container">
          <div class="chart-container">
            <h3 class="text-lg font-medium mb-2">Expenses by Category</h3>
            <div class="h-64">
              <canvas id="categoryChart"></canvas>
            </div>
          </div>
          <div class="chart-container">
            <h3 class="text-lg font-medium mb-2">Expenses by Status</h3>
            <div class="h-64">
              <canvas id="statusChart"></canvas>
            </div>
          </div>
          <div class="chart-container">
            <h3 class="text-lg font-medium mb-2">Monthly Trend</h3>
            <div class="h-64">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
          <div class="chart-container">
            <h3 class="text-lg font-medium mb-2">Top Startups by Expenses</h3>
            <div class="h-64">
              <canvas id="startupChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <script>
        // Fetch data from API
        async function fetchData(timeFilter = 'month') {
          try {
            const response = await fetch(\`/api/admin/expenses?timeFilter=\${timeFilter}\`);
            if (!response.ok) {
              throw new Error('Failed to fetch data');
            }
            return await response.json();
          } catch (error) {
            console.error('Error fetching expense data:', error);
            return { expenses: [] };
          }
        }

        // Initialize charts
        let categoryChart, statusChart, trendChart, startupChart;

        // Process and display data
        async function updateDashboard(timeFilter = 'month') {
          // Show loading state
          document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
          });
          
          const data = await fetchData(timeFilter);
          const expenses = data.expenses || [];
          
          if (expenses.length === 0) {
            document.querySelectorAll('.chart-container').forEach(container => {
              container.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-gray-500">No expense data available</p></div>';
            });
            return;
          }

          // Calculate summary metrics
          const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
          const pending = expenses.filter(exp => exp.status === 'PENDING').reduce((sum, exp) => sum + exp.amount, 0);
          const approved = expenses.filter(exp => exp.status === 'APPROVED').reduce((sum, exp) => sum + exp.amount, 0);
          const rejected = expenses.filter(exp => exp.status === 'REJECTED').reduce((sum, exp) => sum + exp.amount, 0);
          
          // Update summary cards
          document.getElementById('totalExpenses').textContent = '₹' + total.toLocaleString();
          document.getElementById('expenseCount').textContent = expenses.length + ' expenses';
          document.getElementById('pendingExpenses').textContent = '₹' + pending.toLocaleString();
          document.getElementById('pendingCount').textContent = expenses.filter(exp => exp.status === 'PENDING').length + ' expenses';
          document.getElementById('approvedExpenses').textContent = '₹' + approved.toLocaleString();
          document.getElementById('approvedCount').textContent = expenses.filter(exp => exp.status === 'APPROVED').length + ' expenses';
          document.getElementById('rejectedExpenses').textContent = '₹' + rejected.toLocaleString();
          document.getElementById('rejectedCount').textContent = expenses.filter(exp => exp.status === 'REJECTED').length + ' expenses';

          // Prepare chart data
          const categoryData = processCategories(expenses);
          const statusData = processStatuses(expenses);
          const trendData = processTrend(expenses);
          const startupData = processStartups(expenses);
          
          // Render charts
          renderCategoryChart(categoryData);
          renderStatusChart(statusData);
          renderTrendChart(trendData);
          renderStartupChart(startupData);
        }

        // Process expense data by category
        function processCategories(expenses) {
          const categories = {};
          expenses.forEach(exp => {
            const category = exp.category?.name || 'Uncategorized';
            if (!categories[category]) {
              categories[category] = 0;
            }
            categories[category] += exp.amount;
          });
          
          return {
            labels: Object.keys(categories),
            data: Object.values(categories)
          };
        }

        // Process expense data by status
        function processStatuses(expenses) {
          const statuses = {
            'PENDING': 0,
            'APPROVED': 0,
            'REJECTED': 0
          };
          
          expenses.forEach(exp => {
            if (statuses[exp.status] !== undefined) {
              statuses[exp.status] += exp.amount;
            }
          });
          
          return {
            labels: Object.keys(statuses),
            data: Object.values(statuses)
          };
        }

        // Process expense data for monthly trend
        function processTrend(expenses) {
          const months = {};
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = month.toLocaleString('default', { month: 'short' }) + ' ' + month.getFullYear();
            months[monthKey] = 0;
          }
          
          expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthKey = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
            if (months[monthKey] !== undefined) {
              months[monthKey] += exp.amount;
            }
          });
          
          return {
            labels: Object.keys(months),
            data: Object.values(months)
          };
        }

        // Process expense data by startup
        function processStartups(expenses) {
          const startups = {};
          expenses.forEach(exp => {
            const startup = exp.startupName || 'Unknown';
            if (!startups[startup]) {
              startups[startup] = 0;
            }
            startups[startup] += exp.amount;
          });
          
          // Sort and take top 5
          const sorted = Object.entries(startups)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          
          return {
            labels: sorted.map(item => item[0]),
            data: sorted.map(item => item[1])
          };
        }

        // Render category chart
        function renderCategoryChart(data) {
          const ctx = document.getElementById('categoryChart').getContext('2d');
          
          if (categoryChart) {
            categoryChart.destroy();
          }
          
          categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: data.labels,
              datasets: [{
                data: data.data,
                backgroundColor: [
                  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                  '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    boxWidth: 12
                  }
                }
              }
            }
          });
        }

        // Render status chart
        function renderStatusChart(data) {
          const ctx = document.getElementById('statusChart').getContext('2d');
          
          if (statusChart) {
            statusChart.destroy();
          }
          
          statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: data.labels.map(label => label.charAt(0) + label.slice(1).toLowerCase()),
              datasets: [{
                data: data.data,
                backgroundColor: [
                  '#f59e0b', // Pending - yellow
                  '#10b981', // Approved - green
                  '#ef4444'  // Rejected - red
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    boxWidth: 12
                  }
                }
              }
            }
          });
        }

        // Render trend chart
        function renderTrendChart(data) {
          const ctx = document.getElementById('trendChart').getContext('2d');
          
          if (trendChart) {
            trendChart.destroy();
          }
          
          trendChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: data.labels,
              datasets: [{
                label: 'Expense Amount',
                data: data.data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₹' + value.toLocaleString();
                    }
                  }
                }
              }
            }
          });
        }

        // Render startup chart
        function renderStartupChart(data) {
          const ctx = document.getElementById('startupChart').getContext('2d');
          
          if (startupChart) {
            startupChart.destroy();
          }
          
          startupChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: data.labels,
              datasets: [{
                label: 'Expense Amount',
                data: data.data,
                backgroundColor: '#6366f1'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₹' + value.toLocaleString();
                    }
                  }
                }
              }
            }
          });
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', () => {
          updateDashboard('month');
          
          document.getElementById('timeFilter').addEventListener('change', (e) => {
            updateDashboard(e.target.value);
          });
          
          document.getElementById('refreshBtn').addEventListener('click', () => {
            const timeFilter = document.getElementById('timeFilter').value;
            updateDashboard(timeFilter);
          });
        });
      </script>
    </body>
    </html>
  `;

  // Set response headers for HTML content
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
