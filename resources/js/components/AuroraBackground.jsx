import React from "react";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}) => {
  return (
    <main>
      <div
        // 👇 PERBAIKAN: Gunakan min-h-screen dan justify-center agar bisa melar jika kontennya panjang
        className={`relative flex flex-col min-h-screen items-center justify-center bg-kas-dark text-white transition-bg overflow-hidden ${className || ''}`}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`
            [--dark-gradient:repeating-linear-gradient(100deg,#000000_0%,#000000_7%,transparent_10%,transparent_12%,#000000_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--color-kas-primary)_10%,var(--color-kas-soft)_15%,var(--color-kas-accent)_20%,var(--color-kas-soft)_25%,var(--color-kas-primary)_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px]
            after:content-[""] after:absolute after:inset-0 
            after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-60 will-change-transform
            ${showRadialGradient ? '[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]' : ''}
            `}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};