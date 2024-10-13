"use client";

import { db } from "@/firebase/1-firebase-config";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

type TodoType = { todo: string; todoID: string; createdAt: any };

export default function Home() {
  const [todo, setTodo] = useState<string>("");
  const [todos, setTodos] = useState<TodoType[]>([]);
  const [error, setError] = useState<string>("");
  const [editTodoID, setEditTodoID] = useState<string | null>(null);

  useEffect(() => {
    const collectionRef = collection(db, "todos");
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const todosData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        todoID: doc.id,
      })) as TodoType[];

      // Sort todos by createdAt timestamp (FIFO: oldest first)
      const sortedTodos = todosData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0; // Firebase timestamp seconds
        const bTime = b.createdAt?.seconds || 0; // Firebase timestamp seconds
        return aTime - bTime; // Ascending order
      });

      setTodos(sortedTodos);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const createTodo = async () => {
    if (!todo.trim()) {
      setError("Please enter a todo.");
      return;
    }
    if (todo.trim().length <= 3) {
      setError("Todo must be longer than 3 characters.");
      return;
    }

    setError(""); // Clear error if input is valid

    try {
      const collectionRef = collection(db, "todos");
      const todoID = doc(collectionRef).id;
      const docRef = doc(collectionRef, todoID);
      await setDoc(docRef, { todo, todoID, createdAt: serverTimestamp() }); // Add timestamp
      setTodo("");
    } catch (e) {
      console.error(e);
      setError("Failed to create todo. Please try again.");
    }
  };

  const editTodo = async (id: string, currentTodo: string) => {
    setTodo(currentTodo); // Set current todo text in input for editing
    setEditTodoID(id); // Store the ID of the todo being edited
  };

  const updateTodo = async () => {
    if (!todo.trim()) {
      setError("Please enter a todo.");
      return;
    }
    if (todo.trim().length <= 3) {
      setError("Todo must be longer than 3 characters.");
      return;
    }

    setError(""); // Clear error if input is valid

    try {
      const docRef = doc(db, "todos", editTodoID as string);
      await setDoc(docRef, {
        todo,
        todoID: editTodoID,
        createdAt: serverTimestamp(),
      }); // Update timestamp
      setTodo("");
      setEditTodoID(null); // Clear the editing state
    } catch (e) {
      console.error(e);
      setError("Failed to update todo. Please try again.");
    }
  };

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
      <label htmlFor="todo" className="mb-2 text-lg font-medium">
        What's Todo
      </label>
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
      <button
        onClick={editTodoID ? updateTodo : createTodo}
        className="w-full max-w-md px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {editTodoID ? "Update" : "Create"}
      </button>

      {/* Enhanced Error Message */}
      {error && (
        <div className="flex items-center mt-2 text-red-500 bg-red-100 border border-red-400 rounded p-2 transition duration-300 ease-in-out">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Scrollable Todo List Container */}
      <div
        className="w-full max-w-md mt-4 overflow-y-auto border border-gray-300 rounded"
        style={{ maxHeight: "300px" }}
      >
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
