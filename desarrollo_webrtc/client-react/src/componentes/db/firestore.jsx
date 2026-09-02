import { db } from "./Config";

export const useFirestore = () => {

const addTask = async (data) => {
const taskExists = await db.collection('tasks').where('task', '==', data.task).get();
if (taskExists.docs.length > 0) {
throw new Error('Task already exists! Please choose another name.');
}
const response = await db.collection('tasks').add(data);
return response;
}

const getTasks = async (uid) => {
const data = await db.collection('tasks').where('uid', '==', uid).get();
return data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
}

const updateTask = async (id, data) => {
const response = await db.collection('tasks').doc(id).update(data);
return response;
}

const deleteTask = async (id) => {
const response = await db.collection('tasks').doc(id).delete();
return response;
}

return { getTasks, addTask, updateTask, deleteTask };

}