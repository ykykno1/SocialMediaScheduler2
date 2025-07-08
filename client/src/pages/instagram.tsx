import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Instagram, ArrowRight, Eye, EyeOff, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  caption: string;
  timestamp: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  is_hidden: boolean;
}

interface InstagramStory {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  timestamp: string;
  is_hidden: boolean;
}

const demoInstagramPosts: InstagramPost[] = [
  {
    id: '1',
    media_type: 'IMAGE',
    media_url: '/api/placeholder/400/400',
    caption: 'תמונה יפה מהיום 📸 #צילום #טבע',
    timestamp: '2025-07-07T10:00:00Z',
    permalink: 'https://instagram.com/p/demo1',
    like_count: 125,
    comments_count: 8,
    is_hidden: false
  },
  {
    id: '2',
    media_type: 'VIDEO',
    media_url: '/api/placeholder/400/600',
    caption: 'סרטון מהיום שעבר 🎥 #וידאו #חיים',
    timestamp: '2025-07-06T15:30:00Z',
    permalink: 'https://instagram.com/p/demo2',
    like_count: 89,
    comments_count: 12,
    is_hidden: false
  },
  {
    id: '3',
    media_type: 'CAROUSEL_ALBUM',
    media_url: '/api/placeholder/400/400',
    caption: 'אלבום תמונות מהשבוע 📷✨ #אלבום #זכרונות',
    timestamp: '2025-07-05T09:15:00Z',
    permalink: 'https://instagram.com/p/demo3',
    like_count: 203,
    comments_count: 25,
    is_hidden: true
  }
];

const demoInstagramStories: InstagramStory[] = [
  {
    id: 's1',
    media_type: 'IMAGE',
    media_url: '/api/placeholder/300/500',
    timestamp: '2025-07-08T12:00:00Z',
    is_hidden: false
  },
  {
    id: 's2',
    media_type: 'VIDEO',
    media_url: '/api/placeholder/300/500',
    timestamp: '2025-07-08T08:30:00Z',
    is_hidden: true
  }
];

export default function InstagramPage() {
  const [posts, setPosts] = useState<InstagramPost[]>(demoInstagramPosts);
  const [stories, setStories] = useState<InstagramStory[]>(demoInstagramStories);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const hidePosts = () => {
    setLoading(true);
    setTimeout(() => {
      setPosts(posts.map(post => 
        selectedPosts.includes(post.id) ? { ...post, is_hidden: true } : post
      ));
      setSelectedPosts([]);
      setLoading(false);
    }, 1000);
  };

  const restorePosts = () => {
    setLoading(true);
    setTimeout(() => {
      setPosts(posts.map(post => 
        selectedPosts.includes(post.id) ? { ...post, is_hidden: false } : post
      ));
      setSelectedPosts([]);
      setLoading(false);
    }, 1000);
  };

  const hideStories = () => {
    setLoading(true);
    setTimeout(() => {
      setStories(stories.map(story => 
        selectedStories.includes(story.id) ? { ...story, is_hidden: true } : story
      ));
      setSelectedStories([]);
      setLoading(false);
    }, 1000);
  };

  const restoreStories = () => {
    setLoading(true);
    setTimeout(() => {
      setStories(stories.map(story => 
        selectedStories.includes(story.id) ? { ...story, is_hidden: false } : story
      ));
      setSelectedStories([]);
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return '🎥';
      case 'CAROUSEL_ALBUM':
        return '📸📸';
      default:
        return '📷';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            חזור לבית
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Instagram className="h-6 w-6 text-[#E4405F]" />
            ניהול אינסטגרם
          </h1>
          <p className="text-gray-600">נהל פוסטים וסטוריז באינסטגרם לשבת (דמו)</p>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Instagram className="h-5 w-5" />
          <span className="font-medium">מצב דמו - אינסטגרם</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          זהו מצב דמו המציג את הפונקציונליות העתידית של ניהול אינסטגרם. 
          הנתונים המוצגים הם לדוגמה ולא משפיעים על החשבון האמיתי שלך.
        </p>
      </div>

      {/* Content Management */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">פוסטים ({posts.length})</TabsTrigger>
          <TabsTrigger value="stories">סטוריז ({stories.length})</TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-[#E4405F]" />
                  פוסטים באינסטגרם
                  <Badge variant="outline">{posts.length} פוסטים</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <Button 
                  onClick={() => setSelectedPosts(posts.filter(p => !p.is_hidden).map(p => p.id))}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  בחר כל הגלויים ({posts.filter(p => !p.is_hidden).length})
                </Button>
                <Button 
                  onClick={() => setSelectedPosts(posts.filter(p => p.is_hidden).map(p => p.id))}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  בחר כל המוסתרים ({posts.filter(p => p.is_hidden).length})
                </Button>
                <Button 
                  onClick={() => setSelectedPosts([])}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  נקה בחירה
                </Button>
              </div>

              {selectedPosts.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                  <Button 
                    onClick={hidePosts}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    הסתר נבחרים ({selectedPosts.length})
                  </Button>
                  <Button 
                    onClick={restorePosts}
                    disabled={loading}
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    הצג נבחרים ({selectedPosts.length})
                  </Button>
                </div>
              )}

              {/* Posts Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Card 
                    key={post.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPosts.includes(post.id) ? 'ring-2 ring-blue-500' : ''
                    } ${post.is_hidden ? 'opacity-50 bg-gray-50' : ''}`}
                    onClick={() => {
                      if (selectedPosts.includes(post.id)) {
                        setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                      } else {
                        setSelectedPosts([...selectedPosts, post.id]);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg">{getMediaIcon(post.media_type)}</span>
                        <div className="flex items-center gap-1">
                          {post.is_hidden ? (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              מוסתר
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              גלוי
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {post.caption}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comments_count}
                          </span>
                        </div>
                        <span>{formatDate(post.timestamp)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-[#E4405F]" />
                  סטוריז באינסטגרם
                  <Badge variant="outline">{stories.length} סטוריז</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <Button 
                  onClick={() => setSelectedStories(stories.filter(s => !s.is_hidden).map(s => s.id))}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  בחר כל הגלויים ({stories.filter(s => !s.is_hidden).length})
                </Button>
                <Button 
                  onClick={() => setSelectedStories(stories.filter(s => s.is_hidden).map(s => s.id))}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  בחר כל המוסתרים ({stories.filter(s => s.is_hidden).length})
                </Button>
                <Button 
                  onClick={() => setSelectedStories([])}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  נקה בחירה
                </Button>
              </div>

              {selectedStories.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                  <Button 
                    onClick={hideStories}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    הסתר נבחרים ({selectedStories.length})
                  </Button>
                  <Button 
                    onClick={restoreStories}
                    disabled={loading}
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    הצג נבחרים ({selectedStories.length})
                  </Button>
                </div>
              )}

              {/* Stories Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stories.map((story) => (
                  <Card 
                    key={story.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStories.includes(story.id) ? 'ring-2 ring-blue-500' : ''
                    } ${story.is_hidden ? 'opacity-50 bg-gray-50' : ''}`}
                    onClick={() => {
                      if (selectedStories.includes(story.id)) {
                        setSelectedStories(selectedStories.filter(id => id !== story.id));
                      } else {
                        setSelectedStories([...selectedStories, story.id]);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg">{getMediaIcon(story.media_type)}</span>
                        <div className="flex items-center gap-1">
                          {story.is_hidden ? (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              מוסתר
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              גלוי
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        {formatDate(story.timestamp)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}