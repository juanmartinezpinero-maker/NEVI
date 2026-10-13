const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconHome = () => (
  <svg {...base}>
    <path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z" />
  </svg>
);
export const IconSearch = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconStories = () => (
  <svg {...base}>
    <rect x="6" y="3" width="12" height="18" rx="3" />
    <path d="M9 8h6M9 12h4" />
  </svg>
);
export const IconPlus = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconChart = () => (
  <svg {...base}>
    <path d="M5 20v-9M12 20V5M19 20v-6" />
  </svg>
);
export const IconUser = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
export const IconShare = () => (
  <svg {...base} width={18} height={18}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
