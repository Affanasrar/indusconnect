import { useLocation } from "react-router-dom";
import Card from "../components/ui/Card";

export default function ModulePlaceholderPage() {
  const location = useLocation();

  const title = location.pathname
    .replace("/", "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Module Page
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {title || "Module"}
        </h1>
        <p className="mt-2 text-slate-500">
          This route is connected in the frontend layout. In the next steps, we
          will replace this placeholder with full CRUD screens and tables.
        </p>
      </div>

      <Card>
        <p className="text-sm font-medium text-slate-500">Current path</p>
        <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
          {location.pathname}
        </p>
      </Card>
    </div>
  );
}