// pages/admin/index.js
import Link from "next/link";
import withAdminAuth from "../../lib/withAdminAuth";
import AdminLayout from "../../components/AdminLayout";

function AdminHome() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-heading font-bold mb-4">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Manage site content and interact with your database.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Link
          href="/admin/tours"
          className="block rounded-xl border border-border bg-card p-6 shadow hover:shadow-lg hover:border-primary transition"
        >
          <h2 className="text-lg font-semibold text-foreground">Manage Tours</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Add, edit, or remove tours displayed on the website.
          </p>
        </Link>

        <Link
          href="/admin/enquiries"
          className="block rounded-xl border border-border bg-card p-6 shadow hover:shadow-lg hover:border-primary transition"
        >
          <h2 className="text-lg font-semibold text-foreground">View Enquiries</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Review and reply to user enquiries.
          </p>
        </Link>

        <Link
          href="/admin/testimonials"
          className="block rounded-xl border border-border bg-card p-6 shadow hover:shadow-lg hover:border-primary transition"
        >
          <h2 className="text-lg font-semibold text-foreground">Manage Testimonials</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Approve or delete customer testimonials.
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminHome);
