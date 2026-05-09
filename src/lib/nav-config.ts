import { LayoutDashboard, Users, ScrollText, Database, Settings, Bell } from "lucide-react";
import {
  GraduationCap, LineChart as LineIcon, TrendingUp, BellRing, UserCog,
} from "lucide-react";
import { ClipboardEdit, ClipboardCheck, BarChart3, AlertTriangle, FileText, Send } from "lucide-react";
import type { NavItem } from "@/components/app-shell";

export const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Manage Users", to: "/admin/users", icon: Users },
  { label: "System Logs", to: "/admin/logs", icon: ScrollText },
  { label: "Backup Data", to: "/admin/backup", icon: Database },
  { label: "Configure System", to: "/admin/configure", icon: Settings },
  { label: "Notifications", to: "/notifications", icon: Bell },
];

export const studentNav: NavItem[] = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard },
  { label: "My Performance", to: "/student/performance", icon: GraduationCap },
  { label: "My Predictions", to: "/student/predictions", icon: LineIcon },
  { label: "Track Progress", to: "/student/progress", icon: TrendingUp },
  { label: "Notifications", to: "/notifications", icon: BellRing },
  { label: "Update Profile", to: "/profile", icon: UserCog },
];

export const teacherNav: NavItem[] = [
  { label: "Dashboard", to: "/teacher", icon: LayoutDashboard },
  { label: "Enter Marks", to: "/teacher/marks", icon: ClipboardEdit },
  { label: "Enter Attendance", to: "/teacher/attendance", icon: ClipboardCheck },
  { label: "View Class Data", to: "/teacher/class", icon: BarChart3 },
  { label: "Weak Students", to: "/teacher/weak", icon: AlertTriangle },
  { label: "Generate Report", to: "/teacher/report", icon: FileText },
  { label: "Send Alerts", to: "/notifications", icon: Send },
];
