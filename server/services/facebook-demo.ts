/**
 * Facebook Demo Service - מדמה פוסטים אמיתיים לפיתוח
 * כשיהיו לנו ההרשאות הנכונות, נחליף את זה בקריאות API אמיתיות
 */

export interface DemoPost {
  id: string;
  message: string;
  created_time: string;
  privacy: {
    value: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  };
  permalink_url: string;
  type: 'status' | 'photo' | 'video' | 'link';
  reactions?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  full_picture?: string;
  attachments?: {
    data: Array<{
      media?: {
        image?: {
          src: string;
        };
      };
    }>;
  };
}

export interface DemoPage {
  id: string;
  name: string;
  category: string;
  followers_count: number;
  posts: DemoPost[];
}

export class FacebookDemoService {
  private demoUserPosts: DemoPost[] = [
    {
      id: "demo_user_post_1",
      message: "שבת שלום לכולם! מקווה שתהנו מהשבת המדהימה הזו 🕯️",
      created_time: "2025-07-05T15:30:00+0000",
      privacy: { value: 'PUBLIC' },
      permalink_url: "https://facebook.com/demo/post1",
      type: 'status',
      reactions: { summary: { total_count: 15 } },
      comments: { summary: { total_count: 3 } }
    },
    {
      id: "demo_user_post_2", 
      message: "התמונות מהטיול המדהים לירושלים! איזה יופי של עיר 📸",
      created_time: "2025-07-03T09:15:00+0000",
      privacy: { value: 'PUBLIC' },
      permalink_url: "https://facebook.com/demo/post2",
      type: 'photo',
      reactions: { summary: { total_count: 32 } },
      comments: { summary: { total_count: 8 } },
      full_picture: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e3f2fd'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%231976d2' font-size='20' font-family='Arial'%3E🏛️ ירושלים %3C/text%3E%3C/svg%3E"
    },
    {
      id: "demo_user_post_3",
      message: "הרגע סיימתי לקרוא ספר מדהים על יהדות וטכנולוגיה. ממליץ בחום! 📚",
      created_time: "2025-07-01T18:45:00+0000", 
      privacy: { value: 'FRIENDS' },
      permalink_url: "https://facebook.com/demo/post3",
      type: 'link',
      reactions: { summary: { total_count: 8 } },
      comments: { summary: { total_count: 2 } }
    },
    {
      id: "demo_user_post_4",
      message: "ברוך השם! הצלחתי לסיים את הפרויקט בזמן. תודה לכל מי שעזר בדרך 🙏",
      created_time: "2025-06-28T14:20:00+0000",
      privacy: { value: 'PUBLIC' },
      permalink_url: "https://facebook.com/demo/post4", 
      type: 'status',
      reactions: { summary: { total_count: 25 } },
      comments: { summary: { total_count: 12 } }
    },
    {
      id: "demo_user_post_5",
      message: "סרטון מהשיעור המעולה שהיה אתמול. כדאי לצפות! 🎥",
      created_time: "2025-06-26T20:10:00+0000",
      privacy: { value: 'PUBLIC' },
      permalink_url: "https://facebook.com/demo/post5",
      type: 'video',
      reactions: { summary: { total_count: 18 } },
      comments: { summary: { total_count: 5 } }
    }
  ];

  private demoPages: DemoPage[] = [
    {
      id: "demo_page_1",
      name: "קהילת טכנולוגיה יהודית",
      category: "Community Organization",
      followers_count: 1247,
      posts: [
        {
          id: "demo_page_post_1",
          message: "הזמנה לכנס השנתי שלנו בנושא יהדות וטכנולוגיה! פרטים בלינק",
          created_time: "2025-07-04T10:00:00+0000",
          privacy: { value: 'PUBLIC' },
          permalink_url: "https://facebook.com/demo/page1/post1",
          type: 'link',
          reactions: { summary: { total_count: 45 } },
          comments: { summary: { total_count: 15 } }
        },
        {
          id: "demo_page_post_2", 
          message: "טיפים חשובים לשמירת שבת בעידן הדיגיטלי 💻🕯️",
          created_time: "2025-07-02T16:30:00+0000",
          privacy: { value: 'PUBLIC' },
          permalink_url: "https://facebook.com/demo/page1/post2",
          type: 'status',
          reactions: { summary: { total_count: 67 } },
          comments: { summary: { total_count: 22 } }
        }
      ]
    },
    {
      id: "demo_page_2",
      name: "חדשות טכנולוגיה",
      category: "News & Media Website", 
      followers_count: 5832,
      posts: [
        {
          id: "demo_page_post_3",
          message: "פריצת דרך חדשה בתחום הבינה המלאכותית! מה זה אומר עלינו?",
          created_time: "2025-07-05T08:15:00+0000",
          privacy: { value: 'PUBLIC' },
          permalink_url: "https://facebook.com/demo/page2/post1",
          type: 'link',
          reactions: { summary: { total_count: 123 } },
          comments: { summary: { total_count: 34 } }
        }
      ]
    }
  ];

