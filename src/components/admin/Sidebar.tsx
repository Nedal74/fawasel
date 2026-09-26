"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  CircleHelp,
  MessagesSquare,
  Blocks,
  Building2,
  Contact,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Link2,
  ListOrdered,
  Quote,
  Settings,
  Sparkles,
  TrendingUp,
  Wrench,
  Briefcase,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminStrings } from "@/i18n/admin";
import { cn } from "@/lib/utils";

function buildGroups(t: AdminStrings) {
  return [
    {
      title: t.groupOverview,
      items: [{ href: "/admin", label: t.navDashboard, icon: LayoutDashboard }],
    },
    {
      title: t.groupGrowth,
      items: [
        { href: "/admin/analytics", label: t.navAnalytics, icon: BarChart3 },
        { href: "/admin/conversations", label: t.navConversations, icon: MessagesSquare },
        { href: "/admin/unanswered", label: t.navUnanswered, icon: CircleHelp },
        { href: "/admin/chatbot", label: t.navChatbot, icon: Bot },
        { href: "/admin/chat_knowledge", label: t.navKnowledge, icon: BookOpen },
      ],
    },
    {
      title: t.groupContent,
      items: [
        { href: "/admin/projects", label: t.navProjects, icon: Briefcase },
        { href: "/admin/articles", label: t.navArticles, icon: Newspaper },
        { href: "/admin/clients", label: t.navClients, icon: Building2 },
        { href: "/admin/services", label: t.navServices, icon: Blocks },
        { href: "/admin/skills", label: t.navSkills, icon: Sparkles },
        { href: "/admin/tools", label: t.navTools, icon: Wrench },
        { href: "/admin/experience", label: t.navExperience, icon: ListOrdered },
        { href: "/admin/testimonials", label: t.navTestimonials, icon: Quote },
        { href: "/admin/metrics", label: t.navMetrics, icon: TrendingUp },
      ],
    },
    {
      title: t.groupSite,
      items: [
        { href: "/admin/content", label: t.navContent, icon: FileText },
        { href: "/admin/media", label: t.navMedia, icon: ImageIcon },
        { href: "/admin/navigation_items", label: t.navNavigation, icon: Link2 },
        { href: "/admin/social_links", label: t.navSocial, icon: Contact },
        { href: "/admin/inquiries", label: t.navInquiries, icon: Inbox },
        { href: "/admin/settings", label: t.navSettings, icon: Settings },
      ],
    },
  ];
}

export function Sidebar({ t, onNavigate }: { t: AdminStrings; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = buildGroups(t);

  return (
    <nav aria-label="Dashboard" className="flex h-[calc(100%-3.5rem)] flex-col gap-6 overflow-y-auto p-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="admin-label mb-2">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-graphite text-offwhite"
                        : "text-muted hover:bg-graphite/60 hover:text-offwhite",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                    {active ? (
                      <span className="ms-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
