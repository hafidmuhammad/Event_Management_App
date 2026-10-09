import "../src/lib/load-env";

const developmentUrl = process.env.DATABASE_URL;
const testUrl = process.env.TEST_DATABASE_URL;
if (!developmentUrl || !testUrl) throw new Error("DATABASE_URL and a separate TEST_DATABASE_URL are required for project QA.");
const development = new URL(developmentUrl);
const test = new URL(testUrl);
const canonicalHost = (hostname: string) => ["localhost", "127.0.0.1", "[::1]"].includes(hostname) ? "local" : hostname;
if (canonicalHost(development.hostname) === canonicalHost(test.hostname) && (development.port || "3306") === (test.port || "3306") && development.pathname === test.pathname) {
  throw new Error("Tests are blocked: TEST_DATABASE_URL points to the development database.");
}
console.log("TEST_DATABASE_URL uses a separate database.");
