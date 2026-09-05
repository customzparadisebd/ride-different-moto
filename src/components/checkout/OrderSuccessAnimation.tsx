import orderSuccessVideo from "@/assets/order-confirmation-anim.mp4";

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
          disablePictureInPicture
          className="h-full w-full object-contain pointer-events-none"
          onContextMenu={(e) => e.preventDefault()}
          onEnded={(e) => {
            const video = e.currentTarget;
            video.currentTime = 0;
            video.play().catch(() => {});
          }}
        >
          <source src={orderSuccessVideo} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
