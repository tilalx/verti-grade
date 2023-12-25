import API from "./config";

export const getAllRouteRatings = async () => {
  try {
    const response = await API.get("/api/routeRating");
    return response.data;
  } catch (error) {
    console.error("Error getting route ratings:", error);
    throw error;
  }
}

export const getRouteRatingsByClimbingRouteId = async (id) => {
  try {
    const response = await API.get(`/api/routeRating/climbingRoute/${id}`);
    return response;
  } catch (error) {
    console.error("Error getting route ratings:", error);
    throw error;
  }

}

export const getRouteRatingById = async (id) => {
  try {
    const response = await API.get(`/api/routeRating/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error getting route rating:", error);
    throw error;
  }
}

export const createRouteRating = async (routeRating) => {
  try {
    const response = await API.put("/api/routeRating", routeRating);
    return response.data;
  } catch (error) {
    console.error("Error creating route rating:", error);
    throw error;
  }
}

export const deleteRouteRating = async (id) => {
  try {
    const response = await API.delete(`/api/routeRating/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting route rating:", error);
    throw error;
  }
}