import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext
): Promise<Response> {
    const userAgent = request.headers.get("user-agent");
    const isBot = userAgent ? isbot(userAgent) : false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ABORT_DELAY);

    try {
        const stream = await renderToReadableStream(
            <ServerRouter context={routerContext} url={request.url} />,
            {
                signal: controller.signal,
                onError(error: unknown) {
                    console.error("SSR Error:", error);
                    responseStatusCode = 500;
                },
            }
        );

        if (isBot) {
            await stream.allReady;
        }

        responseHeaders.set("Content-Type", "text/html");

        return new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
        });
    } catch (error) {
        console.error("Render error:", error);
        return new Response("Internal Server Error", { status: 500 });
    } finally {
        clearTimeout(timeoutId);
    }
}
