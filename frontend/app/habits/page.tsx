"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from "@/hooks/queries/useHabits";
import { useGoals } from "@/hooks/queries/useGoals";

export default function HabitsPage() {
  const { data: habits = [], isLoading } = useHabits();
  const { data: goals = [] } = useGoals();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeHabits = habits.filter((h) => !h.is_deleted);

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Habits</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Habit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeHabits.map((habit) => {
            const latestVersion = habit.versions[0];
            return (
              <div
                key={habit.id}
                className="p-4 bg-white rounded-lg border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {habit.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {latestVersion?.weekly_target || 0}× / week
                </p>
                {latestVersion?.requires_text_on_completion && (
                  <p className="text-xs text-gray-500 mb-2">Text required</p>
                )}
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setEditingId(habit.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this habit? Historical data will be preserved.")) {
                        deleteHabit.mutate(habit.id);
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {activeHabits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No habits yet.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create your first habit
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
