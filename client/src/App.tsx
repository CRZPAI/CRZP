import React, { Suspense, lazy, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteNavbar } from "@/website/components/SiteNavbar";
import Home from "./app/pages/Home";
import NotFound from "./pages/not-found";

// Marketing pages are split out so the dashboard (/) loads faster.
const Landing = lazy(() => import("./website/pages/Landing"));
const Docs = lazy(() => import("./website/pages/Docs"));

function useTitle(title: string) {
  useEffect(() => { document.title = title; }, [title]);
}

function TitledHome() { useTitle("CRZP APEX — Risk Intelligence Platform"); return <Home />; }
function TitledLanding() {
  useTitle("CRZP APEX — Geopolitical Risk Intelligence");
  return <WebsiteLayout><Landing /></WebsiteLayout>;
}
function TitledDocs() {
  useTitle("Documentation — CRZP APEX");
  return <WebsiteLayout><Docs /></WebsiteLayout>;
}
function TitledNotFound() { useTitle("Page Not Found — CRZP APEX"); return <NotFound />; }

function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-[#020617] text-foreground flex flex-col min-h-screen">
      <SiteNavbar />
      <main className="flex-1"><Suspense fallback={<div className="min-h-screen" />}>{children}</Suspense></main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={TitledHome} />
      <Route path="/app" component={() => <Redirect to="/" />} />
      <Route path="/landing" component={TitledLanding} />
      <Route path="/docs" component={TitledDocs} />
      <Route component={TitledNotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
