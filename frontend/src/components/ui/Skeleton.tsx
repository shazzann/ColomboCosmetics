const Skeleton = ({ className }: { className?: string }) => {
    return (
        <div
            className={`animate-pulse bg-pink-50/50 rounded-xl ${className}`}
        ></div>
    );
};

export default Skeleton;
