import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "ShopMe. - Bảng điều khiển Cửa hàng",
    description: "ShopMe. - Bảng điều khiển Cửa hàng",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <StoreLayout>
                {children}
            </StoreLayout>
        </>
    );
}
