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

interface ApiResponse {
	data: {
		aqi: number;
		idx: number;
		attributions: {
			url: string;
			name: string;
			logo: string;
		}[];
		city: {
			geo: number[];
			name: string;
			url: string;
		};
		dominentpol: string;
		iaqi: {
			co?: {
				v: number;
			};
			h?: {
				v: number;
			};
			no2?: {
				v: number;
			};
			o3?: {
				v: number;
			};
			p?: {
				v: number;
			};
			pm10?: {
				v: number;
			};
			pm25?: {
				v: number;
			};
			so2?: {
				v: number;
			};
			t?: {
				v: number;
			};
			w?: {
				v: number;
			};
		};
		time: {
			s: string;
			tz: string;
			v: number;
		};
	};
}

function displayValueOrMessage(value: number | undefined, label: string) {
	if (value === undefined) {
		return `<p>${label}: Data not available.</p>`;
	} else {
		return `<p>${label}: ${value}.</p>`;
	}
}

const handler: ExportedHandler<Env> = {
	async fetch(request, env) {
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
		const content = await response.json() as ApiResponse;

		const country = request.cf?.country;
		let temperatureUnit = '°C';

		let html_content = `<p>You are located at: ${latitude},${longitude}.</p>`;
		html_content += `<p>Based off sensor data from <a class="underline decoration-lime-400" href="${content.data.city.url}">${content.data.city.name}</a>:</p>`;
		html_content += displayValueOrMessage(content.data.aqi, "The AQI level");
		html_content += displayValueOrMessage(content.data.iaqi.no2?.v, "The NO2 level");
		html_content += displayValueOrMessage(content.data.iaqi.o3?.v, "The O3 level");

		let temperatureMessage;
		if (content.data.iaqi.t?.v === undefined) {
			temperatureMessage = `<p>The temperature: Data not available.</p>`;
		} else {
			let temperature = content.data.iaqi.t.v;
			if (country === 'US' || country === 'BS' || country === 'KY' || country === 'PW') {
				temperature = temperature * 9 / 5 + 32;
				temperatureUnit = '°F';
			}
			const formattedTemperature = new Intl.NumberFormat('en-US', {
				style: 'decimal',
				maximumFractionDigits: 1
			}).format(temperature);
			temperatureMessage = `<p>The temperature is: ${formattedTemperature}${temperatureUnit}.</p>`;
		}

		html_content += temperatureMessage;

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

export default handler;
