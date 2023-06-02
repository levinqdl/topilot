import { report } from "./api/report";

class TopilotReporter {
  labels: Record<string, string>;
  totalFailed: number;
  totalPassed: number;
  options: any;
  constructor({ labels, ...options }: { labels: Record<string, string>, host?: string, token?: string }) {
    this.labels = labels;
    this.totalFailed = 0;
    this.totalPassed = 0;
    this.options = options
  }
  onTestEnd(test: any, result: any) {
    if (result.status === "passed") {
      this.totalPassed++;
    } else if (result.status === "failed") {
      this.totalFailed++;
    }
  }
  onEnd(results: any) {
    if (results) {
      return report(
        { totalPassed: this.totalPassed, totalFailed: this.totalFailed },
        this.labels,
        this.options
      );
    }
  }
}

export default TopilotReporter;
