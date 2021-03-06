import { Worker } from "@youkuohao/worker";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const worker = new Worker(path.join(__dirname, "./worker.js"));

  http
    .createServer((request, response) => {
      worker.handleRequest(request, response);
    })
    .listen(8080, () => {
      console.log("Listing on port 8080");
    });
} catch (e) {
  console.error(e);
}
