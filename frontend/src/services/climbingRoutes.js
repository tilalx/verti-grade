import API from "./config";

export const getAllClimbingRoutes = async () => {
  try {
    const response = await API.get("/api/climbingroute");
    return response.data;
  } catch (error) {
    console.error("Error getting climbing routes:", error);
    throw error;
  }
}

export const getClimbingRouteById = async (id) => {
  try {
    const response = await API.get(`/api/climbingroute/${id}`);
    return response;
  } catch (error) {
    console.error("Error getting climbing route:", error);
    throw error;
  }
}

export const createClimbingRoute = async (climbingRoute) => {
  try {
    const climbingRouteJSON = JSON.parse(climbingRoute);
    const response = await API.put("/api/climbingroute", climbingRouteJSON);
    return response.data;
  } catch (error) {
    console.error("Error creating climbing route:", error);
    throw error;
  }
}

export const updateClimbingRoute = async (climbingRoute) => {
  try {
    const response = await API.post("/api/climbingroute", climbingRoute);
    return response.data;
  } catch (error) {
    console.error("Error updating climbing route:", error);
    throw error;
  }
}

export const deleteClimbingRoute = async (id) => {
  try {
    const response = await API.delete(`/api/climbingroute/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting climbing route:", error);
    throw error;
  }
}

export const printClimbingRoute = async (id) => {
  try {
    const response = await API.get(`/api/climbingroute/${id}/pdf`, 
      { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
    return response.data;
  } catch (error) {
    console.error("Error printing climbing route:", error);
    throw error;
  }
}

export const getAllCreators = async () => {
  try {
    const response = await API.get("/api/climbingroute/creators");
    return response.data;
  } catch (error) {
    console.error("Error getting creators:", error);
    throw error;
  }
}