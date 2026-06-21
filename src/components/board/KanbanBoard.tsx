import React, { useState, useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBoardStore } from "@/store/board-store";
import { useFilteredColumns } from "@/hooks/use-board-filters";
import { IssueStatus, Issue } from "@/types";
import { BoardColumn } from "./BoardColumn";
import { IssueCard } from "./IssueCard";

const COLUMN_ORDER: IssueStatus[] = [
    IssueStatus.BACKLOG,
    IssueStatus.TODO,
    IssueStatus.IN_PROGRESS,
    IssueStatus.DONE,
];

export const KanbanBoard: React.FC = () => {
    const columns = useFilteredColumns();
    const allIssues = useBoardStore((s) => s.issues);
    const allColumns = useBoardStore((s) => s.columns); // unfiltered, source of truth for status lookup
    const moveIssue = useBoardStore((s) => s.moveIssue);
    const setDraggingIssue = useBoardStore((s) => s.setDraggingIssue);

    const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

    // Pointer sensor requires a small drag distance before activating,
    // so simple clicks (to open issue detail) aren't hijacked as drags.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Find which column currently owns a given issue ID
    const findColumnForIssue = (issueId: string): IssueStatus | undefined => {
        return COLUMN_ORDER.find((status) =>
            allColumns[status].issueIds.includes(issueId)
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const issue = allIssues[active.id as string];
        if (issue) {
            setActiveIssue(issue);
            setDraggingIssue(issue.id);
        }
    };

    // Handles live cross-column hover feedback — dnd-kit fires this
    // continuously as the dragged item moves over droppable targets.
    const handleDragOver = (event: DragOverEvent) => {
        // Intentionally left minimal: BoardColumn's `isOver` state from
        // useDroppable already provides visual feedback. We only need to
        // commit the actual move on drag end to avoid excessive store writes.
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveIssue(null);
        setDraggingIssue(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const fromStatus = findColumnForIssue(activeId);
        if (!fromStatus) return;

        // Determine destination: either dropped on a column directly (empty area)
        // or dropped on another issue card (use that card's column)
        const overData = over.data.current;
        let toStatus: IssueStatus;
        let toIndex: number;

        if (overData?.type === "column") {
            // Dropped on empty column area — append to end
            toStatus = overData.status as IssueStatus;
            toIndex = allColumns[toStatus].issueIds.length;
        } else {
            // Dropped on another issue card
            toStatus = findColumnForIssue(overId) ?? fromStatus;
            const targetCol = allColumns[toStatus].issueIds;
            const overIndex = targetCol.indexOf(overId);
            toIndex = overIndex === -1 ? targetCol.length : overIndex;
        }

        // No-op if dropped in the same place
        if (fromStatus === toStatus) {
            const currentIndex = allColumns[fromStatus].issueIds.indexOf(activeId);
            if (currentIndex === toIndex) return;
        }

        moveIssue({
            issueId: activeId,
            fromStatus,
            toStatus,
            toIndex,
        });
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 h-full px-5 py-3 overflow-x-auto">
                {COLUMN_ORDER.map((status) => (
                    <BoardColumn key={status} column={columns[status]} />
                ))}
            </div>

            {/* Drag preview — follows cursor, rendered in a portal above everything */}
            <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
                {activeIssue ? (
                    <div className="w-72">
                        <IssueCard issue={activeIssue} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};