  // מחקה את הפוסטים האישיים של המשתמש
  async getUserPosts(): Promise<DemoPost[]> {
    // דמוי השהיה של API
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.demoUserPosts];
  }

  // מחקה את העמודים של המשתמש
  async getUserPages(): Promise<DemoPage[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.demoPages];
  }

  // מדמה הסתרת פוסטים
  async hidePosts(postIds: string[]): Promise<{ hiddenCount: number; results: Array<{ id: string; success: boolean; error?: string }> }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const results = postIds.map(id => {
      // בדמו, אנחנו תמיד מצליחים להסתיר
      const post = this.demoUserPosts.find(p => p.id === id);
      if (post && post.privacy.value === 'PUBLIC') {
        post.privacy.value = 'ONLY_ME'; // מסתיר הפוסט
        return { id, success: true };
      }
      return { id, success: false, error: 'Post not found or already hidden' };
    });

    const hiddenCount = results.filter(r => r.success).length;
    return { hiddenCount, results };
  }

  // מדמה שחזור פוסטים
  async restorePosts(postIds: string[]): Promise<{ restoredCount: number; results: Array<{ id: string; success: boolean; error?: string }> }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const results = postIds.map(id => {
      const post = this.demoUserPosts.find(p => p.id === id);
      if (post && post.privacy.value === 'ONLY_ME') {
        post.privacy.value = 'PUBLIC'; // משחזר הפוסט
        return { id, success: true };
      }
      return { id, success: false, error: 'Post not found or already public' };
    });

    const restoredCount = results.filter(r => r.success).length;
    return { restoredCount, results };
  }

  // מדמה הסתרת פוסטים של עמוד
  async hidePagePosts(pageId: string, postIds: string[]): Promise<{ hiddenCount: number; results: Array<{ id: string; success: boolean; error?: string }> }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const page = this.demoPages.find(p => p.id === pageId);
    if (!page) {
      return { hiddenCount: 0, results: postIds.map(id => ({ id, success: false, error: 'Page not found' })) };
    }

    const results = postIds.map(id => {
      const post = page.posts.find(p => p.id === id);
      if (post && post.privacy.value === 'PUBLIC') {
        post.privacy.value = 'ONLY_ME';
        return { id, success: true };
      }
      return { id, success: false, error: 'Post not found or already hidden' };
    });

    const hiddenCount = results.filter(r => r.success).length;
    return { hiddenCount, results };
  }

  // מדמה שחזור פוסטים של עמוד
  async restorePagePosts(pageId: string, postIds: string[]): Promise<{ restoredCount: number; results: Array<{ id: string; success: boolean; error?: string }> }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const page = this.demoPages.find(p => p.id === pageId);
    if (!page) {
      return { restoredCount: 0, results: postIds.map(id => ({ id, success: false, error: 'Page not found' })) };
    }

    const results = postIds.map(id => {
      const post = page.posts.find(p => p.id === id);
      if (post && post.privacy.value === 'ONLY_ME') {
        post.privacy.value = 'PUBLIC';
        return { id, success: true };
      }
      return { id, success: false, error: 'Post not found or already public' };
    });

    const restoredCount = results.filter(r => r.success).length;
    return { restoredCount, results };
  }

  // מחזיר סטטיסטיקות דמו
  getStats() {
    const publicPosts = this.demoUserPosts.filter(p => p.privacy.value === 'PUBLIC').length;
    const hiddenPosts = this.demoUserPosts.filter(p => p.privacy.value === 'ONLY_ME').length;
    
    return {
      totalPosts: this.demoUserPosts.length,
      publicPosts,
      hiddenPosts,
      totalPages: this.demoPages.length,
      totalPagePosts: this.demoPages.reduce((sum, page) => sum + page.posts.length, 0)
    };
  }
}

export const facebookDemoService = new FacebookDemoService();