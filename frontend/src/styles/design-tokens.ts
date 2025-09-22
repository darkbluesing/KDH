export const COLOR_TOKENS = {
  deepBlack: "#05060A",
  charcoal: "#12131A",
  neonPurple: "#A259FF",
  electricBlue: "#3A86FF",
  bloodyRed: "#EF233C",
  metallicSilver: "#ADB5BD",
  ember: "#FF6D00",
} as const;

export const GRID_DIMENSIONS = {
  columns: 7,
  rows: 20,
  cellWidth: 135,
  cellHeight: 240,
} as const;

export const PLATFORM_BADGES = {
  youtube: {
    label: "YouTube",
    gradient: "linear-gradient(135deg, #FF0000, #EF233C)",
  },
  instagram: {
    label: "Instagram",
    gradient: "linear-gradient(135deg, #FEDA75, #D62976, #6228D7)",
  },
} as const;
