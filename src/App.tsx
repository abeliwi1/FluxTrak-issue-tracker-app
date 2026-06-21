import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { useBoardStore } from "@/store/board-store";
import { useFilteredIssueList } from "@/hooks/use-board-filters";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";

const BacklogView: React.FC = () => {
  const issues = useFilteredIssueList();
  const users = useBoardStore((s) => s.users);
  const selectIssue = useBoardStore((s) => s.selectIssue);

  return (
    <div className="px-5 py-4 max-w-4xl">
      <div className="space-y-0.5">
        {issues.map((issue) => {
          const assignee = issue.assigneeId ? users[issue.assigneeId] : undefined;
          return (
            <button
              key={issue.id}
              onClick={() => selectIssue(issue.id)}
              className="
                w-full flex items-center gap-3 px-3 py-2 rounded-md
                hover:bg-[var(--bg-elevated)] transition-colors text-left
                border-b border-[var(--border)] last:border-0
              "
            >
              <StatusBadge status={issue.status} />
              <span className="text-[11px] font-mono text-[var(--text-muted)] w-12 flex-shrink-0">
                {issue.key}
              </span>
              <PriorityIcon priority={issue.priority} />
              <span className="text-sm text-[var(--text-primary)] truncate flex-1">
                {issue.title}
              </span>
              {assignee && <Avatar user={assignee} size="xs" />}
            </button>
          );
        })}

        {issues.length === 0 && (
          <p className="text-center text-sm text-[var(--text-muted)] py-12">
            No issues match your filters.
          </p>
        )}
      </div>
    </div>
  );
};



const App: React.FC = () => {
  const activeView = useBoardStore((s) => s.activeView);

  return (
    <AppShell>
      {activeView === "board" && <KanbanBoard />}
      {activeView === "backlog" && <BacklogView />}
      {activeView === "all-issues" && <BacklogView />}
    </AppShell>
  );
};

export default App;