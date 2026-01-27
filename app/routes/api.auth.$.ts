import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { auth } from "@/lib/auth.server";

// This route acts as a proxy for Better Auth
// It handles all /api/auth/* requests

export async function loader({ request }: LoaderFunctionArgs) {
    return auth.handler(request);
}

export async function action({ request }: ActionFunctionArgs) {
    return auth.handler(request);
}
