import {
  UserCircle,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Shield,
  Hash,
  LogOut,
  X,
  CheckCircle2,
} from "lucide-react";
import Button from "../ui/Button";

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  role: string;
  logout: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  role,
  logout,
}: UserProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B33]/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE5F0] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#102644] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-blue-200 border border-white/20">
              <UserCircle size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {user?.fullName || "Employee Profile"}
              </h3>
              <p className="text-xs text-blue-200/90 font-medium">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-blue-200 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Info Fields */}
        <div className="p-5 space-y-4 text-xs text-[#102644]">
          <div className="rounded-xl border border-[#DCE5F0] bg-slate-50/70 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#64748B] font-medium">
                <Building2 size={14} className="text-[#1769E0]" /> Organization
              </span>
              <span className="font-bold text-[#102644]">IndusConnect Enterprise</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#64748B] font-medium">
                <Shield size={14} className="text-[#1769E0]" /> System Role
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#1769E0] border border-blue-200 uppercase">
                {role.replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#64748B] font-medium">
                <Hash size={14} className="text-[#1769E0]" /> Employee Code
              </span>
              <span className="font-mono font-bold text-slate-800">
                {user?.employeeCode || "IND-EMP-001"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#64748B] font-medium">
                <Briefcase size={14} className="text-[#1769E0]" /> Department
              </span>
              <span className="font-semibold text-slate-800">
                {user?.department || "Operations & Mobility"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#64748B] font-medium">
                <CheckCircle2 size={14} className="text-[#16845B]" /> Account Status
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#16845B] border border-emerald-200">
                Active &bull; Verified
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#64748B]">
              <Mail size={13} />
              <span>Email:</span>
              <span className="font-semibold text-[#102644]">{user?.email}</span>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-2 text-[#64748B]">
                <Phone size={13} />
                <span>Phone:</span>
                <span className="font-semibold text-[#102644]">{user.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#F1F5F9] bg-slate-50 px-5 py-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-lg text-xs py-1.5"
          >
            Close
          </Button>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
