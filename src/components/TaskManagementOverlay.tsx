import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Circle, Plus, Trash2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

interface TaskManagementOverlayProps {
  onClose: () => void;
  userData: any;
  auth: any;
  appId: string;
  db: any;
}

export function TaskManagementOverlay({ onClose, userData, auth, appId, db }: TaskManagementOverlayProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Load tasks from Firebase
  useEffect(() => {
    const loadTasks = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.tasks) {
            setTasks(data.tasks);
          }
        }
      } catch (err) {
        console.error("Error loading tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [auth, appId, db]);

  // Save tasks to Firebase whenever tasks state changes (and not loading)
  const saveTasks = async (updatedTasks: Task[]) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { tasks: updatedTasks });
    } catch (err) {
      console.error("Error saving tasks:", err);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: Date.now()
    };

    const newTasks = [newTask, ...tasks];
    setTasks(newTasks);
    setNewTaskTitle('');
    await saveTasks(newTasks);
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const deleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1f2937] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col max-h-[85vh]"
      >
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            My Tasks
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {/* Add Task Form */}
          <form onSubmit={addTask} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 opacity-50" />
              </div>
              <p>You don't have any tasks right now.</p>
              <p className="text-sm mt-1">Add a task above to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Tasks */}
              {activeTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">To Do ({activeTasks.length})</h3>
                  <div className="space-y-2">
                    {activeTasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={() => toggleTask(task.id)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Completed ({completedTasks.length})</h3>
                  <div className="space-y-2 opacity-75">
                    {completedTasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={() => toggleTask(task.id)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const TaskItem: React.FC<{ task: Task; onToggle: () => void | Promise<void>; onDelete: () => void | Promise<void> }> = ({ task, onToggle, onDelete }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition ${task.completed ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
      <button 
        onClick={onToggle}
        className="text-gray-400 hover:text-emerald-500 flex-shrink-0 transition"
      >
        {task.completed ? (
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>
      
      <div className={`flex-1 overflow-hidden text-ellipsis ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
        {task.title}
      </div>

      <button 
        onClick={onDelete}
        className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
