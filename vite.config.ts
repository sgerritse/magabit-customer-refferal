import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: https://platform-api.sharethis.com https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; style-src 'self' 'unsafe-inline' blob: https: https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https: wss: https://ctmzlorgzptgeluwjxwk.supabase.co wss://ctmzlorgzptgeluwjxwk.supabase.co https://platform-api.sharethis.com https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app wss://lovable.dev wss://*.lovable.dev wss://*.lovableproject.com wss://*.lovable.app; worker-src 'self' blob: https: https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; frame-src 'self' data: about: blob: https://www.youtube.com https://www.youtube-nocookie.com https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; child-src 'self' data: about: blob: https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; manifest-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';",
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
  preview: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: https://platform-api.sharethis.com https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; style-src 'self' 'unsafe-inline' blob: https: https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https: wss: https://ctmzlorgzptgeluwjxwk.supabase.co wss://ctmzlorgzptgeluwjxwk.supabase.co https://platform-api.sharethis.com https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app wss://lovable.dev wss://*.lovable.dev wss://*.lovableproject.com wss://*.lovable.app; worker-src 'self' blob: https: https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; frame-src 'self' data: about: blob: https://www.youtube.com https://www.youtube-nocookie.com https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; child-src 'self' data: about: blob: https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; manifest-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';",
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
