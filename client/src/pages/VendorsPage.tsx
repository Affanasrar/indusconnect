import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  PlusCircle,
  Edit,
  Trash2,
  Truck,
  Route,
  CreditCard,
  Search,
  RefreshCcw,
  UserCheck,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  getVendors,
  createVendor,
  updateVendor,
  deactivateVendor,
  assignVendorToVehicle,
  assignVendorToRoute,
  createVendorBill,
  getVendorBills,
  approveVendorBill,
  rejectVendorBill,
  payVendorBill,
} from "../api/vendors";
import { getVehicles } from "../api/vehicles";
import { getRoutes } from "../api/routes";
import type {
  Vendor,
  VendorBill,
  VendorContractType,
  VendorStatus,
} from "../types/vendor";
import type { Vehicle, TransportRoute } from "../types/transport";

interface VendorFormState {
  vendorName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  contractType: VendorContractType;
  status: VendorStatus;
  contractStartDate: string;
  contractEndDate: string;
  notes: string;
}

interface BillFormState {
  vendorId: string;
  routeId: string;
  billNumber: string;
  billDate: string;
  amount: string;
  currency: string;
  description: string;
}

const defaultVendorForm: VendorFormState = {
  vendorName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  contractType: "PER_TRIP",
  status: "ACTIVE",
  contractStartDate: "",
  contractEndDate: "",
  notes: "",
};

const defaultBillForm: BillFormState = {
  vendorId: "",
  routeId: "",
  billNumber: "",
  billDate: "",
  amount: "",
  currency: "PKR",
  description: "",
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };
    return responseError.response?.data?.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}

