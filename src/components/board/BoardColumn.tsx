import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { BoardColumn as BoardColumnType, IssueStatus } from "@/types";
import { useBoardStore } from "@/store/board-store";
import { IssueCard } from "./IssueCard";
import { STATUS_CONFIG } from "@/components/ui/StatusBadge";

interface BoardColumnProps {
    column: BoardColumnType;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ column }) => {
    const issues = useBoardStore((s) => s.issues);
    const openModal = useBoardStore((s) => s.openCreateModal);

    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        data: { type: "column", status: column.id },
    });

    const config = STATUS_CONFIG[column.id];
    const Icon = config.icon;

    const columnIssues = column.issueIds
        .map((id) => issues[id])
        .filter((issue): issue is NonNullable<typeof issue> => Boolean(issue));

    return (
        <div className="flex flex-col w-72 flex-shrink-0 h-full">
            {/* Column header */}
            <div className="flex items-center gap-2 px-1 py-2.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${config.color}`} strokeWidth={2} />
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                    {column.title}
                </h3>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                    {columnIssues.length}
                </span>
                <button
                    onClick={openModal}
                    className="
            ml-auto p-1 rounded-md text-[var(--text-muted)]
            hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]
            transition-colors
          "
                    title={`New issue in ${column.title}`}
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Droppable area */}
            <div
                ref={setNodeRef}
                className={`
          flex-1 overflow-y-auto px-1 pb-3 rounded-lg
          transition-colors duration-150
          ${isOver ? "bg-[var(--accent-subtle)]/30" : ""}
        `}
            >
                <SortableContext
                    items={column.issueIds}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2 min-h-[40px]">
                        {columnIssues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}

                        {/* Empty state */}
                        {columnIssues.length === 0 && (
                            <div
                                className="
                  flex items-center justify-center h-20 rounded-lg
                  border border-dashed border-[var(--border)]
                  text-[11px] text-[var(--text-muted)]
                "
                            >
                                Drop issues here
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};