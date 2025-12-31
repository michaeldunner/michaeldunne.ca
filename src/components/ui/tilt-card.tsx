import { useRef } from "react";

export const TiltCard = ({
  children,
  className = "",
  rotateFactor = 0.4,
}: {
  children: React.ReactNode;
  className?: string;
  rotateFactor?: number;
}) => {
  const isPointerInside = useRef(false);
  const refElement = useRef<HTMLDivElement>(null);
  const state = useRef({
    rotate: {
      x: 0,
      y: 0,
    },
  });

  const containerStyle = {
    "--r-x": "0deg",
    "--r-y": "0deg",
    "--duration": "300ms",
    "--easing": "ease",
  } as any;

  const updateStyles = () => {
    if (refElement.current) {
      const { rotate } = state.current;
      refElement.current?.style.setProperty("--r-x", `${rotate.x}deg`);
      refElement.current?.style.setProperty("--r-y", `${rotate.y}deg`);
    }
  };

  return (
    <div
      style={containerStyle}
      className={`relative [perspective:600px] transition-transform duration-[var(--duration)] ease-[var(--easing)] will-change-transform ${className}`}
      ref={refElement}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        const percentage = {
          x: (100 / rect.width) * position.x,
          y: (100 / rect.height) * position.y,
        };
        const delta = {
          x: percentage.x - 50,
          y: percentage.y - 50,
        };

        const { rotate } = state.current;
        rotate.x = -(delta.x / 10);
        rotate.y = delta.y / 10;
        rotate.x *= rotateFactor;
        rotate.y *= rotateFactor;

        updateStyles();
      }}
      onPointerEnter={() => {
        isPointerInside.current = true;
        if (refElement.current) {
          setTimeout(() => {
            if (isPointerInside.current) {
              refElement.current?.style.setProperty("--duration", "0s");
            }
          }, 300);
        }
      }}
      onPointerLeave={() => {
        isPointerInside.current = false;
        if (refElement.current) {
          refElement.current.style.removeProperty("--duration");
          refElement.current?.style.setProperty("--r-x", `0deg`);
          refElement.current?.style.setProperty("--r-y", `0deg`);
        }
      }}
    >
      <div className="will-change-transform origin-center transition-transform duration-[var(--duration)] ease-[var(--easing)] [transform:rotateY(var(--r-x))_rotateX(var(--r-y))]">
        {children}
      </div>
    </div>
  );
};
