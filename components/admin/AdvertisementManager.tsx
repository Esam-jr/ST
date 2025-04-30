import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Advertisement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  scheduledDate: string;
  platforms: string[];
  status: string;
}

const PLATFORMS = ['Twitter', 'LinkedIn', 'Facebook'];

export default function AdvertisementManager() {
  const { data: session } = useSession();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    scheduledDate: '',
    platforms: [] as string[],
  });

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch('/api/advertisements');
      if (!response.ok) throw new Error('Failed to fetch advertisements');
      const data = await response.json();
      setAdvertisements(data);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      toast.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || session.user.role !== 'ADMIN') {
      toast.error('Unauthorized');
      return;
    }

    try {
      const response = await fetch('/api/advertisements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create advertisement');

      const newAdvertisement = await response.json();
      setAdvertisements([newAdvertisement, ...advertisements]);
      setFormData({
        title: '',
        content: '',
        imageUrl: '',
        scheduledDate: '',
        platforms: [],
      });
      toast.success('Advertisement created successfully');
    } catch (error) {
      console.error('Error creating advertisement:', error);
      toast.error('Failed to create advertisement');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Advertisement Management</h1>

      {session?.user?.role === 'ADMIN' && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
              className="w-full p-2 border rounded"
                />
              </div>
              
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              name="content"
              value={formData.content}
                  onChange={handleInputChange}
                  required
              rows={4}
              className="w-full p-2 border rounded"
                />
              </div>
              
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
                  onChange={handleInputChange}
              className="w-full p-2 border rounded"
                />
              </div>
              
          <div>
            <label className="block text-sm font-medium mb-1">
              Scheduled Date
            </label>
            <input
              type="datetime-local"
              name="scheduledDate"
              value={formData.scheduledDate}
                  onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
                />
              </div>
              
          <div>
            <label className="block text-sm font-medium mb-1">Platforms</label>
            <div className="space-x-4">
              {PLATFORMS.map((platform) => (
                <label key={platform} className="inline-flex items-center">
                  <input
                      type="checkbox"
                    checked={formData.platforms.includes(platform)}
                    onChange={() => handlePlatformChange(platform)}
                    className="mr-2"
                  />
                  {platform}
                </label>
              ))}
                </div>
              </div>
              
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Advertisement
          </button>
        </form>
      )}

      <div className="space-y-4">
        {advertisements.map((ad) => (
          <div
            key={ad.id}
            className="border rounded p-4 space-y-2"
          >
            <h2 className="text-xl font-semibold">{ad.title}</h2>
            <p className="text-gray-600">{ad.content}</p>
            {ad.imageUrl && (
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="max-w-xs rounded"
              />
            )}
            <div className="text-sm text-gray-500">
              Scheduled for: {new Date(ad.scheduledDate).toLocaleString()}
                </div>
            <div className="text-sm">
              Platforms: {ad.platforms.join(', ')}
                </div>
            <div className="text-sm">
              Status: {ad.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 