import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Issue } from "@/types";
import { useBoardStore } from "@/store/board-store";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "lucide-react";

interface IssueCardProps {
    issue: Issue;
    /** When true, renders a static, non-interactive "lifted" preview for DragOverlay */
    isOverlay?: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, isOverlay = false }) => {
    const assignee = useBoardStore((s) =>
        issue.assigneeId ? s.users[issue.assigneeId] : undefined
    );
    const labelsMap = useBoardStore((s) => s.labels);
    const labels = issue.labelIds.map((id) => labelsMap[id]).filter(Boolean);
    const selectIssue = useBoardStore((s) => s.selectIssue);
    const toggleLabelFilter = useBoardStore((s) => s.toggleLabelFilter);
    const activeFilters = useBoardStore((s) => s.filters.labelIds);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: issue.id,
        data: { type: "issue", issue },
        disabled: isOverlay,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={isOverlay ? undefined : style}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
            onClick={() => !isOverlay && selectIssue(issue.id)}
            className={`
        group relative bg-[var(--bg-elevated)] border border-[var(--border)]
        rounded-lg p-3 cursor-grab active:cursor-grabbing
        transition-all duration-150
        ${isDragging ? "opacity-30" : "opacity-100"}
        ${isOverlay
                    ? "shadow-2xl shadow-black/60 border-indigo-500/50 rotate-2 cursor-grabbing"
                    : "hover:border-[var(--text-muted)] hover:shadow-md hover:shadow-black/20"
                }
      `}
        >
            {/* Key + priority row */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-medium text-[var(--text-muted)]">
                    {issue.key}
                </span>
                <PriorityIcon priority={issue.priority} />
            </div>

            {/* Title */}
            <p className="text-[13px] leading-snug text-[var(--text-primary)] font-medium mb-2.5 line-clamp-2">
                {issue.title}
            </p>

            {/* Labels */}
            {labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2.5">
                    {labels.slice(0, 3).map((label) => (
                        <button
                            key={label.id}
                            onClick={(e) => {
                                e.stopPropagation(); // prevent card click opening detail modal
                                toggleLabelFilter(label.id);
                            }}
                            title={`Filter by ${label.name}`}
                            className="
                                inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                                text-[10px] font-medium transition-all
                                hover:ring-1 hover:ring-current cursor-pointer
                            "
                            style={{
                                backgroundColor: activeFilters.includes(label.id)
                                    ? `${label.color}40`
                                    : `${label.color}1a`,
                                color: label.color,
                                boxShadow: activeFilters.includes(label.id)
                                    ? `0 0 0 1px ${label.color}`
                                    : undefined,
                            }}
                        >
                            <Tag className="w-2.5 h-2.5" />
                            {label.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Footer: story points + assignee */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                    {issue.storyPoints !== null && (
                        <span
                            className="
                flex items-center justify-center
                w-5 h-5 rounded text-[10px] font-semibold
                bg-[var(--bg-hover)] text-[var(--text-secondary)]
              "
                        >
                            {issue.storyPoints}
                        </span>
                    )}
                    {issue.dueDate && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(issue.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    )}
                </div>

                {assignee ? (
                    <Avatar user={assignee} size="xs" />
                ) : (
                    <div
                        className="
              w-5 h-5 rounded-full border border-dashed
              border-[var(--text-muted)] opacity-50
            "
                    />
                )}
            </div>
        </div>
    );
};