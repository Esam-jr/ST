import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, DownloadIcon, FileTextIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";

interface BudgetReportDialogProps {
  startupCallId: string;
  budgets: any[];
}

export default function BudgetReportDialog({
  startupCallId,
  budgets,
}: BudgetReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [timeframe, setTimeframe] = useState<string>("all");

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/startup-calls/${startupCallId}/budgets/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            budgetId: selectedBudget,
            dateFrom: dateFrom?.toISOString(),
            dateTo: dateTo?.toISOString(),
            timeframe,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Create a blob from the PDF stream
      const blob = await response.blob();

      // Create a link element to download the PDF
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `budget_report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Generated",
        description: "Your budget report has been downloaded.",
        variant: "default",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate budget report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedBudget(null);
    setDateFrom(undefined);
    setDateTo(undefined);
    setTimeframe("all");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Budget Report</DialogTitle>
          <DialogDescription>
            Create a detailed budget report with expense breakdowns. Select the
            options below to customize your report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="budget" className="text-right">
              Budget
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedBudget || "all"}
                onValueChange={(value) =>
                  setSelectedBudget(value === "all" ? null : value)
                }
              >
                <SelectTrigger id="budget">
                  <SelectValue placeholder="Select budget" />
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
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeframe" className="text-right">
              Timeframe
            </Label>
            <div className="col-span-3">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger id="timeframe">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="current_quarter">
                    Current Quarter
                  </SelectItem>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {timeframe === "custom" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date-from" className="text-right">
                  From
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-from"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date-to" className="text-right">
                  To
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-to"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        disabled={(date) =>
                          dateFrom ? date < dateFrom : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <DownloadIcon className="h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
