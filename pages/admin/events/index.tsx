import { useState } from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Layout from "@/components/layout/Layout";
import {
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  Clock,
  MapPin,
  Globe,
  Video,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import useSWR, { mutate } from "swr";

// Date formatter helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Format time from date
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Use SWR for data fetching with auto-revalidation
  const {
    data: events = [],
    error,
    mutate: refreshEvents,
  } = useSWR("/api/events", fetcher, {
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    revalidateOnFocus: true, // Refresh when tab regains focus
  });

  // Filter events based on search term and type
  const filteredEvents = events.filter((event: any) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? event.type === filterType : true;
    return matchesSearch && matchesType;
  });

  // Count for each type of event
  const typeCounts = events.reduce(
    (counts: Record<string, number>, event: any) => {
      const type = event.type || "OTHER";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    },
    {}
  );

  // Group by upcoming and past events
  const now = new Date();
  const upcoming = filteredEvents.filter(
    (event: any) => new Date(event.startDate) > now
  );
  const past = filteredEvents.filter(
    (event: any) => new Date(event.startDate) <= now
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeletingId(id);

    try {
      await axios.delete(`/api/events/${id}`);

      // Optimistically update the UI
      refreshEvents(
        events.filter((event: any) => event.id !== id),
        { revalidate: true }
      );

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderEventTypeTag = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      WORKSHOP: { bg: "bg-indigo-100", text: "text-indigo-800" },
      WEBINAR: { bg: "bg-purple-100", text: "text-purple-800" },
      DEADLINE: { bg: "bg-red-100", text: "text-red-800" },
      ANNOUNCEMENT: { bg: "bg-blue-100", text: "text-blue-800" },
      NETWORKING: { bg: "bg-green-100", text: "text-green-800" },
      OTHER: { bg: "bg-gray-100", text: "text-gray-800" },
    };

    const style = colors[type] || colors["OTHER"];

    return (
      <span
        className={`${style.bg} ${style.text} text-xs font-medium px-2.5 py-0.5 rounded-full`}
      >
        {type}
      </span>
    );
  };

  return (
    <Layout title="Events Management | Admin">
      <div className="container mx-auto py-6 space-y-6">
        {/* Admin Navigation Tabs */}
        <div className="flex border-b">
          <Link
            href="/admin/events"
            className="mr-4 px-4 py-2 text-primary font-medium border-b-2 border-primary"
          >
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Events
            </div>
          </Link>
          <Link
            href="/admin/advertisements"
            className="mr-4 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Advertisements
            </div>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Events Management</h1>
            <p className="text-gray-500">
              Create and manage events for the platform
            </p>
          </div>
          <Link href="/admin/events/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Event
            </Button>
          </Link>
        </div>

        {/* Filter and stats section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-3">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <span>{filterType || "All Types"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="WORKSHOP">Workshop</SelectItem>
                      <SelectItem value="WEBINAR">Webinar</SelectItem>
                      <SelectItem value="DEADLINE">Deadline</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                      <SelectItem value="NETWORKING">Networking</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex border rounded-md overflow-hidden">
                    <Button
                      variant={view === "grid" ? "default" : "ghost"}
                      className="rounded-none px-3"
                      onClick={() => setView("grid")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-grid"
                      >
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                      </svg>
                    </Button>
                    <Separator orientation="vertical" />
                    <Button
                      variant={view === "list" ? "default" : "ghost"}
                      className="rounded-none px-3"
                      onClick={() => setView("list")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-list"
                      >
                        <line x1="8" x2="21" y1="6" y2="6" />
                        <line x1="8" x2="21" y1="12" y2="12" />
                        <line x1="8" x2="21" y1="18" y2="18" />
                        <line x1="3" x2="3.01" y1="6" y2="6" />
                        <line x1="3" x2="3.01" y1="12" y2="12" />
                        <line x1="3" x2="3.01" y1="18" y2="18" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Events by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      {type}
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            Error loading events. Please refresh the page.
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">
              No events found. Create your first event.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No events match your search.</p>
          </div>
        ) : (
          <>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Upcoming ({upcoming.length})
                </TabsTrigger>
                <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
                <TabsTrigger value="all">
                  All Events ({filteredEvents.length})
                </TabsTrigger>
              </TabsList>

              {["upcoming", "past", "all"].map((tab) => {
                const eventsToShow =
                  tab === "upcoming"
                    ? upcoming
                    : tab === "past"
                    ? past
                    : filteredEvents;

                return (
                  <TabsContent key={tab} value={tab} className="mt-6">
                    {view === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {eventsToShow.map((event: any) => (
                          <Card key={event.id} className="overflow-hidden">
                            {event.imageUrl && (
                              <div className="h-36 overflow-hidden">
                                <img
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                {renderEventTypeTag(event.type)}
                                {event.isVirtual && (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center text-blue-500"
                                  >
                                    <Video className="h-3 w-3 mr-1" />
                                    Virtual
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg mt-2">
                                {event.title}
                              </CardTitle>
                              <CardDescription>
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(event.startDate)}
                                  {event.endDate &&
                                    event.startDate !== event.endDate &&
                                    ` - ${formatDate(event.endDate)}`}
                                </div>
                              </CardDescription>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatTime(event.startDate)}
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {event.description}
                              </p>
                              {event.location && (
                                <div className="mt-2 text-sm text-gray-500 flex items-center">
                                  {event.isVirtual ? (
                                    <Globe className="h-4 w-4 mr-1" />
                                  ) : (
                                    <MapPin className="h-4 w-4 mr-1" />
                                  )}
                                  {event.location}
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-between">
                              <Link
                                href={`/events/${event.id}`}
                                target="_blank"
                              >
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              <div className="space-x-2">
                                <Link href={`/admin/events/edit/${event.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(event.id)}
                                  disabled={deletingId === event.id}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  {deletingId === event.id ? (
                                    <span className="animate-pulse">...</span>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Event
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {eventsToShow.map((event: any) => (
                              <tr key={event.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="flex items-start space-x-3">
                                    {event.imageUrl ? (
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <img
                                          src={event.imageUrl}
                                          alt={event.title}
                                          className="h-10 w-10 rounded-md object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {event.title}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {renderEventTypeTag(event.type)}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatDate(event.startDate)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatTime(event.startDate)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500 flex items-center">
                                    {event.isVirtual ? (
                                      <>
                                        <Video className="inline h-4 w-4 mr-1" />
                                        Virtual Event
                                      </>
                                    ) : (
                                      <>
                                        <MapPin className="inline h-4 w-4 mr-1" />
                                        {event.location || "Not specified"}
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <Link
                                      href={`/events/${event.id}`}
                                      target="_blank"
                                    >
                                      <Button variant="ghost" size="sm">
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Link
                                      href={`/admin/events/edit/${event.id}`}
                                    >
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(event.id)}
                                      disabled={deletingId === event.id}
                                    >
                                      {deletingId === event.id ? (
                                        <span className="animate-pulse">
                                          ...
                                        </span>
                                      ) : (
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      )}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || session.user.role !== "ADMIN") {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/admin/events",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
};
