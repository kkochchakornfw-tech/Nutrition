import type { SVGProps } from "react";

// Lucide-style outline icons (stroke = currentColor), decorative by default
function Svg({ children, className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const CheckCircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Svg>
);

export const AlertIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const CircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
  </Svg>
);

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

export const SpinnerIcon = ({ className = "h-4 w-4", ...p }: SVGProps<SVGSVGElement>) => (
  <Svg className={`animate-spin motion-reduce:animate-none ${className}`} {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </Svg>
);

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </Svg>
);

export const ClipboardIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </Svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const CalculatorIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
  </Svg>
);

export const LogOutIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Svg>
);

export const AppleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 7c-1.5-1-3.5-1.3-5-.5C4.5 7.8 4 11 5 14c1 3.2 3 6 5 6 .8 0 1.3-.4 2-.4s1.2.4 2 .4c2 0 4-2.8 5-6 1-3 .5-6.2-2-7.5-1.5-.8-3.5-.5-5 .5Z" />
    <path d="M12 7c0-2 1-3.5 3-4" />
  </Svg>
);

export const LeafIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
    <path d="M2 21c0-3 1.9-5.4 5.2-6.1 2.4-.5 4.9-2 5.8-4.9" />
  </Svg>
);

export const ScaleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8 9a6 6 0 0 1 8 0l-2.5 3h-3Z" />
  </Svg>
);

export const ActivityIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
);

export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const HistoryIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </Svg>
);

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

export const CarrotIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M17 5c1.5-1.5 3-2 4-1s.5 2.5-1 4M14 4l1 2M17 7l2 1" />
    <path d="M18.5 8.5c1.5 1.5 1.7 4.2-1.2 7.1-3.6 3.6-8.8 5.4-10.6 3.6s0-7 3.6-10.6c2.9-2.9 5.6-2.7 7.1-1.2Z" />
  </Svg>
);

export const BerryIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 3v3M9 4.5 12 6l3-1.5" />
    <circle cx="12" cy="14" r="7" />
    <path d="M9 12h.01M12 11h.01M15 12h.01M9 15h.01M12 16h.01M15 15h.01M12 13.5h.01" />
  </Svg>
);

export const GrainBowlIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 11h18a9 6 0 0 1-18 0Z" />
    <path d="M7 11c0-2 1-4 2-5M12 11c0-2.5 1-5 2-6M17 11c0-2 .5-3.5 1.5-5" />
  </Svg>
);

export const EyeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.3 13.3 0 0 1-2.6 3.4M6.6 6.6C3.4 8.6 1.5 12 1.5 12S5 19 12 19a10.6 10.6 0 0 0 4.2-.86" />
    <path d="M9.9 14.1a3 3 0 0 0 4.2-4.2" />
    <path d="M2 2l20 20" />
  </Svg>
);

export const IdCardIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M14 10h5M14 14h5M5.5 16.5c.5-1.5 1.7-2.2 2.5-2.2s2 .7 2.5 2.2" />
  </Svg>
);

export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 5 3.2 8.4 7 9 3.8-.6 7-4 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const DropletIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 2.5s7 7.4 7 12.1a7 7 0 1 1-14 0C5 9.9 12 2.5 12 2.5Z" />
  </Svg>
);
