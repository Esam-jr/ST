import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, BellOff, Check } from 'lucide-react';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

export default function NotificationsTab() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setPage(0);
    fetchNotifications(0, true);
  }, [filter]);

  const fetchNotifications = async (pageNumber: number, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const onlyUnread = filter === 'unread' ? 'true' : 'false';
      const response = await axios.get(
        `/api/user/notifications?offset=${pageNumber * ITEMS_PER_PAGE}&limit=${ITEMS_PER_PAGE}&onlyUnread=${onlyUnread}`
      );
      
      const newNotifications = response.data.notifications;
      setNotifications(prev => reset ? newNotifications : [...prev, ...newNotifications]);
      setUnreadCount(response.data.unreadCount);
      setHasMore(newNotifications.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await axios.put('/api/user/notifications', {
          ids: [notification.id],
        });
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Navigate to the link if provided
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
      
      if (unreadIds.length === 0) return;

      await axios.put('/api/user/notifications', {
        ids: unreadIds,
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Format notification time as a relative time (e.g., "2 hours ago")
  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return 'Unknown time';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REVIEW_ASSIGNMENT':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'REVIEW_SUBMISSION':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'APPLICATION_STATUS':
        return <Bell className="h-5 w-5 text-purple-500" />;
      case 'ALL_REVIEWS_COMPLETED':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>View and manage your notifications</CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading && page === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchNotifications(0, true)}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{
              filter === 'all' 
                ? 'You don\'t have any notifications yet'
                : 'You don\'t have any unread notifications'
            }</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                  !notification.read 
                    ? 'bg-primary/5 cursor-pointer border-primary/20' 
                    : 'bg-card hover:bg-accent/50 cursor-pointer'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>{notification.title}</h4>
                    {!notification.read && (
                      <Badge variant="default" className="bg-primary/10 text-primary border-primary/30">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 