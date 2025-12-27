import Image from "next/image";
import Link from "next/link";

const StoreCard = ({ store }) => {
    return (
        <Link href={`/shop/${store.username}`} className="block">
            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-3">
                    <Image
                        src={store.logo || "/api/placeholder/60/60"}
                        alt={store.name}
                        width={60}
                        height={60}
                        className="rounded-full object-cover border-2 border-slate-100"
                    />
                    <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{store.name}</h3>
                        <p className="text-slate-500 text-sm">@{store.username}</p>
                    </div>
                </div>
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">{store.description}</p>
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{store._count.Product} products</span>
                    <span className="text-green-600 font-medium">Visit Store →</span>
                </div>
            </div>
        </Link>
    );
};

export default StoreCard;
