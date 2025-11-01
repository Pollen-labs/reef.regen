import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx,js}",
  ],
  // Ensure dynamic class names used via mappings are preserved in production
  safelist: [
    // bg tints used for regen type tags
    "bg-flamingo-300",
    "bg-ribbon-300",
    "bg-aquamarine-300",
    "bg-sunflower-300",
    "bg-violet-300",
    "bg-magenta-300",
    "bg-vulcan-200",
    // text colors used on tags
    "text-vulcan-950",
    "text-vulcan-900",
    "text-black",
    "text-white",
  ],
  darkMode: ["class"],
  theme: {
    // Override base to 18px with 1.4 line-height; keep Tailwind defaults for others
    fontSize: {
      ...defaultTheme.fontSize,
      base: ['18px', { lineHeight: '1.4' }],
    },
    extend: {
      fontFamily: {
        // Outfit everywhere by default (we'll set body in @layer base)
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
      },
      // Letter spacing and line-height tokens that match the spec
      letterSpacing: {
        // -2% for headings (Tailwind accepts CSS <length-percentage> via arbitrary values,
        // but this alias makes it convenient)
        "hd": "-0.02em",
      },
      lineHeight: {
        // 104% for headings, 140% for body
        "hd": "1.04",
        "body": "1.4",
      },
      // Additional font sizes that match your scale
      fontSize: {
        // Headings
        "h1": ["118px", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "h2": ["89px",  { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "h3": ["67px",  { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "h4": ["50px",  { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "h5": ["38px",  { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "h6": ["28px",  { lineHeight: "1.04", letterSpacing: "-0.02em" }],

        // Body text tokens (140% line-height)
        "2xlb": ["26px", { lineHeight: "1.4" }],
        "xlb":  ["24px", { lineHeight: "1.4" }],
        "lgb":  ["22px", { lineHeight: "1.4" }],
        "baseb":["18px", { lineHeight: "1.4" }], // explicit token; base is also 18px now
        "smb":  ["16px", { lineHeight: "1.4" }],
        "xsb":  ["14px", { lineHeight: "1.4" }],
      },

      // Color system
      colors: {
        // Single-token "brand variables"
        black:  "#1D1D25",
        white:  "#F6F6F9",
        orange: "#F06334",
        blue:   "#345DF0",
        fuchsia:"#F034ED",
        teal:   "#4DCEAE",
        yellow: "#F0DD34",
        "mid-vulcan": "#6B6E8C",

        // Optional extended palettes (use what you need)
        vulcan: {
          50:"#F6F6F9",100:"#EDEDF1",200:"#D6D6E1",300:"#B3B5C6",
          400:"#898CA7",500:"#6B6E8C",600:"#565873",700:"#46475E",
          800:"#3C3D50",900:"#363744",950:"#1D1D25",
        },
        flamingo: {
          50:"#FEF4E9",100:"#FDE5D7",200:"#FAC8AE",300:"#F6A17B",
          400:"#F06334",500:"#ED4C22",600:"#DF3417",700:"#B92415",
          800:"#931F19",900:"#771D17",950:"#400B0A",
        },
        aquamarine: {
          50:"#E9FFF8",100:"#CAFBEA",200:"#9AFDD4",300:"#59FCCE",
          400:"#34F0C3",500:"#00D6A4",600:"#00AF86",700:"#008C6F",
          800:"#006E5A",900:"#005A4B",950:"#00332C",
        },
        ribbon: {
          50:"#EFF3FF",100:"#DCE5FD",200:"#C1D1FC",300:"#96B5FA",
          400:"#648DF6",500:"#345DF0",600:"#2A47E6",700:"#2233D3",
          800:"#222CAB",900:"#212B87",950:"#191D52",
        },
        violet: {
          50:"#FBF5FF",100:"#F4E7FF",200:"#ECD4FF",300:"#DDB2FF",
          400:"#C880FF",500:"#B250FC",600:"#A234F0",700:"#8910D3",
          800:"#741DAC",900:"#5F198A",950:"#410467",
        },
        sunflower: {
          50:"#FDFDE9",100:"#FAFBC6",200:"#F8F690",300:"#F4EA50",
          400:"#F0DD34",500:"#DFC113",600:"#C0990E",700:"#996F0F",
          800:"#7F5814",900:"#6C4717",950:"#3F2509",
        },
        magenta: {
          50:"#FFF4FF",100:"#FDE8FF",200:"#FCCFFF",300:"#FADAFD",
          400:"#FB77FA",500:"#F034ED",600:"#D524CE",700:"#B11AA8",
          800:"#911789",900:"#76196D",950:"#4F0348",
        },
      },
    },
  },
  plugins: [],
} satisfies Config
