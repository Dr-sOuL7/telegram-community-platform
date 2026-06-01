type Task = () => Promise<any>;

export class RateLimiter {
  private queue: Task[] = [];
  private isProcessing = false;
  // Simple rate limiter: wait 35ms between requests (~28 per second)
  private readonly delayMs = 35;

  async enqueue<T>(task: Task): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        await new Promise((res) => setTimeout(res, this.delayMs));
      }
    }

    this.isProcessing = false;
  }
}
