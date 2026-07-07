import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Edit, RefreshCcw, Search, UserPlus, Users } from "lucide-react";
import {
  createUser,
  getUsers,
  updateUser,
  type CreateUserInput,
} from "../api/users";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import type { RoleName, UserProfile } from "../types/frontend";

const defaultForm: CreateUserInput = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  role: "EMPLOYEE",
  employeeCode: "",
  department: "",
  hrGrade: "STAFF",
};

export default function UsersPage() {
  const { bootstrap } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [form, setForm] = useState<CreateUserInput>(defaultForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = (bootstrap?.formOptions?.roles ?? [
    "SUPER_ADMIN",
    "EMPLOYEE",
    "MANAGER",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "DRIVER",
    "FINANCE_OFFICER",
    "SECURITY_OFFICER",
  ]) as RoleName[];

  const hrGradeOptions = bootstrap?.formOptions?.hrGrades ?? [
    "SUPPORT_STAFF",
    "STAFF",
    "OFFICER",
    "MANAGER",
    "SENIOR_MANAGER",
    "EXECUTIVE",
    "DOCTOR",
    "CONSULTANT",
  ];

  async function loadUsers() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getUsers();
      setUsers(data);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch users"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.toLowerCase().includes(keyword) ||
        user.department?.toLowerCase().includes(keyword) ||
        user.employeeCode?.toLowerCase().includes(keyword) ||
        user.role?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  function resetForm() {
    setEditingUserId(null);
    setForm(defaultForm);
    setMessage("");
    setError("");
  }

  function handleEdit(user: UserProfile) {
    setEditingUserId(user.id);
    setMessage("");
    setError("");

    setForm({
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      password: "",
      phone: user.phone ?? "",
      role: (user.role?.name ?? "EMPLOYEE") as RoleName,
      employeeCode: user.employeeCode ?? "",
      department: user.department ?? "",
      hrGrade: user.hrGrade ?? "STAFF",
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (editingUserId) {
        const updatePayload: any = {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          employeeCode: form.employeeCode,
          department: form.department,
          hrGrade: form.hrGrade,
        };

        if (form.password.trim()) {
          updatePayload.password = form.password;
        }

        await updateUser(editingUserId, updatePayload);
        setMessage("User updated successfully");
      } else {
        if (!form.password.trim()) {
          throw new Error("Password is required for new user");
        }

        await createUser(form);
        setMessage("User created successfully");
      }

      resetForm();
      await loadUsers();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save user"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Super Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="mt-2 text-slate-500">
            Create and manage IndusConnect users with role-based access.
          </p>
        </div>

        <Button variant="secondary" onClick={loadUsers}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingUserId ? "Edit User" : "Create User"}
              </h2>
              <p className="text-sm text-slate-500">
                {editingUserId
                  ? "Update selected user details."
                  : "Add a new role-based user."}
              </p>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                value={form.fullName}
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password{" "}
                {editingUserId && (
                  <span className="font-normal text-slate-400">
                    leave blank to keep same
                  </span>
                )}
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                required={!editingUserId}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as RoleName,
                    })
                  }
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  HR Grade
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  value={form.hrGrade}
                  onChange={(event) =>
                    setForm({ ...form, hrGrade: event.target.value })
                  }
                >
                  {hrGradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Employee Code
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                value={form.employeeCode}
                onChange={(event) =>
                  setForm({ ...form, employeeCode: event.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Department
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                value={form.department}
                onChange={(event) =>
                  setForm({ ...form, department: event.target.value })
                }
              />
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingUserId
                    ? "Update User"
                    : "Create User"}
              </Button>

              {editingUserId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  All Users
                </h2>
                <p className="text-sm text-slate-500">
                  {filteredUsers.length} users found
                </p>
              </div>
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 md:w-72"
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
              Loading users...
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">HR Grade</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {user.fullName}
                        </p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        <p className="text-xs text-slate-400">
                          {user.employeeCode || "No employee code"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {user.role?.name ?? "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {user.department ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {user.hrGrade ?? "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          {user.status ?? "ACTIVE"}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit size={15} className="mr-2" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}