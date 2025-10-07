import {
  Zap,
  MessageSquare,
  Trophy,
  Settings,
  Pause,
  ListOrdered,
  Users,
  FileText,
  Bell,
  DollarSign,
  Mail,
  Phone,
  Workflow,
  UserCircle,
  CreditCard,
  TrendingUp,
  FileCheck,
  Palette,
  BarChart3,
  ShieldAlert,
  Code,
  Globe,
  Video,
  ChevronRight,
  Package,
  Paintbrush,
  Link,
  ShoppingCart,
  Home,
  BookOpen,
  User,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const adminItems = [
  { 
    title: "Theme Settings", 
    value: "theme-settings", 
    icon: Paintbrush,
    subItems: [
      { title: "Dashboard", value: "theme-dashboard", icon: Home },
      { title: "Onboarding", value: "theme-onboarding", icon: BookOpen },
      { title: "Progress", value: "theme-progress", icon: TrendingUp },
      { title: "Profile", value: "theme-profile", icon: User },
      { title: "Ambassador", value: "theme-ambassador", icon: Users },
      { title: "Loading", value: "theme-loading", icon: Loader2 },
      { title: "Admin Panel", value: "theme-admin-panel", icon: LayoutDashboard },
      { title: "Global", value: "theme-global", icon: Globe },
    ]
  },
  { title: "Challenges", value: "challenges", icon: Zap },
  { title: "Child Reactions", value: "reactions", icon: MessageSquare },
  { title: "Parent Feelings", value: "parent-reactions", icon: MessageSquare },
  { title: "Badges", value: "badges", icon: Trophy },
  { 
    title: "Products & Plans", 
    value: "products", 
    icon: Package,
    subItems: [
      { title: "Membership Plans", value: "products-plans", icon: Package },
    ]
  },
  { title: "Pause Reminders", value: "pause-reminders", icon: Pause },
  { 
    title: "Onboarding", 
    value: "onboarding", 
    icon: ListOrdered,
    subItems: [
      { title: "Welcome Video", value: "onboarding-video", icon: Video },
      { title: "Onboarding Steps", value: "onboarding-steps", icon: ListOrdered },
    ]
  },
  { title: "Users", value: "users", icon: Users },
  { title: "Answer Logs", value: "logs", icon: FileText },
  { 
    title: "Notifications", 
    value: "notifications", 
    icon: Bell,
    subItems: [
      { title: "Email", value: "notifications-email", icon: Mail },
      { title: "SMS", value: "notifications-sms", icon: Phone },
      { title: "Push", value: "notifications-push", icon: Bell },
      { title: "Sequences", value: "notifications-sequences", icon: Workflow },
      { title: "Ambassador", value: "notifications-ambassador", icon: UserCircle },
    ]
  },
  { 
    title: "Affiliates", 
    value: "affiliates", 
    icon: DollarSign,
    subItems: [
      { title: "Settings", value: "affiliates-settings", icon: Settings },
      { title: "Payouts", value: "affiliates-payouts", icon: CreditCard },
      { title: "Ambassadors", value: "affiliates-ambassadors", icon: Users },
      { title: "Earnings", value: "affiliates-earnings", icon: TrendingUp },
      { title: "Tax / 1099", value: "affiliates-tax", icon: FileCheck },
      { title: "Creatives", value: "affiliates-creatives", icon: Palette },
      { title: "Analytics", value: "affiliates-analytics", icon: BarChart3 },
      { title: "Fraud", value: "affiliates-fraud", icon: ShieldAlert },
      { title: "Tracking", value: "affiliates-tracking", icon: Code },
    ]
  },
  { title: "Security", value: "security", icon: ShieldAlert },
  { 
    title: "API", 
    value: "api", 
    icon: Link,
    subItems: [
      { title: "Stripe", value: "api-stripe", icon: CreditCard },
      { title: "WordPress", value: "api-woocommerce", icon: ShoppingCart },
    ]
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b flex items-center justify-center">
        <h2 className="font-semibold text-sm">Admin Menu</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                if (item.subItems) {
                  // Item with sub-items (collapsible)
                  const isParentActive = activeTab.startsWith(item.value);
                  return (
                    <Collapsible
                      key={item.value}
                      defaultOpen={isParentActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                              const isSubActive = activeTab === subItem.value;
                              return (
                                <SidebarMenuSubItem key={subItem.value}>
                                  <SidebarMenuSubButton
                                    onClick={() => onTabChange(subItem.value)}
                                    isActive={isSubActive}
                                  >
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                } else {
                  // Regular item without sub-items
                  const isActive = activeTab === item.value;
                  return (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.value)}
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
