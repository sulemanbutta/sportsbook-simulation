import axios from 'axios';

class ApiClient {
  constructor() {
    this.maxRetries = 3;
    this.servicesStartupDelay = 3000;
  }

  async makeRequest(requestFn, options = {}) {
    const {
        onServiceStarting = null,
        onRetry = null
    } = options;

    for (let attempt = 1; attempt <= this.maxRetries;  attempt++) {
      try{
        const response = await requestFn();
        return response;
      } catch (error) {
        const isServiceStarting = error.response?.status === 503;
        const isLastAtttempt = attempt == this.manRetries;

        if (isServiceStarting && !isLastAtttempt) {
          if (onServiceStarting) {
            onServiceStarting(attempt, this.maxRetries);
          }

          console.log(`Service starting up, retrying in ${this.serviceStartupDelay/1000}s... (${attempt}/${this.maxRetries})`);

          if (onRetry) {
            onRetry(attempt, error);
          }

          await new Promise(resolve => setTimeout(resolve, this.servicesStartupDelay));
          continue;
        }

        throw error;
      }
    }
  }

  async warmUpServices() {

    const authApi = import.meta.env.VITE_AUTH_API_URL;
    const bettingApi = import.meta.env.VITE_BETTING_API_URL;
    const settlementApi = import.meta.env.VITE_SETTLEMENT_API_URL;

    const services = [
      `${authApi}/warmup`,
      `${bettingApi}/warmup`,
      `${settlementApi}/warmup`,
    ]

    console.log('Warming up services...');

    const warmupPromises = services.map(async (serviceUrl) => {
      try {
        const response = await axios.get(serviceUrl, { timeout: 5000 });
        console.log(`Warmed up: ${serviceUrl}`, response.data);
      } catch (error) {
        console.log(`Failed to warm up: ${serviceUrl}`, error.message);
      }
    });
    await Promise.allSettled(warmupPromises);
    console.log('🔥 Service warmup complete');
  }
}

export default new ApiClient();
