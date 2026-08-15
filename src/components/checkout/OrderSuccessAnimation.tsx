import orderSuccessVideo from "@/assets/order-confirmation-anim.mp4.asset.json";

/**
 * OrderSuccessAnimation
 * Displays the specific uploaded MP4 animation for CUSTOMZ PARADISE BD order success.
 */
export function OrderSuccessAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto flex justify-center ${className}`}>
      <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-xl">
        <video
          autoPlay
          muted
          playsInline
          className="h-full w-full object-contain"
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src={orderSuccessVideo.url} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
