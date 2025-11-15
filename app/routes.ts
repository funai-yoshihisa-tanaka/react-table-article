import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/form", "routes/form.tsx"),
  route("/table", "routes/table.tsx"),
  route("/paginated-table", "routes/paginated-table.tsx"),
] satisfies RouteConfig;
