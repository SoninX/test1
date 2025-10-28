import { useQuery, type UseQueryReturn } from "@pinia/colada";

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

export const useUsersStore = defineStore("users", () => {
  const { $apiv1 } = useNuxtApp();

  // Getters
  // Get user by id from users list
  const getUserById = (id: number): ComputedRef<User | undefined> => {
    return computed(() => {
      return getUserListQuery().data?.value?.find((user) => user.id === id);
    });
  };

  //Actions
  // get userList query
  const getUserListQuery = (): UseQueryReturn<User[]> => {
    return useQuery({
      key: ["usersList"],
      query: () => $apiv1("/users", { method: "GET" }),
    });
  };

  // update user query
  // const updateUserQuery = () => {
  //   return useMutation<User>({
  //     key: ["usersList", id],
  //     mutation: () => $apiv1(`/users/${id}`, { method: "PATCH", body: data }),
  //   });
  // };

  return {
    getUserListQuery,
    getUserById,
    // updateUserQuery,
  };
});
