import { defineQuery, useQuery } from "@pinia/colada";

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
