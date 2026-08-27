import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cockpit: {
          bg: "#0b0b0a",
          side: "#090907",
          panel: "#11110f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