export default function VendorsPage() {
  const { bootstrap } = useAuth();
  
  // Permissions
  const isFinance = bootstrap?.role === "SUPER_ADMIN" || bootstrap?.role === "FINANCE_OFFICER";
  const isTransportAdmin = bootstrap?.role === "SUPER_ADMIN" || bootstrap?.role === "TRANSPORT_ADMIN";

  // Data States
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"VENDORS" | "BILLS">("VENDORS");

  // Filter States
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("ALL");
  const [contractTypeFilter, setContractTypeFilter] = useState("ALL");

  const [billSearch, setBillSearch] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState("ALL");
  const [billVendorFilter, setBillVendorFilter] = useState("ALL");

  // Form toggles / Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorFormState>(defaultVendorForm);

  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState<BillFormState>(defaultBillForm);

  // Detail View Modals
  const [selectedVendorDetails, setSelectedVendorDetails] = useState<Vendor | null>(null);
  const [showAssignVehicleModal, setShowAssignVehicleModal] = useState(false);
  const [showAssignRouteModal, setShowAssignRouteModal] = useState(false);
  const [assignTargetVendorId, setAssignTargetVendorId] = useState<string | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignRouteId, setAssignRouteId] = useState("");

  const [showBillActionModal, setShowBillActionModal] = useState<VendorBill | null>(null);
  const [billActionRemarks, setBillActionRemarks] = useState("");

  // Status message states
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all operational data
  async function loadData() {
    try {
      setIsLoading(true);
      setError("");
      
      const [vendorsList, billsList] = await Promise.all([
        getVendors(),
        getVendorBills(),
      ]);

      setVendors(vendorsList || []);
      setBills(billsList || []);

      if (isTransportAdmin) {
        const [vehiclesList, routesList] = await Promise.all([
          getVehicles(),
          getRoutes(),
        ]);
        setVehicles(vehiclesList || []);
        setRoutes(routesList || []);
      }
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load vendor registry data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter computations
  const filteredVendors = useMemo(() => {
    const keyword = vendorSearch.toLowerCase().trim();
    return vendors.filter((v) => {
      const matchSearch =
        !keyword ||
        v.vendorName.toLowerCase().includes(keyword) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(keyword)) ||
        (v.email && v.email.toLowerCase().includes(keyword)) ||
        (v.phone && v.phone.includes(keyword));

      const matchStatus =
        vendorStatusFilter === "ALL" || v.status === vendorStatusFilter;

      const matchContract =
        contractTypeFilter === "ALL" || v.contractType === contractTypeFilter;

      return matchSearch && matchStatus && matchContract;
    });
  }, [vendors, vendorSearch, vendorStatusFilter, contractTypeFilter]);

  const filteredBills = useMemo(() => {
    const keyword = billSearch.toLowerCase().trim();
    return bills.filter((b) => {
      const matchSearch =
        !keyword ||
        b.billNumber.toLowerCase().includes(keyword) ||
        (b.vendor?.vendorName && b.vendor.vendorName.toLowerCase().includes(keyword)) ||
        (b.route?.routeName && b.route.routeName.toLowerCase().includes(keyword)) ||
        (b.description && b.description.toLowerCase().includes(keyword));

      const matchStatus =
        billStatusFilter === "ALL" || b.status === billStatusFilter;

      const matchVendor =
        billVendorFilter === "ALL" || b.vendorId === billVendorFilter;

      return matchSearch && matchStatus && matchVendor;
    });
  }, [bills, billSearch, billStatusFilter, billVendorFilter]);

  const metrics = useMemo(() => {
    const active = vendors.filter((v) => v.status === "ACTIVE").length;
    const totalBillsAmount = bills
      .filter((b) => b.status === "APPROVED" || b.status === "PAID")
      .reduce((sum, b) => sum + b.amount, 0);
    const pendingBillsCount = bills.filter((b) => b.status === "PENDING").length;

    return {
      totalVendors: vendors.length,
      activeVendors: active,
      totalBillsApproved: totalBillsAmount,
      pendingBills: pendingBillsCount,
    };
  }, [vendors, bills]);

  // Handle vendor creation/update submission
  async function handleVendorSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        vendorName: vendorForm.vendorName.trim(),
        contactPerson: vendorForm.contactPerson.trim() || undefined,
        phone: vendorForm.phone.trim() || undefined,
        email: vendorForm.email.trim() || undefined,
        address: vendorForm.address.trim() || undefined,
        contractType: vendorForm.contractType,
        status: vendorForm.status,
        contractStartDate: vendorForm.contractStartDate || undefined,
        contractEndDate: vendorForm.contractEndDate || undefined,
        notes: vendorForm.notes.trim() || undefined,
      };

      if (!payload.vendorName) {
        throw new Error("Vendor name is required");
      }

      if (editingVendorId) {
        await updateVendor(editingVendorId, payload);
        setMessage("Vendor updated successfully");
      } else {
        await createVendor(payload);
        setMessage("Vendor registered successfully");
      }

      setVendorForm(defaultVendorForm);
      setShowVendorModal(false);
      setEditingVendorId(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to submit vendor form");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle bill submission
  async function handleBillSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const amountNum = parseFloat(billForm.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount greater than 0");
      }

      if (!billForm.vendorId) {
        throw new Error("Select a vendor");
      }

      if (!billForm.billNumber.trim()) {
        throw new Error("Bill number is required");
      }

      if (!billForm.billDate) {
        throw new Error("Bill date is required");
      }

      await createVendorBill({
        vendorId: billForm.vendorId,
        routeId: billForm.routeId || undefined,
        billNumber: billForm.billNumber.trim(),
        billDate: billForm.billDate,
        amount: amountNum,
        currency: billForm.currency,
        description: billForm.description.trim() || undefined,
      });

      setMessage("Vendor invoice submitted successfully");
      setBillForm(defaultBillForm);
      setShowBillModal(false);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to submit vendor bill");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Trigger Edit mode
  function triggerEditVendor(vendor: Vendor) {
    setEditingVendorId(vendor.id);
    setVendorForm({
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      contractType: vendor.contractType,
      status: vendor.status,
      contractStartDate: vendor.contractStartDate ? new Date(vendor.contractStartDate).toISOString().split("T")[0] : "",
      contractEndDate: vendor.contractEndDate ? new Date(vendor.contractEndDate).toISOString().split("T")[0] : "",
      notes: vendor.notes || "",
    });
    setShowVendorModal(true);
  }

  // Trigger Deactivate
  async function handleDeactivateVendor(id: string) {
    if (!confirm("Are you sure you want to deactivate this vendor?")) return;
    setError("");
    setMessage("");
    try {
      await deactivateVendor(id);
      setMessage("Vendor deactivated successfully");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to deactivate vendor");
    }
  }

  // Handle Vehicle Assignment
  async function handleAssignVehicle(e: FormEvent) {
    e.preventDefault();
    if (!assignTargetVendorId || !assignVehicleId) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await assignVendorToVehicle(assignVehicleId, assignTargetVendorId);
      setMessage("Vendor assigned to vehicle successfully");
      setShowAssignVehicleModal(false);
      setAssignVehicleId("");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to assign vehicle");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Route Assignment
  async function handleAssignRoute(e: FormEvent) {
    e.preventDefault();
    if (!assignTargetVendorId || !assignRouteId) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await assignVendorToRoute(assignRouteId, assignTargetVendorId);
      setMessage("Vendor assigned to route successfully");
      setShowAssignRouteModal(false);
      setAssignRouteId("");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to assign route");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Bill actions (Approve / Reject)
  async function handleBillStatusUpdate(action: "APPROVE" | "REJECT") {
    if (!showBillActionModal) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      if (action === "APPROVE") {
        await approveVendorBill(showBillActionModal.id, { financeRemarks: billActionRemarks });
        setMessage("Vendor bill approved successfully");
      } else {
        await rejectVendorBill(showBillActionModal.id, { financeRemarks: billActionRemarks });
        setMessage("Vendor bill rejected successfully");
      }
      setShowBillActionModal(null);
      setBillActionRemarks("");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update bill status");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Pay Bill
  async function handlePayBill(id: string) {
    if (!confirm("Confirm payment completion for this invoice?")) return;
    setError("");
    setMessage("");
    try {
      await payVendorBill(id);
      setMessage("Bill marked as Paid & queued for ERP payroll sync");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to process payment");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Vendor & Contract Fleet Management
          </h1>
          <p className="text-sm text-slate-500">
            Monitor vendor metrics, handle billing claims, and oversee logistics supplier contracts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setError("");
              setMessage("");
              loadData();
            }}
            disabled={isLoading}
            className="rounded-xl border border-slate-200"
          >
            <RefreshCcw size={16} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {isTransportAdmin && activeTab === "VENDORS" && (
            <Button
              onClick={() => {
                setEditingVendorId(null);
                setVendorForm(defaultVendorForm);
                setShowVendorModal(true);
              }}
              className="rounded-xl"
            >
              <PlusCircle size={16} className="mr-2" />
              Register Vendor
            </Button>
          )}

          {activeTab === "BILLS" && (
            <Button
              onClick={() => {
                setBillForm(defaultBillForm);
                setShowBillModal(true);
              }}
              className="rounded-xl"
            >
              <PlusCircle size={16} className="mr-2" />
              Submit Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Message alerts */}
      {message && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-100">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 border border-red-100">
          <XCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Vendors</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.totalVendors}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-700">
              <Building2 size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Contracts</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.activeVendors}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3.5 text-emerald-700">
              <UserCheck size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Audits</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{metrics.pendingBills}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3.5 text-amber-700">
              <FileCheck size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Processed Invoices</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-800">
                PKR {metrics.totalBillsApproved.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3.5 text-violet-700">
              <CreditCard size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("VENDORS")}
          className={`px-6 py-3 text-sm font-bold transition border-b-2 ${
            activeTab === "VENDORS"
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Vendors Registry
        </button>
        <button
          onClick={() => setActiveTab("BILLS")}
          className={`px-6 py-3 text-sm font-bold transition border-b-2 ${
            activeTab === "BILLS"
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Billing Claims & Ledger
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCcw size={40} className="animate-spin text-blue-700" />
          <p className="mt-4 text-sm font-medium">Fetching details from database...</p>
        </div>
      ) : activeTab === "VENDORS" ? (
        /* VENDORS REGISTRY TAB */
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search vendor registry by name, contact, email..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 transition"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={vendorStatusFilter}
                onChange={(e) => setVendorStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLACKLISTED">Blacklisted</option>
              </select>

              <select
                value={contractTypeFilter}
                onChange={(e) => setContractTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
              >
                <option value="ALL">All Contract Types</option>
                <option value="MONTHLY">Monthly</option>
                <option value="PER_TRIP">Per Trip</option>
                <option value="PER_KM">Per KM</option>
                <option value="ON_DEMAND">On Demand</option>
              </select>
            </div>
          </div>

          {/* Vendors grid */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredVendors.map((vendor) => {
              const statusColors = {
                ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
                INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
                BLACKLISTED: "bg-red-50 text-red-700 border-red-100",
              };

              return (
                <Card
                  key={vendor.id}
                  className="flex flex-col justify-between border-slate-100 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">{vendor.vendorName}</h3>
                        <p className="mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-slate-50 text-slate-500">
                          {vendor.contractType.replace("_", " ")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          statusColors[vendor.status]
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="text-slate-400" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={15} className="text-slate-400" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={15} className="text-slate-400" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-slate-400" />
                          <span className="truncate">{vendor.address}</span>
                        </div>
                      )}
                      {(vendor.contractStartDate || vendor.contractEndDate) && (
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-slate-400" />
                          <span className="text-xs">
                            {vendor.contractStartDate
                              ? new Date(vendor.contractStartDate).toLocaleDateString()
                              : "-"}{" "}
                            to{" "}
                            {vendor.contractEndDate
                              ? new Date(vendor.contractEndDate).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Truck size={14} /> Vehicles: {vendor.vehicles?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Route size={14} /> Routes: {vendor.routes?.length || 0}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedVendorDetails(vendor)}
                        className="flex-1 rounded-xl text-xs py-1.5"
                      >
                        Details
                      </Button>

                      {isTransportAdmin && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => triggerEditVendor(vendor)}
                            className="rounded-xl p-2"
                            title="Edit Vendor"
                          >
                            <Edit size={14} />
                          </Button>
                          {vendor.status === "ACTIVE" && (
                            <Button
                              variant="danger"
                              onClick={() => handleDeactivateVendor(vendor.id)}
                              className="rounded-xl p-2 bg-red-50 text-red-600 hover:bg-red-100"
                              title="Deactivate Vendor"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredVendors.length === 0 && (
              <div className="col-span-full rounded-2xl bg-white p-12 text-center border border-slate-100 shadow-sm">
                <AlertTriangle className="mx-auto text-slate-300" size={40} />
                <h3 className="mt-4 font-bold text-slate-800">No vendors found</h3>
                <p className="text-slate-500 text-sm mt-1">Try modifying your search query or filters.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BILLS CLAIM TAB */
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search billing ledger by bill number, vendor, descriptions..."
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 transition"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={billStatusFilter}
                onChange={(e) => setBillStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PAID">Paid</option>
              </select>

              <select
                value={billVendorFilter}
                onChange={(e) => setBillVendorFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition lg:max-w-xs"
              >
                <option value="ALL">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bills Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Bill Details</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Assigned Route</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status & Sync</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => {
                  const statusColors = {
                    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
                    APPROVED: "bg-blue-50 text-blue-700 border-blue-100",
                    REJECTED: "bg-red-50 text-red-700 border-red-100",
                    PAID: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  };

                  const syncColors = {
                    NOT_READY: "text-slate-400 bg-slate-50",
                    READY_FOR_EXPORT: "text-amber-600 bg-amber-50",
                    EXPORTED: "text-emerald-600 bg-emerald-50",
                  };

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-800">{bill.billNumber}</div>
                        {bill.description && (
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                            {bill.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {bill.vendor?.vendorName || "Unknown Vendor"}
                      </td>
                      <td className="px-6 py-4">
                        {bill.route ? (
                          <div>
                            <span className="font-medium text-slate-800">{bill.route.routeName}</span>
                            <span className="block font-mono text-[10px] text-slate-400">
                              {bill.route.routeCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No specific route</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(bill.billDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {bill.currency} {bill.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider ${
                              statusColors[bill.status]
                            }`}
                          >
                            {bill.status}
                          </span>
                          
                          {bill.status === "PAID" && (
                            <span
                              className={`block w-max rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                syncColors[bill.payrollSyncStatus]
                              }`}
                              title={
                                bill.exportedAt
                                  ? `Synced with payroll on ${new Date(bill.exportedAt).toLocaleString()}`
                                  : "Awaiting automatic ERP exports"
                              }
                            >
                              Sync: {bill.payrollSyncStatus.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {bill.status === "PENDING" && isFinance && (
                            <>
                              <Button
                                variant="primary"
                                onClick={() => {
                                  setShowBillActionModal(bill);
                                  setBillActionRemarks("");
                                }}
                                className="rounded-lg text-xs px-2.5 py-1"
                              >
                                Review
                              </Button>
                            </>
                          )}

                          {bill.status === "APPROVED" && isFinance && (
                            <Button
                              onClick={() => handlePayBill(bill.id)}
                              className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1"
                            >
                              Pay Claim
                            </Button>
                          )}

                          <span className="text-slate-300 text-xs py-1">
                            {bill.status === "REJECTED" && (
                              <span className="text-red-500 font-semibold italic text-xs">Rejected</span>
                            )}
                            {bill.status === "PAID" && bill.payrollSyncStatus === "EXPORTED" && (
                              <span className="text-emerald-600 font-semibold text-xs">Exported</span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <AlertTriangle className="mx-auto text-slate-300" size={35} />
                      <h4 className="mt-3 font-bold text-slate-800 text-sm">No bills registered</h4>
                      <p className="text-slate-400 text-xs mt-0.5">Try altering the filters or log a new bill invoice.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENDOR CREATION/EDIT MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              {editingVendorId ? "Edit Vendor Details" : "Register Logistics Vendor"}
            </h3>

            <form onSubmit={handleVendorSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.vendorName}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Karachi Transit Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Muhammad Ali"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. 03001234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. info@vendor.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contract Billing Model
                  </label>
                  <select
                    value={vendorForm.contractType}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, contractType: e.target.value as VendorContractType })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="MONTHLY">Monthly Contract</option>
                    <option value="PER_TRIP">Pay Per Trip</option>
                    <option value="PER_KM">Pay Per KM travelled</option>
                    <option value="ON_DEMAND">On Demand basis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={vendorForm.status}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, status: e.target.value as VendorStatus })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLACKLISTED">Blacklisted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={vendorForm.contractStartDate}
                    onChange={(e) => setVendorForm({ ...vendorForm, contractStartDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contract End Date
                  </label>
                  <input
                    type="date"
                    value={vendorForm.contractEndDate}
                    onChange={(e) => setVendorForm({ ...vendorForm, contractEndDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Corporate Address
                </label>
                <textarea
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Street details, business center, city..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Internal Remarks / Notes
                </label>
                <textarea
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Compliance remarks, security checks, vehicle fitness details..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVendorModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                  {isSubmitting ? "Submitting..." : editingVendorId ? "Save Changes" : "Create Vendor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BILL MODAL */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Submit Vendor Expense Claim Invoice
            </h3>

            <form onSubmit={handleBillSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Vendor Partner *
                </label>
                <select
                  required
                  value={billForm.vendorId}
                  onChange={(e) => setBillForm({ ...billForm, vendorId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                >
                  <option value="">Select Vendor...</option>
                  {vendors
                    .filter((v) => v.status === "ACTIVE")
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendorName}
                      </option>
                    ))}
                </select>
              </div>

              {isTransportAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Associated Transport Route (Optional)
                  </label>
                  <select
                    value={billForm.routeId}
                    onChange={(e) => setBillForm({ ...billForm, routeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  >
                    <option value="">No Route Link...</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.routeName} ({r.routeCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Bill/Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={billForm.billNumber}
                    onChange={(e) => setBillForm({ ...billForm, billNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. INV-1002"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={billForm.billDate}
                    onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Claim Amount *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <input
                    type="text"
                    disabled
                    value={billForm.currency}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Itemized Description
                </label>
                <textarea
                  value={billForm.description}
                  onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                  placeholder="Detail fuel charges, toll additions, route operations days, driver allowance breakdowns..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowBillModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                  {isSubmitting ? "Submitting..." : "File Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR DETAILS VIEW OVERLAY MODAL */}
      {selectedVendorDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedVendorDetails.vendorName}</h3>
                <p className="text-xs text-slate-400">ID: {selectedVendorDetails.id}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setSelectedVendorDetails(null)}
                className="rounded-lg p-1.5 px-3 border border-slate-200"
              >
                Close
              </Button>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Contract info</h4>
                  <div className="mt-2 space-y-2.5 text-sm text-slate-700">
                    <p className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      <strong>Contact:</strong> {selectedVendorDetails.contactPerson || "-"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-400" />
                      <strong>Phone:</strong> {selectedVendorDetails.phone || "-"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <strong>Email:</strong> {selectedVendorDetails.email || "-"}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400" />
                      <strong>Address:</strong> {selectedVendorDetails.address || "-"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      <strong>Contract Duration:</strong>{" "}
                      {selectedVendorDetails.contractStartDate
                        ? new Date(selectedVendorDetails.contractStartDate).toLocaleDateString()
                        : "-"}{" "}
                      to{" "}
                      {selectedVendorDetails.contractEndDate
                        ? new Date(selectedVendorDetails.contractEndDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>

                {selectedVendorDetails.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Notes</h4>
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed border border-slate-100">
                      {selectedVendorDetails.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Vendor fleet and route associations */}
              <div className="space-y-4 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 md:pl-6 md:border-l">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck size={15} /> Assigned Fleet
                    </h4>
                    {isTransportAdmin && selectedVendorDetails.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          setAssignTargetVendorId(selectedVendorDetails.id);
                          setShowAssignVehicleModal(true);
                        }}
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center"
                      >
                        + Assign Vehicle
                      </button>
                    )}
                  </div>
                  <div className="mt-2.5 space-y-2 max-h-32 overflow-y-auto">
                    {selectedVendorDetails.vehicles?.map((veh) => (
                      <div key={veh.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs border border-slate-100">
                        <span className="font-bold text-slate-700">{veh.vehicleNumber}</span>
                        <span className="text-slate-400 uppercase font-semibold">{veh.vehicleType}</span>
                      </div>
                    ))}
                    {(!selectedVendorDetails.vehicles || selectedVendorDetails.vehicles.length === 0) && (
                      <p className="text-slate-400 text-xs italic">No vehicles assigned to this vendor.</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Route size={15} /> Serviced Routes
                    </h4>
                    {isTransportAdmin && selectedVendorDetails.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          setAssignTargetVendorId(selectedVendorDetails.id);
                          setShowAssignRouteModal(true);
                        }}
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center"
                      >
                        + Assign Route
                      </button>
                    )}
                  </div>
                  <div className="mt-2.5 space-y-2 max-h-32 overflow-y-auto">
                    {selectedVendorDetails.routes?.map((rt) => (
                      <div key={rt.id} className="flex flex-col rounded-xl bg-slate-50 p-2 text-xs border border-slate-100">
                        <span className="font-bold text-slate-700">{rt.routeName}</span>
                        <span className="font-mono text-[10px] text-slate-400 mt-0.5">{rt.routeCode}</span>
                      </div>
                    ))}
                    {(!selectedVendorDetails.routes || selectedVendorDetails.routes.length === 0) && (
                      <p className="text-slate-400 text-xs italic">No routes assigned to this vendor.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN VEHICLE TO VENDOR OVERLAY */}
      {showAssignVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              Associate Vehicle with Vendor
            </h4>

            <form onSubmit={handleAssignVehicle} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Vehicle *
                </label>
                <select
                  required
                  value={assignVehicleId}
                  onChange={(e) => setAssignVehicleId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                >
                  <option value="">Choose vehicle number...</option>
                  {vehicles
                    .filter((v) => v.status === "ACTIVE" && v.vendorId !== assignTargetVendorId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.ownershipType} - {v.vehicleType})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAssignVehicleModal(false);
                    setAssignVehicleId("");
                  }}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Linking..." : "Assign Vehicle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ROUTE TO VENDOR OVERLAY */}
      {showAssignRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              Associate Transport Route with Vendor
            </h4>

            <form onSubmit={handleAssignRoute} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Route *
                </label>
                <select
                  required
                  value={assignRouteId}
                  onChange={(e) => setAssignRouteId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                >
                  <option value="">Choose route code...</option>
                  {routes
                    .filter((r) => r.status === "ACTIVE" && r.vendorId !== assignTargetVendorId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.routeName} ({r.routeCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAssignRouteModal(false);
                    setAssignRouteId("");
                  }}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs">
                  {isSubmitting ? "Linking..." : "Assign Route"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL ACTION REVIEW MODAL */}
      {showBillActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Review Vendor Invoice Claim
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p>
                <strong>Bill Number:</strong> {showBillActionModal.billNumber}
              </p>
              <p>
                <strong>Vendor:</strong> {showBillActionModal.vendor?.vendorName}
              </p>
              <p>
                <strong>Claim Amount:</strong> {showBillActionModal.currency} {showBillActionModal.amount.toLocaleString()}
              </p>
              {showBillActionModal.description && (
                <p>
                  <strong>Description:</strong> {showBillActionModal.description}
                </p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Audit/Review Remarks
              </label>
              <textarea
                value={billActionRemarks}
                onChange={(e) => setBillActionRemarks(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 transition"
                placeholder="Include approval comments or reasons for rejection..."
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowBillActionModal(null);
                  setBillActionRemarks("");
                }}
                disabled={isSubmitting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => handleBillStatusUpdate("REJECT")}
                disabled={isSubmitting}
                className="rounded-xl text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-2"
              >
                Reject Claim
              </Button>
              <Button
                type="button"
                onClick={() => handleBillStatusUpdate("APPROVE")}
                disabled={isSubmitting}
                className="rounded-xl text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-2"
              >
                Approve Claim
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
