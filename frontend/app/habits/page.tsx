"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from "@/hooks/queries/useHabits";
import { useGoals } from "@/hooks/queries/useGoals";

interface HabitFormData {
  name: string;
  weekly_target: number;
  requires_text_on_completion: boolean;
  linked_goal_id: string | null;
}

export default function HabitsPage() {
  const { data: habits = [], isLoading } = useHabits();
  const { data: goals = [] } = useGoals();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<typeof activeHabits[0] | null>(null);
  const [formData, setFormData] = useState<HabitFormData>({
    name: "",
    weekly_target: 3,
    requires_text_on_completion: false,
    linked_goal_id: null,
  });

  const activeHabits = habits.filter((h) => !h.is_deleted);
  const activeGoals = goals.filter((g) => !g.is_deleted);

  const handleOpenModal = (habit?: typeof activeHabits[0]) => {
    if (habit) {
      const latestVersion = habit.versions[0];
      setEditingHabit(habit);
      setFormData({
        name: habit.name,
        weekly_target: latestVersion?.weekly_target || 3,
        requires_text_on_completion: latestVersion?.requires_text_on_completion || false,
        linked_goal_id: latestVersion?.linked_goal_id || null,
      });
    } else {
      setEditingHabit(null);
      setFormData({
        name: "",
        weekly_target: 3,
        requires_text_on_completion: false,
        linked_goal_id: null,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingHabit) {
        await updateHabit.mutateAsync({
          habitId: editingHabit.id,
          data: formData,
        });
      } else {
        await createHabit.mutateAsync(formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save habit:", error);
    }
  };

  const handleDelete = async (habitId: string) => {
    if (confirm("Delete this habit? Historical data will be preserved.")) {
      try {
        await deleteHabit.mutateAsync(habitId);
      } catch (error) {
        console.error("Failed to delete habit:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading habits...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Habits</h1>
            <p className="text-gray-600 mt-1">Track your weekly habits and link them to goals</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + New Habit
          </button>
        </div>

        {activeHabits.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No habits yet</h3>
            <p className="mt-2 text-gray-600">Create your first habit to start tracking</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeHabits.map((habit) => {
              const latestVersion = habit.versions[0];
              const linkedGoal = activeGoals.find(g => g.id === latestVersion?.linked_goal_id);

              return (
                <div
                  key={habit.id}
                  className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{habit.name}</h3>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {latestVersion?.weekly_target || 0} times per week
                      </span>
                    </div>

                    {latestVersion?.requires_text_on_completion && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">Notes required</span>
                      </div>
                    )}

                    {linkedGoal && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{linkedGoal.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenModal(habit)}
                      className="flex-1 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="flex-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleCloseModal}
              />

              {/* Modal Content */}
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingHabit ? "Edit Habit" : "New Habit"}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Habit Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Morning run"
                      />
                    </div>

                    <div>
                      <label htmlFor="weekly_target" className="block text-sm font-medium text-gray-700 mb-1">
                        Weekly Target *
                      </label>
                      <input
                        type="number"
                        id="weekly_target"
                        required
                        min={1}
                        max={7}
                        value={formData.weekly_target}
                        onChange={(e) => setFormData({ ...formData, weekly_target: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">How many times per week? (1-7)</p>
                    </div>

                    <div>
                      <label htmlFor="linked_goal" className="block text-sm font-medium text-gray-700 mb-1">
                        Linked Goal (optional)
                      </label>
                      <select
                        id="linked_goal"
                        value={formData.linked_goal_id || ""}
                        onChange={(e) => setFormData({ ...formData, linked_goal_id: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No goal</option>
                        {activeGoals.map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title} ({goal.year})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="requires_text"
                        checked={formData.requires_text_on_completion}
                        onChange={(e) => setFormData({ ...formData, requires_text_on_completion: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requires_text" className="ml-2 block text-sm text-gray-700">
                        Require notes when completing this habit
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createHabit.isPending || updateHabit.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createHabit.isPending || updateHabit.isPending ? "Saving..." : "Save Habit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
