import { useState } from "react";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, ExternalLink } from "lucide-react";
import useSWR from "swr";
import axios from "axios";

// Date formatter helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// Define Announcement type based on Advertisement model
interface Announcement {
  id: string;
  title: string;
  content: string; // Changed from description
  imageUrl?: string;
  scheduledDate: string; // Changed from startDate/endDate
  platforms: string[];
  status: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Use SWR for data fetching with auto-revalidation
  const { data: announcements = [], error } = useSWR<Announcement[]>(
    "/api/public/announcements",
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  // Filter announcements based on search term
  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Announcements | Startup Network">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Announcements</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest news and updates from our startup
            community.
          </p>
        </div>

        <div className="flex w-full max-w-md mx-auto items-center space-x-2 mb-12">
          <Input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button type="submit" variant="ghost">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800 max-w-3xl mx-auto">
            Unable to load announcements. Please try again later.
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">
              No announcements at the moment. Please check back soon!
            </p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No announcements match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                {announcement.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col">
                  {announcement.scheduledDate && (
                    <div className="flex items-center text-sm text-blue-600 mb-3">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(announcement.scheduledDate)}</span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-3">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 mb-4 flex-grow">
                    {announcement.content}
                  </p>

                  {announcement.platforms &&
                    announcement.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 mb-3">
                        {announcement.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    )}

                  <div className="text-xs text-gray-500 mt-4">
                    Posted on {formatDate(announcement.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
