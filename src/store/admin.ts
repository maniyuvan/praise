import { selectorFamily } from "recoil";
import { ApiAuthGetQuery } from ".";

export const AllUsersQuery = selectorFamily({
  key: "AllUsersQuery",
  get:
    (params: any) =>
    async ({ get }) => {
      const response = get(
        ApiAuthGetQuery({ endPoint: "/api/admin/users/all" })
      );
      return response?.data;
    },
});
