import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { loadSettings } from "@/lib/morse/storage";
import { useApplyTheme } from "@/hooks/use-theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MorseType — Practice Morse code, fast." },
      { name: "description", content: "A Monkeytype-style Morse code typing trainer. Learn the alphabet, race against your WPM, climb the leaderboard." },
      { property: "og:title", content: "MorseType — Practice Morse code, fast." },
      { property: "og:description", content: "A Monkeytype-style Morse code typing trainer. Learn the alphabet, race against your WPM, climb the leaderboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "MorseType — Practice Morse code, fast." },
      { name: "twitter:description", content: "A Monkeytype-style Morse code typing trainer. Learn the alphabet, race against your WPM, climb the leaderboard." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e0515558-b626-44ee-bd25-51c3882d99b0/id-preview-d1fbc062--50e5f900-3295-4486-9933-e8dcf0a4e617.lovable.app-1778494340721.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e0515558-b626-44ee-bd25-51c3882d99b0/id-preview-d1fbc062--50e5f900-3295-4486-9933-e8dcf0a4e617.lovable.app-1778494340721.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=DM+Serif+Display&family=Inter:wght@400;500;700&family=Archivo+Black&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [theme, setTheme] = useState(() => loadSettings().theme);

  useEffect(() => {
    setTheme(loadSettings().theme);
    function onStorage(e: StorageEvent) {
      if (e.key === "morsetype.settings.v1") setTheme(loadSettings().theme);
    }
    window.addEventListener("storage", onStorage);
    function onCustom() { setTheme(loadSettings().theme); }
    window.addEventListener("morsetype:settings-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("morsetype:settings-changed", onCustom);
    };
  }, []);

  useApplyTheme(theme);

  const isLightTheme = theme === "telegraph";

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme={isLightTheme ? "light" : "dark"} />
    </QueryClientProvider>
  );
}
