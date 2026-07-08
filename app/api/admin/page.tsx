// app/admin/page.tsx
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-black mb-4">Admin</h1>
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition">
          ← Back to app
        </Link>
      </div>
    </div>
  );
}