import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Trash2,
    MessageSquare,
    Clock,
    Tag,
    Send,
} from "lucide-react";
import { useBoardStore } from "@/store/board-store";
import { IssueStatus, IssuePriority, ActivityLogEntry } from "@/types";
import { PriorityIcon, PRIORITY_CONFIG } from "./PriorityIcon";
import { STATUS_CONFIG, StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";

const ACTIVITY_VERB: Record<ActivityLogEntry["action"], string> = {
    CREATED: "created this issue",
    STATUS_CHANGED: "changed status",
    PRIORITY_CHANGED: "changed priority",
    ASSIGNEE_CHANGED: "changed assignee",
    TITLE_CHANGED: "changed title",
    LABEL_ADDED: "added a label",
    LABEL_REMOVED: "removed a label",
};

function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatRelative(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

export const IssueDetailModal: React.FC = () => {
    const selectedIssueId = useBoardStore((s) => s.selectedIssueId);
    const selectIssue = useBoardStore((s) => s.selectIssue);
    const issue = useBoardStore((s) =>
        selectedIssueId ? s.issues[selectedIssueId] : undefined
    );
    const usersMap = useBoardStore((s) => s.users);
    const labelsMap = useBoardStore((s) => s.labels);
    const updateIssue = useBoardStore((s) => s.updateIssue);
    const deleteIssue = useBoardStore((s) => s.deleteIssue);
    const addComment = useBoardStore((s) => s.addComment);
    const getCommentsForIssue = useBoardStore((s) => s.getCommentsForIssue);
    const getActivityForIssue = useBoardStore((s) => s.getActivityForIssue);

    const [titleDraft, setTitleDraft] = useState("");
    const [descDraft, setDescDraft] = useState("");
    const [statusDraft, setStatusDraft] = useState<IssueStatus>(IssueStatus.TODO);
    const [priorityDraft, setPriorityDraft] = useState<IssuePriority>(IssuePriority.MEDIUM);
    const [assigneeDraft, setAssigneeDraft] = useState<string>("");
    const [commentDraft, setCommentDraft] = useState("");
    const [tab, setTab] = useState<"comments" | "activity">("comments");
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const titleRef = useRef<HTMLTextAreaElement>(null);


    // ── Dirty check — must come BEFORE useEffects that reference it ──
    const isDirty = !!issue && (
        titleDraft.trim() !== issue.title ||
        descDraft.trim() !== (issue.description ?? "") ||
        statusDraft !== issue.status ||
        priorityDraft !== issue.priority ||
        assigneeDraft !== (issue.assigneeId ?? "")
    );

    // Sync local drafts whenever a new issue is opened
    useEffect(() => {
        if (issue) {
            setTitleDraft(issue.title);
            setDescDraft(issue.description ?? "");
            setStatusDraft(issue.status);
            setPriorityDraft(issue.priority);
            setAssigneeDraft(issue.assigneeId ?? "");
            setConfirmingDelete(false);
            setTab("comments");
        }
    }, [issue?.id]);

    // ── Escape to close ──────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [selectIssue, isDirty]);

    if (!issue) return null; // return  guard

    const assignee = issue.assigneeId ? usersMap[issue.assigneeId] : undefined;
    const reporter = usersMap[issue.reporterId];
    const labels = issue.labelIds.map((id) => labelsMap[id]).filter(Boolean);
    const comments = getCommentsForIssue(issue.id);
    const activity = getActivityForIssue(issue.id);

    // OLD EDITING LOGIC
    // const commitTitle = () => {
    //     const trimmed = titleDraft.trim();
    //     if (trimmed && trimmed !== issue.title) {
    //         updateIssue({ id: issue.id, title: trimmed });
    //     } else {
    //         setTitleDraft(issue.title);
    //     }
    // };

    // const commitDescription = () => {
    //     const trimmed = descDraft.trim();
    //     if (trimmed !== (issue.description ?? "")) {
    //         updateIssue({ id: issue.id, description: trimmed || null });
    //     }
    // };

    const handleSave = () => {
        const trimmedTitle = titleDraft.trim();
        updateIssue({
            id: issue.id,
            title: trimmedTitle || issue.title,
            description: descDraft.trim() || null,
            status: statusDraft,
            priority: priorityDraft,
            assigneeId: assigneeDraft || null,
        });
    };

    const handleCancel = () => {
        setTitleDraft(issue.title);
        setDescDraft(issue.description ?? "");
        setStatusDraft(issue.status);
        setPriorityDraft(issue.priority);
        setAssigneeDraft(issue.assigneeId ?? "");
    };

    const handleAddComment = () => {
        const trimmed = commentDraft.trim();
        if (!trimmed) return;
        addComment({ issueId: issue.id, authorId: "usr_1", body: trimmed });
        setCommentDraft("");
    };

    const handleDelete = () => {
        if (!confirmingDelete) {
            setConfirmingDelete(true);
            return;
        }
        deleteIssue(issue.id);
        selectIssue(null);
    };

    const handleClose = () => {
        if (isDirty) {
            const confirmClose = window.confirm("You have unsaved changes. Discard them?");
            if (!confirmClose) return;
        }
        selectIssue(null);
    };

    const statuses = Object.values(IssueStatus);
    const priorities = Object.values(IssuePriority);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                /** close modal by click outside */
                onClick={handleClose}
            />

            <div
                className="
          relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col
          bg-[var(--bg-elevated)] border border-[var(--border)]
          rounded-xl shadow-2xl shadow-black/50
        "
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)] flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
                            {issue.key}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleDelete}
                            onBlur={() => setConfirmingDelete(false)}
                            className={`
                flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                transition-colors
                ${confirmingDelete
                                    ? "bg-red-600 text-white"
                                    : "text-[var(--text-muted)] hover:text-red-400 hover:bg-red-950/30"
                                }
              `}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {confirmingDelete ? "Confirm delete" : "Delete"}
                        </button>
                        <button
                            onClick={handleClose}
                            className="
                p-1.5 rounded-md text-[var(--text-muted)]
                hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]
                transition-colors
              "
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {/* Title — inline editable */}
                    <textarea
                        ref={titleRef}
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        rows={1}
                        className="
              w-full bg-transparent text-lg font-semibold text-[var(--text-primary)]
              border-none outline-none resize-none
              focus:bg-[var(--bg-hover)] rounded-md px-1 -mx-1 transition-colors
            "
                    />

                    {/* Description — inline editable */}
                    <textarea
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        placeholder="Add a description..."
                        rows={3}
                        className="
              w-full bg-transparent text-sm text-[var(--text-secondary)]
              placeholder:text-[var(--text-muted)]
              border-none outline-none resize-none
              focus:bg-[var(--bg-hover)] rounded-md px-1 -mx-1 transition-colors
            "
                    />

                    {/* Editable Metadata grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-3 border-y border-[var(--border)]">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-muted)]">Status</span>
                            <select
                                value={statusDraft}
                                onChange={(e) =>
                                    setStatusDraft(e.target.value as IssueStatus )
                                }
                                className="
                  text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)]
                  border border-[var(--border)] rounded-md px-2 py-1 outline-none
                  cursor-pointer hover:border-[var(--border-focus)] transition-colors
                "
                            >
                                {statuses.map((s) => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-muted)]">Priority</span>
                            <select
                                value={priorityDraft}
                                onChange={(e) =>
                                    setPriorityDraft( e.target.value as IssuePriority )
                                }
                                className="
                  text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)]
                  border border-[var(--border)] rounded-md px-2 py-1 outline-none
                  cursor-pointer hover:border-[var(--border-focus)] transition-colors
                "
                            >
                                {priorities.map((p) => (
                                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-muted)]">Assignee</span>
                            <select
                                value={assigneeDraft}
                                onChange={(e) =>
                                    setAssigneeDraft(e.target.value)
                                }
                                className="
                  text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)]
                  border border-[var(--border)] rounded-md px-2 py-1 outline-none
                  cursor-pointer hover:border-[var(--border-focus)] transition-colors
                "
                            >
                                <option value="">Unassigned</option>
                                {Object.values(usersMap).map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reporter (read-only) */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-muted)]">Reporter</span>
                            <div className="flex items-center gap-1.5">
                                {reporter && <Avatar user={reporter} size="xs" />}
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {reporter?.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Labels */}
                    {labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {labels.map((label) => (
                                <span
                                    key={label.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                                    style={{ backgroundColor: `${label.color}1a`, color: label.color }}
                                >
                                    <Tag className="w-2.5 h-2.5" />
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Tabs: Comments / Activity */}
                    <div>
                        <div className="flex items-center gap-1 border-b border-[var(--border)] mb-3">
                            <button
                                onClick={() => setTab("comments")}
                                className={`
                  flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px
                  transition-colors
                  ${tab === "comments"
                                        ? "border-indigo-500 text-[var(--text-primary)]"
                                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                    }
                `}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Comments {comments.length > 0 && `(${comments.length})`}
                            </button>
                            <button
                                onClick={() => setTab("activity")}
                                className={`
                  flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px
                  transition-colors
                  ${tab === "activity"
                                        ? "border-indigo-500 text-[var(--text-primary)]"
                                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                    }
                `}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                Activity
                            </button>
                        </div>

                        {/* Comments panel */}
                        {tab === "comments" && (
                            <div className="space-y-3">
                                {comments.map((comment) => {
                                    const author = usersMap[comment.authorId];
                                    if (!author) return null;
                                    return (
                                        <div key={comment.id} className="flex gap-2.5">
                                            <Avatar user={author} size="xs" className="mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs font-medium text-[var(--text-primary)]">
                                                        {author.name}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">
                                                        {formatRelative(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                    {comment.body}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {comments.length === 0 && (
                                    <p className="text-xs text-[var(--text-muted)] py-2">
                                        No comments yet.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Activity panel */}
                        {tab === "activity" && (
                            <div className="space-y-2.5">
                                {activity.map((entry) => {
                                    const actor = usersMap[entry.actorId];
                                    if (!actor) return null;
                                    return (
                                        <div key={entry.id} className="flex items-center gap-2.5 text-xs">
                                            <Avatar user={actor} size="xs" />
                                            <span className="text-[var(--text-secondary)]">
                                                <span className="font-medium text-[var(--text-primary)]">
                                                    {actor.name}
                                                </span>{" "}
                                                {ACTIVITY_VERB[entry.action]}
                                                {entry.fromValue && entry.toValue && (
                                                    <>
                                                        {" "}
                                                        <span className="text-[var(--text-muted)]">from</span>{" "}
                                                        <span className="text-[var(--text-secondary)]">{entry.fromValue}</span>{" "}
                                                        <span className="text-[var(--text-muted)]">to</span>{" "}
                                                        <span className="text-[var(--text-secondary)]">{entry.toValue}</span>
                                                    </>
                                                )}
                                            </span>
                                            <span className="text-[10px] text-[var(--text-muted)] ml-auto flex-shrink-0">
                                                {formatTimestamp(entry.createdAt)}
                                            </span>
                                        </div>
                                    );
                                })}

                                {activity.length === 0 && (
                                    <p className="text-xs text-[var(--text-muted)] py-2">
                                        No activity recorded.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save bar — only visible when there are unsaved changes */}
                {isDirty && (
                    <div
                        className="
                            flex-shrink-0 flex items-center justify-between gap-3 px-5 py-2.5
                            border-t border-[var(--border)] bg-[var(--accent-subtle)]
                        "
                    >
                        <span className="text-xs text-[var(--text-secondary)]">
                            You have unsaved changes
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                className="
                                    px-3 py-1.5 rounded-md text-xs font-medium
                                    text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                                    hover:bg-[var(--bg-hover)] transition-colors
                                "
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="
                                    px-3 py-1.5 rounded-md text-xs font-semibold
                                    bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]
                                    transition-colors
                                "
                            >
                                Save changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Comment input — fixed at bottom */}
                <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-t border-[var(--border)]">
                    <input
                        type="text"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment();
                        }}
                        placeholder="Leave a comment..."
                        className="
              flex-1 h-8 px-3 rounded-md text-xs
              bg-[var(--bg-hover)] border border-[var(--border)]
              text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
              outline-none focus:border-[var(--border-focus)] transition-colors
            "
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={!commentDraft.trim()}
                        className="
              p-2 rounded-md bg-[var(--accent)] text-white
              hover:bg-[var(--accent-hover)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};