export type RoleName =
  | "SUPER_ADMIN"
  | "EMPLOYEE"
  | "MANAGER"
  | "TRANSPORT_ADMIN"
  | "ACCOMMODATION_ADMIN"
  | "DRIVER"
  | "FINANCE_OFFICER"
  | "SECURITY_OFFICER";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Role {
  name: RoleName;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
  employeeCode?: string;
  department?: string;
  hrGrade?: string;
  role?: Role;
}

export interface MenuItem {
  key: string;
  title: string;
  path: string;
}

export interface DashboardCard {
  key: string;
  title: string;
  api: string;
}

export interface FrontendBootstrap {
  profile: UserProfile;
  role: RoleName;
  menu: MenuItem[];
  permissions: Record<string, boolean>;
  dashboardCards: DashboardCard[];
  formOptions: Record<string, string[]>;
  notificationSummary: {
    unread: number;
  };
}