import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "ShopMe. - Store Dashboard",
    description: "ShopMe. - Store Dashboard",
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
