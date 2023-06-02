import req from "./req";

function report(
  results: { totalPassed: number; totalFailed: number },
  labels: Record<string, string>,
  options = {}
) {
  const method = "post";
  const body = {
    totalPassed: results.totalPassed,
    totalFailed: results.totalFailed,
    labels,
  };
  const path = "/api/report";
  return req(path, {...options, method, body, });
}

export { report };

