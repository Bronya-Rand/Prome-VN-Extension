import { getRequestHeaders } from "../../../../../script.js";

export async function classifyLocal(text) {
	try {
		const response = await fetch("/api/extra/classify", {
			method: "POST",
			headers: getRequestHeaders(),
			body: JSON.stringify({ text }),
		});

		if (response.ok) {
			const data = await response.json();
			return data.classification?.[0]?.label ?? null;
		}

		return null;
	} catch (error) {
		toastr.error(
			"Could not classify expression. Check the console or your backend for more information.",
		);
		console.error(error);
		return null;
	}
}
