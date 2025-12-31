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
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading your habits...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">Your Habits</h1>
          <p className="text-lg text-gray-600">Build consistent habits to achieve your goals</p>
        </div>

        {/* Add Habit Button */}
        <button
          onClick={() => handleOpenModal()}
          className="mb-10 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          + Add a new habit
        </button>

        {activeHabits.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-pink-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-pink-500"
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
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No habits yet</h3>
              <p className="text-gray-600 mb-8">Create your first habit and start tracking your progress</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Create your first habit
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeHabits.map((habit) => {
              const latestVersion = habit.versions[0];
              const linkedGoal = activeGoals.find(g => g.id === latestVersion?.linked_goal_id);

              return (
                <div
                  key={habit.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{habit.name}</h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-pink-500"
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
                        </div>
                        <span className="text-gray-700">
                          {latestVersion?.weekly_target || 0} times per week
                        </span>
                      </div>

                      {latestVersion?.requires_text_on_completion && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-purple-500"
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
                          </div>
                          <span className="text-gray-700">Notes required</span>
                        </div>
                      )}

                      {linkedGoal && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-green-500"
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
                          </div>
                          <span className="text-gray-700 truncate">{linkedGoal.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleOpenModal(habit)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white rounded-xl transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-white rounded-xl transition-colors duration-200"
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
                className="fixed inset-0 bg-black bg-opacity-40 transition-opacity backdrop-blur-sm"
                onClick={handleCloseModal}
              />

              {/* Modal Content */}
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-semibold text-gray-900">
                    {editingHabit ? "Edit habit" : "Create a habit"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                        Habit name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-base"
                        placeholder="Morning run, Read for 30 min..."
                      />
                    </div>

                    <div>
                      <label htmlFor="weekly_target" className="block text-sm font-semibold text-gray-900 mb-2">
                        Weekly target
                      </label>
                      <input
                        type="number"
                        id="weekly_target"
                        required
                        min={1}
                        max={7}
                        value={formData.weekly_target}
                        onChange={(e) => setFormData({ ...formData, weekly_target: parseInt(e.target.value) })}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-base"
                      />
                      <p className="mt-2 text-sm text-gray-500">How many times per week? (1-7)</p>
                    </div>

                    <div>
                      <label htmlFor="linked_goal" className="block text-sm font-semibold text-gray-900 mb-2">
                        Linked goal <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <select
                        id="linked_goal"
                        value={formData.linked_goal_id || ""}
                        onChange={(e) => setFormData({ ...formData, linked_goal_id: e.target.value || null })}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-base"
                      >
                        <option value="">No goal</option>
                        {activeGoals.map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title} ({goal.year})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="requires_text"
                        checked={formData.requires_text_on_completion}
                        onChange={(e) => setFormData({ ...formData, requires_text_on_completion: e.target.checked })}
                        className="mt-0.5 h-5 w-5 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requires_text" className="text-sm text-gray-700 leading-relaxed">
                        Require notes when completing this habit
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createHabit.isPending || updateHabit.isPending}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {createHabit.isPending || updateHabit.isPending ? "Saving..." : editingHabit ? "Save changes" : "Create habit"}
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
