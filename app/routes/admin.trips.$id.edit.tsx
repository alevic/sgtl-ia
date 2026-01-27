import { redirect } from "react-router";
import NewTripPage, { loader as tripLoader, action as tripAction } from "./admin.trips.new";

export const loader = tripLoader;
export const action = tripAction;
export default NewTripPage;
