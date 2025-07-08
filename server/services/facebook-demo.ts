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

export interface DemoCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  objective: string;
  daily_budget: string;
  reach: number;
  impressions: number;
  created_time: string;
  updated_time: string;
  campaign_type: 'sponsored_post' | 'video_ad' | 'carousel_ad';
}

export class FacebookDemoService {
  private demoCampaigns: DemoCampaign[] = [
    {
      id: "demo_campaign_1",
      name: "קמפיין קיץ 2025 - מוצרי טכנולוגיה",
      status: 'ACTIVE',
      objective: "CONVERSIONS",
      daily_budget: "150.00",
      reach: 8450,
      impressions: 15200,
      created_time: "2025-07-01T08:00:00+0000",
      updated_time: "2025-07-07T14:30:00+0000",
      campaign_type: 'sponsored_post'
    },
    {
      id: "demo_campaign_2", 
      name: "פרסום עמוד עסקי - שירותי ייעוץ",
      status: 'ACTIVE',
      objective: "PAGE_LIKES",
      daily_budget: "75.00",
      reach: 3200,
      impressions: 7800,
      created_time: "2025-06-25T10:15:00+0000",
      updated_time: "2025-07-06T16:45:00+0000",
      campaign_type: 'video_ad'
    },
    {
      id: "demo_campaign_3",
      name: "מבצע מיוחד - סוף השבוע",
      status: 'PAUSED',
      objective: "TRAFFIC",
      daily_budget: "200.00", 
      reach: 12100,
      impressions: 28500,
      created_time: "2025-06-20T12:00:00+0000",
      updated_time: "2025-07-05T09:20:00+0000",
      campaign_type: 'carousel_ad'
    },
    {
      id: "demo_campaign_4",
      name: "חדשות המוצר החדש שלנו",
      status: 'ACTIVE',
      objective: "BRAND_AWARENESS",
      daily_budget: "100.00",
      reach: 5600,
      impressions: 11400,
      created_time: "2025-07-03T15:30:00+0000",
      updated_time: "2025-07-07T11:15:00+0000", 
      campaign_type: 'sponsored_post'
    }
  ];

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

  // מחקה את הקמפיינים של המשתמש
  async getUserCampaigns(): Promise<DemoCampaign[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [...this.demoCampaigns];
  }

  // מדמה השהיית קמפיינים
  async pauseCampaigns(campaignIds: string[]): Promise<{ pausedCount: number; results: Array<{ id: string; success: boolean; error?: string }> }> {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const results = campaignIds.map(id => {
      const campaign = this.demoCampaigns.find(c => c.id === id);
      if (campaign && campaign.status === 'ACTIVE') {
        campaign.status = 'PAUSED';
        campaign.updated_time = new Date().toISOString();
        return { id, success: true };
      }
      return { id, success: false, error: 'Campaign not found or already paused' };
    });

    const pausedCount = results.filter(r => r.success).length;
    return { pausedCount, results };
  }

  // מדמה הפעלת קמפיינים
  async activateCampaigns(campaignIds: string[]): Promise<{ activatedCount: number; results: Array<{ id: string; success: boolean; error?: string }> }> {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const results = campaignIds.map(id => {
      const campaign = this.demoCampaigns.find(c => c.id === id);
      if (campaign && campaign.status === 'PAUSED') {
        campaign.status = 'ACTIVE';
        campaign.updated_time = new Date().toISOString();
        return { id, success: true };
      }
      return { id, success: false, error: 'Campaign not found or already active' };
    });

    const activatedCount = results.filter(r => r.success).length;
    return { activatedCount, results };
  }

