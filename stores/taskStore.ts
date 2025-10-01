// src/stores/taskStore.ts

import { create } from 'zustand';

interface Task {
  id: string;
  title: string;
  notes?: string; // Add the notes field here
  date: string;
  time?: string;
  status: "new" | "old" | "upcoming";
}

type NewTask = {
    title: string;
    notes?: string; // Add the notes field here
    date: string;
    time?: string;
     media: any[];
}

interface TaskStore {
  tasks: Task[];
  addTask: (task: NewTask) => void;
}

const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (newTask) => set((state) => {
    const status = "new";
    const newId = (state.tasks.length + 1).toString();
    const taskToAdd: Task = { ...newTask, id: newId, status };
    return { tasks: [...state.tasks, taskToAdd] };
  }),
}));

export default useTaskStore;