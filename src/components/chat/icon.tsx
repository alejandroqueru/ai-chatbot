import type { SVGProps } from 'react';

const paths = {
  asterisk: 'M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07 19.07 4.93',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4',
  plus: 'M12 5v14M5 12h14',
  chat: 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2A8.5 8.5 0 0 1 21 11.5Z',
  arrow: 'M12 19V5m-6 6 6-6 6 6',
  panel:
    'M9 4v16M6 4h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z',
  search: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM16 16l4 4',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
  write: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z',
  bulb: 'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9Z',
  close: 'm6 6 12 12M6 18 18 6',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** Vector brand mark: avoids platform-dependent Unicode emoji rendering. */
export function AlbaMark(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon
      name="asterisk"
      width="1em"
      height="1em"
      strokeWidth="0.85"
      strokeLinecap="butt"
      className="alba-mark"
      {...props}
    />
  );
}