  // פונקציה מאוחדת להסתרת כל התוכן לפי העדפות המשתמש
  async hideAllContent(preferences: {
    managePersonalPosts: boolean;
    manageBusinessPages: boolean;
    manageCampaigns: boolean;
    enabledPageIds: string[];
  }): Promise<{
    personalPosts: { hiddenCount: number; results: Array<{ id: string; success: boolean; error?: string }> };
    pagesPosts: { hiddenCount: number; results: Array<{ id: string; success: boolean; error?: string }> };
    campaigns: { pausedCount: number; results: Array<{ id: string; success: boolean; error?: string }> };
  }> {
    const results = {
      personalPosts: { hiddenCount: 0, results: [] },
      pagesPosts: { hiddenCount: 0, results: [] },
      campaigns: { pausedCount: 0, results: [] }
    };

    // הסתר פוסטים אישיים
    if (preferences.managePersonalPosts) {
      const publicPosts = this.demoUserPosts.filter(p => p.privacy.value === 'PUBLIC');
      if (publicPosts.length > 0) {
        results.personalPosts = await this.hidePosts(publicPosts.map(p => p.id));
      }
    }

    // הסתר פוסטים של עמודים עסקיים
    if (preferences.manageBusinessPages && preferences.enabledPageIds.length > 0) {
      for (const pageId of preferences.enabledPageIds) {
        const page = this.demoPages.find(p => p.id === pageId);
        if (page) {
          const publicPagePosts = page.posts.filter(p => p.privacy.value === 'PUBLIC');
          if (publicPagePosts.length > 0) {
            const pageResult = await this.hidePagePosts(pageId, publicPagePosts.map(p => p.id));
            results.pagesPosts.hiddenCount += pageResult.hiddenCount;
            results.pagesPosts.results.push(...pageResult.results);
          }
        }
      }
    }

    // השהה קמפיינים
    if (preferences.manageCampaigns) {
      const activeCampaigns = this.demoCampaigns.filter(c => c.status === 'ACTIVE');
      if (activeCampaigns.length > 0) {
        results.campaigns = await this.pauseCampaigns(activeCampaigns.map(c => c.id));
      }
    }

    return results;
  }

  // פונקציה מאוחדת לשחזור כל התוכן לפי העדפות המשתמש
  async restoreAllContent(preferences: {
    managePersonalPosts: boolean;
    manageBusinessPages: boolean;
    manageCampaigns: boolean;
    enabledPageIds: string[];
  }): Promise<{
    personalPosts: { restoredCount: number; results: Array<{ id: string; success: boolean; error?: string }> };
    pagesPosts: { restoredCount: number; results: Array<{ id: string; success: boolean; error?: string }> };
    campaigns: { activatedCount: number; results: Array<{ id: string; success: boolean; error?: string }> };
  }> {
    const results = {
      personalPosts: { restoredCount: 0, results: [] },
      pagesPosts: { restoredCount: 0, results: [] },
      campaigns: { activatedCount: 0, results: [] }
    };

    // שחזר פוסטים אישיים
    if (preferences.managePersonalPosts) {
      const hiddenPosts = this.demoUserPosts.filter(p => p.privacy.value === 'ONLY_ME');
      if (hiddenPosts.length > 0) {
        results.personalPosts = await this.restorePosts(hiddenPosts.map(p => p.id));
      }
    }

    // שחזר פוסטים של עמודים עסקיים
    if (preferences.manageBusinessPages && preferences.enabledPageIds.length > 0) {
      for (const pageId of preferences.enabledPageIds) {
        const page = this.demoPages.find(p => p.id === pageId);
        if (page) {
          const hiddenPagePosts = page.posts.filter(p => p.privacy.value === 'ONLY_ME');
          if (hiddenPagePosts.length > 0) {
            const pageResult = await this.restorePagePosts(pageId, hiddenPagePosts.map(p => p.id));
            results.pagesPosts.restoredCount += pageResult.restoredCount;
            results.pagesPosts.results.push(...pageResult.results);
          }
        }
      }
    }

    // הפעל קמפיינים
    if (preferences.manageCampaigns) {
      const pausedCampaigns = this.demoCampaigns.filter(c => c.status === 'PAUSED');
      if (pausedCampaigns.length > 0) {
        results.campaigns = await this.activateCampaigns(pausedCampaigns.map(c => c.id));
      }
    }

    return results;
  }

  // מחזיר סטטיסטיקות דמו מורחבות
  getStats() {
    const publicPosts = this.demoUserPosts.filter(p => p.privacy.value === 'PUBLIC').length;
    const hiddenPosts = this.demoUserPosts.filter(p => p.privacy.value === 'ONLY_ME').length;
    const activeCampaigns = this.demoCampaigns.filter(c => c.status === 'ACTIVE').length;
    const pausedCampaigns = this.demoCampaigns.filter(c => c.status === 'PAUSED').length;
    
    return {
      totalPosts: this.demoUserPosts.length,
      publicPosts,
      hiddenPosts,
      totalPages: this.demoPages.length,
      totalPagePosts: this.demoPages.reduce((sum, page) => sum + page.posts.length, 0),
      totalCampaigns: this.demoCampaigns.length,
      activeCampaigns,
      pausedCampaigns
    };
  }
}

export const facebookDemoService = new FacebookDemoService();