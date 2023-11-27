/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		let endpoint = 'https://api.waqi.info/feed/geo:';
		const token = env.weather_token; //Use a token from https://aqicn.org/api/

		const latitude = request.cf?.latitude;
		const longitude = request.cf?.longitude;
		endpoint += `${latitude};${longitude}/?token=${token}`;
		const init = {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};

		const response = await fetch(endpoint, init);
		const content = await response.json();

		let html_content = `<p>You are located at: ${latitude},${longitude}.</p>`;
		html_content += `<p>Based off sensor data from <a class="underline decoration-lime-400" href="${content.data.city.url}">${content.data.city.name}</a>:</p>`;
		html_content += `<p>The AQI level is: ${content.data.aqi}.</p>`;
		html_content += `<p>The N02 level is: ${content.data.iaqi.no2?.v}.</p>`;
		html_content += `<p>The O3 level is: ${content.data.iaqi.o3?.v}.</p>`;
		html_content += `<p>The temperature is: ${content.data.iaqi.t?.v}°C.</p>`;

		let html = `
      <!DOCTYPE html>
      <head>
        <title>Weather</title>
		<link rel="icon" href="https://fav.farm/%F0%9F%8C%A6" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-900">
        <main class="flex h-screen flex-col items-center w-[400px] m-auto">
          <div id="container" class="mt-6 p-6">
            <h1 class="text-center text-9xl font-black" style="background: linear-gradient(to right, #E7FF52, #41FF54);-webkit-background-clip: text;-webkit-text-fill-color: transparent">Your Localish Weather</h1>
          </div>
          <div class="text-white rounded-md border-lime-400 border p-6 bg-slate-800">
          ${html_content}
          </div>
        </main>
      </body>`;

		return new Response(html, {
			headers: {
				'content-type': 'text/html;charset=UTF-8',
			},
		});
	},
};
