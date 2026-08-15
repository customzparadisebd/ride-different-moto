import orderSuccessVideo from "@/assets/order-confirmation-anim.mp4.asset.json";

/**
 * OrderSuccessAnimation
 * Displays the specific uploaded MP4 animation for CUSTOMZ PARADISE BD order success.
 */
export function OrderSuccessAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto flex justify-center w-full ${className}`}>
      <div className="relative w-full max-w-[320px] sm:max-w-[480px] lg:max-w-[640px] aspect-video overflow-hidden rounded-xl">
        <video
          autoPlay
          muted
          loop
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
