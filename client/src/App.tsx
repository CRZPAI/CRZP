import React, { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteNavbar } from "@/website/components/SiteNavbar";
import Landing from "./website/pages/Landing";
import Docs from "./website/pages/Docs";
import Home from "./app/pages/Home";
import NotFound from "./pages/not-found";

function useTitle(title: string) {
  useEffect(() => { document.title = title; }, [title]);
}

function TitledHome() { useTitle("CRZP | App"); return <Home />; }
function TitledLanding() {
  useTitle("CRZP | Website");
  return <WebsiteLayout><Landing /></WebsiteLayout>;
}
function TitledDocs() {
  useTitle("CRZP | Docs");
  return <WebsiteLayout><Docs /></WebsiteLayout>;
}
function TitledNotFound() { useTitle("CRZP | Not Found"); return <NotFound />; }

function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-[#020617] text-foreground flex flex-col min-h-screen">
      <SiteNavbar />
      <main className="flex-1">{children}</main>
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
