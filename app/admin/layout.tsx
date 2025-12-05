import type React from "react"
import type { Metadata } from "next"
import { AdminLayout } from "@/components/admin/admin-layout"

export const metadata: Metadata = {
  title: "Admin • Campus Connect",
}

// Segment layout: do not include <html> or <body>; root layout provides them
export default function AdminSegmentLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
