import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface Advertisement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  scheduledDate: string;
  platforms: string[];
  status: string;
}

export default function AdvertisementDisplay({
  location = "sidebar",
  maxAds = 2,
  className = "",
}: {
  location?: "sidebar" | "banner" | "inline";
  maxAds?: number;
  className?: string;
}) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    // Rotate ads every 10 seconds if there are multiple
    if (advertisements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % filteredAds.length);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [advertisements]);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/public/advertisements");
      if (!response.ok) throw new Error("Failed to fetch advertisements");
      const data = await response.json();
      setAdvertisements(data);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedAds((prev) => [...prev, id]);

    // If we dismissed the current ad, move to the next one
    if (filteredAds[currentAdIndex]?.id === id) {
      if (filteredAds.length > 1) {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % filteredAds.length);
      }
    }

    // Store dismissed ads in local storage for 24 hours
    const now = new Date();
    localStorage.setItem(
      "dismissedAds",
      JSON.stringify({
        ads: [...dismissedAds, id],
        expiry: now.setHours(now.getHours() + 24),
      })
    );
  };

  // Load dismissed ads from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dismissedAds");
    if (stored) {
      try {
        const { ads, expiry } = JSON.parse(stored);
        // Check if expired
        if (new Date().getTime() < expiry) {
          setDismissedAds(ads);
        } else {
          // Clear expired data
          localStorage.removeItem("dismissedAds");
        }
      } catch (e) {
        // Handle potential JSON parse error
        localStorage.removeItem("dismissedAds");
      }
    }
  }, []);

  // Filter out dismissed ads and only show published ones
  const filteredAds = advertisements
    .filter((ad) => ad.status === "published")
    .filter((ad) => !dismissedAds.includes(ad.id))
    .slice(0, maxAds);

  if (loading) {
    return null; // Don't show loading state to avoid layout shifts
  }

  if (filteredAds.length === 0) {
    return null; // Don't render anything if no ads to show
  }

  const currentAd = filteredAds[currentAdIndex % filteredAds.length];

  // Different layouts based on location
  if (location === "banner") {
    return (
      <div
        className={`w-full bg-gradient-to-r from-primary-50 to-primary-100 p-3 relative ${className}`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {currentAd.imageUrl && (
              <div className="w-12 h-12 rounded overflow-hidden hidden sm:block">
                <img
                  src={currentAd.imageUrl}
                  alt={currentAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-medium text-primary-800">
                {currentAd.title}
              </h3>
              <p className="text-sm text-primary-700 line-clamp-1">
                {currentAd.content}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Link href={`/advertisements/${currentAd.id}`}>
              <Button size="sm" variant="ghost">
                <span>Learn More</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => handleDismiss(currentAd.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (location === "inline") {
    return (
      <Card className={`overflow-hidden my-4 ${className}`}>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {currentAd.imageUrl && (
              <div className="sm:w-1/3">
                <img
                  src={currentAd.imageUrl}
                  alt={currentAd.title}
                  className="w-full h-full object-cover"
                  style={{ maxHeight: "200px" }}
                />
              </div>
            )}
            <div
              className={`p-4 ${currentAd.imageUrl ? "sm:w-2/3" : "w-full"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{currentAd.title}</h3>
                  <p className="mt-2 text-gray-600">{currentAd.content}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400"
                  onClick={() => handleDismiss(currentAd.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4">
                <Link href={`/advertisements/${currentAd.id}`}>
                  <Button size="sm" variant="outline">
                    <span>Learn More</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default sidebar view
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {currentAd.imageUrl && (
          <div className="w-full h-32">
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-medium">{currentAd.title}</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400"
              onClick={() => handleDismiss(currentAd.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {currentAd.content}
          </p>
          <div className="mt-3">
            <Link href={`/advertisements/${currentAd.id}`}>
              <Button size="sm" variant="link" className="px-0">
                <span>Learn More</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
