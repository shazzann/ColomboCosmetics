import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-pink-400 mb-4 animate-scale-in">
                <Icon size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 font-serif mb-1">{title}</h3>
            <p className="text-gray-400 text-sm max-w-xs">{description}</p>
        </div>
    );
};

export default EmptyState;
