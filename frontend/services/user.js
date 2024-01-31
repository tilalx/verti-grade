import API from "./config";

export const getAllUsers = async () => {
  try {
    const response = await API.get("/api/users/all");
    return response.data;
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}

export const getUserById = async (id) => {
  try {
    const response = await API.get(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

export const createUser = async (user) => {
  try {
    const userJSON = JSON.stringify(user);
    const bodyJson = JSON.parse(userJSON);
    const response = await API.post("/api/users/create", bodyJson);
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export const updateUser = async (user) => {
  try {
    const response = await API.put("/api/users/edit", user);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export const deleteUser = async (id) => {
  try {
    const response = await API.delete(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}