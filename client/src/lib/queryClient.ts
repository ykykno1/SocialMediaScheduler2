// client/src/lib/queryClient.ts

import { QueryClient, QueryFunction } from "@tanstack/react-query";

// עוזר שמוודא שהתגובה תקינה - עם הבחנה בין שגיאות רשת לשגיאות לוגיקה
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // אם זה 400/401/403/409 - זה שגיאת לוגיקה, לא שגיאת רשת
    if (res.status >= 400 && res.status < 500) {
      // לא זורק exception, נותן לקוד לטפל בתוכן השגיאה
      return;
    }
    // רק על שגיאות רשת אמיתיות (5xx) זורק exception
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// קריאה ל־API עם טוקן JWT אוטומטי - מחזיר JSON תמיד
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<any> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // תמיד מחזיר JSON, גם על שגיאות לוגיקה
  return await res.json();
}

// פונקציית ברירת מחדל לשליפה עם טוקן
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// יצירת QueryClient עם הגדרות אופטימליות לעדכון אוטומטי
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // מתעדכן כשחוזרים לטאב
      staleTime: 30000, // 30 שניות במקום אין סוף
      retry: 1, // ינסה פעם אחת נוספת
    },
    mutations: {
      retry: 1, // ינסה פעם אחת נוספת על מטאציות
    },
  },
});
