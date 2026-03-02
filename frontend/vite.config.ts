// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// //import basicSsl from "@vitejs/plugin-basic-ssl";

// export default defineConfig({
//   plugins: [react()],
// });

// //  basicSsl();

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["nonaffectingly-overbig-ernestina.ngrok-free.dev"],
  },
});
