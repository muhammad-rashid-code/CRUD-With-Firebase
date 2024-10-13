"use client";

import { db } from "@/firebase/1-firebase-config";
import { collection, doc, setDoc } from "firebase/firestore";
import { useState } from "react";

type TodoType = { todo: string; todoID: string };

export default function Home() {
  const [todo, setTodo] = useState<string>("");
  const [error, setError] = useState<string>("");

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
      await setDoc(docRef, { todo, todoID });
      setTodo("");
    } catch (e) {
      console.error(e);
      setError("Failed to create todo. Please try again.");
    }
  };

  return (
    <>
      <label htmlFor="todo">What's Todo </label>
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
      />
      <button onClick={createTodo}>Create</button>
      {error && <span style={{ color: "red", display: "block" }}>{error}</span>}
    </>
  );
}
