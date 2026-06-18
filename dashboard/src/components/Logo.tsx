// OVH logo (source: homarr-labs/dashboard-icons). Uses `currentColor` so it follows
// the theme — render with `text-primary` for OVH blue in light + a visible lighter
// blue in dark (the `.dark` --primary token).
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1505 909"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ovh-finops"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="m1407.08 52.27-160.24 283.35h-168.16L880.85 684.34h168.16l-126.62 223.9h413.47c193.88-243.71 223.55-582.53 71.22-855.97M592.01 908.24 1116.27.76H673.13L372.42 523.85 99.41 50.29C-54.9 323.73-27.2 664.53 172.61 908.24z"
      />
    </svg>
  )
}
