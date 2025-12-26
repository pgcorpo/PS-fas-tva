"use client";

import { Layout } from "@/components/Layout";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/queries/useGoals";

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();

  const activeGoals = goals.filter((g) => !g.is_deleted);

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
          <h2 className="text-2xl font-bold text-gray-900">Goals</h2>
          <button
            onClick={() => {
              const title = prompt("Goal title:");
              const year = prompt("Year:", new Date().getFullYear().toString());
              if (title && year) {
                createGoal.mutate({
                  title,
                  year: parseInt(year, 10),
                });
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Goal
          </button>
        </div>

        <div className="space-y-4">
          {activeGoals.map((goal) => (
            <div
              key={goal.id}
              className="p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  <p className="text-sm text-gray-600">{goal.year}</p>
                  {goal.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Delete this goal? Habits will not be deleted, but future links will be removed."
                      )
                    ) {
                      deleteGoal.mutate(goal.id);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeGoals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No goals yet.</p>
            <button
              onClick={() => {
                const title = prompt("Goal title:");
                const year = prompt("Year:", new Date().getFullYear().toString());
                if (title && year) {
                  createGoal.mutate({
                    title,
                    year: parseInt(year, 10),
                  });
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create your first goal
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
