export interface Env {
	WEATHER_TOKEN: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		let endpoint = 'https://api.waqi.info/feed/geo:';
		const token = env.WEATHER_TOKEN; //Use a token from https://aqicn.org/api/

		const latitude = request.cf?.latitude;
		const longitude = request.cf?.longitude;
		endpoint += `${latitude};${longitude}/?token=${token}`;
		const init = {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};

		const response = await fetch(endpoint, init);
		const content: object = await response.json();

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
        <main class="flex  flex-col items-center w-[400px] m-auto">
          <div id="container" class="mt-6 p-6">
            <h1 class="text-center text-9xl font-black" style="background: linear-gradient(to right, #E7FF52, #41FF54);-webkit-background-clip: text;-webkit-text-fill-color: transparent">Your Localish Weather</h1>
          </div>
          <div class="text-white rounded-md border-lime-400 border p-6 bg-slate-800">
          ${html_content}
          </div>
        </main>
		<footer class="text-center">
			<p class="pt-8 text-white">Made with ❤️ by <a href="https://twitter.com/GSVarner">Gary Varner</a></p>
		</footer>
      </body>`;

		return new Response(html, {
			headers: {
				'content-type': 'text/html;charset=UTF-8',
			},
		});
	},
};
