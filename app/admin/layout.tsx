import AdminMfaGate from "@/components/admin/AdminMfaGate";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminMfaGate>{children}</AdminMfaGate>;
}
