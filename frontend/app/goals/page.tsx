"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/queries/useGoals";

interface GoalFormData {
  title: string;
  year: number;
  description: string;
}

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ id: string; title: string; year: number; description: string | null } | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    year: new Date().getFullYear(),
    description: "",
  });

  const activeGoals = goals.filter((g) => !g.is_deleted);

  const handleOpenModal = (goal?: typeof activeGoals[0]) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        year: goal.year,
        description: goal.description || "",
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: "",
        year: new Date().getFullYear(),
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({
          goalId: editingGoal.id,
          data: {
            title: formData.title,
            year: formData.year,
            description: formData.description || null,
          },
        });
      } else {
        await createGoal.mutateAsync({
          title: formData.title,
          year: formData.year,
          description: formData.description || null,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save goal:", error);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (confirm("Delete this goal? Habits will not be deleted, but future links will be removed.")) {
      try {
        await deleteGoal.mutateAsync(goalId);
      } catch (error) {
        console.error("Failed to delete goal:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading your goals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">Your Goals</h1>
          <p className="text-lg text-gray-600">Define your annual goals and link habits to achieve them</p>
        </div>

        {/* Add Goal Button */}
        <button
          onClick={() => handleOpenModal()}
          className="mb-10 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          + Add a new goal
        </button>

        {activeGoals.length === 0 ? (
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No goals yet</h3>
              <p className="text-gray-600 mb-8">Start your journey by creating your first goal</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Create your first goal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-semibold text-gray-900">{goal.title}</h3>
                      <span className="px-4 py-1.5 text-sm font-semibold bg-pink-50 text-pink-600 rounded-full">
                        {goal.year}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-gray-600 leading-relaxed">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-3 ml-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleOpenModal(goal)}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                    {editingGoal ? "Edit goal" : "Create a goal"}
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
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                        Goal title
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-base"
                        placeholder="Run a marathon, Learn Spanish..."
                      />
                    </div>

                    <div>
                      <label htmlFor="year" className="block text-sm font-semibold text-gray-900 mb-2">
                        Year
                      </label>
                      <input
                        type="number"
                        id="year"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-base"
                        min={2020}
                        max={2100}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                        Description <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-base resize-none"
                        rows={4}
                        placeholder="Add details about what you want to achieve..."
                      />
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
                      disabled={createGoal.isPending || updateGoal.isPending}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {createGoal.isPending || updateGoal.isPending ? "Saving..." : editingGoal ? "Save changes" : "Create goal"}
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
