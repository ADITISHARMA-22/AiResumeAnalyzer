import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        "dark-200": "#475467",
        "light-blue-100": "#c1d3f81a",
        "light-blue-200": "#a7bff14d",
        "badge-green": "#d5faf1",
        "badge-red": "#f9e3e2",
        "badge-yellow": "#fceed8",
        "badge-green-text": "#254d4a",
        "badge-red-text": "#752522",
        "badge-yellow-text": "#73321b",
      },
      boxShadow: {
        inset: "inset 0 1px 3px 0 rgb(0 0 0 / 0.1)",
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #AB8C95 0%, #8E97C5 100%)",
      },
    },
  },
} satisfies Config;
