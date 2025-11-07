import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "ShopMe. - Admin",
    description: "ShopMe. - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
