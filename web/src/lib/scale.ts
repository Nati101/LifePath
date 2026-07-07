export const QUESTIONS_PER_STEP = 3;

export const scaleOptions = [
  {
    value: 1,
    label: "Not Like Me",
    shortLabel: "Not me",
    fill: "#ffd4d2",
    border: "#f0a8a4",
    ring: "#e06b66",
  },
  {
    value: 2,
    label: "A Little Like Me",
    shortLabel: "A little",
    fill: "#ffe4c8",
    border: "#f0c090",
    ring: "#d4924a",
  },
  {
    value: 3,
    label: "Mostly Like Me",
    shortLabel: "Mostly",
    fill: "#d4efdc",
    border: "#9dd4ad",
    ring: "#5aab6e",
  },
  {
    value: 4,
    label: "Very Like Me",
    shortLabel: "Very me",
    fill: "#c8ebe4",
    border: "#8ecfc4",
    ring: "#3d9a82",
  },
] as const;
