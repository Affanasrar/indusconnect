import { ShieldAlert } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import EmployeeExpensesPage from "./EmployeeExpensesPage";
import ExpenseReviewPage from "./ExpenseReviewPage";

export default function ExpensesPage() {
  const { bootstrap, user } = useAuth();

  const role =
    bootstrap?.role ?? user?.role?.name;

  if (!role) {
    return (
      <Card>
        <div className="py-12 text-center text-sm text-slate-500">
          Loading expense module...
        </div>
      </Card>
    );
  }

  if (role === "EMPLOYEE") {
    return <EmployeeExpensesPage />;
  }

  if (role === "MANAGER") {
    return <ExpenseReviewPage mode="MANAGER" />;
  }

  if (
    role === "FINANCE_OFFICER" ||
    role === "SUPER_ADMIN"
  ) {
    return <ExpenseReviewPage mode="FINANCE" />;
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Expense Management
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Expense Claims
        </h1>
      </div>

      <Card>
        <div className="py-12 text-center">
          <ShieldAlert
            size={44}
            className="mx-auto text-amber-500"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Limited access
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Expense submission is available to employees.
            Manager and Finance review access depends on
            the assigned system role.
          </p>
        </div>
      </Card>
    </div>
  );
}