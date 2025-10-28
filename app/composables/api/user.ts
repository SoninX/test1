import type { User } from "~/stores/users";

// Function to fetch user list data
const getUserListData = async () => {
  const { $apiv1 } = useNuxtApp();
  const data = await $apiv1("/users", { method: "GET" });
  return data as User[];
};

const userListQuery = defineQuery(() => {
  const userList = useQuery<User[]>({
    key: ["usersList"],
    query: getUserListData,
  });
  return { userList };
});

export { getUserListData, userListQuery };
