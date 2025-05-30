import { useQuery } from "@tanstack/react-query";

export interface InstagramPost {
  id: string;
  caption: string;
  timestamp: string;
  media_type: string;
  permalink: string;
}

export default function useInstagramPosts() {
  return useQuery<InstagramPost[]>({
    queryKey: ["/api/instagram/posts"],
    retry: false,
  });
}