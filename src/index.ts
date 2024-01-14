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

		let html_content = `<div class="row-span-1 flex flex-col items-center rounded-xl border-2 bg-neutral-100 p-4">
			<div class="text-4xl font-bold">${latitude}, ${longitude}</div>
			<div><a class="underline decoration-lime-400" href="${content.data.city.url}">${content.data.city.name}</a></div>
		</div>`;
		html_content += `<div>
			<h1 class="text-center text-6xl font-black">
				Your Local<span
					style="background: linear-gradient(to right, #e7ff52, #41ff54); -webkit-background-clip: text; -webkit-text-fill-color: transparent"
				>ish</span
				>
				Weather
			</h1>
		</div>`;
		html_content += `<div class="row-span-1 flex items-end justify-end rounded-xl border-2 bg-neutral-100 p-4">
			<div class="p-2">
				<div class="text-7xl font-bold">${content.data.aqi}</div>
				<div class="text-right text-2xl font-medium">AQI</div>
			</div>
		</div>`;
		html_content += `<div class="row-span-1 rounded-xl border-2 bg-neutral-100 p-4"> ${content.data.iaqi.no2?.v || 0}</div>`;
		html_content += `<div class="row-span-1 rounded-xl border-2 bg-neutral-100 p-4">${content.data.iaqi.t?.v}°C</div>`;
		html_content += `<div class="row-span-1 rounded-xl border-2 bg-neutral-100 p-4">${content.data.iaqi.o3?.v || 0}</div>`;

		let html = `
      <!DOCTYPE html>
      <head>
        <title>Weather</title>
		<link rel="icon" href="https://fav.farm/%F0%9F%8C%A6" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen">
        <main class="flex justify-center m-auto">
          <div class="grid w-[800px] auto-cols-min auto-rows-[192px] grid-cols-3 gap-4 mt-6">
          ${html_content}
          </div>
        </main>
		<footer class="text-center">
			<p class="pt-8 text-black">Made with ❤️ by <a href="https://twitter.com/GSVarner">Gary Varner</a></p>
		</footer>
      </body>`;

		return new Response(html, {
			headers: {
				'content-type': 'text/html;charset=UTF-8',
			},
		});
	},
};
