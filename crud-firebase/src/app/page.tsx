"use client";

import { db } from "@/firebase/1-firebase-config";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

// Define the TodoType with proper typing for the timestamp
type TodoType = { todo: string; todoID: string; createdAt: Timestamp };

export default function Home() {
  const [todo, setTodo] = useState<string>(""); // State for the current todo input
  const [todos, setTodos] = useState<TodoType[]>([]); // State to hold all todos
  const [error, setError] = useState<string>(""); // Error message state
  const [editTodoID, setEditTodoID] = useState<string | null>(null); // State for the ID of the todo being edited

  // Fetch todos from Firestore and update the state
  useEffect(() => {
    const collectionRef = collection(db, "todos");

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const todosData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        todoID: doc.id,
      })) as TodoType[];

      // Sort todos by creation timestamp in ascending order (FIFO)
      const sortedTodos = todosData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return aTime - bTime;
      });

      setTodos(sortedTodos); // Update todos state
    });

    return () => unsubscribe(); // Cleanup Firestore subscription
  }, []);

  // Function to create a new todo
  const createTodo = async () => {
    if (!todo.trim()) {
      setError("Please enter a todo.");
      return;
    }
    if (todo.trim().length <= 3) {
      setError("Todo must be longer than 3 characters.");
      return;
    }

    setError(""); // Clear any existing error messages

    try {
      const collectionRef = collection(db, "todos");
      const todoID = doc(collectionRef).id; // Generate a unique ID for the todo
      const docRef = doc(collectionRef, todoID);

      await setDoc(docRef, {
        todo,
        todoID,
        createdAt: serverTimestamp(), // Store the current server timestamp
      });

      setTodo(""); // Clear the input field
    } catch (e) {
      console.error(e);
      setError("Failed to create todo. Please try again.");
    }
  };

  // Function to handle editing an existing todo
  const editTodo = (id: string, currentTodo: string) => {
    setTodo(currentTodo); // Set the current todo text in the input field for editing
    setEditTodoID(id); // Store the ID of the todo being edited
  };

  // Function to update an existing todo
  const updateTodo = async () => {
    if (!todo.trim()) {
      setError("Please enter a todo.");
      return;
    }
    if (todo.trim().length <= 3) {
      setError("Todo must be longer than 3 characters.");
      return;
    }

    setError(""); // Clear any existing error messages

    try {
      const docRef = doc(db, "todos", editTodoID as string);
      await setDoc(docRef, {
        todo,
        todoID: editTodoID,
        createdAt: serverTimestamp(), // Update the timestamp
      });

      setTodo(""); // Clear the input field
      setEditTodoID(null); // Exit editing mode
    } catch (e) {
      console.error(e);
      setError("Failed to update todo. Please try again.");
    }
  };

  // Function to delete a todo
  const deleteTodo = async (id: string) => {
    try {
      const docRef = doc(db, "todos", id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error(e);
      setError("Failed to delete todo. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1>Welcome</h1>
      <label htmlFor="todo" className="mb-2 text-lg font-medium">
        What&apos;s Todo
      </label>

      {/* Input field for entering todos */}
      <input
        type="text"
        id="todo"
        value={todo}
        onChange={(e) => {
          const value = e.target.value;
          setTodo(value);
          if (!value.trim()) {
            setError("Please enter a todo.");
          } else if (value.trim().length <= 3) {
            setError("Todo must be longer than 3 characters.");
          } else {
            setError(""); // Clear error if input is valid
          }
        }}
        className={`w-full max-w-md p-2 mb-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />

      {/* Button to create or update a todo */}
      <button
        onClick={editTodoID ? updateTodo : createTodo}
        className="w-full max-w-md px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {editTodoID ? "Update" : "Create"}
      </button>

      {/* Error message display */}
      {error && (
        <div className="mt-2 w-full max-w-md p-2 bg-red-100 border border-red-400 rounded text-red-500">
          {error}
        </div>
      )}

      {/* Display the list of todos */}
      <div className="w-full max-w-md mt-4 h-[300px] overflow-y-auto border border-gray-300 rounded">
        <ul>
          {todos.map((todo) => (
            <li
              key={todo.todoID}
              className="flex justify-between items-center p-2 bg-white border-b border-gray-200"
            >
              <div>
                <span>{todo.todo}</span>
                <span className="text-gray-500 text-xs block">
                  {todo.createdAt?.toDate().toLocaleString() || "Loading..."}
                </span>
              </div>
              <div>
                <button
                  onClick={() => editTodo(todo.todoID, todo.todo)}
                  className="px-2 py-1 text-sm text-blue-500 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTodo(todo.todoID)}
                  className="px-2 py-1 text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
