// services/user.js
const supabase = useSupabaseClient();

export async function getAllUsers() {
  let { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) throw new Error(error.message);
  return data;
}

export async function createUser(user) {
  const { data, error } = await supabase
    .from('users')
    .insert([user]);

  if (error) throw new Error(error.message);
  return data;
}

export async function updateUser(user) {
  const { data, error } = await supabase
    .from('users')
    .update(user)
    .match({ id: user.id });  // Assuming 'id' is the primary key

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .match({ id: userId });

  if (error) throw new Error(error.message);
  return data;
}
