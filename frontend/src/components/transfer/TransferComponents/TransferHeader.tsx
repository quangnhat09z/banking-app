
export default function TransferHeader({ pageState }: { pageState: 'form' | 'confirm' | 'success' }) {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transfer Money</h1>
            <p className="text-sm text-gray-500 mt-1">Move funds securely across internal accounts</p>

            {/* Thanh quy trình */}
            <div className="flex items-center gap-2 mt-6">
                <span className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${pageState === 'form' ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <span className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${pageState === 'confirm' ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <span className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${pageState === 'success' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            </div>
        </div>
    );
}